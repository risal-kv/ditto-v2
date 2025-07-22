#!/usr/bin/env python3
"""
Simple test script for the Productivity Dashboard API
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health_check():
    """Test the health check endpoint."""
    print("Testing health check...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_user_registration():
    """Test user registration."""
    print("Testing user registration...")
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    return response.status_code == 200

def test_user_login():
    """Test user login."""
    print("Testing user login...")
    login_data = {
        "username": "testuser",
        "password": "password123"
    }
    
    response = requests.post(
        f"{BASE_URL}/auth/token",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    print()
    
    if response.status_code == 200:
        return result.get("access_token")
    return None

def test_dashboards(token):
    """Test dashboard endpoints."""
    print("Testing dashboards...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get dashboards
    response = requests.get(f"{BASE_URL}/dashboards", headers=headers)
    print(f"Get dashboards - Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    # Create a new dashboard
    dashboard_data = {
        "name": "My Test Dashboard",
        "description": "A test dashboard for development",
        "is_default": False
    }
    
    response = requests.post(f"{BASE_URL}/dashboards", json=dashboard_data, headers=headers)
    print(f"Create dashboard - Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def test_integrations(token):
    """Test integration endpoints."""
    print("Testing integrations...")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get integrations
    response = requests.get(f"{BASE_URL}/integrations", headers=headers)
    print(f"Get integrations - Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    # Test GitHub OAuth URL
    response = requests.get(f"{BASE_URL}/integrations/github/connect", headers=headers)
    print(f"GitHub OAuth URL - Status: {response.status_code}")
    if response.status_code == 200:
        print(f"GitHub OAuth URL: {response.json().get('oauth_url')}")
    else:
        try:
            error_data = response.json()
            print(f"Error: {error_data}")
        except:
            print(f"Error: HTTP {response.status_code} - {response.text}")
    print()

def test_dashboard_data(token):
    """Test dashboard data endpoint."""
    print("Testing dashboard data...")
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{BASE_URL}/dashboard/data", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

def main():
    """Run all tests."""
    print("=== Productivity Dashboard API Tests ===\n")
    
    # Test health check
    test_health_check()
    
    # Try login first, then register if login fails
    token = test_user_login()
    
    if not token:
        # User doesn't exist, try to register
        print("User doesn't exist, trying registration...")
        if test_user_registration():
            token = test_user_login()
    
    if token:
        print(f"Authentication successful! Token: {token[:20]}...")
        print()
        
        # Test authenticated endpoints
        test_dashboards(token)
        test_integrations(token)
        test_dashboard_data(token)
    else:
        print("Authentication failed!")

if __name__ == "__main__":
    main()
