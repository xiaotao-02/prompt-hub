#Requires -Version 5.1
<#
.SYNOPSIS
  部署前检查 output/zeabur-api.env 是否满足 API 生产启动校验（assertProductionConfig）。

.EXAMPLE
  .\scripts\check-zeabur-api-env.ps1
  .\scripts\check-zeabur-api-env.ps1 -EnvFile output\zeabur-api.env
#>
param(
  [string] $EnvFile = (Join-Path $PSScriptRoot '..\output\zeabur-api.env')
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile"
}

function Get-EnvMap {
  param([string]$Path)
  $map = @{}
  foreach ($line in Get-Content $Path) {
    $t = $line.Trim()
    if (-not $t -or $t.StartsWith('#')) { continue }
    $idx = $t.IndexOf('=')
    if ($idx -lt 1) { continue }
    $key = $t.Substring(0, $idx).Trim()
    $value = $t.Substring($idx + 1).Trim()
    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $map[$key] = $value
  }
  return $map
}

$env = Get-EnvMap -Path $EnvFile
$errors = @()
$devJwt = 'dev-only-change-me'

function Require-Key {
  param([string]$Key, [string]$Hint)
  if (-not $env.ContainsKey($Key) -or [string]::IsNullOrWhiteSpace($env[$Key])) {
    $script:errors += "${Key}: missing or empty. $Hint"
  }
}

function Require-False {
  param([string]$Key)
  if ($env.ContainsKey($Key) -and $env[$Key] -eq 'true') {
    $script:errors += "${Key}: must be false in production"
  }
}

Require-Key 'JWT_SECRET' 'Run: npm run gen:secrets'
if ($env['JWT_SECRET'] -eq $devJwt) {
  $errors += 'JWT_SECRET: must not be dev default'
}
Require-Key 'CONFIG_ENCRYPTION_KEY' 'Run: npm run gen:secrets'
if ($env['CONFIG_ENCRYPTION_KEY'] -eq $devJwt) {
  $errors += 'CONFIG_ENCRYPTION_KEY: must not be dev default'
}
Require-False 'DEV_LOGIN_ENABLED'
Require-False 'MOCK_PAY_ENABLED'
Require-False 'EMAIL_DEV_LOG'

$hops = 0
if ($env.ContainsKey('TRUSTED_PROXY_HOPS') -and $env['TRUSTED_PROXY_HOPS'] -match '^\d+$') {
  $hops = [int]$env['TRUSTED_PROXY_HOPS']
}
if ($hops -lt 1) {
  $errors += 'TRUSTED_PROXY_HOPS: must be >= 1 behind Zeabur reverse proxy'
}

if ($env.ContainsKey('PORT') -and $env['PORT'] -ne '') {
  $errors += 'PORT: do not set manually on Zeabur (platform injects PORT)'
}

if ($errors.Count -gt 0) {
  Write-Host "Zeabur API env check FAILED ($EnvFile):" -ForegroundColor Red
  foreach ($e in $errors) { Write-Host "  - $e" -ForegroundColor Red }
  exit 1
}

Write-Host "[OK] Zeabur API env ready for production deploy: $EnvFile" -ForegroundColor Green
exit 0
