from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .diagnostics import analyze_logs
from .rag import answer_question, ingest_knowledge_base
from .schemas import AnalyzeRequest, AskRequest


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        app.state.ingested_chunks = ingest_knowledge_base()
    except Exception as exc:
        # API health and diagnostics should still start if vector setup fails.
        app.state.ingestion_error = str(exc)
        app.state.ingested_chunks = 0
    yield


app = FastAPI(
    title="StackSherpa API",
    description="Evidence-grounded application troubleshooting assistant",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "stacksherpa-api",
        "ingested_chunks": getattr(app.state, "ingested_chunks", 0),
        "ingestion_error": getattr(app.state, "ingestion_error", None),
    }


@app.post("/api/diagnostics/analyze")
def diagnostics(request: AnalyzeRequest):
    return analyze_logs(request.logs)


@app.post("/api/assistant/ask")
def ask(request: AskRequest):
    return answer_question(request.question, request.logs)
