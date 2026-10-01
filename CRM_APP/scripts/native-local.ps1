param([Parameter(Mandatory=$true)][string]$PgBin)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$PgBin=(Resolve-Path -LiteralPath $PgBin).Path
if(Test-Path .env) { throw '.env already exists; refusing to replace credentials' }
$adminPassword=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$runtimePassword=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
New-Item -ItemType Directory -Force .local-postgres | Out-Null
$adminPassword | Set-Content -Encoding ascii .local-postgres/password
& "$PgBin/initdb.exe" -D .local-postgres/data -U postgres -A scram-sha-256 --pwfile=.local-postgres/password --encoding=UTF8 --locale=C
if($LASTEXITCODE -ne 0){throw 'initdb failed'}
# Loopback-only synthetic cluster; no Windows service or production database.
& "$PgBin/pg_ctl.exe" -D .local-postgres/data -l .local-postgres/server.log -o '-h 127.0.0.1 -p 55432' -w start
if($LASTEXITCODE -ne 0){throw 'PostgreSQL startup failed'}
$env:PGPASSWORD=$adminPassword
try { node --import tsx scripts/create-local-db.ts; if($LASTEXITCODE -ne 0){throw 'createdb failed'} } finally {Remove-Item Env:PGPASSWORD}
@"
POSTGRES_PASSWORD=$adminPassword
ADMIN_DATABASE_URL=postgresql://postgres:$adminPassword@127.0.0.1:55432/crm_m0
DATABASE_URL=postgresql://crm_runtime:$runtimePassword@127.0.0.1:55432/crm_m0
WORKER_CONTEXTS=[]
PORT=4317
"@ | Set-Content -Encoding utf8 .env
npm.cmd run migrate
if($LASTEXITCODE -ne 0){throw 'Migration failed'}
npm.cmd run seed
if($LASTEXITCODE -ne 0){throw 'Seed failed'}
