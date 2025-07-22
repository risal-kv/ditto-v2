import httpx
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import Flow
from typing import List, Optional
from datetime import datetime, timedelta
import warnings
from schemas.models import CalendarEvent, Task, Email
from config.settings import settings

class GoogleService:
    def __init__(self, access_token: str, refresh_token: str = None):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.google_client_id,
            client_secret=settings.google_client_secret
        )
    
    async def get_oauth_url(self, state: str = None) -> str:
        """Generate Google OAuth URL."""
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [settings.google_redirect_uri]
                }
            },
            scopes=[
                "https://www.googleapis.com/auth/calendar",
                "https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
                "openid"
            ]
        )
        flow.redirect_uri = settings.google_redirect_uri
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'  # Force consent screen to get refresh token
        )
        return authorization_url
    
    async def exchange_code_for_token(self, code: str) -> dict:
        """Exchange authorization code for access token."""
        try:
            # Temporarily suppress warnings about scope changes
            warnings.filterwarnings('ignore', message='Scope has changed')
            
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": settings.google_client_id,
                        "client_secret": settings.google_client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                        "redirect_uris": [settings.google_redirect_uri]
                    }
                },
                scopes=[
                    "https://www.googleapis.com/auth/calendar",
                    "https://www.googleapis.com/auth/gmail.readonly",
                    "https://www.googleapis.com/auth/userinfo.email",
                    "https://www.googleapis.com/auth/userinfo.profile",
                    "openid"
                ]
            )
            flow.redirect_uri = settings.google_redirect_uri
            
            # Fetch token while ignoring scope change warnings
            try:
                flow.fetch_token(code=code)
            except Exception as token_error:
                print(f"Token fetch error details: {str(token_error)}")
                # Try to continue if we have credentials despite the error
                if not flow.credentials or not flow.credentials.token:
                    raise token_error
            
            # Reset warnings to default
            warnings.resetwarnings()
            
            # Check if we have valid credentials
            if not flow.credentials or not flow.credentials.token:
                raise Exception("Failed to obtain valid credentials")
                
            return {
                "access_token": flow.credentials.token,
                "refresh_token": flow.credentials.refresh_token,
                "expires_at": flow.credentials.expiry.isoformat() if flow.credentials.expiry else None
            }
        except Exception as e:
            print(f"Error exchanging code for token: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return {}
    
    def refresh_credentials(self):
        """Refresh access token if needed."""
        if self.credentials.expired and self.credentials.refresh_token:
            self.credentials.refresh(GoogleRequest())
            return self.credentials.token
        return self.access_token
    
    async def get_calendar_events(self, limit: int = 10, days_ahead: int = 7, start_date: datetime = None, end_date: datetime = None) -> List[CalendarEvent]:
        """Get calendar events within a date range."""
        try:
            self.refresh_credentials()
            service = build('calendar', 'v3', credentials=self.credentials)
            
            # Use provided dates or default to current time + days_ahead
            if start_date is None:
                start_time = datetime.utcnow()
            else:
                start_time = start_date
                
            if end_date is None:
                end_time = start_time + timedelta(days=days_ahead)
            else:
                end_time = end_date
            
            events_result = service.events().list(
                calendarId='primary',
                timeMin=start_time.isoformat() + 'Z',
                timeMax=end_time.isoformat() + 'Z',
                maxResults=limit,
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            events = events_result.get('items', [])
            calendar_events = []
            
            for event in events:
                start = event['start'].get('dateTime', event['start'].get('date'))
                end = event['end'].get('dateTime', event['end'].get('date'))
                
                # Parse datetime strings
                if 'T' in start:
                    start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
                else:
                    # All-day event
                    start_dt = datetime.fromisoformat(start + 'T00:00:00+00:00')
                    end_dt = datetime.fromisoformat(end + 'T23:59:59+00:00')
                
                calendar_events.append(CalendarEvent(
                    id=event['id'],
                    title=event.get('summary', 'No Title'),
                    start_time=start_dt,
                    end_time=end_dt,
                    description=event.get('description'),
                    location=event.get('location')
                ))
            
            return calendar_events
        except Exception as e:
            print(f"Error fetching calendar events: {e}")
            return []
    
    async def get_tasks(self, limit: int = 10) -> List[Task]:
        """Get Google Tasks."""
        try:
            self.refresh_credentials()
            service = build('tasks', 'v1', credentials=self.credentials)
            
            # Get task lists
            task_lists = service.tasklists().list().execute()
            all_tasks = []
            
            for task_list in task_lists.get('items', []):
                tasks_result = service.tasks().list(
                    tasklist=task_list['id'],
                    maxResults=limit
                ).execute()
                
                for task in tasks_result.get('items', []):
                    due_date = None
                    if task.get('due'):
                        due_date = datetime.fromisoformat(task['due'].replace('Z', '+00:00'))
                    
                    all_tasks.append(Task(
                        id=task['id'],
                        title=task.get('title', 'No Title'),
                        description=task.get('notes'),
                        due_date=due_date,
                        status=task.get('status', 'needsAction'),
                        priority=None  # Google Tasks doesn't have priority
                    ))
                
                if len(all_tasks) >= limit:
                    break
            
            return all_tasks[:limit]
        except Exception as e:
            print(f"Error fetching tasks: {e}")
            return []
    
    async def get_emails(self, limit: int = 10) -> List[Email]:
        """Get recent emails from Gmail."""
        try:
            self.refresh_credentials()
            service = build('gmail', 'v1', credentials=self.credentials)
            
            # Get recent messages
            messages_result = service.users().messages().list(
                userId='me',
                maxResults=limit,
                q='is:unread OR is:important'
            ).execute()
            
            messages = messages_result.get('messages', [])
            emails = []
            
            for message in messages:
                msg = service.users().messages().get(
                    userId='me',
                    id=message['id'],
                    format='metadata',
                    metadataHeaders=['From', 'Subject', 'Date']
                ).execute()
                
                headers = {h['name']: h['value'] for h in msg.get('payload', {}).get('headers', [])}
                
                # Parse date
                received_at = datetime.now()  # Default to now if parsing fails
                if 'Date' in headers:
                    try:
                        from email.utils import parsedate_to_datetime
                        received_at = parsedate_to_datetime(headers['Date'])
                    except:
                        pass
                
                emails.append(Email(
                    id=message['id'],
                    subject=headers.get('Subject', 'No Subject'),
                    sender=headers.get('From', 'Unknown'),
                    received_at=received_at,
                    is_read='UNREAD' not in msg.get('labelIds', []),
                    snippet=msg.get('snippet', '')[:100] + '...' if len(msg.get('snippet', '')) > 100 else msg.get('snippet', '')
                ))
            
            return emails
        except Exception as e:
            print(f"Error fetching emails: {e}")
            return []
    
    async def get_user_info(self) -> dict:
        """Get user info."""
        try:
            self.refresh_credentials()
            service = build('oauth2', 'v2', credentials=self.credentials)
            
            user_info = service.userinfo().get().execute()
            return {
                "id": user_info.get('id'),
                "name": user_info.get('name'),
                "email": user_info.get('email'),
                "picture": user_info.get('picture')
            }
        except Exception as e:
            print(f"Error fetching user info: {e}")
            return {}
