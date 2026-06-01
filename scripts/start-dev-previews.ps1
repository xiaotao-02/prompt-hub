# Start extension UI, website, and platform API dev previews (Windows)
$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path -Parent $PSScriptRoot
$LogDir = Join-Path $RepoRoot '.cursor/dev-preview'
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Test-PortOpen([int]$Port) {
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(500)
    if ($ok -and $client.Connected) {
      $client.Close()
      return $true
    }
    $client.Close()
    return $false
  } catch {
    return $false
  }
}

function Wait-PortClosed([int]$Port, [int]$TimeoutSec = 10) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (-not (Test-PortOpen $Port)) { return $true }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Stop-PortProcess([int]$Port) {
  $pids = @(
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  )
  foreach ($procId in $pids) {
    if (-not $procId) { continue }
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
    } catch {
      # process may have already exited
    }
  }
  $null = Wait-PortClosed -Port $Port -TimeoutSec 10
  Start-Sleep -Seconds 1
}

function Get-DevProcessIds([string]$WorkingDirectory, [string]$ServiceName) {
  $dir = (Resolve-Path $WorkingDirectory -ErrorAction Stop).Path
  $dirNorm = ($dir -replace '/', '\').TrimEnd('\')

  $pids = @()
  $processes = Get-CimInstance Win32_Process -Filter "name = 'node.exe' OR name = 'powershell.exe'" -ErrorAction SilentlyContinue
  foreach ($proc in $processes) {
    $cmd = $proc.CommandLine
    if (-not $cmd) { continue }

    $cmdNorm = ($cmd -replace '/', '\')
    if ($cmdNorm -notlike "*$dirNorm*") { continue }

    # Repo root also matches website/api paths; exclude child service dirs for extension.
    if ($ServiceName -eq 'extension') {
      if ($cmdNorm -like "*\website\*" -or $cmdNorm -like "*\services\api\*") { continue }
    }

    if ($cmd -notmatch 'npm(\.cmd)?(\s+run\s+dev|\-cli\.js\s+run\s+dev)|tsx[/\\].*watch\s+src|services[/\\]api[/\\].*src[/\\]index\.ts|vite(\.js|/bin/)|astro(\.mjs)?\s+dev') {
      continue
    }

    $pids += $proc.ProcessId
  }

  return @($pids | Select-Object -Unique)
}

function Stop-DevProcesses([string]$WorkingDirectory, [string]$ServiceName) {
  $pids = Get-DevProcessIds -WorkingDirectory $WorkingDirectory -ServiceName $ServiceName
  if ($pids.Count -eq 0) { return }

  Write-Host "dev:previews stopping $($pids.Count) stale process(es) for $ServiceName"
  foreach ($procId in $pids) {
    try {
      Stop-Process -Id $procId -Force -ErrorAction Stop
    } catch {
      # process may have already exited
    }
  }
  Start-Sleep -Seconds 1
}

function Show-LogTail([string]$LogPath, [int]$Lines = 40) {
  if (-not (Test-Path $LogPath)) {
    Write-Host "dev:previews log not found: $LogPath"
    return
  }
  Write-Host ''
  Write-Host "dev:previews last $Lines lines of $LogPath"
  Write-Host '---'
  Get-Content -Path $LogPath -Tail $Lines -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_ }
  Write-Host '---'
}

function Wait-HttpReady([string]$Url, [int]$TimeoutSec, [string]$Name, [string]$LogPath) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
        return $true
      }
    } catch {
      # still starting
    }
    Start-Sleep -Seconds 1
  }
  Show-LogTail -LogPath $LogPath
  throw "$Name not ready within ${TimeoutSec}s: $Url"
}

function Set-LocalDevEnv([string]$Dir, [hashtable]$Defaults) {
  $envPath = Join-Path $Dir '.env'
  $examplePath = Join-Path $Dir '.env.example'
  $created = $false

  if (-not (Test-Path $envPath)) {
    if (-not (Test-Path $examplePath)) {
      throw "Missing $examplePath"
    }
    Copy-Item $examplePath $envPath
    $created = $true
  }

  $original = [System.IO.File]::ReadAllText($envPath, $Utf8NoBom)
  $lines = $original -split "`r?`n", -1
  if ($lines.Count -gt 0 -and $lines[-1] -eq '') {
    $lines = $lines[0..($lines.Count - 2)]
  }

  $changed = $created
  foreach ($key in $Defaults.Keys) {
    $value = $Defaults[$key]
    $targetLine = "$key=$value"
    $replaced = $false
    $newLines = @()
    foreach ($line in $lines) {
      if ($line -match "^\s*$([regex]::Escape($key))=") {
        if ($line -ne $targetLine) { $changed = $true }
        $newLines += $targetLine
        $replaced = $true
      } else {
        $newLines += $line
      }
    }
    if (-not $replaced) {
      $newLines += $targetLine
      $changed = $true
    }
    $lines = $newLines
  }

  if ($changed) {
    [System.IO.File]::WriteAllLines($envPath, $lines, $Utf8NoBom)
    if ($created) {
      Write-Host "dev:previews created $envPath"
    } else {
      Write-Host "dev:previews updated $envPath"
    }
  }

  return $changed
}

function Ensure-NpmInstall([string]$Dir) {
  $nodeModules = Join-Path $Dir 'node_modules'
  if (-not (Test-Path $nodeModules)) {
    Write-Host "dev:previews npm install in $Dir"
    Push-Location $Dir
    try {
      npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install failed: $Dir" }
    } finally {
      Pop-Location
    }
  }
}

function Start-DevService {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [hashtable]$Environment = @{}
  )
  $stdoutLog = Join-Path $LogDir "$Name.log"
  if (Test-Path $stdoutLog) {
    try {
      Remove-Item $stdoutLog -Force -ErrorAction Stop
    } catch {
      Start-Sleep -Seconds 2
      Remove-Item $stdoutLog -Force -ErrorAction SilentlyContinue
    }
  }

  $envPairs = @()
  foreach ($key in $Environment.Keys) {
    $envPairs += "`$env:$key='$($Environment[$key])';"
  }
  $command = ($envPairs -join ' ') + "Set-Location '$WorkingDirectory'; npm run dev 2>&1 | Out-File -FilePath '$stdoutLog' -Encoding utf8"

  $proc = Start-Process powershell -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-Command', $command
  ) -WindowStyle Hidden -PassThru

  Write-Host "dev:previews started $Name pid=$($proc.Id) log=$stdoutLog"
  return $proc
}

Write-Host 'dev:previews preparing local environment...'

$websiteEnvChanged = Set-LocalDevEnv (Join-Path $RepoRoot 'website') @{
  'NEXT_PUBLIC_API_URL'          = 'http://localhost:8787'
  'NEXT_PUBLIC_MOCK_PAY_ENABLED' = 'true'
  'NEXT_PUBLIC_PRICING_ENABLED'  = 'true'
}
$apiEnvChanged = Set-LocalDevEnv (Join-Path $RepoRoot 'services/api') @{
  'MOCK_PAY_ENABLED' = 'true'
  'SITE_URL'         = 'http://localhost:4321'
  'API_PUBLIC_URL'   = 'http://localhost:8787'
  'CORS_ORIGIN'      = 'http://localhost:4321,http://localhost:5173,https://github.com/xiaotao-02/prompt-hub'
  'EMAIL_DEV_LOG'    = 'true'
}
$extensionEnv = @{
  DEV_PREVIEW_NO_OPEN       = '1'
  VITE_PLATFORM_SITE_URL    = 'http://localhost:4321'
  VITE_PLATFORM_API_URL     = 'http://localhost:8787'
}

$envChangedByService = @{
  extension = $true
  website   = $websiteEnvChanged
  api       = $apiEnvChanged
}

Ensure-NpmInstall $RepoRoot
Ensure-NpmInstall (Join-Path $RepoRoot 'website')
Ensure-NpmInstall (Join-Path $RepoRoot 'services/api')

$services = @(
  @{
    Name = 'extension'
    Port = 5173
    Url  = 'http://localhost:5173/__dev__/ui-preview'
    Dir  = $RepoRoot
    Env  = $extensionEnv
  },
  @{
    Name = 'website'
    Port = 4321
    Url  = 'http://localhost:4321/'
    Dir  = Join-Path $RepoRoot 'website'
    Env  = @{}
  },
  @{
    Name = 'api'
    Port = 8787
    Url  = 'http://localhost:8787/health'
    Dir  = Join-Path $RepoRoot 'services/api'
    Env  = @{}
  }
)

foreach ($svc in $services) {
  $envChanged = $envChangedByService[$svc.Name]
  if (Test-PortOpen $svc.Port) {
    if ($envChanged) {
      Write-Host "dev:previews env updated, restarting $($svc.Name) on port $($svc.Port)"
      Stop-PortProcess $svc.Port
      Stop-DevProcesses -WorkingDirectory $svc.Dir -ServiceName $svc.Name
      $null = Start-DevService -Name $svc.Name -WorkingDirectory $svc.Dir -Environment $svc.Env
    } else {
      Write-Host "dev:previews port $($svc.Port) in use, skip $($svc.Name)"
    }
  } else {
    Stop-DevProcesses -WorkingDirectory $svc.Dir -ServiceName $svc.Name
    $null = Start-DevService -Name $svc.Name -WorkingDirectory $svc.Dir -Environment $svc.Env
  }
}

Write-Host 'dev:previews waiting for services...'
foreach ($svc in $services) {
  $logPath = Join-Path $LogDir "$($svc.Name).log"
  $null = Wait-HttpReady -Url $svc.Url -TimeoutSec 90 -Name $svc.Name -LogPath $logPath
  Write-Host "dev:previews ready $($svc.Name) $($svc.Url)"
}

Start-Process 'http://localhost:5173/__dev__/ui-preview'
Start-Process 'http://localhost:4321/account'

Write-Host ''
Write-Host 'Dev previews ready (npm run dev:previews):'
Write-Host '  Extension gallery  http://localhost:5173/__dev__/ui-preview'
Write-Host '    #popup         http://localhost:5173/__dev__/ui-preview#popup'
Write-Host '    #options       http://localhost:5173/__dev__/ui-preview#options'
Write-Host '    #panel         http://localhost:5173/__dev__/ui-preview#panel'
Write-Host '    #contextmenu   http://localhost:5173/__dev__/ui-preview#contextmenu'
Write-Host '    #website       http://localhost:5173/__dev__/ui-preview#website'
Write-Host '  Website home     http://localhost:4321/'
Write-Host '  Website account  http://localhost:4321/account'
Write-Host '  Website pricing  http://localhost:4321/pricing'
Write-Host '  Website docs     http://localhost:4321/docs'
Write-Host '  API health       http://localhost:8787/health'
Write-Host ''
Write-Host "Logs: $LogDir"
