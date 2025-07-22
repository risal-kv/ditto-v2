"""
Routes package for the API.
"""
from fastapi import APIRouter

from routes.auth import router as auth_router
from routes.dashboards import router as dashboards_router
from routes.integrations import router as integrations_router
from routes.news import router as news_router
from routes.health import router as health_router

# Create a main router to include all other routers
api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(dashboards_router)
api_router.include_router(integrations_router)
api_router.include_router(news_router)
api_router.include_router(health_router)
