@echo off
title Smart Fare Management System
color 0A

echo ========================================
echo    SMART FARE MANAGEMENT SYSTEM
echo ========================================
echo.
echo Starting both Backend and Frontend...
echo.

REM Set Maven path
set MAVEN_HOME=%CD%\apache-maven-3.9.6
set PATH=%MAVEN_HOME%\bin;%PATH%

echo [1/2] Starting Backend Server (Spring Boot)...
cd backend
start "Smart Fare Backend" cmd /k "mvn spring-boot:run"

echo [2/2] Starting Frontend Server (Node.js)...
cd ..\frontend
start "Smart Fare Frontend" cmd /k "node server.js"

echo.
echo ========================================
echo    SERVERS STARTING...
echo ========================================
echo.
echo Backend API: http://localhost:8081/api
echo Frontend App: http://localhost:3000
echo.
echo Wait 10-15 seconds for servers to start,
echo then open: http://localhost:3000
echo.
echo Press any key to open the app in browser...
pause > nul

start http://localhost:3000

echo.
echo ========================================
echo    SMART FARE IS NOW RUNNING!
echo ========================================
echo.
echo To stop the servers:
echo - Close the Backend and Frontend command windows
echo - Or press Ctrl+C in each window
echo.
pause