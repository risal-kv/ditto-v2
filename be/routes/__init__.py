"""
Routes package for the API.
"""
from fastapi import APIRouter

from .auth import router as auth_router
from .dashboards import router as dashboards_router
from .integrations import router as integrations_router
from .news import router as news_router
from .notes import router as notes_router
from .health import router as health_router

# Create a main router to include all other routers
api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(dashboards_router , tags=["dashboards"])
api_router.include_router(integrations_router , tags=["integrations"])
api_router.include_router(news_router,  tags=["news"])
api_router.include_router(notes_router , tags=["notes"])
api_router.include_router(health_router , tags=["health"])
