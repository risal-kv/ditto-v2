"""
Integration routes for connecting external services.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import json

from be.models.database import get_db, User as DBUser, Integration
from be.schemas.models import Integration as IntegrationSchema
from be.utils.auth import get_current_active_user
from be.services.github_service import GitHubService
from be.services.google_service import GoogleService
from be.services.jira_service import JiraService
from be.config.settings import settings

router = APIRouter(
    tags=["integrations"]
)

@router.get("/apps")
async def get_available_integrations():
    """Get a list of available integrations."""
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

@router.get("/integrations", response_model=List[IntegrationSchema])
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
@router.get("/integrations/github/connect")
async def github_connect(
    current_user: DBUser = Depends(get_current_active_user)
):
    """Get GitHub OAuth URL."""
    github_service = GitHubService("")
    oauth_url = github_service.get_oauth_url()
    return {"url": oauth_url}

@router.get("/integrations/github/callback")
async def github_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle GitHub OAuth callback."""
    # Get code from query parameters
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code parameter")
    
    # Get state from query parameters (contains user_id)
    state = request.query_params.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing state parameter")
    
    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Exchange code for access token
    github_service = GitHubService("")
    access_token = await github_service.exchange_code_for_token(code)
    
    if not access_token:
        raise HTTPException(status_code=400, detail="Failed to get access token")
    
    # Get user info to verify connection
    github_service = GitHubService(access_token)
    user_info = await github_service.get_user_info()
    
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info")
    
    # Check if integration already exists
    integration = db.query(Integration).filter(
        Integration.user_id == user_id,
        Integration.service_name == "github"
    ).first()
    
    if integration:
        # Update existing integration
        integration.access_token = access_token
        integration.is_active = True
        integration.metadata = json.dumps(user_info)
    else:
        # Create new integration
        integration = Integration(
            user_id=user_id,
            service_name="github",
            access_token=access_token,
            is_active=True,
            metadata=json.dumps(user_info)
        )
        db.add(integration)
    
    db.commit()
    
    # Redirect to frontend
    return {"success": True, "integration": "github", "username": user_info.get("login")}

# Google Integration
@router.get("/integrations/google/connect")
async def google_connect(
    current_user: DBUser = Depends(get_current_active_user)
):
    """Get Google OAuth URL."""
    google_service = GoogleService("", "")
    oauth_url = google_service.get_oauth_url(str(current_user.id))
    return {"url": oauth_url}

@router.get("/integrations/google/callback")
async def google_callback(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback."""
    # Get code from query parameters
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing code parameter")
    
    # Get state from query parameters (contains user_id)
    state = request.query_params.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing state parameter")
    
    try:
        user_id = int(state)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    # Exchange code for access token
    google_service = GoogleService("", "")
    token_info = await google_service.exchange_code_for_token(code)
    
    if not token_info or "access_token" not in token_info:
        raise HTTPException(status_code=400, detail="Failed to get access token")
    
    access_token = token_info["access_token"]
    refresh_token = token_info.get("refresh_token", "")
    
    # Get user info to verify connection
    google_service = GoogleService(access_token, refresh_token)
    user_info = await google_service.get_user_info()
    
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info")
    
    # Check if integration already exists
    integration = db.query(Integration).filter(
        Integration.user_id == user_id,
        Integration.service_name == "google"
    ).first()
    
    if integration:
        # Update existing integration
        integration.access_token = access_token
        integration.refresh_token = refresh_token
        integration.is_active = True
        integration.metadata = json.dumps(user_info)
    else:
        # Create new integration
        integration = Integration(
            user_id=user_id,
            service_name="google",
            access_token=access_token,
            refresh_token=refresh_token,
            is_active=True,
            metadata=json.dumps(user_info)
        )
        db.add(integration)
    
    db.commit()
    
    # Redirect to frontend
    return {"success": True, "integration": "google", "email": user_info.get("email")}

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
