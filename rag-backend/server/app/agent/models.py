import os
from typing import Literal
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

load_dotenv()

def get_chat_model(
    provider: Literal["gemini", "openai", "groq"],
    model_name: str,
    temperature: float = 0.4,
    max_tokens: int = 512
):
    """Factory creating configured Chat LLM instances across providers."""
    if not provider or not model_name:
        raise ValueError("Both provider and model_name must be provided.")
    if provider == "gemini":
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set.")
        return ChatGoogleGenerativeAI(model=model_name, temperature=temperature, max_tokens=max_tokens)
    elif provider == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set.")
        return ChatOpenAI(model=model_name, temperature=temperature, max_tokens=max_tokens)
    elif provider == "groq":
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set.")
        return ChatOpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key, model=model_name, temperature=temperature, max_tokens=max_tokens)
    else:
        raise ValueError(f"Unsupported provider: {provider}")

def get_model_instance(
    provider: Literal["gemini", "openai", "groq"],
    model_name: str,
    temperature: float = 0.4,
    max_tokens: int = 512
):
    return get_chat_model(provider, model_name, temperature, max_tokens)
