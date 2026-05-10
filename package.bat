@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0package.ps1"
if %errorlevel% neq 0 (
    echo Error: could not create zip.
    exit /b 1
)
