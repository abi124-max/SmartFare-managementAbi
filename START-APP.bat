@echo off
echo ========================================
echo   SMART FARE - Starting Application
echo ========================================
echo.

echo [1/3] Starting Backend (Port 8081)...
start "Smart Fare Backend" cmd /k "compile-and-run.bat"

echo [2/3] Waiting 60 seconds for backend to initialize...
timeout /t 60 /nobreak

echo [3/3] Starting Frontend (Port 3000)...
cd frontend
start "Smart Fare Frontend" cmd /k "node server.js"
cd ..

echo.
echo ========================================
echo   APPLICATION STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Backend:  http://localhost:8081/api
echo Frontend: http://localhost:3000
echo.
echo Open your browser to: http://localhost:3000
echo.
echo Press any key to exit this window...
pause >nul
