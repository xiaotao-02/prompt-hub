#Requires -Version 5.1
<#
.SYNOPSIS
  验收 Zeabur 部署：API health、官网账户页、可选管理员 /v1/admin/overview。

.EXAMPLE
  .\scripts\verify-zeabur-admin.ps1 -ApiUrl "https://xxx-api.zeabur.app" -WebUrl "https://xxx-web.zeabur.app"

.EXAMPLE
  .\scripts\verify-zeabur-admin.ps1 -ApiUrl "https://xxx-api.zeabur.app" -Token "eyJ..."
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $ApiUrl,

  [string] $WebUrl = '',

  [string] $Token = ''
)

$ErrorActionPreference = 'Stop'
$apiBase = $ApiUrl.TrimEnd('/')

function Test-Url {
  param([string] $Url, [string] $Label)
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30
    Write-Host "[OK] $Label -> $($r.StatusCode)" -ForegroundColor Green
    return $true
  } catch {
    Write-Host "[FAIL] $Label -> $($_.Exception.Message)" -ForegroundColor Red
    return $false
  }
}

Write-Host "=== Zeabur admin smoke ===" -ForegroundColor Cyan
$ok = Test-Url "$apiBase/health" 'API /health'

if ($WebUrl) {
  $webBase = $WebUrl.TrimEnd('/')
  $accountOk = Test-Url "$webBase/account" 'Website /account'
  if (-not $accountOk) { $ok = $false }
  Write-Host "  Admin UI: $webBase/admin" -ForegroundColor DarkGray

  try {
    $accountHtml = (Invoke-WebRequest -Uri "$webBase/account" -UseBasicParsing -TimeoutSec 30).Content
    if ($accountHtml -match 'Google 登录尚未启用') {
      Write-Host '[FAIL] /account: NEXT_PUBLIC_GOOGLE_CLIENT_ID not set (website build)' -ForegroundColor Red
      $ok = $false
    } elseif ($accountHtml -notmatch 'accounts\.google\.com/gsi/client') {
      Write-Host '[WARN] /account: Google Identity Services script not found in HTML' -ForegroundColor Yellow
    } else {
      Write-Host '[OK] /account: Google login enabled (GIS script present)' -ForegroundColor Green
    }
  } catch {
    Write-Host "[WARN] /account Google check skipped: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

try {
  $body = '{"credential":"invalid-smoke-token"}'
  Invoke-RestMethod -Uri "$apiBase/v1/auth/google" -Method POST -ContentType 'application/json' -Body $body -TimeoutSec 15 | Out-Null
  Write-Host '[WARN] POST /v1/auth/google accepted invalid token (unexpected)' -ForegroundColor Yellow
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if ($status -eq 503) {
    Write-Host '[FAIL] POST /v1/auth/google -> 503 (GOOGLE_CLIENT_ID not configured on API)' -ForegroundColor Red
    Write-Host '  Fix: set API GOOGLE_CLIENT_ID = website NEXT_PUBLIC_GOOGLE_CLIENT_ID, then Redeploy API' -ForegroundColor Yellow
    Write-Host '  CLI: .\scripts\apply-zeabur-admin-google.ps1 -ClientId "<id>.apps.googleusercontent.com" -AdminEmail "<email>" -EnvId "<env-id>"' -ForegroundColor DarkGray
    $ok = $false
  } elseif ($status -eq 401) {
    Write-Host '[OK] POST /v1/auth/google -> 401 (Google auth route configured)' -ForegroundColor Green
  } else {
    Write-Host "[WARN] POST /v1/auth/google -> HTTP $status" -ForegroundColor Yellow
  }
}

if ($Token) {
  try {
    $headers = @{ Authorization = "Bearer $($Token.Trim())" }
    $overview = Invoke-RestMethod -Uri "$apiBase/v1/admin/overview?days=7" -Headers $headers -TimeoutSec 30
    Write-Host '[OK] GET /v1/admin/overview (admin whitelist + JWT)' -ForegroundColor Green
    if ($null -ne $overview.totalUsers) {
      Write-Host "  totalUsers: $($overview.totalUsers)" -ForegroundColor DarkGray
    }
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host "[FAIL] GET /v1/admin/overview -> HTTP $status (403=邮箱不在 ADMIN_EMAILS 或未登录)" -ForegroundColor Red
    $ok = $false
  }
} else {
  Write-Host '[SKIP] No -Token: login at /account then re-run with JWT to verify admin API' -ForegroundColor Yellow
}

if (-not $ok) { exit 1 }
Write-Host 'Done.' -ForegroundColor Cyan
