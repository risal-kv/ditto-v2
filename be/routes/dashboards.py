"""
Dashboard routes for managing user dashboards and widgets.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import asyncio

from models.database import get_db, User as DBUser, Integration, Dashboard, Widget
from schemas.models import (
    Dashboard as DashboardSchema, DashboardCreate, DashboardWithWidgets, 
    DashboardWithWidgetsAndData, Widget as WidgetSchema, WidgetWithData, 
    WidgetCreate, DashboardData
)
from utils.auth import get_current_active_user
from services.github_service import GitHubService
from services.google_service import GoogleService
from services.jira_service import JiraService
from services.cache_service import cache_service
from config.settings import settings

router = APIRouter(
    tags=["dashboards"]
)

# Helper function to fetch widget data
def _cache_and_return(data: dict, user_id: int, service_name: str, widget_type: str, cache_params: dict, ttl: int = 600) -> dict:
    """Helper function to cache data and return it."""
    cache_service.set(user_id, service_name, widget_type, data, cache_params, ttl)
    return data

async def _fetch_widget_data(widget: Widget, user_id: int, db: Session) -> dict:
    """Fetch live data for a widget based on its service and type."""
    try:
        # Try to get data from cache first
        cache_params = {"widget_type": widget.widget_type, "config": widget.config}
        cached_data = cache_service.get(user_id, widget.service_name, widget.widget_type, cache_params)
        
        if cached_data:
            print(f"Cache HIT for {widget.service_name}:{widget.widget_type}")
            return cached_data
        
        print(f"Cache MISS for {widget.service_name}:{widget.widget_type} - fetching from API")
        
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
                prs = github_service.get_pull_requests(limit=limit)
                data = {"pull_requests": [pr.dict() for pr in prs]}
                return _cache_and_return(data, user_id, widget.service_name, widget.widget_type, cache_params)
            
            elif widget.widget_type == "issues":
                limit = widget.config.get("limit", 10) if widget.config else 10
                issues = github_service.get_assigned_issues(limit=limit)
                data = {"issues": issues}
                return _cache_and_return(data, user_id, widget.service_name, widget.widget_type, cache_params)
            
            elif widget.widget_type == "notifications":
                limit = widget.config.get("limit", 10) if widget.config else 10
                notifications = github_service.get_notifications(limit=limit)
                data = {"notifications": notifications}
                return _cache_and_return(data, user_id, widget.service_name, widget.widget_type, cache_params)
        
        elif widget.service_name == "google":
            google_service = GoogleService(integration.access_token, integration.refresh_token or "")
            
            if widget.widget_type == "calendar":
                limit = widget.config.get("limit", 10) if widget.config else 10
                events = await google_service.get_calendar_events(limit=limit)
                data = {"events": [event.dict() for event in events]}
                return _cache_and_return(data, user_id, widget.service_name, widget.widget_type, cache_params)
            
            elif widget.widget_type == "tasks":
                limit = widget.config.get("limit", 10) if widget.config else 10
                tasks = await google_service.get_tasks(limit=limit)
                data = {"tasks": [task.dict() for task in tasks]}
                return _cache_and_return(data, user_id, widget.service_name, widget.widget_type, cache_params)
            
            elif widget.widget_type == "emails":
                limit = widget.config.get("limit", 10) if widget.config else 10
                emails = await google_service.get_emails(limit=limit)
                data = {"emails": [email.dict() for email in emails]}
                return _cache_and_return(data, user_id, widget.service_name, widget.widget_type, cache_params)
        
        elif widget.service_name == "jira":
            jira_service = JiraService(integration.access_token, settings.jira_server)
            
            if widget.widget_type == "tickets":
                limit = widget.config.get("limit", 10) if widget.config else 10
                tickets = await jira_service.get_assigned_tickets(limit=limit)
                data = {"tickets": [ticket.dict() for ticket in tickets]}
                return _cache_and_return(data, user_id, widget.service_name, widget.widget_type, cache_params)
        
        elif widget.service_name == "notes":
            # Notes is an internal service, no integration record needed
            from services.notes_service import NotesService
            notes_service = NotesService(db, user_id)
            
            if widget.widget_type == "notes_list":
                limit = widget.config.get("limit", 10) if widget.config else 10
                pinned_only = widget.config.get("pinned_only", False) if widget.config else False
                notes = notes_service.get_notes(limit=limit, pinned_only=pinned_only)
                data = {"notes": [{
                    "id": note.id,
                    "title": note.title,
                    "content": note.content,
                    "is_pinned": note.is_pinned,
                    "created_at": note.created_at,
                    "updated_at": note.updated_at
                } for note in notes]}
                return _cache_and_return(data, user_id, widget.service_name, widget.widget_type, cache_params, ttl=300)
            
            elif widget.widget_type == "notes_search":
                query = widget.config.get("query", "") if widget.config else ""
                limit = widget.config.get("limit", 10) if widget.config else 10
                if query:
                    notes = notes_service.search_notes(query, limit=limit)
                    return {"search_results": [{
                        "id": note.id,
                        "title": note.title,
                        "content": note.content,
                        "is_pinned": note.is_pinned,
                        "created_at": note.created_at,
                        "updated_at": note.updated_at
                    } for note in notes]}
                else:
                    return {"search_results": []}
        
        data = {"error": f"Unsupported widget type: {widget.widget_type} for service: {widget.service_name}"}
        # Cache error responses for shorter time (1 minute) to retry sooner
        cache_service.set(user_id, widget.service_name, widget.widget_type, data, cache_params, ttl=60)
        return data
    
    except Exception as e:
        error_data = {"error": f"Failed to fetch data: {str(e)}"}
        # Cache error responses for shorter time (1 minute)
        cache_service.set(user_id, widget.service_name, widget.widget_type, error_data, cache_params, ttl=60)
        return error_data

@router.get("/dashboards", response_model=List[DashboardSchema])
async def get_user_dashboards(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all dashboards for the current user."""
    dashboards = db.query(Dashboard).filter(Dashboard.user_id == current_user.id).all()
    return dashboards

@router.post("/dashboards", response_model=DashboardSchema)
async def create_dashboard(
    dashboard: DashboardCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new dashboard."""
    import json
    
    # Serialize layout_config to JSON string if it's a dict
    layout_config_json = None
    if dashboard.layout_config:
        if isinstance(dashboard.layout_config, dict):
            layout_config_json = json.dumps(dashboard.layout_config)
        else:
            layout_config_json = dashboard.layout_config
    
    # Create the dashboard
    db_dashboard = Dashboard(
        user_id=current_user.id,
        name=dashboard.name,
        description=dashboard.description,
        is_default=dashboard.is_default,
        layout_config=layout_config_json
    )
    db.add(db_dashboard)
    db.commit()
    db.refresh(db_dashboard)
    
    # Auto-add Notes integration if it doesn't exist
    notes_integration = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.service_name == "notes"
    ).first()
    
    if not notes_integration:
        notes_integration = Integration(
            user_id=current_user.id,
            service_name="notes",
            access_token="internal",  # Placeholder for internal service
            is_active=True,
            metadata=json.dumps({"type": "internal", "service": "notes"})
        )
        db.add(notes_integration)
        db.commit()
        db.refresh(notes_integration)
    
    # Add default Notes widget to the new dashboard
    default_notes_widget = Widget(
        dashboard_id=db_dashboard.id,
        widget_type="notes_list",
        service_name="notes",
        position_x=0,
        position_y=0,
        width=4,
        height=3,
        config=json.dumps({"limit": 10, "pinned_only": False})
    )
    db.add(default_notes_widget)
    db.commit()
    
    return db_dashboard

@router.get("/dashboards/{dashboard_id}", response_model=DashboardWithWidgetsAndData)
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

@router.post("/dashboards/{dashboard_id}/widgets/integration", response_model=WidgetSchema)
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

@router.get("/dashboard/data", response_model=DashboardData)
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
