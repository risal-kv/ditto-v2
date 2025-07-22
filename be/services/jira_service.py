import httpx
from jira import JIRA
from typing import List, Optional
from datetime import datetime
from schemas.models import Ticket
from config.settings import settings

class JiraService:
    def __init__(self, access_token: str, server: str = None):
        self.access_token = access_token
        self.server = server or settings.jira_server
        self.jira = None
        
        if access_token:
            self.headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
    

    
    async def get_oauth_url(self, state: str = None) -> str:
        """Generate Jira OAuth 2.0 authorization URL."""
        import urllib.parse
        
        # OAuth 2.0 parameters
        params = {
            'audience': 'api.atlassian.com',
            'client_id': settings.jira_client_id,
            'scope': 'read:jira-user read:jira-work write:jira-work',
            'redirect_uri': settings.jira_redirect_uri,
            'response_type': 'code'
        }
        
        if state:
            params['state'] = state
            
        # Build authorization URL
        auth_url = f"https://auth.atlassian.com/authorize?{urllib.parse.urlencode(params)}"
        return auth_url
    
    async def exchange_code_for_token(self, code: str) -> dict:
        """Exchange authorization code for access token using OAuth 2.0."""
        import httpx
        
        async with httpx.AsyncClient() as client:
            try:
                # OAuth 2.0 token exchange
                response = await client.post(
                    "https://auth.atlassian.com/oauth/token",
                    headers={
                        'Content-Type': 'application/json'
                    },
                    json={
                        "grant_type": "authorization_code",
                        "client_id": settings.jira_client_id,
                        "client_secret": settings.jira_client_secret,
                        "code": code,
                        "redirect_uri": settings.jira_redirect_uri
                    }
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    
                    # Get user info with the access token
                    user_info = await self._get_user_info_oauth2(token_data['access_token'])
                    
                    return {
                        'access_token': token_data['access_token'],
                        'refresh_token': token_data.get('refresh_token'),
                        'expires_in': token_data.get('expires_in', 3600),
                        'user_info': user_info
                    }
                else:
                    print(f"Token exchange failed: {response.status_code} - {response.text}")
                    return {}
                    
            except Exception as e:
                print(f"Error exchanging code for token: {e}")
                return {}
    
    async def _get_user_info_oauth2(self, access_token: str) -> dict:
        """Get user info using OAuth 2.0 access token."""
        import httpx
        
        async with httpx.AsyncClient() as client:
            try:
                # Get accessible resources (sites)
                resources_response = await client.get(
                    "https://api.atlassian.com/oauth/token/accessible-resources",
                    headers={
                        'Authorization': f'Bearer {access_token}',
                        'Accept': 'application/json'
                    }
                )
                
                if resources_response.status_code == 200:
                    resources = resources_response.json()
                    if resources:
                        # Use the first available resource
                        site = resources[0]
                        cloud_id = site['id']
                        
                        # Get user profile
                        profile_response = await client.get(
                            f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/myself",
                            headers={
                                'Authorization': f'Bearer {access_token}',
                                'Accept': 'application/json'
                            }
                        )
                        
                        if profile_response.status_code == 200:
                            profile = profile_response.json()
                            return {
                                'id': profile.get('accountId'),
                                'email': profile.get('emailAddress'),
                                'name': profile.get('displayName'),
                                'cloud_id': cloud_id,
                                'site_url': site.get('url')
                            }
                
                return {'id': 'unknown', 'email': 'unknown', 'name': 'Unknown User'}
                
            except Exception as e:
                print(f"Error getting user info: {e}")
                return {'id': 'unknown', 'email': 'unknown', 'name': 'Unknown User'}
    
    async def get_user_info(self, access_token: str = None) -> dict:
        """Get authenticated user information using OAuth 2.0."""
        if access_token:
            return await self._get_user_info_oauth2(access_token)
        elif hasattr(self, 'headers') and self.headers:
            try:
                import httpx
                async with httpx.AsyncClient() as client:
                    # Get accessible resources (sites)
                    resources_response = await client.get(
                        "https://api.atlassian.com/oauth/token/accessible-resources",
                        headers=self.headers
                    )
                    
                    if resources_response.status_code == 200:
                        resources = resources_response.json()
                        if resources:
                            cloud_id = resources[0]['id']
                            # Get user profile
                            profile_response = await client.get(
                                f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/myself",
                                headers=self.headers
                            )
                            
                            if profile_response.status_code == 200:
                                profile = profile_response.json()
                                return {
                                    "id": profile.get("accountId"),
                                    "email": profile.get("emailAddress"),
                                    "name": profile.get("displayName"),
                                }
                    return {'id': 'unknown', 'email': 'unknown', 'name': 'Unknown User'}
            except Exception as e:
                print(f"Error getting user info: {e}")
                return {'id': 'unknown', 'email': 'unknown', 'name': 'Unknown User'}
        else:
            return {}
    
    async def get_assigned_tickets(self, limit: int = 10) -> List[Ticket]:
        """Get tickets assigned to the current user using OAuth 2.0."""
        if not hasattr(self, 'headers') or not self.headers:
            return []
        
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                # Get accessible resources first
                resources_response = await client.get(
                    "https://api.atlassian.com/oauth/token/accessible-resources",
                    headers=self.headers
                )
                
                if resources_response.status_code != 200:
                    print(f"Failed to get resources: {resources_response.status_code}")
                    return []
                    
                resources = resources_response.json()
                if not resources:
                    return []
                    
                cloud_id = resources[0]['id']
                
                # Get current user info
                user_response = await client.get(
                    f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/myself",
                    headers=self.headers
                )
                
                if user_response.status_code != 200:
                    print(f"Failed to get user info: {user_response.status_code}")
                    return []
                    
                user_info = user_response.json()
                account_id = user_info.get('accountId')
                
                if not account_id:
                    return []
                
                # Search for issues assigned to current user
                jql = f'assignee = "{account_id}"'
                search_response = await client.get(
                    f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/search",
                    headers=self.headers,
                    params={
                        'jql': jql,
                        'maxResults': limit,
                        'fields': 'id,key,summary,status,priority,assignee,created,updated'
                    }
                )
                
                if search_response.status_code != 200:
                    print(f"Failed to search issues: {search_response.status_code} - {search_response.text}")
                    return []
                
                search_data = search_response.json()
                issues = search_data.get('issues', [])

                print(search_data)
                
                tickets = []
                for issue in issues:
                    fields = issue.get('fields', {})
                    tickets.append(Ticket(
                        id=str(issue.get('id', '')),
                        key=issue.get('key', ''),
                        title=fields.get('summary', ''),
                        status=fields.get('status', {}).get('name', 'Unknown'),
                        priority=fields.get('priority', {}).get('name', 'None'),
                        assignee=fields.get('assignee', {}).get('displayName') if fields.get('assignee') else None,
                        created_at=datetime.fromisoformat(fields.get('created', '2023-01-01T00:00:00.000+0000').replace('Z', '+00:00')),
                        updated_at=datetime.fromisoformat(fields.get('updated', '2023-01-01T00:00:00.000+0000').replace('Z', '+00:00'))
                    ))
                
                return tickets
                
        except Exception as e:
            print(f"Error fetching assigned tickets: {e}")
            return []
    
    async def get_reported_tickets(self, limit: int = 10) -> List[Ticket]:
        """Get tickets reported by the current user."""
        if not self.jira:
            return []
        
        try:
            # Get current user
            current_user = self.jira.current_user()
            
            # Search for issues reported by current user
            jql = f'reporter = "{current_user}" AND status != "Done" ORDER BY updated DESC'
            issues = self.jira.search_issues(jql, maxResults=limit)
            
            tickets = []
            for issue in issues:
                tickets.append(Ticket(
                    id=str(issue.id),
                    key=issue.key,
                    title=issue.fields.summary,
                    status=issue.fields.status.name,
                    priority=issue.fields.priority.name if issue.fields.priority else "None",
                    assignee=issue.fields.assignee.displayName if issue.fields.assignee else None,
                    created_at=datetime.fromisoformat(issue.fields.created.replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(issue.fields.updated.replace('Z', '+00:00'))
                ))
            
            return tickets
        except Exception as e:
            print(f"Error fetching reported tickets: {e}")
            return []
    
    async def get_watching_tickets(self, limit: int = 10) -> List[Ticket]:
        """Get tickets the user is watching."""
        if not self.jira:
            return []
        
        try:
            # Get current user
            current_user = self.jira.current_user()
            
            # Search for issues being watched by current user
            jql = f'watcher = "{current_user}" AND status != "Done" ORDER BY updated DESC'
            issues = self.jira.search_issues(jql, maxResults=limit)
            
            tickets = []
            for issue in issues:
                tickets.append(Ticket(
                    id=str(issue.id),
                    key=issue.key,
                    title=issue.fields.summary,
                    status=issue.fields.status.name,
                    priority=issue.fields.priority.name if issue.fields.priority else "None",
                    assignee=issue.fields.assignee.displayName if issue.fields.assignee else None,
                    created_at=datetime.fromisoformat(issue.fields.created.replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(issue.fields.updated.replace('Z', '+00:00'))
                ))
            
            return tickets
        except Exception as e:
            print(f"Error fetching watching tickets: {e}")
            return []
    
    async def get_recent_activity(self, limit: int = 10) -> List[dict]:
        """Get recent activity from Jira."""
        if not self.jira:
            return []
        
        try:
            # This is a simplified implementation
            # You might want to use Jira's activity stream API for more detailed activity
            current_user = self.jira.current_user()
            jql = f'(assignee = "{current_user}" OR reporter = "{current_user}") ORDER BY updated DESC'
            issues = self.jira.search_issues(jql, maxResults=limit)
            
            activities = []
            for issue in issues:
                activities.append({
                    "id": issue.id,
                    "key": issue.key,
                    "title": issue.fields.summary,
                    "type": "issue_updated",
                    "updated_at": datetime.fromisoformat(issue.fields.updated.replace('Z', '+00:00')),
                    "url": f"{self.server}/browse/{issue.key}"
                })
            
            return activities
        except Exception as e:
            print(f"Error fetching recent activity: {e}")
            return []
