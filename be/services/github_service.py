import httpx
from github import Github
from typing import List, Optional
from datetime import datetime
from schemas.models import PullRequest
from config.settings import settings

class GitHubService:
    def __init__(self, access_token: str = None):
        self.access_token = access_token
        if access_token:
            self.github = Github(access_token)
        else:
            self.github = None
        self.base_url = "https://api.github.com"
    
    def get_oauth_url(self, state: str = None) -> str:
        """Generate GitHub OAuth URL."""
        if not settings.github_client_id or settings.github_client_id.startswith('placeholder'):
            raise ValueError("GitHub OAuth credentials not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in your .env file.")
        
        url = (
            f"https://github.com/login/oauth/authorize"
            f"?client_id={settings.github_client_id}"
            f"&redirect_uri={settings.github_redirect_uri}"
            f"&scope=repo,user:email,read:org,notifications"
        )
        if state:
            url += f"&state={state}"
        return url
    
    async def exchange_code_for_token(self, code: str) -> dict:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": settings.github_redirect_uri,
                },
                headers={"Accept": "application/json"}
            )
            return response.json()
    
    def get_user_info(self) -> dict:
        """Get authenticated user info."""
        if not self.github:
            raise ValueError("GitHub client not initialized. Access token required.")
        user = self.github.get_user()
        return {
            "id": user.id,
            "login": user.login,
            "name": user.name,
            "email": user.email,
            "avatar_url": user.avatar_url
        }
    
    def get_pull_requests(self, limit: int = 10) -> List[PullRequest]:
        """Get user's pull requests."""
        if not self.github:
            raise ValueError("GitHub client not initialized. Access token required.")
        user = self.github.get_user()
        prs = []

        repos = user.get_repos(type="all", sort="updated")

        for repo in repos:
            try:
                print(f"Checking repository: {repo.full_name}")
                for pr in repo.get_pulls(state="open", sort="updated")[:limit]:
                    prs.append(PullRequest(
                        id=pr.id,
                        title=pr.title,
                        url=pr.html_url,
                        state=pr.state,
                        created_at=pr.created_at,
                        updated_at=pr.updated_at,
                        author=pr.user.login,
                        repository=repo.full_name
                    ))
                    if len(prs) >= limit:
                        break
            except Exception as e:
                continue  # Skip repos with access issues
            
            if len(prs) >= limit:
                break
        
        print(f"Total PRs found: {len(prs)}")
        return prs[:limit]
    
    def get_assigned_issues(self, limit: int = 10) -> List[dict]:
        """Get issues assigned to the user."""
        if not self.github:
            raise ValueError("GitHub client not initialized. Access token required.")
        user = self.github.get_user()
        issues = []
        
        try:
            for issue in self.github.search_issues(f"assignee:{user.login} is:issue is:open", sort="updated")[:limit]:
                issues.append({
                    "id": issue.id,
                    "title": issue.title,
                    "url": issue.html_url,
                    "state": issue.state,
                    "created_at": issue.created_at,
                    "updated_at": issue.updated_at,
                    "repository": issue.repository.full_name,
                    "labels": [label.name for label in issue.labels]
                })
        except Exception as e:
            print(f"Error fetching issues: {e}")
        
        return issues
    
    def get_notifications(self, limit: int = 10) -> List[dict]:
        """Get user notifications."""
        if not self.github:
            raise ValueError("GitHub client not initialized. Access token required.")
        try:
            notifications = []
            for notification in self.github.get_user().get_notifications()[:limit]:
                notifications.append({
                    "id": notification.id,
                    "title": notification.subject.title,
                    "type": notification.subject.type,
                    "reason": notification.reason,
                    "updated_at": notification.updated_at,
                    "repository": notification.repository.full_name if notification.repository else None,
                    "unread": notification.unread
                })
            return notifications
        except Exception as e:
            print(f"Error fetching notifications: {e}")
            return []
