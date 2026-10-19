from typing import Literal
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig

from app.agent.state import AgentState
from app.agent.nodes import (
    start_node,
    conditional_router_node_1,
    retrieve_context,
    query_rephraser_node,
    chatbot_node,
    generic_response_node,
    response_evaluation_node,
    unsatisfactory_handler_node,
    clarify_node,
    web_search,
)

_compiled_graph_instance = None


def route_after_chatbot(
    state: AgentState, config: RunnableConfig
) -> Literal["tools", "response_evaluation_node"]:
    last_message = state["messages"][-1]
    if (
        isinstance(last_message, AIMessage)
        and getattr(last_message, "tool_calls", None)
    ):
        return "tools"
    return "response_evaluation_node"


def return_router_response(state: AgentState, config: RunnableConfig) -> str:
    """Route after genuine_generic_router node."""
    route_list = state.get("route", [])
    decision = route_list[-1] if route_list else "genuine_query"
    next_node = "generic_response_node" if decision == "generic_or_repetitive" else "context_retriver"
    print(f"  ↳ [Graph Edge] Intent Router decision: '{decision}' -> Transitioning to: [{next_node}]")
    return decision


def return_evaluator_response(state: AgentState, config: RunnableConfig) -> str:
    """Route after evalator_node."""
    route_list = state.get("route", [])
    decision = route_list[-1] if route_list else "satisfactory"
    next_map = {
        "satisfactory": "END (Delivering Final Answer)",
        "unsatisfactory": "unsatisfactory_handle_node",
        "query_rephrase": "query_rephraser_node",
        "revise": "chatbot_node",
        "clarify": "clarify_node"
    }
    next_node = next_map.get(decision, "END")
    print(f"  ↳ [Graph Edge] Evaluator verdict: '{decision}' -> Transitioning to: [{next_node}]")
    return decision


def get_chatbot_agent():
    """
    Singleton provider. Returns the compiled LangGraph workflow instance.
    If it doesn't exist yet, it compiles it once and caches it in RAM.
    """
    global _compiled_graph_instance
    
    if _compiled_graph_instance is None:
        print("Initializing and Compiling LangGraph Chatbot Engine...")
        
        graph_builder = StateGraph(AgentState)
        graph_builder.add_node("start_node", start_node)
        graph_builder.add_node("genuine_generic_router", conditional_router_node_1)
        graph_builder.add_node("context_retriver", retrieve_context)
        graph_builder.add_node("query_rephraser_node", query_rephraser_node)
        graph_builder.add_node("chatbot_node", chatbot_node)
        graph_builder.add_node("generic_response_node", generic_response_node)
        graph_builder.add_node("evalator_node", response_evaluation_node)
        graph_builder.add_node("unsatisfactory_handle_node", unsatisfactory_handler_node)
        graph_builder.add_node("clarify_node", clarify_node)
        graph_builder.add_node("tools", ToolNode(tools=[web_search]))
        
        graph_builder.add_edge(START, "start_node")
        graph_builder.add_edge("start_node", "genuine_generic_router")
        graph_builder.add_conditional_edges(
            "genuine_generic_router",
            return_router_response,
            {
                "generic_or_repetitive": "generic_response_node",
                "genuine_query": "context_retriver"
            }
        )
        graph_builder.add_edge("context_retriver", "chatbot_node")
        graph_builder.add_edge("generic_response_node", END)
        graph_builder.add_conditional_edges(
            "chatbot_node",
            route_after_chatbot,
            {
                "tools": "tools",
                "response_evaluation_node": "evalator_node"
            }
        )
        graph_builder.add_edge("tools", "chatbot_node")
        graph_builder.add_conditional_edges(
            "evalator_node",
            return_evaluator_response,
            {
                "satisfactory": END,
                "unsatisfactory": "unsatisfactory_handle_node",
                "query_rephrase": "query_rephraser_node",
                "revise": "chatbot_node",
                "clarify": "clarify_node"
            }
        )
        graph_builder.add_edge("query_rephraser_node", "context_retriver")
        graph_builder.add_edge("unsatisfactory_handle_node", END)        
        graph_builder.add_edge("clarify_node", END) 
        _compiled_graph_instance = graph_builder.compile()       
        
    return _compiled_graph_instance
