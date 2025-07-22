"""
Calendar routes for fetching meeting data from Google Calendar.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json

from models.database import get_db, User as DBUser, Integration
from utils.auth import get_current_active_user
from services.google_service import GoogleService

router = APIRouter(
    prefix="/calendar",
    tags=["calendar"]
)

@router.get("/meetings")
async def get_meetings(
    start_date: Optional[str] = Query(None, description="Start date in ISO format (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date in ISO format (YYYY-MM-DD)"),
    days: Optional[int] = Query(30, description="Number of days to fetch if start/end dates not provided"),
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get meetings from Google Calendar for a specific date range.
    
    If start_date and end_date are not provided, it will fetch meetings for the specified
    number of days (default: 30) from today.
    """
    # Check if user has Google integration
    integration = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.service_name == "google",
        Integration.is_active == True
    ).first()
    
    if not integration:
        raise HTTPException(
            status_code=404,
            detail="Google Calendar integration not found. Please connect your Google account first."
        )
    
    # Parse dates or use default range
    try:
        if start_date:
            start_datetime = datetime.fromisoformat(start_date)
        else:
            start_datetime = datetime.now()
        
        if end_date:
            end_datetime = datetime.fromisoformat(end_date)
        else:
            end_datetime = start_datetime + timedelta(days=days)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Please use ISO format (YYYY-MM-DD)."
        )
    
    # Initialize Google service with user's tokens
    google_service = GoogleService(
        access_token=integration.access_token,
        refresh_token=integration.refresh_token
    )
    
    # Fetch calendar events
    events = await google_service.get_calendar_events(
        start_date=start_datetime,
        end_date=end_datetime
    )
    
    return {
        "start_date": start_datetime.isoformat(),
        "end_date": end_datetime.isoformat(),
        "count": len(events),
        "meetings": events
    }

@router.get("/status")
async def get_calendar_status(
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Check if the user has connected their Google Calendar.
    """
    integration = db.query(Integration).filter(
        Integration.user_id == current_user.id,
        Integration.service_name == "google",
        Integration.is_active == True
    ).first()
    
    if integration:
        # Get user info from metadata
        metadata = {}
        try:
            if integration.metadata:
                metadata = json.loads(integration.metadata)
        except:
            pass
        
        return {
            "connected": True,
            "email": metadata.get("email", "Unknown"),
            "name": metadata.get("name", "Unknown"),
            "connected_at": integration.updated_at.isoformat() if integration.updated_at else None
        }
    
    return {
        "connected": False
    }
