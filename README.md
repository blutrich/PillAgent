# 🧗 ClimbingPill - AI Climbing Coach Platform

**B2B2C AI-powered climbing training platform using Mastra framework with unified architecture**

## 🎯 Project Overview

ClimbingPill is a comprehensive AI climbing coach platform that delivers personalized training programs through climbing gyms and coaches to their members. The system targets a 5-minute onboarding experience with 85% completion rate and provides scientific, injury-aware training recommendations.

### **Business Model: B2B2C**
- **Platform**: Delivered through climbing gyms/coaches to their members
- **Delivery**: WhatsApp-based program delivery and support  
- **Value Prop (Climbers)**: Personalized, injury-aware programs via WhatsApp
- **Value Prop (Gyms)**: Plug-and-play professional training services with minimal overhead

## 🏗️ Architecture

### **Unified Agent System**
- **Single Agent**: `climbingAgent` using OpenAI GPT-4o
- **11 Integrated Tools**: Goal setting, assessment, program generation, weather, retention analysis
- **Memory System**: LibSQL storage with Supabase data layer
- **Workflows**: RetentionWorkflow for progress tracking and engagement

### **Database: Supabase Production**
- **Project**: MastraPill (`lxeggioigpyzmkrjdmne`)
- **Tables**: `user_profiles`, `assessments`, `training_programs`, `training_sessions`, `conversation_history`
- **Integration**: Full CRUD operations with Mastra tools
- **Security**: Row Level Security (RLS) enabled

## 🔧 Technical Stack

- **Framework**: [Mastra](https://mastra.ai) - AI agent orchestration
- **Database**: Supabase (PostgreSQL with real-time features)
- **AI**: OpenAI GPT-4o for conversational intelligence
- **Storage**: Hybrid - LibSQL for Mastra internals, Supabase for business data
- **Deployment**: Ready for WhatsApp Cloud API integration

## 📊 Assessment Methodology

**Scientific Composite Scoring:**
- **45%** Finger Strength (fingerboard performance)
- **20%** Pull-up Strength  
- **15%** Core Strength (toe-to-bar)
- **10%** Push-up Strength
- **10%** Flexibility

**Grade Prediction Algorithm:**
- Normalized scoring (0-100) with confidence levels
- Strength analysis and weakness identification
- Personalized recommendations based on climbing style

## 🎯 User Journey (5-Minute Onboarding)

1. **Goal Setting** → Primary climbing objectives
2. **Level Check** → Current climbing grade assessment  
3. **Mini Assessment** → Quick physical capability check
4. **Schedule Setup** → Training frequency and duration
5. **Equipment Check** → Available training equipment
6. **Program Generation** → AI-powered personalized program

**Target Metrics:**
- 85% onboarding completion (vs 60-70% industry)
- 65% 30-day retention (vs 40-50% industry)
- 70% program completion (vs 30-40% industry)

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd PillAgent

# Install dependencies
cd my-mastra-app
npm install

# Set up environment variables
cp .env.example .env
# Add your OpenAI API key and other configurations
```

### Project Structure

```
PillAgent/
├── docs/                          # Documentation and guides
├── my-mastra-app/                 # Main Mastra application
│   ├── src/mastra/
│   │   ├── agents/                # Unified climbing agent
│   │   ├── tools/                 # 11 integrated tools
│   │   ├── workflows/             # Retention and analysis workflows
│   │   └── lib/                   # Supabase integration
│   └── scripts/                   # Utility scripts
└── README.md                      # This file
```

## 🔗 Key Integrations

### **Mastra-Supabase Connection**
- ✅ Assessment tool saves to `assessments` table
- ✅ Program generation creates records in `training_programs`
- ✅ Onboarding updates `user_profiles` 
- ✅ Conversation history persistence
- ✅ Retention analysis with historical data

### **AI Tools Available**
1. `goalSettingTool` - Capture climbing objectives
2. `currentLevelCheckTool` - Assess current climbing level
3. `miniPhysicalAssessmentTool` - Quick capability check
4. `scheduleSetupTool` - Training schedule configuration
5. `equipmentCheckTool` - Available equipment assessment
6. `climbingAssessmentTool` - Comprehensive physical assessment
7. `programGenerationTool` - AI-powered program creation
8. `weatherTool` - Climbing weather conditions
9. `retentionAnalysisTool` - User engagement analysis
10. `onboardingOrchestratorTool` - Flow management
11. `onboardingAnalyticsTool` - Progress tracking

## 📈 Business Intelligence

### **Target Demographics**
- **Age**: 25-50 years old
- **Experience**: 0.5-3 years climbing
- **Lifestyle**: Working full-time, limited training time
- **Pain Points**: Insecurity, injury fear, progress frustration

### **Training Methodology**
- **6-week cycles** with energy systems training
- **Grade calculations**: Project = 80% + 1, Flash = 80% - 1
- **Frequency limits**: Fingerboard 2x/week, Projects 2x/week
- **Progressive overload** protocols with injury prevention

## 🚀 Deployment Status

**Current State: Development Complete**
- ✅ Unified agent architecture implemented
- ✅ Supabase integration tested and working
- ✅ All 11 tools connected to production database
- ✅ Assessment and program generation validated
- ✅ Memory system operational

**Next Steps:**
- WhatsApp Cloud API integration
- Coach dashboard development
- Gym partner onboarding system
- Production deployment pipeline

## 📝 Documentation

- [Mastra Implementation Guide](docs/MASTRA_IMPLEMENTATION_GUIDE.md)
- [Backend Integration Guide](docs/MASTRA_BACKEND_INTEGRATION.md)
- [UI Mockup](docs/ClimbingPillMockup.tsx)

## 🤝 Contributing

This is a private project for ClimbingPill platform development. For questions or collaboration opportunities, please contact the development team.

## 📄 License

Private - All rights reserved

---

**Built with ❤️ for the climbing community** 🧗‍♀️🧗‍♂️ 