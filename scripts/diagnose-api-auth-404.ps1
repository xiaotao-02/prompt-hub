#Requires -Version 5.1
<#
.SYNOPSIS
  对比自定义 API 域名与 Zeabur 生成域名上的登录路由，定位插件 HTTP 404。

.EXAMPLE
  .\scripts\diagnose-api-auth-404.ps1
  .\scripts\diagnose-api-auth-404.ps1 -CustomApiUrl https://api.aipromptstudio.top -ZeaburApiUrl https://prompt-hub-api.zeabur.app
#>
param(
  [string] $CustomApiUrl = 'https://api.aipromptstudio.top',
  [string] $ZeaburApiUrl = 'https://prompt-hub-api.zeabur.app'
)

$ErrorActionPreference = 'Continue'
$scriptDir = $PSScriptRoot
$verify = Join-Path $scriptDir 'verify-api-auth-route.ps1'

function Test-AuthRoute([string]$ApiUrl) {
  & $verify -ApiUrl $ApiUrl
  return $LASTEXITCODE -eq 0
}

Write-Host '=== API auth route diagnosis ===' -ForegroundColor Cyan
Write-Host "  Custom: $CustomApiUrl"
Write-Host "  Zeabur: $ZeaburApiUrl"
Write-Host ''

$customOk = Test-AuthRoute $CustomApiUrl
$zeaburOk = Test-AuthRoute $ZeaburApiUrl

if ($customOk) {
  Write-Host ''
  Write-Host '[OK] Custom API domain exposes auth routes. Plugin login should work if VITE_PLATFORM_API_URL matches.' -ForegroundColor Green
  exit 0
}

if ($zeaburOk) {
  Write-Host ''
  Write-Host '[FIX] Custom domain missing auth routes; Zeabur *.zeabur.app domain is OK.' -ForegroundColor Yellow
  Write-Host @'

在 Zeabur 控制台：
  1) 打开 Project -> api 服务 (Root Directory = services/api)
  2) 域名 -> 确认 api.aipromptstudio.top 绑定在此服务（勿绑在 website 或旧 api 实例）
  3) 若其他服务也挂了同名域名，先删除旧绑定
  4) Redeploy api 服务
  5) 验收：
     .\scripts\verify-api-auth-route.ps1 -ApiUrl https://api.aipromptstudio.top

有 ZEABUR_TOKEN 时可自动重绑：
  $env:ZEABUR_TOKEN = '...'
  .\scripts\apply-zeabur-production-domain.ps1

'@ -ForegroundColor Cyan
  exit 1
}

Write-Host ''
Write-Host '[FAIL] Neither API URL exposes /v1/auth/email/code/send. Redeploy services/api on Zeabur.' -ForegroundColor Red
Write-Host '  See docs/deploy-zeabur-runbook.zh.md' -ForegroundColor DarkGray
exit 1
