# Add Cursor install + data folders to Windows Defender exclusions (requires Administrator).
# Helps reduce Agent timeout / stuck state from real-time scanning.

#Requires -RunAsAdministrator

$paths = @(
  "$env:LOCALAPPDATA\Programs\cursor",
  "$env:APPDATA\Cursor"
)

foreach ($path in $paths) {
  if (Test-Path $path) {
    Add-MpPreference -ExclusionPath $path
    Write-Host "Excluded: $path"
  } else {
    Write-Host "Skip (not found): $path"
  }
}

Write-Host 'Defender exclusions applied. Restart Cursor if Agent was unstable.'
