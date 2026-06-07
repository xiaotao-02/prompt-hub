#Requires -Version 5.1
<#
.SYNOPSIS
  通过 Zeabur GraphQL API 批量写入 output/zeabur-api.env 并重启 API 服务。

.EXAMPLE
  $env:ZEABUR_TOKEN = '<Zeabur Dashboard -> Settings -> API Keys>'
  .\scripts\apply-zeabur-api-env-graphql.ps1
#>
param(
  [string] $EnvFile = (Join-Path $PSScriptRoot '..\output\zeabur-api.env'),
  [string] $ServiceId = '6a21c8d42fe98e0879e0863d',
  [string] $EnvironmentId = '6a217e0a95b39806d284a647',
  [string] $ZeaburToken = $env:ZEABUR_TOKEN
)

$ErrorActionPreference = 'Stop'
if (-not $ZeaburToken) {
  Write-Error 'Set ZEABUR_TOKEN (Zeabur Dashboard -> Settings -> API Keys).'
}
if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile"
}

& (Join-Path $PSScriptRoot 'check-zeabur-api-env.ps1') -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

function Invoke-ZeaburGql {
  param([string]$Query)
  $body = @{ query = $Query } | ConvertTo-Json -Compress
  $r = Invoke-RestMethod -Method Post -Uri 'https://api.zeabur.com/graphql' `
    -Headers @{ Authorization = "Bearer $ZeaburToken"; 'Content-Type' = 'application/json' } `
    -Body $body
  if ($r.errors) {
    throw ($r.errors | ForEach-Object { $_.message } | Join-String -Separator '; ')
  }
  return $r
}

function ConvertTo-GqlStringLiteral([string]$s) {
  $s -replace '\\', '\\\\' -replace '"', '\"' -replace "`n", '\n' -replace "`r", ''
}

$lines = Get-Content $EnvFile | Where-Object {
  $_ -match '^\s*[^#]' -and $_ -match '='
}
Write-Host "Applying $($lines.Count) variables to service $ServiceId ..." -ForegroundColor Cyan

foreach ($line in $lines) {
  if ($line -match '^\s*#') { continue }
  $idx = $line.IndexOf('=')
  if ($idx -lt 1) { continue }
  $key = $line.Substring(0, $idx).Trim()
  $value = $line.Substring($idx + 1).Trim()
  if ($key -eq '' -or $value -match '^<') { continue }

  $ek = ConvertTo-GqlStringLiteral $key
  $ev = ConvertTo-GqlStringLiteral $value

  $update = @"
mutation {
  updateSingleEnvironmentVariable(
    serviceID: "$ServiceId"
    environmentID: "$EnvironmentId"
    oldKey: "$ek"
    newKey: "$ek"
    value: "$ev"
  ) { key value }
}
"@
  try {
    Invoke-ZeaburGql -Query $update | Out-Null
    Write-Host "  updated $key" -ForegroundColor DarkGray
  } catch {
    $create = @"
mutation {
  createEnvironmentVariable(
    serviceID: "$ServiceId"
    environmentID: "$EnvironmentId"
    key: "$ek"
    value: "$ev"
  ) { key value }
}
"@
    Invoke-ZeaburGql -Query $create | Out-Null
    Write-Host "  created $key" -ForegroundColor DarkGray
  }
}

Write-Host 'Restarting API service...' -ForegroundColor Yellow
$restart = @"
mutation {
  restartService(serviceID: "$ServiceId", environmentID: "$EnvironmentId")
}
"@
Invoke-ZeaburGql -Query $restart | Out-Null
Write-Host 'Done. Run verify-zeabur-deploy.ps1 after ~60s.' -ForegroundColor Green
