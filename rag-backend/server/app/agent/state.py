from typing import Optional, Literal, TypedDict, Annotated, Any
import operator
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class ModelClass(TypedDict):
    provider: Literal["gemini", "openai", "groq"]
    model_name: str
    temperature: float
    max_tokens: int

class AgentState(TypedDict):
    system_prompt: str
    error_messages: Optional[Annotated[list[dict[str, str]], operator.add]]
    max_iter: int
    query: Annotated[list[str], operator.add]
    messages: Annotated[list[BaseMessage], add_messages]
    model: ModelClass
    remarks: str
    search_enabled: bool
    disclaimer: bool
    trajectory: Annotated[list[dict[str, str]], operator.add]
    current_context: str | None
    retrived_context: Annotated[list[str], operator.add]
    query_context_pairs: Annotated[list[dict[str, Any]], operator.add]
    query_type: str | None
    route: Annotated[list[str], operator.add]

class ConditionalRouterOutput(TypedDict):   
    route: Literal["generic_or_repetitive", "genuine_query", "satisfactory", "unsatisfactory", "revise", "query_rephrase", "clarify"]
