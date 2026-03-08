@echo off
title Smart Fare Management System
echo ============================================
echo    🚌 SMART FARE MANAGEMENT SYSTEM
echo    One-Click Startup - Ready in 60 Seconds
echo ============================================
echo.

echo 🚀 Starting Smart Fare Application...
echo.

REM Start backend
echo [1/2] Starting Backend Server...
cd /d "%~dp0backend"
start "Smart Fare Backend" cmd /c "cd /d %~dp0backend && mvn spring-boot:run"

REM Wait for backend
echo ⏳ Waiting for backend to initialize...
timeout /t 30 /nobreak >nul

REM Start frontend
echo [2/2] Starting Frontend Server...
cd /d "%~dp0frontend"
start "Smart Fare Frontend" cmd /c "cd /d %~dp0frontend && npm start"

REM Wait for frontend
echo ⏳ Waiting for frontend to start...
timeout /t 15 /nobreak >nul

echo.
echo 🎉 SMART FARE IS READY!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8081/api
echo.
echo 🌐 Opening application in your browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo ✅ Both servers are running in separate windows
echo 🎯 Your Smart Fare app is ready to use!
echo.
echo 📝 Quick Test:
echo    1. Select: Koyambedu → Tambaram
echo    2. Choose today's date
echo    3. Click "Search Buses"
echo    4. Book your ticket! 🎫
echo.
echo To stop: Close the backend and frontend windows
echo ============================================
pause
