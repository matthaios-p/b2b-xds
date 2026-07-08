#!/bin/bash
# Quick setup script for local development

set -e

echo "🚀 B2B Signage Cost Calculator - Setup Script"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✓ Node.js detected: $(node --version)"
echo ""

# Setup Backend
echo "📦 Setting up backend..."
cd backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ Created .env from template"
    echo "⚠️  Please edit backend/.env and add your OPENAI_API_KEY"
fi
npm install --legacy-peer-deps > /dev/null 2>&1
echo "✓ Backend dependencies installed"
cd ..

# Setup Frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend
npm install --legacy-peer-deps > /dev/null 2>&1
echo "✓ Frontend dependencies installed"
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"
echo "  cd frontend && npm run dev"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"
