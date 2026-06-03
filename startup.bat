@echo off
echo ========================================================
echo Starting Attack Path Agent Demo (Integrated Frontend + API Backend)
echo ========================================================
echo.

REM Next.js serves both the React UI and /api/attack-path backend routes.
start "AttackPathAgent_NextJS_Server" cmd /c "npm run dev"

echo The server is spinning up. 
echo Once ready, access the application at: http://localhost:3000
echo Backend health path: http://localhost:3000/api/attack-path
echo.
pause
