param(
  [switch]$InstallAutostart,
  [switch]$UninstallAutostart,
  [switch]$Status,
  [switch]$Help
)

$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HelperScript = Join-Path $RootDir "scripts\rashnu_log_helper.py"
$ArtifactDir = Join-Path $RootDir "research\artifacts\rashnu"
$StartupDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup"
$StartupScriptPath = Join-Path $StartupDir "Rashnu Log Helper.cmd"

function Resolve-PythonCommand {
  if (Get-Command py -ErrorAction SilentlyContinue) {
    return @("py", "-3")
  }
  if (Get-Command python -ErrorAction SilentlyContinue) {
    return @("python")
  }
  throw "Python 3 was not found on PATH."
}

function Invoke-PythonScript {
  param([string]$ScriptPath)

  $command = Resolve-PythonCommand
  if ($command.Count -gt 1) {
    & $command[0] $command[1..($command.Count - 1)] $ScriptPath
    return
  }
  & $command[0] $ScriptPath
}

function Ensure-Artifacts {
  New-Item -ItemType Directory -Path $ArtifactDir -Force | Out-Null
}

function Test-HelperRunning {
  try {
    Invoke-WebRequest -Uri "http://127.0.0.1:45173/health" -UseBasicParsing -TimeoutSec 2 | Out-Null
    return $true
  } catch {
    return $false
  }
}

function Write-StartupScript {
  New-Item -ItemType Directory -Path $StartupDir -Force | Out-Null
  Ensure-Artifacts
  $content = @"
@echo off
cd /d "$RootDir"
where py >nul 2>nul
if not errorlevel 1 (
  py -3 "$HelperScript"
  exit /b %errorlevel%
)
python "$HelperScript"
"@
  Set-Content -Path $StartupScriptPath -Value $content -Encoding ASCII
}

function Print-Status {
  if (Test-HelperRunning) {
    Write-Output "Rashnu log helper: running"
  } else {
    Write-Output "Rashnu log helper: not running"
  }
  if (Test-Path $StartupScriptPath) {
    Write-Output "Autostart: installed ($StartupScriptPath)"
  } else {
    Write-Output "Autostart: not installed"
  }
}

function Show-Usage {
  @"
Usage: .\run-rashnu-helper.ps1 [command]

Commands:
  (no command)            Run logger helper in foreground
  -InstallAutostart       Install Windows Startup launcher and start helper
  -UninstallAutostart     Remove Windows Startup launcher
  -Status                 Show helper and autostart status
  -Help                   Show this message
"@ | Write-Output
}

if ($Help) {
  Show-Usage
  exit 0
}

if ($Status) {
  Print-Status
  exit 0
}

if ($InstallAutostart) {
  Write-StartupScript
  Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList @("/c", "`"$StartupScriptPath`"") | Out-Null
  Write-Output "Installed and started autostart logger: Rashnu Log Helper"
  exit 0
}

if ($UninstallAutostart) {
  if (Test-Path $StartupScriptPath) {
    Remove-Item -LiteralPath $StartupScriptPath -Force
  }
  Write-Output "Removed autostart logger: Rashnu Log Helper"
  exit 0
}

Ensure-Artifacts
Invoke-PythonScript -ScriptPath $HelperScript
