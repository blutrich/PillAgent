# Production API Keys Setup Guide

## 🔑 Required API Keys for ClimbingPill Production

### 1. Tavily Search API Key
**Purpose**: Real-time web search for climbing information, gear reviews, weather, and route conditions.

**Required for**: Backend (Mastra Cloud)

#### Setup Steps:

1. **Get Tavily API Key**:
   - Go to [tavily.com](https://tavily.com/)
   - Sign up for account
   - Navigate to Dashboard → API Keys
   - Copy your API key (starts with `tvly-`)

2. **Add to Mastra Cloud Backend**:
   ```
   Platform: Mastra Cloud
   Project: pill_agent
   Variable: TAVILY_API_KEY
   Value: tvly-your_api_key_here
   ```
   
   **Steps**:
   - Visit [Mastra Cloud Dashboard](https://cloud.mastra.ai/)
   - Select your `pill_agent` project
   - Go to Settings → Environment Variables
   - Click "Add Variable"
   - Name: `TAVILY_API_KEY`
   - Value: Your Tavily API key
   - Save and redeploy

## 🚀 Platform-Specific Instructions

### Mastra Cloud (Backend)
```bash
# Navigate to your project dashboard
https://cloud.mastra.ai/projects/pill_agent

# Add environment variable:
TAVILY_API_KEY=tvly-your_api_key_here
```

### Vercel (Frontend - if needed)
```bash
# Vercel Dashboard → Project → Settings → Environment Variables
TAVILY_API_KEY=tvly-your_api_key_here
```

### Netlify (Alternative Frontend)
```bash
# Site Settings → Environment Variables
TAVILY_API_KEY=tvly-your_api_key_here
```

### Railway (Alternative Backend)
```bash
# Project Settings → Variables
TAVILY_API_KEY=tvly-your_api_key_here
```

### Render (Alternative Backend)
```bash
# Environment → Add Environment Variable
TAVILY_API_KEY=tvly-your_api_key_here
```

## 🔒 Security Best Practices

### API Key Security
- ✅ Never commit API keys to git
- ✅ Use environment variables only
- ✅ Rotate keys periodically
- ✅ Monitor usage for unusual activity
- ✅ Set up billing alerts

### Environment Variable Naming
- ✅ Use `TAVILY_API_KEY` (exactly as shown)
- ❌ Don't use variations like `TAVILY_KEY` or `TAVILY_API`
- ✅ Case-sensitive - use UPPERCASE

## 🧪 Testing Production Setup

### 1. Verify API Key is Set
```bash
# Check if environment variable is available
echo $TAVILY_API_KEY
```

### 2. Test Search Functionality
Ask your deployed agent:
- "What are the best climbing shoes for 2024?"
- "Current weather at Joshua Tree"
- "Latest climbing news"

### 3. Expected Behavior
- ✅ Should return real-time search results
- ✅ Should include AI-generated answers
- ✅ Should show source URLs
- ❌ Should NOT show "TAVILY_API_KEY environment variable is required"

## 💰 Cost Management

### Tavily API Pricing
- **Basic Search**: 1 credit per query
- **Advanced Search**: 2 credits per query
- **Free Tier**: 1,000 credits/month
- **Paid Plans**: Starting at $20/month

### Usage Optimization
- ClimbingPill uses **basic search** by default (cost-effective)
- Advanced search only for complex research queries
- Domain filtering reduces unnecessary results
- Smart caching to minimize repeated searches

## 🚨 Troubleshooting

### Common Issues

1. **"TAVILY_API_KEY environment variable is required"**
   - ✅ Add API key to Mastra Cloud environment variables
   - ✅ Redeploy your backend service
   - ✅ Verify variable name is exactly `TAVILY_API_KEY`

2. **"Tavily API error (401): Unauthorized"**
   - ✅ Check API key is valid and active
   - ✅ Verify no extra spaces in the key
   - ✅ Check your Tavily account status

3. **"Failed to search Tavily: timeout"**
   - ✅ Check network connectivity
   - ✅ Verify Tavily service status
   - ✅ Try again after a few minutes

4. **Search returns no results**
   - ✅ Check your search query
   - ✅ Try broader search terms
   - ✅ Verify API credits remaining

### Support Resources
- **Tavily Documentation**: [docs.tavily.com](https://docs.tavily.com/)
- **Mastra Cloud Support**: [cloud.mastra.ai/support](https://cloud.mastra.ai/support)
- **ClimbingPill Issues**: Check project documentation

## ✅ Deployment Checklist

Before going live:
- [ ] Tavily API key obtained
- [ ] API key added to Mastra Cloud
- [ ] Backend redeployed with new environment variable
- [ ] Search functionality tested with real queries
- [ ] Billing alerts set up for API usage
- [ ] Usage monitoring configured

**Ready to provide real-time climbing information to your users!** 🧗‍♂️ 