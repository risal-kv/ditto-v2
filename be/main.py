from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional
import uvicorn
import asyncio
import os
import json

# Import our modules
from config.settings import settings
from models.database import get_db, User as DBUser, Integration, Dashboard, Widget
from schemas.models import (
    User, UserCreate, Token, DashboardData, Dashboard as DashboardSchema,
    DashboardCreate, DashboardWithWidgets, DashboardWithWidgetsAndData,
    Widget as WidgetSchema, WidgetWithData, WidgetCreate, 
    Integration as IntegrationSchema
)
from utils.auth import (
    authenticate_user, create_access_token, get_current_active_user,
    get_password_hash
)
from services.github_service import GitHubService
from services.google_service import GoogleService
from services.jira_service import JiraService

app = FastAPI(
    title="Productivity Dashboard API",
    description="Aggregates data from multiple productivity services",
    version="1.0.0"
)

# Mount static files directory
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)  # Ensure static directory exists
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Routes
@app.post("/auth/register", response_model=User)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    db_user = db.query(DBUser).filter(DBUser.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    db_user = db.query(DBUser).filter(DBUser.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = DBUser(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create default dashboard
    default_dashboard = Dashboard(
        user_id=db_user.id,
        name="My Dashboard",
        description="Default productivity dashboard",
        is_default=True
    )
    db.add(default_dashboard)
    db.commit()
    
    return db_user

@app.post("/auth/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate user and return access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Helper function to fetch widget data
async def _fetch_widget_data(widget: Widget, user_id: int, db: Session) -> dict:
    """Fetch live data for a widget based on its service and type."""
    try:
        # Get the integration for this service
        integration = db.query(Integration).filter(
            Integration.user_id == user_id,
            Integration.service_name == widget.service_name,
            Integration.is_active == True
        ).first()
        
        if not integration:
            return {"error": f"No active {widget.service_name} integration found"}
        
        # Fetch data based on service type
        if widget.service_name == "github":
            github_service = GitHubService(integration.access_token)
            
            if widget.widget_type == "pull_requests":
                limit = widget.config.get("limit", 10) if widget.config else 10
                prs = await github_service.get_pull_requests(limit=limit)
                return {"pull_requests": [pr.dict() for pr in prs]}
            
            elif widget.widget_type == "issues":
                limit = widget.config.get("limit", 10) if widget.config else 10
                issues = await github_service.get_assigned_issues(limit=limit)
                return {"issues": issues}
            
            elif widget.widget_type == "notifications":
                limit = widget.config.get("limit", 10) if widget.config else 10
                notifications = await github_service.get_notifications(limit=limit)
                return {"notifications": notifications}
        
        elif widget.service_name == "google":
            google_service = GoogleService(integration.access_token, integration.refresh_token or "")
            
            if widget.widget_type == "calendar":
                limit = widget.config.get("limit", 10) if widget.config else 10
                events = await google_service.get_calendar_events(limit=limit)
                return {"events": [event.dict() for event in events]}
            
            elif widget.widget_type == "tasks":
                limit = widget.config.get("limit", 10) if widget.config else 10
                tasks = await google_service.get_tasks(limit=limit)
                return {"tasks": [task.dict() for task in tasks]}
            
            elif widget.widget_type == "emails":
                limit = widget.config.get("limit", 10) if widget.config else 10
                emails = await google_service.get_emails(limit=limit)
                return {"emails": [email.dict() for email in emails]}
        
        elif widget.service_name == "jira":
            jira_service = JiraService(integration.access_token, settings.jira_server)
            
            if widget.widget_type == "tickets":
                limit = widget.config.get("limit", 10) if widget.config else 10
                tickets = await jira_service.get_assigned_tickets(limit=limit)
                return {"tickets": [ticket.dict() for ticket in tickets]}
        
        return {"error": f"Unsupported widget type: {widget.widget_type} for service: {widget.service_name}"}
    
    except Exception as e:
        return {"error": f"Failed to fetch data: {str(e)}"}

# Dashboard Routes
@app.get("/dashboards", response_model=List[DashboardSchema])
async def get_user_dashboards(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all dashboards for the current user."""
    dashboards = db.query(Dashboard).filter(Dashboard.user_id == current_user.id).all()
    return dashboards

@app.post("/dashboards", response_model=DashboardSchema)
async def create_dashboard(
    dashboard: DashboardCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new dashboard."""
    db_dashboard = Dashboard(
        user_id=current_user.id,
        name=dashboard.name,
        description=dashboard.description,
        is_default=dashboard.is_default,
        layout_config=dashboard.layout_config
    )
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)
    return db_dashboard

@app.get("/dashboards/{dashboard_id}", response_model=DashboardWithWidgetsAndData)
async def get_dashboard(
    dashboard_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific dashboard with its widgets and live data."""
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id
    ).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    widgets = db.query(Widget).filter(Widget.dashboard_id == dashboard_id).all()
    
    # Fetch live data for each widget
    widgets_with_data = []
    for widget in widgets:
        widget_data = await _fetch_widget_data(widget, current_user.id, db)
        widget_with_data = WidgetWithData(
            id=widget.id,
            dashboard_id=widget.dashboard_id,
            widget_type=widget.widget_type,
            service_name=widget.service_name,
            position_x=widget.position_x,
            position_y=widget.position_y,
            width=widget.width,
            height=widget.height,
            config=widget.config,
            is_active=widget.is_active,
            created_at=widget.created_at,
            data=widget_data
        )
        widgets_with_data.append(widget_with_data)
    
    # Create response with widgets and data
    response = DashboardWithWidgetsAndData(
        id=dashboard.id,
        user_id=dashboard.user_id,
        name=dashboard.name,
        description=dashboard.description,
        is_default=dashboard.is_default,
        layout_config=dashboard.layout_config,
        created_at=dashboard.created_at,
        widgets=widgets_with_data
    )
    
    return response

@app.post("/dashboards/{dashboard_id}/widgets/integration", response_model=WidgetSchema)
async def create_integration_widget(
    dashboard_id: int,
    widget: WidgetCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new widget from an integration service for a specific dashboard."""
    # Check if dashboard exists and belongs to user
    dashboard = db.query(Dashboard).filter(
        Dashboard.id == dashboard_id,
        Dashboard.user_id == current_user.id
    ).first()
    
    if not dashboard:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    
    # Verify that the user has an active integration for the service
    integration = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.service_name == widget.service_name,
        Integration.is_active == True
    ).first()
    
    if not integration:
        raise HTTPException(
            status_code=400,
            detail=f"No active {widget.service_name} integration found. Please connect the service first."
        )
    
    # Create the widget
    # Convert config dict to JSON string for database storage
    config_json = json.dumps(widget.config) if widget.config else None
    
    db_widget = Widget(
        dashboard_id=dashboard_id,
        widget_type=widget.widget_type,
        service_name=widget.service_name,
        position_x=widget.position_x,
        position_y=widget.position_y,
        width=widget.width,
        height=widget.height,
        config=config_json
    )
    
    db.add(db_widget)
    db.commit()
    db.refresh(db_widget)
    return db_widget

@app.get("/dashboard/data", response_model=DashboardData)
async def get_dashboard_data(
    dashboard_id: Optional[int] = None,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get aggregated data for dashboard."""
    # Get user's integrations
    integrations = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.is_active == True
    ).all()
    
    integration_map = {integration.service_name: integration for integration in integrations}
    
    dashboard_data = DashboardData()
    
    # Aggregate data from all services
    tasks = []
    
    # GitHub data
    if 'github' in integration_map:
        github_service = GitHubService(integration_map['github'].access_token)
        try:
            prs = await github_service.get_pull_requests(limit=10)
            dashboard_data.pull_requests = prs
        except Exception as e:
            print(f"Error fetching GitHub data: {e}")
    
    # Google data
    if 'google' in integration_map:
        google_service = GoogleService(
            integration_map['google'].access_token,
            integration_map['google'].refresh_token
        )
        try:
            events = await google_service.get_calendar_events(limit=10)
            google_tasks = await google_service.get_tasks(limit=10)
            emails = await google_service.get_emails(limit=10)
            
            dashboard_data.calendar_events = events
            dashboard_data.tasks.extend(google_tasks)
            dashboard_data.emails = emails
        except Exception as e:
            print(f"Error fetching Google data: {e}")
    
    # Jira data
    if 'jira' in integration_map:
        jira_service = JiraService(
            integration_map['jira'].access_token,
            settings.jira_server
        )
        try:
            tickets = await jira_service.get_assigned_tickets(limit=10)
            dashboard_data.tickets = tickets
        except Exception as e:
            print(f"Error fetching Jira data: {e}")
    
    return dashboard_data

# Integration Routes

@app.get("/apps")
async def get_available_integrations():
    integrations = [
        {
            "id": "github",
            "name": "GitHub",
            "description": "Connect to GitHub to track your repositories, issues, and pull requests.",
            "icon": "github",
            "connect_url": "/integrations/github/connect"
        },
        {
            "id": "google",
            "name": "Google",
            "description": "Connect to Google services for calendar, tasks, and emails.",
            "icon": "google",
            "connect_url": "/integrations/google/connect"
        },
        {
            "id": "jira",
            "name": "Jira",
            "description": "Connect to Jira for project management and issue tracking.",
            "icon": "jira",
            "connect_url": "/integrations/jira/connect"
        }
    ]
    return {"integrations": integrations}

@app.get("/integrations", response_model=List[IntegrationSchema])
async def get_user_integrations(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all integrations for the current user."""
    integrations = db.query(Integration).filter(
        Integration.user_id == current_user.id
    ).all()
    return integrations

# GitHub Integration
@app.get("/integrations/github/connect")
async def github_connect(
    current_user: DBUser = Depends(get_current_active_user)
):
    """Get GitHub OAuth URL."""
    try:
        github_service = GitHubService(None)
        oauth_url = await github_service.get_oauth_url(state=str(current_user.id))
        return {"oauth_url": oauth_url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/integrations/github/callback")
async def github_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback."""
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    
    try:
        user_id = int(state) if state else None
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        github_service = GitHubService("")
        token_data = await github_service.exchange_code_for_token(code)
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        # Store integration
        integration = db.query(Integration).filter(
            Integration.user_id == user_id,
            Integration.service_name == "github"
        ).first()
        
        if integration:
            integration.access_token = token_data["access_token"]
            integration.is_active = True
        else:
            integration = Integration(
                user_id=user_id,
                service_name="github",
                access_token=token_data["access_token"]
            )
            db.add(integration)
        
        db.commit()
        return {"message": "GitHub integration successful"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Integration failed: {str(e)}")

# Google Integration
@app.get("/integrations/google/connect")
async def google_connect(
    current_user: DBUser = Depends(get_current_active_user)
):
    """Get Google OAuth URL."""
    google_service = GoogleService("", "")
    oauth_url = await google_service.get_oauth_url(state=str(current_user.id))
    return {"oauth_url": oauth_url}

@app.get("/integrations/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback."""
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    
    try:
        user_id = int(state) if state else None
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        google_service = GoogleService("", "")
        token_data = await google_service.exchange_code_for_token(code)
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        # Store integration
        integration = db.query(Integration).filter(
            Integration.user_id == user_id,
            Integration.service_name == "google"
        ).first()
        
        if integration:
            integration.access_token = token_data["access_token"]
            integration.refresh_token = token_data.get("refresh_token")
            integration.is_active = True
        else:
            integration = Integration(
                user_id=user_id,
                service_name="google",
                access_token=token_data["access_token"],
                refresh_token=token_data.get("refresh_token")
            )
            db.add(integration)
        
        db.commit()
        return {"message": "Google integration successful"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Integration failed: {str(e)}")

# Jira Integration
@app.get("/integrations/jira/connect")
async def jira_connect(
    current_user: DBUser = Depends(get_current_active_user)
):
    """Get Jira OAuth URL for authentication."""
    try:
        jira_service = JiraService("", settings.jira_server)
        oauth_url = await jira_service.get_oauth_url(state=str(current_user.id))
        return {"oauth_url": oauth_url}
    except Exception as e:
        print(f"Error in jira_connect: {e}")
        raise HTTPException(status_code=500, detail=f"OAuth setup failed: {str(e)}")

@app.get("/integrations/jira/callback")
async def jira_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Jira OAuth callback."""
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not provided")
    
    try:
        user_id = int(state) if state else None
        if not user_id:
            raise HTTPException(status_code=400, detail="Invalid state parameter")
        
        jira_service = JiraService("", settings.jira_server)
        token_data = await jira_service.exchange_code_for_token(code)
        
        if "access_token" not in token_data:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        # Store integration
        integration = db.query(Integration).filter(
            Integration.user_id == user_id,
            Integration.service_name == "jira"
        ).first()
        
        if integration:
            integration.access_token = token_data["access_token"]
            integration.is_active = True
        else:
            integration = Integration(
                user_id=user_id,
                service_name="jira",
                access_token=token_data["access_token"]
            )
            db.add(integration)
        
        db.commit()
        return {"message": "Jira integration successful"}
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Integration failed: {str(e)}")

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
