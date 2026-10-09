@echo off
title Paisa Pro — Smart Money Tracker
cd /d "%~dp0"
cls
color 0B
echo.
echo   ===================================================
echo   💰 Paisa Pro — Smart Money Tracker
echo   ===================================================
echo.
echo   Starting app... Please wait...
echo.

:: Open browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5180/"

:: Start PowerShell server
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause
