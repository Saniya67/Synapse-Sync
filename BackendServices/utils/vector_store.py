# vector_store.py
import os
import faiss
import numpy as np
from typing import List, Dict, Any, Tuple
import openai

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")

class IssueVectorStore:
    def __init__(self, dim: int = 1536):
        self.index = faiss.IndexFlatL2(dim)
        self.vectors = []  # to keep issue metadata in parallel
        self.dim = dim

    def add_issues(self, issues: List[Dict[str, Any]]):
        texts = [self._make_text(i) for i in issues]
        vectors = self._embed_batch(texts)
        self.index.add(np.array(vectors).astype("float32"))
        self.vectors.extend(issues)

    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        q_emb = self._embed_text(query)
        D, I = self.index.search(np.array([q_emb]).astype("float32"), k)
        return [self.vectors[i] for i in I[0] if i < len(self.vectors)]

    def _make_text(self, issue: Dict[str, Any]) -> str:
        return f"Issue #{issue.get('number')} {issue.get('title')}\n{issue.get('body') or ''}"

    def _embed_text(self, text: str) -> np.ndarray:
        if not OPENAI_API_KEY:
            # fallback: random vec for local mock
            return np.random.rand(self.dim)
        resp = openai.Embedding.create(
            model=EMBED_MODEL,
            input=text[:8000]  # limit length
        )
        return np.array(resp["data"][0]["embedding"])

    def _embed_batch(self, texts: List[str]) -> List[np.ndarray]:
        if not OPENAI_API_KEY:
            return [np.random.rand(self.dim) for _ in texts]
        resp = openai.Embedding.create(
            model=EMBED_MODEL,
            input=[t[:8000] for t in texts]
        )
        return [np.array(d["embedding"]) for d in resp["data"]]
