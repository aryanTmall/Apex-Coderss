@echo off
title CivicHelp 1-Click Launcher
cls
echo ========================================================
echo        CIVICHELP -- 1-CLICK SYSTEM LAUNCHER
echo ========================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo [1/3] Starting CivicHelp Backend (FastAPI on http://127.0.0.1:8000)...
start "CivicHelp-Backend" cmd /k "cd /d %ROOT_DIR%backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting CivicHelp Frontend (Vite on http://localhost:5173)...
start "CivicHelp-Frontend" cmd /k "cd /d %ROOT_DIR%frontend && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo.
echo Opening CivicHelp in your default web browser...
start http://localhost:5173

echo.
echo ========================================================
echo CivicHelp is now LIVE!
echo   - Public Portal:       http://localhost:5173/public
echo   - Emergency 112 Hub:   http://localhost:5173/emergency
echo   - Civic Intelligence:  http://localhost:5173/public/intelligence
echo   - Government Portal:   http://localhost:5173/government/login
echo   - Operations Console:  http://localhost:5173/app
echo   - Backend API Docs:    http://127.0.0.1:8000/docs
echo ========================================================
echo To stop all services at any time, run stop.bat or close
echo the terminal windows.
echo.
pause
