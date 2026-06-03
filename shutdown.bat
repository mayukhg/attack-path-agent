@echo off
echo ========================================================
echo Shutting down DAE Attack Path Demo...
echo ========================================================
echo.

REM Finds the process ID (PID) running the integrated UI/API server on port 3000 and kills it.
FOR /F "tokens=5" %%T IN ('netstat -ano ^| findstr :3000') DO (
    IF NOT "%%T"=="0" (
        echo Stopping service running on Port 3000 (PID: %%T)...
        taskkill /PID %%T /F >nul 2>&1
    )
)

echo.
echo Application successfully shutdown.
pause
