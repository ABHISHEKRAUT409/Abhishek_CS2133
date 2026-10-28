@echo off
title QuickPOS - Retail Billing Desk
echo ========================================================
echo        QuickPOS - Retail Billing & Inventory
echo ========================================================
echo.
echo Starting POS server on http://localhost:3005 ...
set PORT=3005
start http://localhost:3005
node server.js
pause
