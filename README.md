# ClimbingPill 🧗‍♂️

An AI-powered climbing training platform that gets climbers from first contact to personalized training programs in 5 minutes.

## 🚀 Features

- **AI-First Design**: Conversational onboarding with intelligent parsing
- **Comprehensive Assessment**: Physical performance analysis with V-grade prediction
- **Personalized Programs**: 6-week training cycles with progressive overload
- **Professional UI**: Modern black/white design with climbing-specific iconography
- **Real-time Chat**: Direct integration with ClimbingPill AI Coach
- **Weather Integration**: Outdoor climbing recommendations
- **Progress Tracking**: Retention analysis and motivation strategies

## 🏗️ Architecture

### Backend (`my-mastra-app/`)
- **Mastra Framework**: AI agent orchestration
- **ClimbingPill AI Coach**: Comprehensive climbing methodology
- **Tools**: Assessment, program generation, weather, retention analysis
- **Workflows**: Simple retention workflow for user engagement

### Frontend (`frontend/`)
- **Next.js 15**: React framework with Turbopack
- **Tailwind CSS 4**: Modern styling with glassmorphism effects
- **Custom Icons**: Professional climbing-specific SVG icons
- **Real-time Integration**: Direct connection to Mastra backend

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- npm or pnpm

### Backend Setup
```bash
cd my-mastra-app
npm install
npm run dev
```
Backend runs on: http://localhost:4112

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:3000 (or next available port)

## 🎯 ClimbingPill Methodology

### Training Philosophy
Built on progressive overload and specificity - systematic layers of difficulty and complexity.

### Core Components
1. **Fingerboard Training**: Systematic finger strength development
2. **Boulder Projects**: Strength and power development
3. **Flash Training**: Reading, planning, executing
4. **Technical/Endurance**: Climbing stamina and movement efficiency
5. **General Fitness**: Supporting strength and injury prevention

### Assessment System
- **80% Boulder Grade**: Grade you can complete 8/10 times
- **Normalized Ratios**: Finger strength, pull-up, core, flexibility
- **Composite Scoring**: 45% finger + 20% pull + 15% core + 10% push + 10% flex
- **Grade Prediction**: V4-V8+ with confidence levels

## 🎨 Design System

### Brand Colors
- **Pink**: #ff4d6d
- **Lime Green**: #a3d977  
- **Teal**: #2d9596

### Typography
- **Font**: Inter (Mastra-style)
- **Hierarchy**: Consistent spacing and weights
- **High Contrast**: Black/white modern aesthetic

## 🔧 API Integration

The frontend connects to the Mastra backend via:
- **Chat**: `/api/agents/climbingPillAgent/generate`
- **Real-time responses** from ClimbingPill AI Coach
- **Fallback handling** for offline scenarios

## 📱 User Experience

### 5-Minute Onboarding Flow
1. **Goal Setting** (30s): Primary climbing objectives
2. **Level Check** (60s): Current grade and experience
3. **Physical Assessment** (2min): Strength and flexibility tests
4. **Schedule Setup** (45s): Training availability
5. **Equipment Check** (30s): Available resources
6. **Program Generation** (15s): Personalized 6-week plan

### AI-First Features
- **Progressive Disclosure**: Information revealed as needed
- **Conversation Threading**: Natural dialogue flow
- **Contextual Actions**: Smart suggestions based on user state
- **Confidence Indicators**: AI response reliability

## 🚀 Deployment

### Backend
- Mastra-compatible hosting
- Environment variables for API keys
- Database for user profiles and progress

### Frontend
- Vercel/Netlify deployment
- Environment variables for backend URL
- Static asset optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**ClimbingPill** - Getting climbers stronger, faster, smarter. 🧗‍♀️✨ 