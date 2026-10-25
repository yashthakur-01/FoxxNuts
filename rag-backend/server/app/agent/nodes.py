import os
import json
from typing import Annotated, Any
from langgraph.prebuilt import InjectedState
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig

from app.agent.state import AgentState, ConditionalRouterOutput
from app.agent.models import get_model_instance
from app.helpers.observable_node import observable_node


@tool
async def web_search(state: Annotated[dict, InjectedState]) -> str:
    """Use this tool to search Google for up-to-date real-time information.
    
    parameters: (query: str): The search query string.
    
    returns: str: A formatted string of search results, including source URLs and content snippets. If the search fails, returns an error message.
    """
    from langchain_community.tools.tavily_search import TavilySearchResults
    query = state['query'][-1]
    tavily_engine = TavilySearchResults(max_results=3)
    try:
        results = await tavily_engine.ainvoke({"query": query})
        
        formatted_results = []
        for doc in results:
            formatted_results.append(f"Source: {doc['url']}\nContent: {doc['content']}\n---")
            
        return "\n".join(formatted_results)
        
    except Exception as e:
        return f"Search temporarily unavailable. Proceed with internal knowledge. Error: {str(e)}" 


@observable_node("genuine_generic_router")
async def conditional_router_node_1(state: AgentState, config: RunnableConfig):
    """
    This is a conditional router that returns the response as generic_or_repetitive or genuine_query on 
    the basis of the query and chat history
    """
    messages = state["messages"]
    provider = state["model"]["provider"]
    model_name = state["model"]["model_name"]
    temperature = state["model"]["temperature"]
    max_tokens = state["model"]["max_tokens"]
    llm = get_model_instance(provider, model_name, temperature, max_tokens)
    
    system_prompt = SystemMessage(content="""You are an intent classifier for an enterprise document search & RAG assistant.
Review the user's latest query along with the conversation history:

CLASSIFICATION RULES:
1. 'generic_or_repetitive': Return this route if ANY of the following apply:
   a) Basic greetings, pleasantries, user self-introductions, chit-chat, or identity questions (e.g. "hello", "my name is yash", "who are you?", "thank you", "bye").
   b) The query can be answered directly from the previous conversation history with high accuracy and NO ambiguity, without needing to retrieve new external knowledge documents.
      - Examples: "what was my name?", "what did I ask earlier?", "can you summarize what you just told me?", "repeat your last response", "explain that last point further".

2. 'genuine_query': Return this route if:
   - The query asks for new factual knowledge, company policies, procedures, technical details, or document information that is NOT already clearly and unambiguously answered in the conversation history.

3. DEFAULT RULE: If uncertain whether a question requires new document retrieval vs conversation history, choose 'genuine_query'.

Output JSON: {"route": "generic_or_repetitive"} or {"route": "genuine_query"}""")
    
    full_messages = [system_prompt] + messages
    route_value = "genuine_query"
    raw_message = None

    try:
        if provider == 'groq':
            # Use direct JSON invocation for Groq to avoid "Tool choice is required" API errors
            response = await llm.ainvoke(full_messages)
            raw_message = response.content
            content = str(response.content).strip().lower()
            
            if "generic_or_repetitive" in content:
                route_value = "generic_or_repetitive"
            elif "genuine_query" in content:
                route_value = "genuine_query"
            else:
                try:
                    parsed = json.loads(content)
                    if isinstance(parsed, dict) and "route" in parsed:
                        route_value = parsed["route"]
                except Exception:
                    route_value = "genuine_query"
        else:
            structured_llm = llm.with_structured_output(ConditionalRouterOutput, include_raw=True)
            response = await structured_llm.ainvoke(full_messages)
            raw_message = response.get("raw")
            parsed_output = response.get("parsed")
            if parsed_output and isinstance(parsed_output, dict) and "route" in parsed_output:
                route_value = parsed_output["route"]
            else:
                route_value = "genuine_query"
    except Exception as err:
        print(f"[WARNING] genuine_generic_router encountered an error ({err}), falling back to direct prompt extraction...")
        try:
            fallback_response = await llm.ainvoke(full_messages)
            raw_message = fallback_response.content
            content_lower = str(fallback_response.content).lower()
            if "generic_or_repetitive" in content_lower:
                route_value = "generic_or_repetitive"
            else:
                route_value = "genuine_query"
        except Exception:
            route_value = "genuine_query"

    print(f"[genuine_generic_router] Final classified route: '{route_value}'")
    return {"route": [route_value], "current_context": None, "node_output": [raw_message]}


@observable_node("context_retriver")
async def retrieve_context(state: AgentState, config: RunnableConfig):
    from app.controllers.query_pipeline import fetch_context_from_vector_db
    query = state["query"][-1]
    configurable = config.get("configurable", {})
    customerId = configurable.get("customerId", "")
    workspaceId = configurable.get("workspaceId", "")
    similarityThreshold = float(configurable.get("similarityThreshold", 0.6))
    
    print(f"  ↳ [Vector Retrieval] Querying Pinecone hybrid index for: '{query}' (threshold={similarityThreshold})")
    context = await fetch_context_from_vector_db(query, customerId, workspaceId, similarity_threshold=similarityThreshold)
    is_context_found = bool(context and context.strip())
    print(f"  ↳ [Vector Retrieval] Result: {len(context) if context else 0} chars retrieved | Context match: {is_context_found}")
    return {
        "retrived_context": [context],
        "current_context": context,
        "query_context_pairs": [{
            "query": query,
            "context_received": context,
            "context_found": is_context_found,
            "query_type": "genuine_query"
        }],
        "query_type": "genuine_query",
        "node_output": [context]
    }


@observable_node("chatbot_node")
async def chatbot_node(state: AgentState, config: RunnableConfig):
    """
    Dynamically initializes the selected LLM provider, applies system prompts,
    and binds tools entirely based on runtime configuration passed by the backend.
    """
    model_provider = state["model"]["provider"]
    model_name = state["model"]["model_name"]
    temperature = state["model"]["temperature"]
    max_tokens = state["model"]["max_tokens"]
    system_prompt = state["system_prompt"]
    search_enabled = state.get('search_enabled', False)
    
    base_model = get_model_instance(model_provider, model_name, temperature, max_tokens)
    if search_enabled:
        base_model = base_model.bind_tools([web_search])

    retrieved_context = state.get("current_context", None)
    if not retrieved_context:
        retrieved_context = state.get("messages", [{"content": "SYSTEM OBSERVATION: unable to fetch the context"}])[-1].content
    messages = [SystemMessage(content=f"""{system_prompt}

STRICT RESPONSE & GROUNDING RULES:
1. Direct Answer: Answer the user's question directly, clearly, and naturally.
2. NO Meta-Language: NEVER use phrases like "According to the provided context...", "Based on the given context...", "In the documents provided...", or "The context mentions...". Simply state the factual answer directly.
3. Grounding: Rely strictly on facts present in the RETRIEVED CONTEXT below. Do NOT hallucinate or assume unverified outside details.
4. Structure: Keep responses clean, well-formatted, and professional using bullet points where applicable.

EXAMPLES:
- Context: "Employee annual leave is 20 days. Health insurance covers full dental."
  Query: "What is the leave policy?" -> "Annual leave for employees is 20 days per calendar year."
  Query: "What health benefits are included?" -> "Health insurance provides full dental coverage."

QUERY:
{state['query'][-1]}

RETRIEVED CONTEXT:
{retrieved_context}
"""), *state["messages"][-5:]]

    print(f"  ↳ [Chatbot Node] Invoking {model_provider}/{model_name} (temp={temperature}, context_len={len(retrieved_context)} chars)...")
    response = await base_model.ainvoke(messages, config=config)
    content_len = len(str(response.content)) if response and hasattr(response, "content") else 0
    print(f"  ↳ [Chatbot Node] Grounded response drafted ({content_len} chars)")
    
    return {"messages": [response], "node_output": [response]}


@observable_node("generic_response_node")
async def generic_response_node(state: AgentState, config: RunnableConfig):
    """
    A simple node that analyses the current conversation. If the query is generic
    or the question is repetitive, whose answer is already been fetched and exists in the conversation history, then it 
    routes to the end node directly without calling the LLM again
    """
    system_prompt = SystemMessage(content="""You are a polite, helpful, and highly intelligent conversation assistant.
Review the conversation history to answer the user's latest query:

1. Direct Answers from History:
   - If the user's query references past messages, previously provided user details (e.g. name, preferences), or previously explained topics from this session, frame a natural, direct, and accurate answer.
   - Do NOT say "According to the chat history..." or "As mentioned earlier...". Answer directly.
   - Example: Query: "What is my name?" -> "Your name is Yash."

2. Greetings & Pleasantries:
   - For greetings, self-introductions, or polite remarks, respond warmly and professionally, offering assistance with their knowledge documents.

3. Out-of-Scope / Missing Info:
   - If the query asks for new document knowledge that does NOT exist in the chat history, politely inform the user to ask a specific topic question so you can retrieve information from their documents.

Keep your response clear, well-structured, friendly, and direct.""")
    
    model_provider = state["model"]["provider"]
    model_name = state["model"]["model_name"]
    temperature = state["model"]["temperature"]
    max_tokens = state["model"]["max_tokens"]
    
    print(f"  ↳ [Generic Response Node] Generating conversational response from session history with {model_provider}/{model_name}...")
    llm_model = get_model_instance(model_provider, model_name, temperature, max_tokens)
    full_messages = [system_prompt] + state["messages"]
    response = await llm_model.ainvoke(full_messages, config=config)
    print(f"  ↳ [Generic Response Node] Conversational response generated ({len(str(response.content))} chars)")
    
    return {
        "messages": [response],
        "query_context_pairs": [{
            "query": state["query"][-1],
            "context_received": "",
            "context_found": True,
            "query_type": "generic_or_repetitive"
        }],
        "query_type": "generic_or_repetitive",
        "node_output": [response]
    }


@observable_node("evalator_node")   
async def response_evaluation_node(state: AgentState, config: RunnableConfig):
    max_iter = state.get("max_iter", 0)
    print(f"  ↳ [Evaluator Node] Inspecting response quality (Iteration {max_iter + 1}/2)...")
    if max_iter >= 2:
        print("  ↳ [Evaluator Node] Max iterations (2) reached -> Routing to 'unsatisfactory'")
        return {"route": ["unsatisfactory"], "node_output": [{"reason": "max_iter reached"}]}
    
    # Extract just the specific text the judge needs
    original_query = state["query"][0]
    latest_query = state["query"][-1]
    drafted_response = state["messages"][-1].content
    retrieved_context = state.get("current_context", None)
    if not retrieved_context:
        retrieved_context = state.get("messages", [{"content": "SYSTEM OBSERVATION: unable to fetch the context"}])[-1].content
    
    system_prompt = SystemMessage(
        content=f"""Evaluate if the Assistant Response adequately answers the Query using the Context.

Original Query: {original_query}
Current Query: {latest_query}
Context: {retrieved_context}
Assistant Response: {drafted_response}
Iteration: {state.get('max_iter', 0) + 1}

Output EXACTLY one option:
- satisfactory
- query_rephrase - [remark]
- revise - [remark]
- clarify - [remark]"""
    )
    
    provider = state["model"]["provider"]
    model_name = state["model"]["model_name"]
    temperature = state["model"]["temperature"]
    max_tokens = state["model"]["max_tokens"]
    
    llm = get_model_instance(provider, model_name, temperature, max_tokens)
    full_messages = [system_prompt] 
    response = await llm.ainvoke(full_messages)
    raw_eval = str(response.content).strip()

    if raw_eval.lower() == "satisfactory":
        print("  ↳ [Evaluator Node] Verdict: 'satisfactory' -> Response approved for delivery")
        return {"route": ["satisfactory"], "max_iter": max_iter + 1, "node_output": [response]}
    elif raw_eval.lower().startswith("query_rephrase"):
        print(f"  ↳ [Evaluator Node] Verdict: 'query_rephrase' -> {raw_eval}")
        return {"route": ["query_rephrase"], "max_iter": max_iter + 1, "remarks": response.content, "node_output": [response]}
    elif raw_eval.lower().startswith("clarify"):
        print(f"  ↳ [Evaluator Node] Verdict: 'clarify' -> {raw_eval}")
        return {"route": ["clarify"], "max_iter": max_iter + 1, "remarks": response.content, "node_output": [response]}
    else:
        print(f"  ↳ [Evaluator Node] Verdict: 'revise' -> {raw_eval}")
        return {"route": ["revise"], "max_iter": max_iter + 1, "remarks": response.content, "node_output": [response]}


@observable_node("query_rephraser_node")
async def query_rephraser_node(state: AgentState, config: RunnableConfig):
    """
    This node rephrases the user query if the response generated is not satisfactory.
    """
    query = state["query"][-1]
    remarks = state.get('remarks', '')
    print(f"  ↳ [Query Rephraser] Rephrasing ambiguous query '{query}' (Remarks: '{remarks}')...")
    system_prompt = SystemMessage(
        content=f"""You are an expert query rewriter for document retrieval.

INSTRUCTIONS:
1. Rewrite the user's latest query into a clear, specific, and self-contained question that preserves original intent.
2. Use conversation history ONLY to resolve ambiguous pronouns (e.g., "it", "they", "that policy") and missing references.
3. Do NOT answer the query, add unverified facts, or include explanations. Output ONLY the rewritten query string.

EXAMPLES:
- History: "Tell me about the remote work policy." -> User: "Does it apply to contractors?"
  Rewritten Query: "Does the remote work policy apply to contractors?"
- History: "What are the salary types?" -> User: "explain the second one"
  Rewritten Query: "Explain the second type of salary component listed in the document."

Judge Remarks: {remarks}
Latest Query: {query}"""
    )    
    provider = state["model"]["provider"]
    model_name = state["model"]["model_name"]
    temperature = state["model"]["temperature"]
    max_tokens = state["model"]["max_tokens"]
    llm = get_model_instance(provider, model_name, temperature, max_tokens)
    
    full_messages = [system_prompt] + state["messages"]
    response = await llm.ainvoke(full_messages)
    rewritten = str(response.content).strip()
    print(f"  ↳ [Query Rephraser] Rewritten query: '{rewritten}' -> Re-entering vector retrieval")
    
    return {"query": [rewritten], "current_context": None, "messages": [HumanMessage(content=rewritten)], "node_output": [response]}


@observable_node("unsatisfactory_handle_node")
async def unsatisfactory_handler_node(state: AgentState, config: RunnableConfig):
    """
    This node returns a clear response indicating the requested query could not be answered with the given knowledge base.
    """
    print("  ↳ [Unsatisfactory Handler] Fallback triggered: Query not answerable from knowledge base.")
    response = AIMessage(content="The requested query could not be answered with the given knowledge base.")
    return {"disclaimer": True, "messages": [response], "node_output": [response]}


@observable_node("clarify_node")
async def clarify_node(state: AgentState, config: RunnableConfig):
    """
    This node asks the user for clarification if the query is too ambiguous to answer or retrieve context for.
    """
    query = state["query"][-1] if state.get("query") else ""
    remarks = state.get('remarks', 'The query is too vague.')
    print(f"  ↳ [Clarify Node] Requesting clarification for query: '{query}'...")
    system_prompt = SystemMessage(
        content=f"""Draft a polite, concise 1-sentence request asking the user to clarify their vague query.

Query: {query}
Remarks: {remarks}

Output ONLY the clarification request."""
    )    
    provider = state["model"]["provider"]
    model_name = state["model"]["model_name"]
    temperature = state["model"]["temperature"]
    max_tokens = state["model"]["max_tokens"]
    llm = get_model_instance(provider, model_name, temperature, max_tokens)
    
    full_messages = [system_prompt]
    response = await llm.ainvoke(full_messages, config=config)
    
    if not response.content or not isinstance(response.content, str) or not response.content.strip():
        response = AIMessage(content="Could you please provide more details or clarify your query?")
        
    print(f"  ↳ [Clarify Node] Clarification message drafted ({len(str(response.content))} chars)")
    return {"messages": [response], "node_output": [response]}


@observable_node("start_node")
async def start_node(state: AgentState, config: RunnableConfig):
    query = state["query"][-1] if state.get("query") else ""
    print(f"  ↳ [Start Node] Workflow initiated for query: '{query}'")
    msgs = state.get("messages", [])
    if not msgs or not any(isinstance(m, HumanMessage) and m.content == query for m in msgs):
        return {"messages": [HumanMessage(content=query)]}
    return {}
