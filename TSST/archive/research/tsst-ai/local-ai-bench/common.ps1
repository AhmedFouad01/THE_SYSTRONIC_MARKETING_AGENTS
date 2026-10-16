# Shared helper for run_local.ps1 / run_haiku.ps1. Read-only: writes only inside the bench folder.
$ErrorActionPreference = 'Stop'
$script:Bench = $PSScriptRoot
$script:Repo  = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..\..\..')).Path   # repo root
$script:Out   = Join-Path $Bench 'out'
New-Item -ItemType Directory -Force $Out | Out-Null

function Initialize-T3Input {
    # Reader has no shell, so we pre-generate the diff it will Read.
    $f = Join-Path $Out 'T3_input.diff'
    Push-Location $Repo
    try { git diff -- TSST/bus/bus.py | Out-File -Encoding utf8 $f } finally { Pop-Location }
}

function Clear-ClaudeEnv {
    # Scrub the parent Claude/Anthropic session env so each run starts from a known state.
    Get-ChildItem Env: | Where-Object { $_.Name -like 'CLAUDE_CODE_*' -or $_.Name -like 'ANTHROPIC_*' } |
        ForEach-Object { Remove-Item "Env:$($_.Name)" -ErrorAction SilentlyContinue }
}

function Invoke-BenchTask {
    param([string]$Task, [string]$Model, [string]$Tag, [int]$TimeoutSec = 600)
    $prompt = Join-Path $Bench "tasks\$Task.md"
    $json   = Join-Path $Out "${Task}_$Tag.json"
    $md     = Join-Path $Out "${Task}_$Tag.md"
    $err    = Join-Path $Out "${Task}_$Tag.stderr.txt"
    $args = @('-p','--model',$Model,'--output-format','json','--safe-mode','--no-session-persistence',
              '--tools','Read,Grep,Glob','--allowedTools','Read,Grep,Glob',
              '--disallowedTools','Edit,Write,Bash,PowerShell,NotebookEdit,WebFetch,WebSearch,Task,Agent',
              '--permission-mode','dontAsk')
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $p = Start-Process -FilePath (Get-Command claude.cmd).Source -ArgumentList $args -WorkingDirectory $Repo `
         -RedirectStandardInput $prompt -RedirectStandardOutput $json -RedirectStandardError $err -NoNewWindow -PassThru
    $timedOut = $false
    if (-not $p.WaitForExit($TimeoutSec * 1000)) {
        $timedOut = $true
        & taskkill /PID $p.Id /T /F | Out-Null
    }
    $sw.Stop()
    $secs = [math]::Round($sw.Elapsed.TotalSeconds, 1)
    $turns = ''; $result = ''; $isErr = ''
    try {
        $j = Get-Content $json -Raw | ConvertFrom-Json
        $result = [string]$j.result; $turns = $j.num_turns; $isErr = $j.is_error
    } catch { $result = "[no parsable JSON output; see $json / $err]" }
    if ($timedOut) { $result = "[TIMEOUT after $TimeoutSec s]`n" + $result }
    Set-Content -Encoding utf8 $md $result
    $line = "$Task,$Tag,$Model,$secs,$turns,$isErr,$timedOut"
    if (-not (Test-Path (Join-Path $Out 'timings.csv'))) { 'task,tag,model,wall_s,num_turns,is_error,timed_out' | Set-Content (Join-Path $Out 'timings.csv') }
    Add-Content (Join-Path $Out 'timings.csv') $line
    Write-Host $line
}
