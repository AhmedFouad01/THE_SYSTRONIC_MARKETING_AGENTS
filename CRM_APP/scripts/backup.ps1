param([string]$Destination = 'backups/m0.dump')
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
New-Item -ItemType Directory -Force (Split-Path $Destination -Parent) | Out-Null
docker compose exec -T postgres pg_dump -U postgres -d crm_m0 -Fc -f /tmp/m0.dump
if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed' }
docker compose cp postgres:/tmp/m0.dump $Destination
if ($LASTEXITCODE -ne 0) { throw 'Backup copy failed' }
