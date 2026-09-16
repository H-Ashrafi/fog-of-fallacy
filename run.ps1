# Builds and starts the Fog of Fallacy server, serving the game from this folder.
# Usage:  .\run.ps1            (then open http://localhost:8787/)
#         $env:ELEVENLABS_API_KEY = "..." ; .\run.ps1     for recorded voices
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$env:FOG_WEB_DIR = $root
if (-not $env:PORT) { $env:PORT = '8787' }
Push-Location (Join-Path $root 'server')
try {
    cargo build --release
    if ($LASTEXITCODE -ne 0) { throw "cargo build failed" }
    & (Join-Path $root 'server\target\release\fog-server.exe')
}
finally { Pop-Location }
