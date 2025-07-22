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
from config.settings import settings

router = APIRouter(
    tags=["dashboards"]
)

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
