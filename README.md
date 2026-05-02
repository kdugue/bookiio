# Bookio

A local-first RAG-powered assessment tool that turns books into quizzes with contextual feedback.

## Quick Start

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
cp .env.example server/.env
# Edit server/.env and add your OpenAI API key
```

### 3. Start ChromaDB

```bash
# Via Docker
docker run -p 8000:8000 chromadb/chroma

# Or via pip
pip install chromadb
chroma run
```

### 4. Run the app

In two terminals:

```bash
# Terminal 1 — API server
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

The client runs at **http://localhost:5173** and proxies API requests to the server on port 3001.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Redux Toolkit, Tailwind CSS |
| Backend | Node.js, Express |
| Vector DB | ChromaDB (local) |
| LLM | OpenAI API |
| Persistence | JSON (db.json), filesystem (uploads/) |
