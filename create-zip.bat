@echo off
title Create Paisa Pro ZIP for Sharing
cd /d "%~dp0"
cls
color 0B
echo ===================================================
echo   Create Paisa Pro ZIP for Sharing
echo ===================================================
echo.
echo This will create a ZIP file on your Desktop
echo ready to share via pendrive or email.
echo.
echo Excluding: node_modules, dist, .git, recovered-raw files
echo.

set "ZIP_NAME=Paisa-Pro-Money-Tracker.zip"
set "DESKTOP=%USERPROFILE%\Desktop"
set "OUTPUT=%DESKTOP%\%ZIP_NAME%"

:: Delete old zip if exists
if exist "%OUTPUT%" del "%OUTPUT%"

echo Creating ZIP at: %OUTPUT%
echo Please wait...
echo.

:: Use PowerShell to create zip excluding node_modules and unnecessary files
powershell -Command ^
  "$source = '%~dp0'; ^
   $dest = '%OUTPUT%'; ^
   $tempDir = Join-Path $env:TEMP 'PaisaProZip'; ^
   if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }; ^
   New-Item -ItemType Directory -Path $tempDir | Out-Null; ^
   $exclude = @('node_modules', 'dist', '.git', 'recovered-raw-1.txt', 'recovered-raw-2.txt', 'recovered-raw-3.txt', 'server.js', 'create-zip.bat'); ^
   Get-ChildItem -Path $source -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object { ^
     Copy-Item $_.FullName -Destination $tempDir -Recurse -Force ^
   }; ^
   if (Test-Path $dest) { Remove-Item $dest -Force }; ^
   Compress-Archive -Path (Join-Path $tempDir '*') -DestinationPath $dest -Force; ^
   Remove-Item $tempDir -Recurse -Force; ^
   Write-Host ''; ^
   Write-Host 'ZIP created successfully!' -ForegroundColor Green"

echo.
if exist "%OUTPUT%" (
    color 0A
    echo ===================================================
    echo   ✅ ZIP Created Successfully!
    echo ===================================================
    echo.
    echo   File: %OUTPUT%
    echo.
    echo   Share this ZIP with your friend.
    echo   Tell them:
    echo     1. Extract the ZIP to any folder
    echo     2. Install Node.js from https://nodejs.org
    echo     3. Double-click "first-time-setup.bat"
    echo     4. Done! Use "Paisa Pro" shortcut on Desktop
    echo.
) else (
    color 0C
    echo ❌ Failed to create ZIP. Try manually zipping.
)

echo ===================================================
pause
