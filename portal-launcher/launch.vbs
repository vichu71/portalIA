Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\portalIA\portal-launcher"
WshShell.Run "cmd /c npm start", 0
Set WshShell = Nothing