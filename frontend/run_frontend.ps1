# Run the Vite dev server bound to 127.0.0.1:5173
# Usage: Right-click -> Run with PowerShell, or open PowerShell and run this script.
# This script forces IPv4 binding to avoid IPv6-only binding and ensures the printed URL
# is reachable in a normal browser at http://127.0.0.1:5173/

Set-Location -LiteralPath "${PWD}\..\frontend" -ErrorAction SilentlyContinue
if (!(Test-Path package.json)) {
    # If the script was invoked from the frontend dir already, switch to it
    Set-Location -LiteralPath (Join-Path (Get-Location) '')
}
Write-Host "Starting Vite dev server in: $(Get-Location)" -ForegroundColor Cyan
Write-Host "If you see an execution policy error, re-run using cmd.exe: cmd /c 'npm run dev -- --host 127.0.0.1 --port 5173'"

# Start Vite on IPv4 loopback and fixed port
npm run dev -- --host 127.0.0.1 --port 5173
