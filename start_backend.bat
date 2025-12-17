@echo off
echo Starting Online Medication Backend...
cd /d "%~dp0backend"
if not exist "run.py" (
    echo Error: run.py not found in backend directory!
    echo Current directory: %CD%
    pause
    exit /b 1
)
echo Running from: %CD%
python run.py
pause

