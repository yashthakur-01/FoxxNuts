from pydantic import BaseModel

class ProcessDocument(BaseModel):
    workspace_id: str
    customer_id: str
    fileName: str    

class DeleteWorkspace(BaseModel):
    workspace_id: str
    customer_id: str
