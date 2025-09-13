# schemas.py
from pydantic import BaseModel
from typing import Optional, List

class ChatRequest(BaseModel):
    owner: str
    repo: str
    question: str
    max_results: Optional[int] = 10

class ChatResponse(BaseModel):
    answer: str
    relevant_issues: Optional[List[int]] = None

class SearchRequest(BaseModel):
    q: str
    per_page: int = 30
    page: int = 1
