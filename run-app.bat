@echo off
title Paisa Pro — Smart Money Tracker
cd /d "%~dp0"
cls
color 0B

:: Quick check if node_modules exists
if not exist "node_modules" (
    color 0E
    echo ===================================================
    echo   ⚠️  First time running? Dependencies not found!
    echo ===================================================
    echo.
    echo   Running first-time setup...
    echo.
    call first-time-setup.bat
    exit /b
)

echo ===================================================
echo   💰 Paisa Pro — Smart Money Tracker
echo ===================================================
echo.
echo   Features Included:
echo     📊 Expense & Earning Tracker
echo     🤝 Udhar & Jama (Lending & Borrowing Khatabook)
echo     🛡️ Multi-layer Auto-Save (LocalStorage + IndexedDB + Disk File)
echo.
echo   Opening app at http://localhost:5180/ ...
echo.

:: Open browser
start "" "http://localhost:5180/"

echo ===================================================
echo   App is running! Keep this window open.
echo   Press Ctrl+C to stop the server.
echo ===================================================
echo.

:: Start Vite dev server
cmd /c npx vite --port 5180
pause
