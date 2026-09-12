$basedir = Split-Path -Parent $PSScriptRoot
$pnpmNext = Join-Path $basedir "node_modules\.pnpm\next@15.5.25_@types+node@22_dcc1b0346cb7dd813f982ff9bc388147\node_modules"
$env:NODE_PATH = "$pnpmNext\next\node_modules;$pnpmNext;E:\pms2\node_modules\.pnpm\node_modules"
$nextCli = Join-Path $pnpmNext "next\dist\bin\next"

Write-Host "Starting Next.js dev server on http://localhost:3000..." -ForegroundColor Cyan
& node $nextCli dev
