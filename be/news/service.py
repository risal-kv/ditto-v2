"""
News service for fetching competitor news by company name or domain.
"""
import os
import requests
from typing import List, Dict, Any, Optional, Union
import logging
from dataclasses import dataclass

from config.settings import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# You would typically store this in an environment variable
# For hackathon POC, we're hardcoding it here
# Get a free API key from https://newsapi.org/
NEWS_API_KEY = settings.news_api_key
NEWS_API_URL = "https://newsapi.org/v2/everything"

# Domain to company mapping for better search results
DOMAIN_TO_COMPANIES = {
    "fintech": ["phonepe", "paytm", "razorpay", "gpay", "google pay", "mobikwik", "bharatpe"],
    "e-commerce": ["amazon", "flipkart", "myntra", "ajio", "meesho", "snapdeal"],
    "food delivery": ["swiggy", "zomato", "uber eats", "foodpanda"],
    "ride sharing": ["uber", "ola", "rapido", "meru"],
    # Add more domains and companies as needed
}

@dataclass
class NewsBase:
    """Base class for news articles."""
    title: str
    description: str
    url: Optional[str] = None
    source: Optional[str] = None
    published_at: Optional[str] = None
    image_url: Optional[str] = None

class NewsService:
    """Service for fetching news related to companies or domains."""
    
    @staticmethod
    def get_news_by_company(company_name: str, days: int = 30, limit: int = 10) -> List[NewsBase]:
        """
        Get news articles related to a specific company.
        
        Args:
            company_name: Name of the company to search for
            days: Number of days to look back for news (default: 30)
            limit: Maximum number of articles to return (default: 10)
            
        Returns:
            List of NewsBase objects
        """
        try:
            if not NEWS_API_KEY:
                logger.warning("No NEWS_API_KEY provided. Using mock data.")
                return NewsService._get_mock_news(company_name, limit)
                
            params = {
                "q": company_name,
                "apiKey": NEWS_API_KEY,
                "sortBy": "publishedAt",
                "language": "en",
                "pageSize": limit,
                "from": f"{days}d"  # Last X days
            }
            
            response = requests.get(NEWS_API_URL, params=params)
            response.raise_for_status()
            
            data = response.json()
            articles = data.get("articles", [])
            
            # Process and convert to NewsBase objects
            news_items = []
            for article in articles:
                news_items.append(NewsBase(
                    title=article.get("title", ""),
                    description=article.get("description", ""),
                    url=article.get("url", ""),
                    source=article.get("source", {}).get("name", ""),
                    published_at=article.get("publishedAt", ""),
                    image_url=article.get("urlToImage", "")
                ))
                
            return news_items
            
        except Exception as e:
            logger.error(f"Error fetching news for company {company_name}: {str(e)}")
            return NewsService._get_mock_news(company_name, limit)
    
    @staticmethod
    def get_news_by_domain(domain: str, days: int = 30, limit: int = 20) -> Dict[str, List[NewsBase]]:
        """
        Get news articles related to companies in a specific domain.
        
        Args:
            domain: Domain to search for (e.g., "fintech", "e-commerce")
            days: Number of days to look back for news (default: 30)
            limit: Maximum number of articles per company (default: 20)
            
        Returns:
            Dictionary mapping company names to lists of NewsBase objects
        """
        domain = domain.lower()
        companies = DOMAIN_TO_COMPANIES.get(domain, [])
        
        if not companies:
            logger.warning(f"No companies found for domain: {domain}")
            return {"unknown": NewsService._get_mock_news(domain, limit)}
        
        # Calculate articles per company to stay within limit
        articles_per_company = max(1, limit // len(companies))
        
        result = {}
        for company in companies:
            result[company] = NewsService.get_news_by_company(company, days, articles_per_company)
            
        return result
    
    @staticmethod
    def _get_mock_news(query: str, limit: int = 5) -> List[NewsBase]:
        """
        Generate mock news data for demonstration purposes.
        
        Args:
            query: Search query (company name or domain)
            limit: Maximum number of mock articles to generate
            
        Returns:
            List of NewsBase objects
        """
        mock_articles = [
            NewsBase(
                title=f"{query.capitalize()} announces new partnership with major tech company",
                description=f"The partnership aims to enhance {query}'s market position and technological capabilities.",
                url="https://example.com/news/1",
                source="Tech Daily",
                published_at="2025-07-20T10:30:00Z",
                image_url="https://example.com/images/partnership.jpg"
            ),
            NewsBase(
                title=f"{query.capitalize()} reports record quarterly growth",
                description=f"The company's revenue increased by 25% compared to the same period last year.",
                url="https://example.com/news/2",
                source="Business Insider",
                published_at="2025-07-18T14:15:00Z",
                image_url="https://example.com/images/growth.jpg"
            ),
            NewsBase(
                title=f"New product launch from {query.capitalize()} disrupts market",
                description=f"Analysts predict the new offering will significantly impact {query}'s competitive position.",
                url="https://example.com/news/3",
                source="Market Watch",
                published_at="2025-07-15T09:45:00Z",
                image_url="https://example.com/images/product.jpg"
            ),
            NewsBase(
                title=f"{query.capitalize()} faces regulatory challenges in international markets",
                description="Regulatory bodies are reviewing the company's practices in several key regions.",
                url="https://example.com/news/4",
                source="Global News",
                published_at="2025-07-12T16:20:00Z",
                image_url="https://example.com/images/regulation.jpg"
            ),
            NewsBase(
                title=f"{query.capitalize()} acquires startup to enhance AI capabilities",
                description="The acquisition is part of the company's strategy to strengthen its technological infrastructure.",
                url="https://example.com/news/5",
                source="Tech Crunch",
                published_at="2025-07-10T11:00:00Z",
                image_url="https://example.com/images/acquisition.jpg"
            )
        ]
        
        return mock_articles[:limit]


if __name__ == "__main__":
    print(NewsService.get_news_by_domain("fintech", limit=5))