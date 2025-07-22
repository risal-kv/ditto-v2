# News Service

A simple service for fetching news about companies and their competitors by company name or domain.

## Features

- Get news articles by company name (e.g., "PhonePe")
- Get news articles by domain (e.g., "fintech") - returns news for all major companies in that domain

## Usage

### Get News by Company Name

```python
from news import get_news_by_company

# Get news articles for a specific company
articles = get_news_by_company(
    company_name="PhonePe",  # Company to search for
    days=30,                 # Look back period (optional, default: 30)
    limit=10                 # Maximum number of articles (optional, default: 10)
)

# Process the articles
for article in articles:
    print(f"Title: {article['title']}")
    print(f"Source: {article['source']}")
    print(f"URL: {article['url']}")
    print("---")
```

### Get News by Domain

```python
from news import get_news_by_domain

# Get news articles for companies in a domain
domain_news = get_news_by_domain(
    domain="fintech",        # Domain to search for
    days=30,                 # Look back period (optional, default: 30)
    limit=20                 # Maximum total articles (optional, default: 20)
)

# Process the articles by company
for company, articles in domain_news.items():
    print(f"=== {company.capitalize()} ===")
    for article in articles:
        print(f"Title: {article['title']}")
        print(f"URL: {article['url']}")
    print("---")
```

## API Key Setup

The service uses NewsAPI under the hood. For real data (instead of mock data):

1. Get a free API key from [NewsAPI](https://newsapi.org/)
2. Set the API key as an environment variable:

```bash
export NEWS_API_KEY="your-api-key-here"
```

## Example

Run the example script to see the service in action:

```bash
python -m news.example
```

## Adding New Domains

To add support for new domains, update the `DOMAIN_TO_COMPANIES` dictionary in `news/service.py`:

```python
DOMAIN_TO_COMPANIES = {
    "fintech": ["phonepe", "paytm", "razorpay", ...],
    "your-new-domain": ["company1", "company2", "company3", ...],
}
```
