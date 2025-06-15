# Environment Variables Setup

## Required Credentials for Supabase Memory

### 1. Database Password
- Go to: https://supabase.com/dashboard/project/lxeggioigpyzmkrjdmne
- Navigate: Settings → Database
- Find: Connection string or Database password
- Copy the password (long random string)

### 2. Service Role Key  
- Go to: https://supabase.com/dashboard/project/lxeggioigpyzmkrjdmne
- Navigate: Settings → API
- Find: service_role key (NOT anon key)
- Copy the service role key

### 3. OpenAI API Key
- Go to: https://platform.openai.com/api-keys
- Create or copy your API key

## Environment Variables

Create a `.env` file in your project root with:

```bash
# Supabase Memory Configuration
SUPABASE_DB_PASSWORD=your_database_password_here
SUPABASE_SERVICE_KEY=your_service_role_key_here

# OpenAI for Vector Embeddings
OPENAI_API_KEY=your_openai_api_key_here
```

## Your Supabase Project Info
- **Project ID**: lxeggioigpyzmkrjdmne
- **Host**: db.lxeggioigpyzmkrjdmne.supabase.co
- **Region**: eu-north-1
- **Status**: Active & Healthy ✅

## Testing After Setup

Run this command to test your configuration:
```bash
npx tsx test-memory-fallback.ts
```

You should see:
```
✅ Configuration: Supabase PostgreSQL credentials available
✅ Storage Backend: Supabase PostgreSQL with pgvector
```

## Production Deployment

For production, add these same variables to your deployment platform:
- **Mastra Cloud**: Project dashboard → Environment Variables
- **Vercel**: Project settings → Environment Variables
- **Netlify**: Site settings → Environment Variables 