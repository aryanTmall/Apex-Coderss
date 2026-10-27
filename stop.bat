@echo off
title CivicHelp 1-Click Shutdown
cls
echo ========================================================
echo        CIVICHELP -- 1-CLICK SYSTEM SHUTDOWN
echo ========================================================
echo.

echo Terminating backend processes on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Killing PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo Terminating frontend processes on port 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    echo Killing PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo All CivicHelp servers have been safely stopped.
echo.
pause
