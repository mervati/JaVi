@echo off
cd /d D:\GitHub\javi-app
start "JaVi Dev" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --auto-open-devtools-for-tabs http://localhost:5173
