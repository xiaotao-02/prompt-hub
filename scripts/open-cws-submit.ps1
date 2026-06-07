# Open Chrome Web Store devconsole and local listing assets for manual submit.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$version = (Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).version
$zip = Join-Path $root "dist-zip\store\prompt-hub-store-v$version.zip"

Write-Host "CWS submit helper — v$version"
Write-Host "Zip: $zip"

if (-not (Test-Path $zip)) {
  Write-Host 'Zip missing. Run: npm run release:store' -ForegroundColor Yellow
}

Start-Process 'https://chrome.google.com/webstore/devconsole'

if (Test-Path $zip) {
  Start-Process 'explorer.exe' -ArgumentList "/select,`"$zip`""
}

Start-Process 'explorer.exe' -ArgumentList (Join-Path $root 'store-assets\promo')
Start-Process 'explorer.exe' -ArgumentList (Join-Path $root 'store-assets\screenshots')

$listing = Join-Path $root 'store-listing'
@(
  'name.txt',
  'summary.zh.txt',
  'summary.en.txt',
  'description.zh.md',
  'description.en.md',
  'category.txt',
  'single-purpose.zh.md',
  'permission-justifications.md',
  'data-usage-disclosure.md',
  'privacy-policy-url.txt'
) | ForEach-Object {
  $path = Join-Path $listing $_
  if (Test-Path $path) { Start-Process 'notepad.exe' $path }
}

Write-Host ''
Write-Host 'Manual steps: Store listing -> Privacy practices -> Upload zip -> Submit for review'
Write-Host 'See store-listing/CHECKLIST.md for field mapping.'
