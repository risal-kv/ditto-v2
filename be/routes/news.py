"""
News routes for fetching competitor news by company name or domain.
"""
from fastapi import APIRouter, Query
from typing import Dict, List, Optional

from news import get_news_by_company, get_news_by_domain
from news.service import NewsBase

router = APIRouter(
    prefix="/news",
    tags=["news"]
)

@router.get("/company/{company_name}", response_model=List[NewsBase])
async def fetch_news_by_company(
    company_name: str,
    days: Optional[int] = Query(30, description="Number of days to look back for news"),
    limit: Optional[int] = Query(10, description="Maximum number of articles to return")
):
    """
    Get news articles related to a specific company.
    
    Args:
        company_name: Name of the company to search for
        days: Number of days to look back for news (default: 30)
        limit: Maximum number of articles to return (default: 10)
        
    Returns:
        List of NewsBase objects with news articles
    """
    return get_news_by_company(company_name, days, limit)

@router.get("/domain/{domain}", response_model=Dict[str, List[NewsBase]])
async def fetch_news_by_domain(
    domain: str,
    days: Optional[int] = Query(30, description="Number of days to look back for news"),
    limit: Optional[int] = Query(20, description="Maximum number of articles per company")
):
    """
    Get news articles related to companies in a specific domain.
    
    Args:
        domain: Domain to search for (e.g., "fintech", "e-commerce")
        days: Number of days to look back for news (default: 30)
        limit: Maximum number of articles per company (default: 20)
        
    Returns:
        Dictionary mapping company names to lists of NewsBase objects
    """
    return get_news_by_domain(domain, days, limit)

@router.get("/domains", response_model=List[str])
async def list_available_domains():
    """
    Get a list of available domains that can be searched.
    
    Returns:
        List of domain names
    """
    from be.news.service import DOMAIN_TO_COMPANIES
    return list(DOMAIN_TO_COMPANIES.keys())
