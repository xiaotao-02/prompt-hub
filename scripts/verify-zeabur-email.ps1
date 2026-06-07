#Requires -Version 5.1
<#
.SYNOPSIS
  验收 Zeabur 生产 API 邮箱验证码发送（与插件/官网账户页一致）。

.EXAMPLE
  .\scripts\verify-zeabur-email.ps1 -ApiUrl https://prompt-hub-api.zeabur.app -Email you@gmail.com
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $ApiUrl,

  [Parameter(Mandatory = $true)]
  [string] $Email
)

$ErrorActionPreference = 'Stop'
$apiBase = $ApiUrl.TrimEnd('/')
$body = @{ email = $Email } | ConvertTo-Json

Write-Host "POST $apiBase/v1/auth/email/code/send" -ForegroundColor Cyan
try {
  $r = Invoke-RestMethod -Method POST -Uri "$apiBase/v1/auth/email/code/send" `
    -ContentType 'application/json' -Body $body -TimeoutSec 45
  if ($r.ok) {
    Write-Host '[OK] Email code send accepted (check inbox for 6-digit code).' -ForegroundColor Green
    exit 0
  }
  Write-Host "[FAIL] Unexpected response: $($r | ConvertTo-Json -Compress)" -ForegroundColor Red
  exit 1
} catch {
  $detail = $_.ErrorDetails.Message
  if (-not $detail -and $_.Exception.Response) {
    $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    $detail = $reader.ReadToEnd()
    $reader.Close()
  }
  Write-Host "[FAIL] $($_.Exception.Message)" -ForegroundColor Red
  if ($detail) { Write-Host $detail -ForegroundColor DarkRed }
  exit 1
}
