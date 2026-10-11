<# Run the same bench tasks on Haiku via the normal Anthropic backend, same read-only tools/flags.
   Usage: powershell -File run_haiku.ps1 [-Tasks T1,...] [-Model haiku] #>
param([string[]]$Tasks = @('T1','T2','T3','T4','T5'), [string]$Model = 'haiku', [int]$TimeoutSec = 600)
$Tasks = @($Tasks | ForEach-Object { $_ -split ',' })   # -File passes 'T1,T2' as one string
. "$PSScriptRoot\common.ps1"
Initialize-T3Input
# NOTE: do NOT scrub CLAUDE_CODE_*/ANTHROPIC_* here: auth for the real backend may come from them.
foreach ($t in $Tasks) { Invoke-BenchTask -Task $t -Model $Model -Tag 'haiku' -TimeoutSec $TimeoutSec }
