import uvicorn
from fastapi import FastAPI, UploadFile, Form, File
from fastapi.responses import JSONResponse
import os
from BackendServices.utils.file_handler import save_file
from BackendServices.utils.text_extractor import extract_text
import logging
from BackendServices.utils.rag_handler import RAGPipeline
from typing import Optional
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware

import json

app = FastAPI()

load_dotenv()  # loads variables from .env


UPLOAD_DIR = "storage"
os.makedirs(UPLOAD_DIR, exist_ok=True)

rag_pipeline = RAGPipeline()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "PUT"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def read_root():
    return "Synapse-Sync"


# @app.post("/ask")
# async def ask_question(file: UploadFile, question: str = Form(...)):
#     # Step 1: Save file
#     file_path = save_file(file, UPLOAD_DIR)
#
#     # Step 2: Extract text
#     text = extract_text(file_path)
#     if not text.strip():
#         return JSONResponse({"error": "No text extracted"}, status_code=400)
#
#     # Step 3: Add document to RAG
#     rag_pipeline.add_document(text)
#
#     # Step 4: Query with RAG
#     answer = rag_pipeline.query(question)
#
#     return {"question": question, "answer": answer}
#

 # set your default file path here
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/ask")
async def ask_question(
    question: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    # Step 1: Add uploaded file (if any) to RAG
    if file and file.filename:
        file_path = save_file(file, UPLOAD_DIR)
        rag_pipeline.add_file(file_path)

    # Step 2: Add all existing files in the storage directory
    for f in os.listdir(UPLOAD_DIR):
        path = os.path.join(UPLOAD_DIR, f)
        if path not in getattr(rag_pipeline, "added_files", []):
            rag_pipeline.add_file(path)
            if not hasattr(rag_pipeline, "added_files"):
                rag_pipeline.added_files = []
            rag_pipeline.added_files.append(path)

    # Step 3: Query RAG across all indexed documents
    answer = rag_pipeline.query(question)
    parsed = json.loads(answer) if answer else {"Irrelevant"}
    if parsed and len(parsed.get("result_table"))<=0:
        parsed.update({"result_table": {"definition": "Irrelevant"}})
    return parsed


GITHUB_OWNER = os.getenv("GITHUB_OWNER", "octocat")
GITHUB_REPO = os.getenv("GITHUB_REPO", "Hello-World")

import re
from BackendServices.utils.usecases import (
    prs_merged_without_approval,
    prs_reviewed_by_user,
    prs_waiting_review,
    prs_merged_last_days,
)

async def handle_query(user_input: str, owner: str, repo: str):
    q = user_input.lower()

    if "merged without approval" in q:
        return await prs_merged_without_approval(owner, repo)

    elif match := re.search(r"reviewed by (\w+)", q):
        reviewer = match.group(1)
        return await prs_reviewed_by_user(owner, repo, reviewer)

    elif "waiting for review" in q or "more than 24 hours" in q:
        return await prs_waiting_review(owner, repo, hours=24)

    elif "merged" in q and "last 7 days" in q:
        return await prs_merged_last_days(owner, repo, days=7)

    else:
        return {"message": "Sorry, I don't understand this query yet."}


@app.get("/chat")
async def ask(question: str):
    """
    Example:
    /ask?question=How+many+PRs+were+merged+without+approval&owner=octocat&repo=Hello-World
    """
    result = await handle_query(question, GITHUB_OWNER, GITHUB_REPO)
    return result

if __name__ == "__main__":
    try:
        print(('Starting service @ port ' + str(80)))
        logging.info(('Starting service @ port ' + str(80)))
        uvicorn.run(app, host=str('0.0.0.0'),
                    port=int(80))
    except Exception as ex:
        logging.error(str(ex))
        print("Unable to start the application" + str(ex))