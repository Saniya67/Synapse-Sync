import httpx, os
from datetime import datetime, timezone

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
BASE_URL = "https://api.github.com"

headers = {"Authorization": f"Bearer {GITHUB_TOKEN}", "Accept": "application/vnd.github.v3+json"}

async def get_pull_requests(owner: str, repo: str, state="all"):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE_URL}/repos/{owner}/{repo}/pulls",
                             headers=headers, params={"state": state})
        r.raise_for_status()
        return r.json()

async def get_reviews(owner: str, repo: str, pr_number: int):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{BASE_URL}/repos/{owner}/{repo}/pulls/{pr_number}/reviews",
                             headers=headers)
        r.raise_for_status()
        return r.json()
