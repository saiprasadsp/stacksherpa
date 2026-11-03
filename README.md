# StackSherpa

AI-powered production troubleshooting assistant built with React, FastAPI, ChromaDB, optional OpenAI, and Docker.

StackSherpa helps a developer investigate application incidents by:
1. Inspecting pasted application logs.
2. Detecting common failure patterns.
3. Retrieving relevant runbook passages using RAG.
4. Producing evidence-grounded troubleshooting guidance with source references.

## Architecture

- **Frontend:** React + Vite
- **Backend:** Python + FastAPI
- **RAG:** ChromaDB persistent vector store
- **Embeddings:** ChromaDB's default embedding function (downloads its embedding model on first ingestion)
- **LLM:** Optional OpenAI API. Without an API key, StackSherpa returns a deterministic answer based on retrieved evidence.
- **Persistence:** ChromaDB local volume
- **Runtime:** Docker Compose

## Run locally with Docker

Requirements: Docker Desktop with Compose.

```bash
git clone <your-repository-url>
cd stacksherpa
cp .env.example .env
docker compose up --build
```

Open:
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

The backend ingests the Markdown runbooks at startup. The first run can take longer because the embedding model is downloaded.

To use OpenAI-generated answers, add your key to `.env`:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Restart the backend after changing `.env`:

```bash
docker compose up --build
```

The app still works without an API key. Its fallback response is based on retrieved documents, not a generative model.

## Run without Docker

Backend:

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend in another terminal:

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env` if needed.

## Try it

Paste this into the Log Analyzer:

```text
2026-10-12T10:21:01Z ERROR POST /api/login status=500
2026-10-12T10:21:02Z ERROR Database connection timeout after 3000ms
2026-10-12T10:21:03Z ERROR Connection pool exhausted active=30 max=30
2026-10-12T10:21:04Z WARN Authentication request failed user_id=demo
```

Then ask the assistant:

> Why are login requests failing, and what should I investigate first?

Try these other scenarios:
- `JWT token expired` and `401 Unauthorized`
- `429 Too Many Requests` and `rate limit exceeded`
- `Connection refused` to an upstream service
- `CORS policy blocked` in browser logs

## Project structure

```text
stacksherpa/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI routes
│   │   ├── rag.py           # Ingestion, retrieval, answer generation
│   │   ├── diagnostics.py   # Log pattern analysis
│   │   └── schemas.py       # API request/response models
│   ├── knowledge_base/      # Markdown runbooks used by RAG
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── data/                    # ChromaDB persistence (created at runtime)
├── docker-compose.yml
└── .env.example
```

## How the RAG flow works

1. **Load:** Read Markdown runbooks from `backend/knowledge_base`.
2. **Chunk:** Split documents into overlapping text chunks.
3. **Embed:** ChromaDB's default embedding function converts chunks into vectors.
4. **Store:** Save vectors and metadata in a persistent Chroma collection.
5. **Retrieve:** Embed the user's question and retrieve the most relevant chunks.
6. **Ground:** Give the retrieved passages to the LLM, or use the deterministic fallback, and return source names.

The important distinction: the LLM does not receive the entire knowledge base. It receives only the passages retrieved for the current question.

## Learning path

1. Run the app and explore the React components.
2. Read `diagnostics.py`; add one new log signature.
3. Read `rag.py`; trace ingestion and retrieval end-to-end.
4. Add a new Markdown runbook and verify it appears as a source.
5. Add an endpoint for saving incidents.
6. Add tests for diagnostics and retrieval.
7. Add authentication, tenant isolation, and deployment.

## Important limitations

- This is a learning/demo application, not a production incident-management system.
- Logs are submitted as text and are not automatically collected from customer infrastructure.
- The included log patterns are illustrative and should be adapted to the target application.
- Do not paste secrets, personal data, access tokens, or real customer logs into the demo.
- RAG citations identify retrieved documents. They do not prove that a proposed fix is correct.
