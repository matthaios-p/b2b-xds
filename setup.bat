@echo off
REM Quick setup script for local development on Windows

echo 🚀 B2B Signage Cost Calculator - Setup Script
echo ==============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js detected: %NODE_VERSION%
echo.

REM Setup Backend
echo 📦 Setting up backend...
cd backend
if not exist ".env" (
    copy .env.example .env > nul
    echo ✓ Created .env from template
    echo ⚠️  Please edit backend\.env and add your OPENAI_API_KEY
)
call npm install --legacy-peer-deps > nul 2>&1
echo ✓ Backend dependencies installed
cd ..

REM Setup Frontend
echo.
echo 📦 Setting up frontend...
cd frontend
call npm install --legacy-peer-deps > nul 2>&1
echo ✓ Frontend dependencies installed
cd ..

echo.
echo ✅ Setup complete!
echo.
echo 🚀 To start development:
echo.
echo Terminal 1 - Backend:
echo   cd backend ^&^& npm run dev
echo.
echo Terminal 2 - Frontend:
echo   cd frontend ^&^& npm run dev
echo.
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo.
pause
