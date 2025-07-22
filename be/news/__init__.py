from news.service import NewsService

# Export the main functions for easier importing
get_news_by_company = NewsService.get_news_by_company
get_news_by_domain = NewsService.get_news_by_domain