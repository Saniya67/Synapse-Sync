from datetime import datetime, timezone, timedelta
from BackendServices.utils.github_pr_client import get_pull_requests, get_reviews

async def prs_merged_without_approval(owner, repo):
    prs = await get_pull_requests(owner, repo, state="closed")
    results = []
    for pr in prs:
        if pr.get("merged_at"):
            reviews = await get_reviews(owner, repo, pr["number"])
            approvals = [r for r in reviews if r["state"] == "APPROVED"]
            if not approvals:  # merged without approval
                results.append({
                    "id": pr["number"],
                    "title": pr["title"],
                    "merged_by": pr["merged_by"]["login"] if pr.get("merged_by") else None,
                    "reviews": []
                })
    return {"count": len(results), "prs": results}

async def prs_reviewed_by_user(owner, repo, user):
    prs = await get_pull_requests(owner, repo, state="all")
    results = []
    for pr in prs:
        reviews = await get_reviews(owner, repo, pr["number"])
        for r in reviews:
            if r["user"]["login"].lower() == user.lower():
                results.append({
                    "id": pr["number"],
                    "title": pr["title"],
                    "reviewer": r["user"]["login"],
                    "decision": r["state"],
                    "date": r["submitted_at"]
                })
    return results

async def prs_waiting_review(owner, repo, hours=24):
    prs = await get_pull_requests(owner, repo, state="open")
    results = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    for pr in prs:
        created = datetime.fromisoformat(pr["created_at"].replace("Z","+00:00"))
        if created < cutoff and not pr.get("requested_reviewers"):
            results.append({
                "id": pr["number"],
                "title": pr["title"],
                "created_at": pr["created_at"],
                "review_requested": False,
                "waiting_time_hours": (datetime.now(timezone.utc)-created).total_seconds()//3600
            })
    return results

async def prs_merged_last_days(owner, repo, days=7):
    prs = await get_pull_requests(owner, repo, state="closed")
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    results = []
    for pr in prs:
        if pr.get("merged_at"):
            merged = datetime.fromisoformat(pr["merged_at"].replace("Z","+00:00"))
            if merged > cutoff:
                reviews = await get_reviews(owner, repo, pr["number"])
                approvers = [r["user"]["login"] for r in reviews if r["state"]=="APPROVED"]
                results.append({
                    "id": pr["number"],
                    "title": pr["title"],
                    "merged_at": pr["merged_at"],
                    "approvers": approvers
                })
    return results
