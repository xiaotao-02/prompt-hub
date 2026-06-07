#Requires -Version 5.1
<#
.SYNOPSIS
  将 SMTP / Zeabur Email 变量写入 Zeabur API 服务并重启。

.DESCRIPTION
  从 output/zeabur-smtp.env（优先）或 -EnvFile 读取发信变量，通过 GraphQL 批量更新。
  需设置 ZEABUR_TOKEN（Zeabur Dashboard -> Settings -> API Keys）。

.EXAMPLE
  # 1. 复制模板并填写 Gmail 应用专用密码
  Copy-Item output\zeabur-smtp.env.example output\zeabur-smtp.env
  # 2. 编辑 output\zeabur-smtp.env 填入 SMTP_PASS
  $env:ZEABUR_TOKEN = '<token>'
  .\scripts\apply-zeabur-smtp.ps1
#>
param(
  [string] $EnvFile = '',
  [string] $ServiceId = '6a21c8d42fe98e0879e0863d',
  [string] $EnvironmentId = '6a217e0a95b39806d284a647',
  [string] $ZeaburToken = $env:ZEABUR_TOKEN,
  [switch] $DryRun
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path $PSScriptRoot -Parent

if (-not $EnvFile) {
  $preferred = Join-Path $repoRoot 'output\zeabur-smtp.env'
  $fallback = Join-Path $repoRoot 'output\zeabur-api.env'
  if (Test-Path $preferred) { $EnvFile = $preferred }
  elseif (Test-Path $fallback) { $EnvFile = $fallback }
  else {
    Write-Error "Missing output\zeabur-smtp.env — copy output\zeabur-smtp.env.example and fill SMTP_PASS or ZSEND_API_KEY."
  }
}

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing $EnvFile"
}

$mailKeys = @(
  'EMAIL_FROM', 'EMAIL_DEV_LOG',
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS',
  'ZSEND_API_KEY', 'ZSEND_FROM'
)

$lines = Get-Content $EnvFile | Where-Object {
  $_ -match '^\s*[^#]' -and $_ -match '='
}

$mailLines = foreach ($line in $lines) {
  if ($line -match '^\s*#') { continue }
  $idx = $line.IndexOf('=')
  if ($idx -lt 1) { continue }
  $key = $line.Substring(0, $idx).Trim()
  if ($mailKeys -contains $key) { $line }
}

if ($mailLines.Count -eq 0) {
  Write-Error "No mail variables ($($mailKeys -join ', ')) found in $EnvFile"
}

$hasSmtp = $false
$hasZsend = $false
foreach ($line in $mailLines) {
  if ($line -match '^SMTP_PASS=(.+)$' -and $Matches[1].Trim() -and $Matches[1] -notmatch '^<') {
    $hasSmtp = $true
  }
  if ($line -match '^ZSEND_API_KEY=(.+)$' -and $Matches[1].Trim() -and $Matches[1] -notmatch '^<') {
    $hasZsend = $true
  }
}

if ($DryRun) {
  Write-Host "Dry run — would apply $($mailLines.Count) variables from $EnvFile :" -ForegroundColor Cyan
  $mailLines | ForEach-Object { Write-Host "  $_" }
  exit 0
}

if (-not $hasSmtp -and -not $hasZsend) {
  Write-Error @"
No outbound mail credentials in $EnvFile.
  - Gmail: set SMTP_PASS to a Google App Password (https://myaccount.google.com/apppasswords)
  - Zeabur Email: set ZSEND_API_KEY (https://zeabur.com/email) and ZSEND_FROM to a verified sender
"@
}

if (-not $ZeaburToken) {
  Write-Error 'Set ZEABUR_TOKEN (Zeabur Dashboard -> Settings -> API Keys).'
}

$tempFile = Join-Path $env:TEMP "zeabur-smtp-apply-$([Guid]::NewGuid().ToString('n')).env"
$mailLines | Set-Content -Path $tempFile -Encoding utf8

try {
  & (Join-Path $PSScriptRoot 'apply-zeabur-api-env-graphql.ps1') `
    -EnvFile $tempFile `
    -ServiceId $ServiceId `
    -EnvironmentId $EnvironmentId `
    -ZeaburToken $ZeaburToken
  exit $LASTEXITCODE
} finally {
  Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
}
