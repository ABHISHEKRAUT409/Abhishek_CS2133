@echo off
title QuickPOS - Stop Server
echo Stopping QuickPOS POS server...
powershell -Command "Get-NetTCPConnection -LocalPort 3005 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
echo QuickPOS server has been stopped.
timeout /t 2 >nul
