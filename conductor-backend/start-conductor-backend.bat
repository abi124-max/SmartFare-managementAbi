@echo off
title Smart Fare Conductor Backend
color 0C

echo ========================================
echo    SMART FARE CONDUCTOR BACKEND
echo ========================================
echo.
echo Starting Conductor Backend API...
echo.

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Java is not installed!
    echo Please install Java 17 or higher
    pause
    exit /b 1
)

REM Check if Maven is available
mvn --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Maven is not available!
    echo Please install Maven 3.6 or higher
    pause
    exit /b 1
)

echo [1/2] Building the application...
call mvn clean compile

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo [2/2] Starting Conductor Backend...
echo.
echo ========================================
echo    CONDUCTOR BACKEND STARTING...
echo ========================================
echo.
echo Backend API: http://localhost:8082/api
echo Health Check: http://localhost:8082/api/conductor/health
echo.
echo 📡 Firebase integration ready
echo 🎫 QR Code generation enabled
echo.
echo Available APIs:
echo ✅ POST /api/conductor/validate-ticket
echo ✅ POST /api/conductor/issue-ticket
echo ✅ GET /api/conductor/bus-stops
echo ✅ GET /api/conductor/health
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the Spring Boot application
call mvn spring-boot:run

echo.
echo Conductor backend stopped.
pause
