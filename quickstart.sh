#!/bin/bash

# 🚀 QUICK START GUIDE
# One Piece Game Engine - Production Deployment

set -e

echo "🏴‍☠️ ONE PIECE GAME ENGINE - QUICK START"
echo "========================================"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."
command -v node > /dev/null || { echo "❌ Node.js required"; exit 1; }
command -v npm > /dev/null || { echo "❌ npm required"; exit 1; }
echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --silent
echo "✅ Dependencies installed"
echo ""

# Check environment
if [ ! -f .env ]; then
  echo "⚠️  .env file missing"
  echo "   Copy from .env.example and fill in Supabase credentials:"
  echo "   cp .env.example .env"
  exit 1
fi
echo "✅ .env configured"
echo ""

# Display options
echo "🎯 DEPLOYMENT OPTIONS"
echo "===================="
echo ""
echo "1. LOCAL DEVELOPMENT"
echo "   npm start"
echo "   Starts backend on http://localhost:3000"
echo ""
echo "2. LOCAL DOCKER (Full Stack)"
echo "   docker-compose up -d"
echo "   Starts: Backend (3000) + Frontend (3001) + Redis (6379)"
echo ""
echo "3. RAILWAY DEPLOYMENT (Recommended)"
echo "   npm install -g @railway/cli"
echo "   railway link"
echo "   railway variables set SUPABASE_URL 'your-url'"
echo "   railway up --prod"
echo ""
echo "4. DATABASE SEEDING"
echo "   npm run seed"
echo "   Populates: 20 nodes, 12 characters, 4 test players"
echo ""
echo "5. MAINTENANCE TASKS"
echo "   npm run release-inactive    # Release inactive crew"
echo "   npm run check-congestion     # Clear chokepoints"
echo "   npm run faction-aggression   # Protect rookies"
echo "   npm run maintenance          # All three"
echo ""

echo "📚 DOCUMENTATION"
echo "================"
echo ""
echo "• README.md                  - Overview & API reference"
echo "• IMPLEMENTATION.md          - Code structure & systems"
echo "• DEPLOYMENT_GUIDE.md        - Deployment to production"
echo "• SCALING_ARCHITECTURE.md    - Scaling to 1000+ users"
echo "• PRODUCTION_READY.md        - Launch checklist"
echo ""

echo "🎮 QUICK TEST"
echo "============="
echo ""
echo "After starting backend:"
echo ""
echo "  curl http://localhost:3000/api/health"
echo "  # Should return: { \"status\": \"ok\", ... }"
echo ""
echo "  curl http://localhost:3000/api/map/state"
echo "  # Should return: { \"nodes\": [...], \"ships\": [...] }"
echo ""

echo "✨ Ready to deploy! Choose option above to continue."
echo ""
