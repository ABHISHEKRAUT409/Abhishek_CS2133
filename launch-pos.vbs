Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Set working directory to project folder
WshShell.CurrentDirectory = strDir

' 1. Check if server is already running on port 3005. If not, start it silently in background.
WshShell.Run "powershell -WindowStyle Hidden -Command ""if (-not (Get-NetTCPConnection -LocalPort 3005 -State Listen -ErrorAction SilentlyContinue)) { $env:PORT='3005'; node server.js }""", 0, False

' 2. Brief pause to allow initialization if newly started
WScript.Sleep 1200

' 3. Open in Windows Edge or Chrome in standalone Desktop App Mode (no address bar or tabs)
edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
appUrl = "http://localhost:3005"

If fso.FileExists(edgePath) Then
    WshShell.Run """" & edgePath & """ --app=""" & appUrl & """", 1, False
ElseIf fso.FileExists(chromePath) Then
    WshShell.Run """" & chromePath & """ --app=""" & appUrl & """", 1, False
Else
    WshShell.Run appUrl, 1, False
End If
