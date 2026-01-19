@echo off
echo Starting Online Medication Backend (Alternative Method)...
cd /d "%~dp0backend"
if not exist "app.py" (
    echo Error: app.py not found in backend directory!
    echo Current directory: %CD%
    pause
    exit /b 1
)
echo Running from: %CD%
python app.py
pause

