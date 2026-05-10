@echo off
setlocal

set ZIP_NAME=affine-sidebar-extension.zip

if exist "%ZIP_NAME%" del /f "%ZIP_NAME%"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Compress-Archive -Path 'manifest.json','background.js','content.js','popup.html','popup.css','popup.js','sidebar.html','sidebar.css','sidebar.js','icons' -DestinationPath '%ZIP_NAME%' -Force"

if %errorlevel% equ 0 (
    echo Done^^! %ZIP_NAME% is ready to upload to AMO.
) else (
    echo Error: could not create %ZIP_NAME%.
    exit /b 1
)
