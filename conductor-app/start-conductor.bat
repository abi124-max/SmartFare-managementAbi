@echo off
title Smart Fare Conductor Application
color 0B

echo ========================================
echo    SMART FARE CONDUCTOR APP
echo ========================================
echo.
echo Starting Conductor Application...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available!
    echo Please install npm properly
    pause
    exit /b 1
)

echo [1/2] Installing dependencies...
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies!
    pause
    exit /b 1
)

echo [2/2] Starting Conductor Frontend...
echo.
echo ========================================
echo    CONDUCTOR APP STARTING...
echo ========================================
echo.
echo Frontend: http://localhost:3001
echo Backend API: http://localhost:8082/api
echo.
echo 📱 QR Scanner requires camera permission
echo 🔥 Configure Firebase in script.js
echo.
echo Press any key to open the app...
pause > nul

start http://localhost:3001

echo.
echo ========================================
echo    CONDUCTOR APP IS NOW RUNNING!
echo ========================================
echo.
echo Features available:
echo ✅ Real-time Dashboard
echo ✅ QR Ticket Scanner
echo ✅ Manual Ticket Issuing
echo ✅ Validation System
echo.
echo To stop the app:
echo - Press Ctrl+C in this window
echo.

REM Start the HTTP server
call npm start

echo.
echo Conductor app stopped.
pause
