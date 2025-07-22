"""
Redis cache service for caching external API responses.
"""
import redis
import json
import hashlib
from typing import Any, Optional
from config.settings import settings

class CacheService:
    """Redis-based cache service for API responses."""
    
    def __init__(self):
        """Initialize Redis connection."""
        try:
            self.redis_client = redis.Redis(
                host=getattr(settings, 'redis_host', 'localhost'),
                port=getattr(settings, 'redis_port', 6379),
                db=getattr(settings, 'redis_db', 0),
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Test connection
            self.redis_client.ping()
            self.enabled = True
        except Exception as e:
            print(f"Redis connection failed: {e}")
            print("Cache disabled - continuing without Redis")
            self.enabled = False
    
    def _generate_key(self, prefix: str, user_id: int, service: str, endpoint: str, params: dict = None) -> str:
        """Generate a unique cache key."""
        key_data = f"{prefix}:{user_id}:{service}:{endpoint}"
        if params:
            # Sort params for consistent hashing
            param_str = json.dumps(params, sort_keys=True)
            key_data += f":{hashlib.md5(param_str.encode()).hexdigest()}"
        return key_data
    
    def get(self, user_id: int, service: str, endpoint: str, params: dict = None) -> Optional[Any]:
        """Get cached data."""
        if not self.enabled:
            return None
            
        try:
            key = self._generate_key("api", user_id, service, endpoint, params)
            cached_data = self.redis_client.get(key)
            
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    def set(self, user_id: int, service: str, endpoint: str, data: Any, params: dict = None, ttl: int = 600) -> bool:
        """Cache data with TTL (default 10 minutes)."""
        if not self.enabled:
            return False
            
        try:
            key = self._generate_key("api", user_id, service, endpoint, params)
            json_data = json.dumps(data, default=str)  # default=str handles datetime objects
            self.redis_client.setex(key, ttl, json_data)
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False
    
    def delete_pattern(self, user_id: int, service: str, pattern: str = "*"):
        """Delete cached data matching pattern."""
        if not self.enabled:
            return
            
        try:
            key_pattern = self._generate_key("api", user_id, service, pattern)
            keys = self.redis_client.keys(key_pattern)
            if keys:
                self.redis_client.delete(*keys)
        except Exception as e:
            print(f"Cache delete error: {e}")
    
    def clear_user_cache(self, user_id: int):
        """Clear all cached data for a user."""
        if not self.enabled:
            return
            
        try:
            key_pattern = f"api:{user_id}:*"
            keys = self.redis_client.keys(key_pattern)
            if keys:
                self.redis_client.delete(*keys)
        except Exception as e:
            print(f"Cache clear error: {e}")
    
    def get_cache_info(self) -> dict:
        """Get cache statistics."""
        if not self.enabled:
            return {"enabled": False, "status": "Redis not available"}
            
        try:
            info = self.redis_client.info('stats')
            return {
                "enabled": True,
                "total_connections": info.get('total_connections_received', 0),
                "keyspace_hits": info.get('keyspace_hits', 0),
                "keyspace_misses": info.get('keyspace_misses', 0),
                "used_memory": info.get('used_memory_human', 'N/A')
            }
        except Exception as e:
            return {"enabled": False, "error": str(e)}

# Global cache instance
cache_service = CacheService()
