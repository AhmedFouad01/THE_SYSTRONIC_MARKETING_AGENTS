param([Parameter(Mandatory=$true)][string]$PgBin, [switch]$PrepareOnly)
$ErrorActionPreference='Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
$PgBin=(Resolve-Path -LiteralPath $PgBin).Path
if(Test-Path .env) { throw '.env already exists; refusing to replace credentials' }
# Bootstrap is intentionally fail-closed on retry. Never rotate persisted state.
if(Test-Path .local-postgres/data) {
    if(!(Test-Path -LiteralPath .local-postgres/password -PathType Leaf)) {
        throw 'Existing PostgreSQL data has incomplete credential/config state. Restore matching credentials and .env from backup; do not reinitialize or rotate the password.'
    }
    throw 'Existing PostgreSQL data/password preserved. Recover .env using the saved cluster password and continue the failed step manually; do not reinitialize or rotate credentials.'
}
if(Test-Path .local-postgres/password) {
    throw 'Prior bootstrap password preserved. Recover the matching configuration and continue manually; automatic credential replacement is refused.'
}
$adminPassword=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$runtimePassword=[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
New-Item -ItemType Directory -Force .local-postgres | Out-Null
$passwordFile=[IO.File]::Open((Join-Path (Get-Location) '.local-postgres/password'),[IO.FileMode]::CreateNew,[IO.FileAccess]::Write)
try { $bytes=[Text.Encoding]::ASCII.GetBytes($adminPassword+"`n"); $passwordFile.Write($bytes,0,$bytes.Length) } finally { $passwordFile.Dispose() }
# Persist the matching configuration before any database operation can fail.
@"
POSTGRES_PASSWORD=$adminPassword
ADMIN_DATABASE_URL=postgresql://postgres:$adminPassword@127.0.0.1:55432/crm_m0
DATABASE_URL=postgresql://crm_runtime:$runtimePassword@127.0.0.1:55432/crm_m0
WORKER_CONTEXTS=[]
PORT=4317
"@ | Set-Content -Encoding utf8 .env
if($PrepareOnly) { return } # Bounded filesystem verification; no database startup.
& "$PgBin/initdb.exe" -D .local-postgres/data -U postgres -A scram-sha-256 --pwfile=.local-postgres/password --encoding=UTF8 --locale=C
if($LASTEXITCODE -ne 0){throw 'initdb failed; credentials/.env preserved. Recover the failed step manually.'}
# Loopback-only synthetic cluster; no Windows service or production database.
& "$PgBin/pg_ctl.exe" -D .local-postgres/data -l .local-postgres/server.log -o '-h 127.0.0.1 -p 55432' -w start
if($LASTEXITCODE -ne 0){throw 'PostgreSQL startup failed; credentials/.env preserved. Recover the failed step manually.'}
$env:PGPASSWORD=$adminPassword
try { node --import tsx scripts/create-local-db.ts; if($LASTEXITCODE -ne 0){throw 'createdb failed'} } finally {Remove-Item Env:PGPASSWORD}
npm.cmd run migrate
if($LASTEXITCODE -ne 0){throw 'Migration failed'}
npm.cmd run seed
if($LASTEXITCODE -ne 0){throw 'Seed failed'}
