#Requires -Version 5.1
<#
.SYNOPSIS
  Apply admin Google env to Zeabur API + website via CLI (requires ZEABUR_TOKEN).

.EXAMPLE
  $env:ZEABUR_TOKEN = '<token from Zeabur Dashboard -> Settings -> API>'
  .\scripts\apply-zeabur-admin-google.ps1 -ClientId 'xxxx.apps.googleusercontent.com' -AdminEmail 'xiaotao666.1@gmail.com' -EnvId '6a217e0a95b39806d284a647' -ApiServiceName 'prompt-hub-api' -WebServiceName 'prompt-hub'
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $ClientId,

  [Parameter(Mandatory = $true)]
  [string] $AdminEmail,

  [Parameter(Mandatory = $true)]
  [string] $EnvId,

  [string] $ApiServiceName = 'prompt-hub-api',
  [string] $WebServiceName = 'prompt-hub',
  [string] $ZeaburToken = $env:ZEABUR_TOKEN
)

$ErrorActionPreference = 'Stop'
if (-not $ZeaburToken) {
  Write-Error 'Set ZEABUR_TOKEN (Zeabur Dashboard -> Settings -> API) or pass -ZeaburToken.'
}

$email = $AdminEmail.Trim().ToLowerInvariant()
$cid = $ClientId.Trim()
$env:ZEABUR_TOKEN = $ZeaburToken

function Invoke-ZeaburVar {
  param([string]$ServiceName, [hashtable]$Keys)
  $args = @(
    'zeabur@latest', 'variable', 'update',
    '--name', $ServiceName,
    '--env-id', $EnvId,
    '-i=false', '-y'
  )
  foreach ($kv in $Keys.GetEnumerator()) {
    $args += '-k'
    $args += ("{0}={1}" -f $kv.Key, $kv.Value)
  }
  & npx @args
  if ($LASTEXITCODE -ne 0) { throw "zeabur variable update failed for $ServiceName" }
}

Write-Host "Updating API service: $ApiServiceName" -ForegroundColor Cyan
Invoke-ZeaburVar -ServiceName $ApiServiceName -Keys @{
  GOOGLE_CLIENT_ID = $cid
  ADMIN_EMAILS     = $email
}

Write-Host "Updating website service: $WebServiceName" -ForegroundColor Cyan
Invoke-ZeaburVar -ServiceName $WebServiceName -Keys @{
  NEXT_PUBLIC_GOOGLE_CLIENT_ID = $cid
}

Write-Host 'Restarting services...' -ForegroundColor Yellow
& npx zeabur@latest service restart --env-id $EnvId --service-name $ApiServiceName -i=false
& npx zeabur@latest service restart --env-id $EnvId --service-name $WebServiceName -i=false

Write-Host 'Done. Verify:' -ForegroundColor Green
Write-Host "  .\scripts\verify-zeabur-admin.ps1 -ApiUrl https://prompt-hub-api.zeabur.app -WebUrl https://prompt-hub.zeabur.app"
