# Stop lingering dev servers started by Cursor Agent (npm run dev, astro, vite).
# Run before closing Cursor if you see "Agent is still working".

$ErrorActionPreference = 'SilentlyContinue'
$ports = 4321, 4322, 5173, 5174, 3000

Write-Host 'Killing processes on common dev ports...'
foreach ($port in $ports) {
  $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) {
    if ($procId -and $procId -ne 0) {
      Stop-Process -Id $procId -Force
      Write-Host "  Port $port -> killed PID $procId"
    }
  }
}

Write-Host 'Done. In Cursor: Ctrl+Shift+P -> Terminal: Kill All Terminals, then try closing again.'
