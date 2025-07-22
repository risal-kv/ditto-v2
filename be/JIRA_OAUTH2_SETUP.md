# Jira OAuth 2.0 Setup Guide

This guide will help you set up Jira OAuth 2.0 integration for your productivity dashboard.

## Prerequisites

1. A Jira Cloud instance (e.g., `https://yourcompany.atlassian.net`)
2. Admin access to create OAuth 2.0 apps in Atlassian Developer Console

## Step 1: Create OAuth 2.0 App in Atlassian Developer Console

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **Create** → **OAuth 2.0 integration**
3. Fill in the app details:
   - **Name**: Your App Name (e.g., "Productivity Dashboard")
   - **Distribution**: Development (for testing) or Production
4. Click **Create**

## Step 2: Configure OAuth 2.0 Settings

1. In your newly created app, go to **Authorization**
2. Configure the following:
   - **Callback URL**: `https://your-domain.com/integrations/jira/callback`
   - **Scopes**: Select the following permissions:
     - `read:jira-user` (to read user profile)
     - `read:jira-work` (to read issues, projects)
     - `write:jira-work` (to create/update issues - optional)

3. Save the configuration

## Step 3: Get Your Credentials

1. Go to **Settings** tab in your app
2. Copy the **Client ID** and **Secret**
3. Note down your **Callback URL**

## Step 4: Configure Environment Variables

Create or update your `.env` file with the following variables:

```bash
# Jira OAuth 2.0 Configuration
JIRA_SERVER=https://yourcompany.atlassian.net
JIRA_CLIENT_ID=your-client-id-from-atlassian-console
JIRA_CLIENT_SECRET=your-client-secret-from-atlassian-console
JIRA_REDIRECT_URI=https://your-domain.com/integrations/jira/callback
```

**Important Notes:**
- Replace `yourcompany` with your actual Jira Cloud subdomain
- Replace `your-domain.com` with your actual domain (or use ngrok for local development)
- Keep your `JIRA_CLIENT_SECRET` secure and never commit it to version control

## Step 5: Test the Integration

1. Start your application: `python main.py`
2. Navigate to `/jira_connect.html`
3. Click "Connect with Jira"
4. You should be redirected to Atlassian's OAuth consent page
5. Grant permissions and you'll be redirected back to your app

## OAuth 2.0 Flow Summary

```
1. User clicks "Connect with Jira"
2. App redirects to: https://auth.atlassian.com/authorize?...
3. User grants permissions on Atlassian's site
4. Atlassian redirects back with authorization code
5. App exchanges code for access token at: https://auth.atlassian.com/oauth/token
6. App uses access token to access Jira APIs
```

## Scopes Explained

- `read:jira-user`: Read user profile information
- `read:jira-work`: Read issues, projects, boards, etc.
- `write:jira-work`: Create and update issues (optional for read-only integrations)

## Troubleshooting

### "Invalid Client" Error
- Verify `JIRA_CLIENT_ID` matches exactly what's in Atlassian Developer Console
- Ensure the app is active and not disabled

### "Invalid Redirect URI" Error
- Verify `JIRA_REDIRECT_URI` matches exactly what's configured in the app settings
- For local development, use ngrok to get a public URL

### "Access Denied" Error
- Check that required scopes are configured in your app
- User needs to grant all requested permissions

## Local Development with ngrok

For local development, use ngrok to expose your local server:

```bash
# Install ngrok if not already installed
# Run your app
python main.py

# In another terminal, expose port 8000
ngrok http 8000

# Use the ngrok URL in your JIRA_REDIRECT_URI
# Example: https://abc123.ngrok.io/integrations/jira/callback
```

## Security Best Practices

1. **Never commit secrets**: Use `.env` files and add them to `.gitignore`
2. **Use HTTPS**: Always use HTTPS URLs in production
3. **Validate state parameter**: Protects against CSRF attacks (already implemented)
4. **Token storage**: Store tokens securely in your database
5. **Token refresh**: Implement token refresh when tokens expire (if using refresh tokens)
