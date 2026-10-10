@echo off
title Paisa Pro — Smart Money Tracker
cd /d "%~dp0"
cls
color 0B

echo ===================================================
echo   💰 Paisa Pro — Smart Money Tracker
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ⚠️ Node.js is not installed on this PC.
    echo 🚀 Launching Portable Mode (using built-in Windows PowerShell)...
    echo.
    call "Paisa Pro.bat"
    exit /b
)

:: Auto-install dependencies if node_modules is missing
if not exist "node_modules" (
    color 0E
    echo First time running on this PC. Setting up dependencies...
    echo Please wait 1-2 minutes...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        color 0C
        echo ⚠️ Setup had warnings. Falling back to Portable Mode...
        call "Paisa Pro.bat"
        exit /b
    )
)

echo Features Included:
echo   📊 Expense & Earning Tracker
echo   🤝 Udhar & Jama (Lending & Borrowing Khatabook)
echo   🛡️ Multi-layer Auto-Save (LocalStorage + IndexedDB + Disk File)
echo.
echo Opening app at http://localhost:5180/ ...
echo.

:: Open browser
start "" "http://localhost:5180/"

echo ===================================================
echo   App is running! Keep this window open.
echo   Press Ctrl+C to stop the server.
echo ===================================================
echo.

:: Start dev server
call npm run dev -- --port 5180
pause
