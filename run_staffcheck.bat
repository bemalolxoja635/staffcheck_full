@echo off
echo StaffCheck tizimi ishga tushmoqda...

:: Backendni alohida oynada ochish
start cmd /k "cd backend && .venv\Scripts\activate && python manage.py runserver"

:: Frontendni alohida oynada ochish
start cmd /k "cd frontend && npm run dev"

echo.
echo Ikkala server ham alohida oynalarda ochildi. 
echo Brauzerda http://localhost:5173 manziliga kiring.
echo.
pause
