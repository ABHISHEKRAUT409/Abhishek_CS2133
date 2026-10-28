@echo off
title QuickPOS - Enable Windows Auto-Start
echo Setting up QuickPOS to automatically start when your PC powers on...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$WshShell = New-Object -ComObject WScript.Shell; " ^
  "$startupPath = [Environment]::GetFolderPath('Startup'); " ^
  "$shortcut = $WshShell.CreateShortcut(\"$startupPath\QuickPOS Retail.lnk\"); " ^
  "$shortcut.TargetPath = 'wscript.exe'; " ^
  "$shortcut.Arguments = \"`\"$PSScriptRoot\launch-pos.vbs`\"\"; " ^
  "$shortcut.WorkingDirectory = $PSScriptRoot; " ^
  "$shortcut.Description = 'QuickPOS Retail Billing & Inventory Desk'; " ^
  "$shortcut.IconLocation = 'shell32.dll,13'; " ^
  "$shortcut.Save(); " ^
  "Write-Host 'Success: QuickPOS added to Windows Startup folder!' -ForegroundColor Green"
pause
