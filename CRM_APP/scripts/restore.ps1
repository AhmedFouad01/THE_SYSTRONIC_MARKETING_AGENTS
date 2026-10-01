param([string]$Source = 'backups/m0.dump', [string]$Database = 'crm_m0_restore')
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if ($Database -notmatch '^crm_m0_restore[a-z0-9_]*$') { throw 'Restore target must be a new crm_m0_restore* database' }
docker compose exec -T postgres createdb -U postgres $Database
if ($LASTEXITCODE -ne 0) { throw 'New database required; refusing to overwrite' }
docker compose cp $Source postgres:/tmp/m0-restore.dump
if ($LASTEXITCODE -ne 0) { throw 'Restore copy failed' }
docker compose exec -T postgres pg_restore -U postgres -d $Database --exit-on-error /tmp/m0-restore.dump
if ($LASTEXITCODE -ne 0) { throw 'Restore failed' }
# Same local cluster already has crm_runtime. A fresh cluster must provision that
# NOSUPERUSER/NOBYPASSRLS role separately; pg_dump does not contain role secrets.
