[CmdletBinding()]
param(
  [Parameter()]
  [ValidateRange(1, 65535)]
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

$nodeModules = Join-Path $PSScriptRoot "..\node_modules"
if (-not (Test-Path $nodeModules)) {
  Write-Error "node_modules was not found. Run pnpm install first."
  exit 1
}

$env:PORT = $Port
$url = "http://localhost:$Port"

Write-Host "Starting test server: $url" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor DarkGray

& pnpm dev --port $Port
exit $LASTEXITCODE
