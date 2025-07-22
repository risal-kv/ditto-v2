"""
Health check routes for monitoring the API status.
"""
from fastapi import APIRouter

router = APIRouter(
    tags=["health"]
)

@router.get("/health")
async def health_check():
    """Simple health check endpoint to verify the API is running."""
    return {"status": "ok"}
