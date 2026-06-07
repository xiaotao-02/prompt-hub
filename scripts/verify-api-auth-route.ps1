#Requires -Version 5.1
<#
.SYNOPSIS
  验证平台 API 是否暴露邮箱验证码登录路由（插件 / 官网登录依赖）。

.DESCRIPTION
  对无效邮箱 POST /v1/auth/email/code/send：
  - 404 → 路由不存在（常见于自定义 api 子域绑到旧服务）
  - 400/401/429/503 → 路由存在（可接受）

.EXAMPLE
  .\scripts\verify-api-auth-route.ps1 -ApiUrl https://api.aipromptstudio.top
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $ApiUrl
)

$ErrorActionPreference = 'Stop'
$base = $ApiUrl.TrimEnd('/')
$uri = "$base/v1/auth/email/code/send"
$body = '{"email":"not-an-email"}'

try {
  $r = Invoke-WebRequest -Uri $uri -Method POST -Body $body -ContentType 'application/json' `
    -UseBasicParsing -TimeoutSec 30
  if ($r.StatusCode -eq 404) {
    Write-Host "[FAIL] POST /v1/auth/email/code/send -> 404 (route missing)" -ForegroundColor Red
    exit 1
  }
  Write-Host "[OK] POST /v1/auth/email/code/send -> $($r.StatusCode) (route exists)" -ForegroundColor Green
  exit 0
} catch {
  $status = $null
  if ($_.Exception.Response) {
    $status = [int]$_.Exception.Response.StatusCode
  }
  if ($status -eq 404) {
    Write-Host "[FAIL] POST /v1/auth/email/code/send -> HTTP 404 (route missing)" -ForegroundColor Red
    Write-Host '  Hint: 在 Zeabur 将 api 自定义域名绑定到当前 api 服务 (Root services/api) 后 Redeploy' -ForegroundColor Yellow
    Write-Host '  See docs/zeabur-api-domain-404.zh.md' -ForegroundColor DarkGray
    exit 1
  }
  if ($status -in 400, 401, 429, 503) {
    Write-Host "[OK] POST /v1/auth/email/code/send -> HTTP $status (route exists)" -ForegroundColor Green
    exit 0
  }
  Write-Host "[FAIL] POST /v1/auth/email/code/send -> HTTP $status $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
