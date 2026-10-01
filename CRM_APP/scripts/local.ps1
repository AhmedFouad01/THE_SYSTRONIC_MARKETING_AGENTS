$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
if (Test-Path .env) { throw '.env already exists; preserve it and follow README commands.' }
function New-LocalSecret { [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) }
$adminPassword = New-LocalSecret
$runtimePassword = New-LocalSecret
@"
POSTGRES_PASSWORD=$adminPassword
ADMIN_DATABASE_URL=postgresql://postgres:$adminPassword@127.0.0.1:55432/crm_m0
DATABASE_URL=postgresql://crm_runtime:$runtimePassword@127.0.0.1:55432/crm_m0
WORKER_CONTEXTS=[]
PORT=4317
"@ | Set-Content -Encoding utf8 .env
docker compose up -d --wait
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL startup failed; generated .env preserved.' }
npm.cmd run migrate
if ($LASTEXITCODE -ne 0) { throw 'Migration failed' }
npm.cmd run seed
if ($LASTEXITCODE -ne 0) { throw 'Seed failed' }
