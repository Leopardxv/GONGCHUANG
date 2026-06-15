@echo off
cd /d "%~dp0"

echo Stopping services...

rem Find and kill PID on port 8000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing backend process (PID: %%a)...
    taskkill /F /PID %%a
)

rem Find and kill PID on port 3000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing frontend process (PID: %%a)...
    taskkill /F /PID %%a
)

echo All services stopped.
pause
