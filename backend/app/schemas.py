from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    logs: str = Field(min_length=5, max_length=50000)


class AskRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    logs: str = Field(default="", max_length=50000)


class Source(BaseModel):
    file: str
    excerpt: str


class AnalyzeResponse(BaseModel):
    severity: str
    summary: str
    signals: list[str]
    recommendations: list[str]


class AskResponse(BaseModel):
    answer: str
    sources: list[Source]
    mode: str
