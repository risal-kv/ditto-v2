from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./productivity_app.db"
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # GitHub OAuth
    
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    github_redirect_uri: str = "http://localhost:8000/integrations/github/callback"
    
    # Google OAuth
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:8000/integrations/google/callback"
    
    # Jira OAuth
    jira_server: Optional[str] = None
    jira_client_id: Optional[str] = None
    jira_client_secret: Optional[str] = None
    jira_redirect_uri: str = "http://localhost:8000/integrations/jira/callback"
    
    # Exchange/Email
    exchange_server: Optional[str] = None

    # News API
    news_api_key: str = "placeholder_news_api_key"
    
    # Redis Cache
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    
    class Config:
        env_file = ".env"

settings = Settings()
