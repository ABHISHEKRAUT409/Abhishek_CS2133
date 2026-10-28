$wsh = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
if ([string]::IsNullOrWhiteSpace($desktop)) {
    $desktop = "C:\Users\saksh\Desktop"
}

$startup = [Environment]::GetFolderPath('Startup')
if ([string]::IsNullOrWhiteSpace($startup)) {
    $startup = "C:\Users\saksh\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup"
}

$dir = "C:\Users\saksh\.gemini\antigravity\scratch\retail_billing_app"
$targetPath = "$dir\launch-pos.vbs"

# 1. Desktop Shortcut
$desktopShortcut = $wsh.CreateShortcut("$desktop\QuickPOS Retail.lnk")
$desktopShortcut.TargetPath = "wscript.exe"
$desktopShortcut.Arguments = "`"$targetPath`""
$desktopShortcut.WorkingDirectory = $dir
$desktopShortcut.Description = "QuickPOS Retail Billing & Inventory Desk"
$desktopShortcut.IconLocation = "shell32.dll,13"
$desktopShortcut.Save()
Write-Host "Desktop Shortcut: $desktop\QuickPOS Retail.lnk"

# 2. Windows Startup Shortcut (Runs independently of Antigravity on PC boot)
$startupShortcut = $wsh.CreateShortcut("$startup\QuickPOS Retail.lnk")
$startupShortcut.TargetPath = "wscript.exe"
$startupShortcut.Arguments = "`"$targetPath`""
$startupShortcut.WorkingDirectory = $dir
$startupShortcut.Description = "QuickPOS Auto-Start"
$startupShortcut.IconLocation = "shell32.dll,13"
$startupShortcut.Save()
Write-Host "Startup Shortcut: $startup\QuickPOS Retail.lnk"
