# Starts the NESCO bridge whenever this user is signed in, and restarts it if it stops. Needs no admin rights.
# Remove with: Unregister-ScheduledTask -TaskName "BillBari bridge"
$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
$node = (Get-Command node).Source
$me = "$env:USERDOMAIN\$env:USERNAME"

# conhost --headless keeps the console window hidden.
$action = New-ScheduledTaskAction -Execute "conhost.exe" -Argument "--headless `"$node`" scripts\bd-bridge.mjs" -WorkingDirectory $repo
$triggers = @(
    New-ScheduledTaskTrigger -AtLogOn -User $me
    # A repeat that does nothing while the bridge is running, and revives it when it is not.
    New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
)
$settings = New-ScheduledTaskSettingsSet -MultipleInstances IgnoreNew -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId $me -LogonType Interactive

Register-ScheduledTask -TaskName "BillBari bridge" -Action $action -Trigger $triggers -Settings $settings -Principal $principal -Force | Out-Null
Start-ScheduledTask -TaskName "BillBari bridge"
Write-Output "BillBari bridge installed and started. Log: $repo\data\bridge.log"
