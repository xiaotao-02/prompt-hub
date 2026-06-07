#Requires -Version 5.1
<#
.SYNOPSIS
  将 output/zeabur-api.env 应用到 Zeabur API 服务（GraphQL 或控制台手动粘贴说明）。

.EXAMPLE
  .\scripts\apply-zeabur-api-env.ps1
  $env:ZEABUR_TOKEN = '...'; .\scripts\apply-zeabur-api-env.ps1 -UseGraphql
#>
param(
  [string] $ServiceUrl = 'https://zeabur.com/projects/6a217e0af1be9943f1f8d8e7/services/6a21c8d42fe98e0879e0863d?envID=6a217e0a95b39806d284a647',
  [string] $EnvFile = (Join-Path $PSScriptRoot '..\output\zeabur-api.env'),
  [switch] $UseGraphql
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile — run: npm run gen:secrets ; fill UPSTREAM_API_KEY in output/zeabur-api.env"
}

& (Join-Path $PSScriptRoot 'check-zeabur-api-env.ps1') -EnvFile $EnvFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($UseGraphql) {
  & (Join-Path $PSScriptRoot 'apply-zeabur-api-env-graphql.ps1') -EnvFile $EnvFile
  exit $LASTEXITCODE
}

Write-Host @"

=== Zeabur API 环境变量（手动粘贴）===

1. 打开 API 服务变量页：
   $ServiceUrl

2. 点击「环境变量」->「编辑原始环境变量」

3. 全选粘贴文件内容：
   $EnvFile

4. 保存后点击「重新部署 / Redeploy Service」

5. 约 60 秒后验收：
   .\scripts\verify-zeabur-deploy.ps1 `
     -WebUrl https://prompt-hub.zeabur.app `
     -ApiUrl https://prompt-hub-api.zeabur.app

若已设置 ZEABUR_TOKEN，可自动写入并重启：
   .\scripts\apply-zeabur-api-env.ps1 -UseGraphql

仅更新发信变量（SMTP / Zeabur Email）：
   .\scripts\apply-zeabur-smtp.ps1

Google 一键登录（API + website 双服务，需 ZEABUR_TOKEN）：
   .\scripts\apply-zeabur-admin-google.ps1 -ClientId "<id>.apps.googleusercontent.com" -AdminEmail "you@gmail.com" -EnvId "<env-id>"

"@ -ForegroundColor Cyan
