@echo off
echo Viewing all users and data from the database...
cd /d "%~dp0backend"
python view_users.py
pause

