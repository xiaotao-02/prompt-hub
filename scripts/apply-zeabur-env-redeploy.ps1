#Requires -Version 5.1
<#
.SYNOPSIS
  仅更新 Zeabur API + website 环境变量（生产域名）并 Redeploy，不绑定域名。

.EXAMPLE
  $env:ZEABUR_TOKEN = '<Zeabur Dashboard -> Settings -> API Keys>'
  .\scripts\apply-zeabur-env-redeploy.ps1

.EXAMPLE
  .\scripts\apply-zeabur-env-redeploy.ps1 -OpenConsole
#>
param(
  [string] $ZeaburToken = $env:ZEABUR_TOKEN,
  [string] $ApiEnvFile = (Join-Path $PSScriptRoot '..\output\zeabur-api.env'),
  [string] $WebsiteEnvFile = (Join-Path $PSScriptRoot '..\output\zeabur-website.env'),
  [switch] $OpenConsole,
  [switch] $SkipSmoke
)

$ErrorActionPreference = 'Stop'
$apiUrl = 'https://zeabur.com/projects/6a217e0af1be9943f1f8d8e7/services/6a21c8d42fe98e0879e0863d?envID=6a217e0a95b39806d284a647'
$webUrl = 'https://zeabur.com/projects/6a217e0af1be9943f1f8d8e7/services/6a217e12e957fb053c54de78?envID=6a217e0a95b39806d284a647'

if (-not (Test-Path $ApiEnvFile)) {
  Write-Error "Missing $ApiEnvFile — restore from private-secrets bundle or npm run gen:secrets"
}
if (-not (Test-Path $WebsiteEnvFile)) {
  Write-Error "Missing $WebsiteEnvFile"
}

if ($OpenConsole -or -not $ZeaburToken) {
  Write-Host @"

=== 手动粘贴（无 ZEABUR_TOKEN 时）===

1) API 服务变量页（已复制 API env 到剪贴板）：
   $apiUrl
   -> 环境变量 -> 编辑原始环境变量 -> 全选粘贴 -> 保存 -> Redeploy Service

2) website 服务变量页（下一步会复制 website env）：
   $webUrl
   -> 同上 -> Redeploy Service

3) 验收：
   .\scripts\verify-zeabur-deploy.ps1 `
     -WebUrl https://aipromptstudio.top `
     -ApiUrl https://api.aipromptstudio.top

自动写入需：
  `$env:ZEABUR_TOKEN = '...'; .\scripts\apply-zeabur-env-redeploy.ps1

"@ -ForegroundColor Cyan
  Set-Clipboard -Value (Get-Content $ApiEnvFile -Raw)
  Write-Host '[clipboard] API env copied' -ForegroundColor Green
  Start-Process $apiUrl
  if ($OpenConsole) { return }
  if (-not $ZeaburToken) { exit 0 }
}

Write-Host 'Applying API env via GraphQL...' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'apply-zeabur-api-env-graphql.ps1') -EnvFile $ApiEnvFile -ZeaburToken $ZeaburToken
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Applying website env via GraphQL...' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'apply-zeabur-website-env-graphql.ps1') -EnvFile $WebsiteEnvFile -ZeaburToken $ZeaburToken
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($SkipSmoke) { exit 0 }

Write-Host 'Waiting 60s for redeploy...' -ForegroundColor Yellow
Start-Sleep -Seconds 60
& (Join-Path $PSScriptRoot 'verify-zeabur-deploy.ps1') `
  -WebUrl 'https://aipromptstudio.top' `
  -ApiUrl 'https://api.aipromptstudio.top'
exit $LASTEXITCODE
