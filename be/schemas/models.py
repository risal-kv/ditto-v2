from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Integration schemas
class IntegrationBase(BaseModel):
    service_name: str

class IntegrationCreate(IntegrationBase):
    access_token: str
    refresh_token: Optional[str] = None
    token_expires_at: Optional[datetime] = None

class Integration(IntegrationBase):
    id: int
    user_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard schemas
class DashboardBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_default: bool = False

class DashboardCreate(DashboardBase):
    layout_config: Optional[Dict[str, Any]] = None

class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    layout_config: Optional[Dict[str, Any]] = None
    is_default: Optional[bool] = None

class Dashboard(DashboardBase):
    id: int
    user_id: int
    layout_config: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Widget schemas
class WidgetBase(BaseModel):
    widget_type: str
    service_name: str
    position_x: int = 0
    position_y: int = 0
    width: int = 1
    height: int = 1

class WidgetCreate(WidgetBase):
    config: Optional[Dict[str, Any]] = None

class WidgetUpdate(BaseModel):
    widget_type: Optional[str] = None
    service_name: Optional[str] = None
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class Widget(WidgetBase):
    id: int
    dashboard_id: int
    config: Optional[Dict[str, Any]] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Widget with live data
class WidgetWithData(Widget):
    data: Optional[Dict[str, Any]] = None

# Dashboard response with widgets
class DashboardWithWidgets(Dashboard):
    widgets: List[Widget] = []

# Dashboard response with widgets including live data
class DashboardWithWidgetsAndData(Dashboard):
    widgets: List[WidgetWithData] = []

# Service data schemas
class CalendarEvent(BaseModel):
    id: str
    title: str
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None
    location: Optional[str] = None

class Task(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str
    priority: Optional[str] = None

class PullRequest(BaseModel):
    id: int
    title: str
    url: str
    state: str
    created_at: datetime
    updated_at: datetime
    author: str
    repository: str

class Ticket(BaseModel):
    id: str
    key: str
    title: str
    status: str
    priority: str
    assignee: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class Email(BaseModel):
    id: str
    subject: str
    sender: str
    received_at: datetime
    is_read: bool
    snippet: Optional[str] = None

# Aggregated dashboard data
class DashboardData(BaseModel):
    calendar_events: List[CalendarEvent] = []
    tasks: List[Task] = []
    pull_requests: List[PullRequest] = []
    tickets: List[Ticket] = []
    emails: List[Email] = []

# Notes schemas
class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    is_pinned: Optional[bool] = False

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_pinned: Optional[bool] = None

class Note(NoteBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
