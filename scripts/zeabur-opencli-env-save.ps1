#Requires -Version 5.1
# 在已登录 Zeabur 的 opencli 浏览器会话中：打开服务页 → 环境变量 → 粘贴 website env → 保存
param(
  [string] $ServiceUrl = 'https://zeabur.com/projects/6a217e0af1be9943f1f8d8e7/services/6a217e12e957fb053c54de78?envID=6a217e0a95b39806d284a647',
  [string] $EnvFile = (Join-Path $PSScriptRoot '..\output\zeabur-website.env')
)

$ErrorActionPreference = 'Stop'
$envText = (Get-Content $EnvFile -Raw).TrimEnd()

$out = opencli browser --session browser:default tab new $ServiceUrl 2>&1 | Out-String
if ($out -notmatch '"page":\s*"([^"]+)"') { throw "无法创建 tab: $out" }
$tab = $Matches[1]
Write-Host "tab=$tab"
Start-Sleep -Seconds 12

opencli browser --session browser:default click --tab $tab --role tab --name '环境变量' | Out-Null
Start-Sleep -Seconds 2
opencli browser --session browser:default click --tab $tab --name '编辑原始环境变量' | Out-Null
Start-Sleep -Seconds 1
opencli browser --session browser:default fill --tab $tab 127 $envText | Out-Null
Start-Sleep -Seconds 1
opencli browser --session browser:default click --tab $tab 131 | Out-Null
Write-Host 'Env saved. Redeploy the website service in Zeabur dashboard.'
