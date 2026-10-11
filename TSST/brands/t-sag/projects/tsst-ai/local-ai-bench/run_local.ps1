<# Run bench tasks on a LOCAL Ollama model through headless Claude Code (read-only tools).
   Usage: powershell -File run_local.ps1 [-Tasks T1,T2,T3,T4,T5] [-Model qwen3-14b-32k]
   Context method that works: Modelfile variant (Modelfile.qwen3-14b-32k -> `ollama create qwen3-14b-32k -f ...`,
   PARAMETER num_ctx 32768). Ollama server keeps running unchanged. #>
param([string[]]$Tasks = @('T1','T2','T3','T4','T5'), [string]$Model = 'qwen3-14b-32k', [int]$TimeoutSec = 600)
$Tasks = @($Tasks | ForEach-Object { $_ -split ',' })   # -File passes 'T1,T2' as one string
. "$PSScriptRoot\common.ps1"
Initialize-T3Input
Clear-ClaudeEnv
$env:ANTHROPIC_BASE_URL   = 'http://localhost:11434'
$env:ANTHROPIC_AUTH_TOKEN = 'ollama'
$env:ANTHROPIC_API_KEY    = ''
$env:CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC = '1'
# VRAM sampler (every 3 s) in the background
$vram = Join-Path $Out 'vram_local.csv'
'ts,mem_used_mib,gpu_util' | Set-Content $vram
$sampler = Start-Job -ArgumentList $vram -ScriptBlock {
    param($f) while ($true) { $r = nvidia-smi --query-gpu=memory.used,utilization.gpu --format=csv,noheader,nounits; Add-Content $f ("{0},{1}" -f (Get-Date -Format o), ($r -replace '\s','')); Start-Sleep 3 } }
try {
    foreach ($t in $Tasks) {
        Invoke-BenchTask -Task $t -Model $Model -Tag 'local' -TimeoutSec $TimeoutSec
        (ollama ps) | Out-File -Append -Encoding utf8 (Join-Path $Out 'ollama_ps_local.txt')
    }
} finally { Stop-Job $sampler; Remove-Job $sampler -Force }
