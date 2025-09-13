# ai_agent.py
import os
import openai
from typing import List, Dict, Any

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# You can swap this to any OpenAI-compatible client. Keep interface simple.
DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # change as needed

def build_issue_context(issues: List[Dict[str, Any]], max_issues: int = 10) -> str:
    """Create a compact context string summarizing the top N issues."""
    pieces = []
    for i, issue in enumerate(issues[:max_issues], start=1):
        number = issue.get("number")
        title = issue.get("title", "").replace("\n", " ")
        body = (issue.get("body") or "").replace("\n", " ")
        state = issue.get("state")
        labels = [l["name"] for l in issue.get("labels", [])]
        assignee = issue.get("assignee")["login"] if issue.get("assignee") else "unassigned"
        created = issue.get("created_at")
        pieces.append(f"{i}. #{number} — {title}\nstate: {state}; created_at: {created}; assignee: {assignee}; labels: {labels}\nbody: {body[:400]}")
    return "\n\n".join(pieces) or "No issues found."

def make_prompt(user_question: str, repo: str, owner: str, issues: List[Dict[str, Any]]) -> str:
    ctx = build_issue_context(issues, max_issues=10)
    prompt = (
        f"You are an expert GitHub issues assistant for {owner}/{repo}.\n"
        f"Use the following issue summaries to answer the user's question. If additional info is needed, ask politely for exact issue numbers.\n\n"
        f"Issue Context:\n{ctx}\n\n"
        f"User question: {user_question}\n\n"
        f"Answer concisely, and include (1) a short summary of your findings, (2) a recommended next step, and (3) a list of top issue numbers that are relevant."
    )
    return prompt

def ask_model(prompt: str, model: str = DEFAULT_MODEL, temperature: float = 0.0) -> str:
    """
    Call the OpenAI ChatCompletion API (or compatible).
    This is a simple wrapper using openai.ChatCompletion for compatibility.
    """
    if not OPENAI_API_KEY:
        # fallback: return a deterministic non-LLM reply for local testing
        return "LLM key missing. Here is what I would have answered:\n\n" + prompt[:1000]

    # Use ChatCompletion (replace with new Chat API as required by your client)
    response = openai.ChatCompletion.create(
        model=model,
        messages=[
            {"role": "system", "content": "You are a helpful assistant for GitHub issues."},
            {"role": "user", "content": prompt},
        ],
        temperature=temperature,
        max_tokens=800,
    )
    return response.choices[0].message.content.strip()
