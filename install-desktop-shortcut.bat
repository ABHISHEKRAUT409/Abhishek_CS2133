@echo off
title QuickPOS - Desktop Shortcut Installer
echo ========================================================
echo       QuickPOS - Installing Desktop Shortcut
echo ========================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; " ^
  "$desktopPath = [Environment]::GetFolderPath('Desktop'); " ^
  "$shortcut = $WshShell.CreateShortcut(\"$desktopPath\QuickPOS Retail.lnk\"); " ^
  "$shortcut.TargetPath = 'wscript.exe'; " ^
  "$shortcut.Arguments = \"`\"$PSScriptRoot\launch-pos.vbs`\"\"; " ^
  "$shortcut.WorkingDirectory = $PSScriptRoot; " ^
  "$shortcut.Description = 'QuickPOS Retail Billing & Inventory Desk'; " ^
  "$shortcut.IconLocation = 'shell32.dll,13'; " ^
  "$shortcut.Save(); " ^
  "Write-Host 'Success: Desktop shortcut created at:' \"$desktopPath\QuickPOS Retail.lnk\" -ForegroundColor Green"

echo.
echo ========================================================
echo Shortcut installed! Look for 'QuickPOS Retail' on Desktop.
echo ========================================================
pause
