#Requires -Version 5.1
<#
.SYNOPSIS
  Zeabur 部署 Smoke：API /health、官网首页、账户页。

.EXAMPLE
  .\scripts\verify-zeabur-deploy.ps1 `
    -WebUrl "https://prompt-hub.zeabur.app" `
    -ApiUrl "https://prompt-hub-api.zeabur.app"
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $WebUrl,

  [Parameter(Mandatory = $true)]
  [string] $ApiUrl
)

$ErrorActionPreference = 'Stop'
$webBase = $WebUrl.TrimEnd('/')
$apiBase = $ApiUrl.TrimEnd('/')
$failed = $false

function Test-HttpOk {
  param(
    [string] $Url,
    [string] $Label,
    [int[]] $AllowedStatus = @(200)
  )
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 45
    if ($AllowedStatus -contains $r.StatusCode) {
      Write-Host "[OK] $Label -> $($r.StatusCode)" -ForegroundColor Green
      return $true
    }
    Write-Host "[FAIL] $Label -> $($r.StatusCode) (expected $($AllowedStatus -join ','))" -ForegroundColor Red
    return $false
  } catch {
    $status = $null
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
    }
    Write-Host "[FAIL] $Label -> HTTP $status $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

Write-Host '=== Zeabur deploy smoke ===' -ForegroundColor Cyan
Write-Host "  Web: $webBase"
Write-Host "  API: $apiBase"
Write-Host ''

if (-not (Test-HttpOk "$apiBase/health" 'API GET /health')) {
  $failed = $true
  Write-Host '  Hint: API 404/502 → 确认已创建 api 服务 (Root services/api)，并 Redeploy' -ForegroundColor Yellow
}

$verifyAuth = Join-Path $PSScriptRoot 'verify-api-auth-route.ps1'
if (Test-Path $verifyAuth) {
  & $verifyAuth -ApiUrl $apiBase
  if ($LASTEXITCODE -ne 0) {
    $failed = $true
    Write-Host '  Hint: 插件登录 404 → api 自定义域名可能绑到旧服务，见 docs/zeabur-api-domain-404.zh.md' -ForegroundColor Yellow
  }
}

if (-not (Test-HttpOk "$webBase/" 'Website GET /')) {
  $failed = $true
  Write-Host '  Hint: Website 502 → Root Directory=website，start 使用 next start（读 PORT），勿手填错误 PORT' -ForegroundColor Yellow
}

Test-HttpOk "$webBase/account" 'Website GET /account' | Out-Null

if ($failed) {
  Write-Host ''
  Write-Host 'See docs/deploy-zeabur-runbook.zh.md (502 / 404 FAQ)' -ForegroundColor DarkGray
  exit 1
}

Write-Host ''
Write-Host 'Done. Optional admin check:' -ForegroundColor Cyan
Write-Host "  .\scripts\verify-zeabur-admin.ps1 -ApiUrl `"$apiBase`" -WebUrl `"$webBase`"" -ForegroundColor DarkGray
