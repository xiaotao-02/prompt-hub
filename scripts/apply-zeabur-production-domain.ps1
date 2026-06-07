#Requires -Version 5.1
<#
.SYNOPSIS
  为 aipromptstudio.top 绑定 Zeabur 自定义域名、更新双服务环境变量并重启。

.DESCRIPTION
  1) GraphQL addDomain：website → aipromptstudio.top；api → api.aipromptstudio.top
  2) 将 output/zeabur-production-domain.env 合并进 zeabur-api.env / zeabur-website.env 并写入 Zeabur
  3) 打印 DNS 解析说明（须在域名注册商控制台手动添加）

.EXAMPLE
  $env:ZEABUR_TOKEN = '<Zeabur API Key>'
  .\scripts\apply-zeabur-production-domain.ps1

.EXAMPLE
  .\scripts\apply-zeabur-production-domain.ps1 -BindDomainsOnly
#>
param(
  [string] $ZeaburToken = $env:ZEABUR_TOKEN,
  [string] $WebsiteServiceId = '6a217e12e957fb053c54de78',
  [string] $ApiServiceId = '6a21c8d42fe98e0879e0863d',
  [string] $EnvironmentId = '6a217e0a95b39806d284a647',
  [string] $RootDomain = 'aipromptstudio.top',
  [string] $ApiDomain = 'api.aipromptstudio.top',
  [string] $ApiPatchFile = (Join-Path $PSScriptRoot '..\output\zeabur-api-domain.env'),
  [string] $WebsitePatchFile = (Join-Path $PSScriptRoot '..\output\zeabur-website-domain.env'),
  [string] $ApiEnvFile = (Join-Path $PSScriptRoot '..\output\zeabur-api.env'),
  [string] $WebsiteEnvFile = (Join-Path $PSScriptRoot '..\output\zeabur-website.env'),
  [switch] $BindDomainsOnly,
  [switch] $SkipBindDomains
)

$ErrorActionPreference = 'Stop'

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

function Merge-EnvPatch {
  param([string]$TargetFile, [string]$PatchPath)
  if (-not (Test-Path $PatchPath)) { return }
  $patch = Get-Content $PatchPath | Where-Object { $_ -match '^\s*[^#]' -and $_ -match '=' }
  $map = @{}
  if (Test-Path $TargetFile) {
    foreach ($line in Get-Content $TargetFile) {
      if ($line -match '^\s*#' -or $line -notmatch '=') { continue }
      $idx = $line.IndexOf('=')
      $map[$line.Substring(0, $idx).Trim()] = $line.Substring($idx + 1)
    }
  }
  foreach ($line in $patch) {
    $idx = $line.IndexOf('=')
    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1).Trim()
    $map[$k] = $v
  }
  $out = @()
  foreach ($kv in $map.GetEnumerator() | Sort-Object Name) {
    $out += "$($kv.Name)=$($kv.Value)"
  }
  $dir = Split-Path $TargetFile -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  if ($map.Count -lt 8 -and $TargetFile -match 'zeabur-api\.env$') {
    Write-Host "  [WARN] $TargetFile 变量过少（$($map.Count)），请从 gen:secrets 恢复完整 env 后再合并域名片段" -ForegroundColor Yellow
    return
  }
  Set-Content -Path $TargetFile -Value ($out -join "`n") -Encoding utf8
  Write-Host "  merged -> $TargetFile ($($map.Count) keys)" -ForegroundColor DarkGray
}

function Add-ZeaburDomain {
  param([string]$ServiceId, [string]$Domain)
  $d = $Domain -replace '"', ''
  $q = @"
mutation {
  addDomain(
    serviceID: "$ServiceId"
    environmentID: "$EnvironmentId"
    domain: "$d"
    isGenerated: false
  ) { domain dnsRecords { type name value } }
}
"@
  try {
    $r = Invoke-ZeaburGql -Query $q
    Write-Host "[OK] addDomain $Domain on service $ServiceId" -ForegroundColor Green
    if ($r.data.addDomain.dnsRecords) {
      $r.data.addDomain.dnsRecords | ForEach-Object {
        Write-Host "     DNS: $($_.type) $($_.name) -> $($_.value)" -ForegroundColor DarkCyan
      }
    }
  } catch {
    Write-Host "[WARN] addDomain $Domain : $_" -ForegroundColor Yellow
  }
}

Write-Host '=== aipromptstudio.top 生产域名 ===' -ForegroundColor Cyan

if (-not $SkipBindDomains) {
  if (-not $ZeaburToken) {
    Write-Host @"

未设置 ZEABUR_TOKEN，跳过 GraphQL 绑定域名。
请手动在 Zeabur 控制台操作：
  website 服务 -> 域名 -> 自定义域名 -> $RootDomain
  api 服务     -> 域名 -> 自定义域名 -> $ApiDomain
复制 Zeabur 显示的 DNS 记录到域名注册商解析面板。

设置 API Key 后可自动绑定：
  `$env:ZEABUR_TOKEN = '...'; .\scripts\apply-zeabur-production-domain.ps1

"@ -ForegroundColor Yellow
  } else {
    Write-Host 'Binding custom domains via GraphQL...' -ForegroundColor Cyan
    Add-ZeaburDomain -ServiceId $WebsiteServiceId -Domain $RootDomain
    Add-ZeaburDomain -ServiceId $ApiServiceId -Domain $ApiDomain
  }
}

Write-Host @"

=== 域名注册商 DNS（在 Zeabur 绑定后按控制台显示为准）===

  主机记录 @     -> Zeabur 为 website 给出的 CNAME 或 A（根域常见需 A 记录）
  主机记录 api   -> Zeabur 为 api 服务给出的 CNAME 目标（如 *.clusters.zeabur.com）
  可选 www      -> 与 @ 相同目标，或在 Zeabur 再绑 www.$RootDomain

生效后访问：
  https://$RootDomain
  https://$ApiDomain/health

"@ -ForegroundColor Cyan

if ($BindDomainsOnly) { exit 0 }

Merge-EnvPatch -TargetFile $ApiEnvFile -PatchPath $ApiPatchFile
Merge-EnvPatch -TargetFile $WebsiteEnvFile -PatchPath $WebsitePatchFile

if (-not $ZeaburToken) {
  Write-Host @"

已合并本地 env 片段。请手动：
  1) 将 $ApiEnvFile 粘贴到 API 服务变量并 Redeploy
  2) 将 $WebsiteEnvFile 粘贴到 website 服务变量并 Redeploy
  3) .\scripts\verify-zeabur-deploy.ps1 -WebUrl https://$RootDomain -ApiUrl https://$ApiDomain

"@ -ForegroundColor Yellow
  exit 0
}

Write-Host 'Applying API env...' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'apply-zeabur-api-env-graphql.ps1') -EnvFile $ApiEnvFile -ServiceId $ApiServiceId -EnvironmentId $EnvironmentId -ZeaburToken $ZeaburToken
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Applying website env...' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'apply-zeabur-website-env-graphql.ps1') -EnvFile $WebsiteEnvFile -ServiceId $WebsiteServiceId -EnvironmentId $EnvironmentId -ZeaburToken $ZeaburToken
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Waiting 60s for redeploy...' -ForegroundColor Yellow
Start-Sleep -Seconds 60
& (Join-Path $PSScriptRoot 'verify-zeabur-deploy.ps1') -WebUrl "https://$RootDomain" -ApiUrl "https://$ApiDomain"
exit $LASTEXITCODE
