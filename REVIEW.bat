@echo off
rem Owner review board: starts the local server and opens the browser (REVIEW-001).
rem If the board already runs, review.py only opens the browser and exits.
cd /d "%~dp0"
chcp 65001 >nul
title لوحة المراجعة — سيب الشباك ده مفتوح
echo.
echo   لوحة المراجعة — سيب الشباك ده مفتوح
echo.
where python >nul 2>nul
if %errorlevel%==0 (python TSST\services\review\review.py --open --read-only) else (py -3 TSST\services\review\review.py --open --read-only)
if errorlevel 1 pause
