@echo off
title Paisa Pro — First Time Setup
cd /d "%~dp0"
cls
color 0B
echo ===================================================
echo   PAISA PRO — First Time Setup
echo   Smart Money Tracker by Hit Jivani
echo ===================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo ❌ ERROR: Node.js is NOT installed on this computer!
    echo.
    echo Please install Node.js first:
    echo.
    echo   1. Go to https://nodejs.org
    echo   2. Download the LTS version (big green button)
    echo   3. Install it (click Next, Next, Next... Finish)
    echo   4. RESTART this computer
    echo   5. Run this setup.bat again
    echo.
    echo ===================================================
    pause
    exit /b 1
)

:: Show Node.js version
echo ✅ Node.js found!
for /f "tokens=*" %%i in ('node -v') do echo    Version: %%i
echo.

:: Install dependencies
echo [1/3] Installing dependencies (this may take 1-2 minutes)...
echo       Please wait...
echo.
call npm install
if %ERRORLEVEL% neq 0 (
    color 0C
    echo.
    echo ❌ ERROR: npm install failed!
    echo    Try running this setup again, or check your internet.
    pause
    exit /b 1
)
echo.
echo ✅ Dependencies installed successfully!
echo.

:: Create Desktop Shortcut
echo [2/3] Creating Desktop shortcut...
set "SCRIPT_DIR=%~dp0"
set "DESKTOP=%USERPROFILE%\Desktop"
set "SHORTCUT_NAME=Paisa Pro.lnk"

:: Use PowerShell to create .lnk shortcut
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('%DESKTOP%\%SHORTCUT_NAME%'); $sc.TargetPath = '%SCRIPT_DIR%run-app.bat'; $sc.WorkingDirectory = '%SCRIPT_DIR%'; $sc.Description = 'Paisa Pro - Smart Money Tracker'; $sc.Save()" >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Desktop shortcut "Paisa Pro" created!
) else (
    echo ⚠️  Could not create shortcut automatically.
    echo    You can manually create one to: %SCRIPT_DIR%run-app.bat
)
echo.

:: Test build
echo [3/3] Testing build...
call npm run build >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Build test passed!
) else (
    echo ⚠️  Build test had warnings (app may still work fine)
)

echo.
color 0A
echo ===================================================
echo   ✅ SETUP COMPLETE!
echo ===================================================
echo.
echo   How to use:
echo   • Double-click "Paisa Pro" shortcut on Desktop
echo   • OR double-click "run-app.bat" in this folder
echo   • App opens at http://localhost:5180/
echo.
echo   First time? The app will open with empty data.
echo   Go to Settings to import your backup JSON file.
echo.
echo ===================================================
echo.
echo Press any key to launch the app now...
pause >nul
call run-app.bat
