#Requires -Version 5.1
<#
.SYNOPSIS
  生成 Zeabur API / website 管理员 Google 登录所需环境变量片段（复制到控制台）。

.EXAMPLE
  .\scripts\zeabur-admin-google-env.ps1 -ClientId "xxx.apps.googleusercontent.com" -AdminEmail "you@gmail.com"
#>
param(
  [Parameter(Mandatory = $true)]
  [string] $ClientId,

  [Parameter(Mandatory = $true)]
  [string] $AdminEmail,

  [string] $WebHost = '',
  [string] $ApiHost = ''
)

$email = $AdminEmail.Trim().ToLowerInvariant()
$cid = $ClientId.Trim()

Write-Host "`n=== 粘贴到 Zeabur API 服务 → 变量 ===" -ForegroundColor Cyan
@"

GOOGLE_CLIENT_ID=$cid
ADMIN_EMAILS=$email
"@ | Write-Host

Write-Host "`n=== 粘贴到 Zeabur website 服务 → 变量 ===" -ForegroundColor Cyan
@"

NEXT_PUBLIC_GOOGLE_CLIENT_ID=$cid
"@ | Write-Host

if ($WebHost) {
  Write-Host "`nGoogle Console → Authorized JavaScript origins:" -ForegroundColor Yellow
  Write-Host "  https://$($WebHost.Trim().TrimStart('https://').TrimEnd('/'))"
}

if ($WebHost -and $ApiHost) {
  $web = $WebHost.Trim().TrimStart('https://').TrimEnd('/')
  $api = $ApiHost.Trim().TrimStart('https://').TrimEnd('/')
  Write-Host ''
  Write-Host ('Login: https://{0}/account' -f $web)
  Write-Host ('Admin: https://{0}/admin' -f $web)
  Write-Host 'Redeploy API and website after env changes.' -ForegroundColor Yellow
  Write-Host ('Verify: .\scripts\verify-zeabur-admin.ps1 -ApiUrl https://{0} -WebUrl https://{1}' -f $api, $web)
}

Write-Host ''
