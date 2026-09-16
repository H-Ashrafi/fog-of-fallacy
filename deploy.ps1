# Deploys the game to the BinaryLane server (fog.hymma.au).
# Packs the working tree (no .git, no build output) into a tarball, copies it over scp,
# rebuilds the Rust server there only if server sources changed, and restarts the service.
# Usage:  .\deploy.ps1            requires ssh access as root@203.29.240.210 (key: ~/.ssh/id_ed25519)
$ErrorActionPreference = 'Stop'
$host_ = 'root@203.29.240.210'
$remote = '/opt/fog-of-fallacy'
$root = $PSScriptRoot
$tmp = Join-Path ([IO.Path]::GetTempPath()) 'fog-deploy.tgz'
$key = Join-Path $HOME '.ssh\id_ed25519'
$sshOpts = @('-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-i', $key)

Write-Host "Packing..."
Push-Location $root
try {
    if (Test-Path $tmp) { Remove-Item $tmp -Force }
    & tar.exe --exclude=./.git --exclude=./server/target --exclude=./.playwright-mcp --exclude=./run.ps1 --exclude=./deploy.ps1 -czf $tmp .
    if ($LASTEXITCODE -ne 0) { throw "tar failed" }
}
finally { Pop-Location }

Write-Host "Uploading $([math]::Round((Get-Item $tmp).Length / 1KB)) KB..."
& scp @sshOpts -q $tmp "${host_}:/tmp/fog-deploy.tgz"
if ($LASTEXITCODE -ne 0) { throw "scp failed" }

Write-Host "Unpacking, building (only if server sources changed) and restarting..."
& ssh @sshOpts $host_ "mkdir -p $remote && tar -xzf /tmp/fog-deploy.tgz -C $remote && rm -f /tmp/fog-deploy.tgz && cd $remote/server && nice -n 19 ionice -c3 /root/.cargo/bin/cargo build --release -j 1 2>&1 | tail -2 && systemctl restart fog-server && sleep 1 && systemctl is-active fog-server && curl -s http://127.0.0.1:8787/api/health"
if ($LASTEXITCODE -ne 0) { throw "remote unpack, build or restart failed" }
Remove-Item $tmp -Force
Write-Host "`nDeployed: https://fog.hymma.au/"
