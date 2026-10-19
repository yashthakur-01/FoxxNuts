from pydantic import BaseModel

class MessageRequest(BaseModel):
    workspace_id: str
    customer_id: str
    session_id: str
    message: str

class InvalidateCacheRequest(BaseModel):
    workspace_id: str
