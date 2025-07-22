"""
Example usage of the news service.
"""
import os
import json
from news import get_news_by_company, get_news_by_domain
from news.service import NewsBase

def main():
    """
    Demonstrate the usage of the news service functions.
    """
    print("News Service Example\n")
    
    # Example 1: Get news by company name
    print("=== News for PhonePe ===")
    phonepe_news = get_news_by_company("PhonePe", days=15, limit=3)
    
    # Print news items using the NewsBase class
    for article in phonepe_news:
        print(f"Title: {article.title}")
        print(f"Description: {article.description}")
        if article.source:
            print(f"Source: {article.source}")
        print(f"URL: {article.url}")
        print("---")
    
    print("\n")
    
    # Example 2: Get news by domain
    print("=== News for Fintech Domain ===")
    fintech_news = get_news_by_domain("fintech", days=15, limit=10)
    
    # Print one article from each company
    for company, articles in fintech_news.items():
        print(f"\n--- {company.capitalize()} ---")
        if articles:
            article = articles[0]
            print(f"Title: {article.title}")
            print(f"Description: {article.description}")
            if article.source:
                print(f"Source: {article.source}")
            print(f"URL: {article.url}")
        else:
            print("No articles found")

if __name__ == "__main__":
    # Set a mock API key for testing if not already set
    if not os.environ.get("NEWS_API_KEY"):
        print("Note: No NEWS_API_KEY environment variable found. Using mock data.")
        # Uncomment and set your API key here for testing with real data
        # os.environ["NEWS_API_KEY"] = "your-api-key-here"
    
    main()
