# crm-cleanup.ps1 -- CRM lane cleanup (prepared 2026-10-11 by DEV_AG). RUN BY AHMED ONLY.
#
# BACKUP LOCATION (already created and verified): C:\Work\backup\crm-cleanup-2026-10-11\
#   crm-lanes-and-stash.bundle          git bundle: the 10 lane branches + stash@{0} (git bundle verify = okay)
#   stash0-read-excel-file.patch        stash@{0} as a patch (+ .sha256; stash commit 7a8e31992cf9895555f7e03a525149abb4e6ae41)
#   worktree-files\<worktree>\...       untracked/ignored files of each worktree (no node_modules/.next/dist)
#
# Restore a branch:  git fetch "C:\Work\backup\crm-cleanup-2026-10-11\crm-lanes-and-stash.bundle" feat/crm-xxx:feat/crm-xxx
# Restore the stash: git stash apply  (from the patch)  ->  git apply C:\Work\backup\crm-cleanup-2026-10-11\stash0-read-excel-file.patch
#
# Does NOT touch: feat/crm-mvp-ui, C:/Work/tsst-crm-mvp. Never uses --force. Stops on the first error.
# Usage:  powershell -ExecutionPolicy Bypass -File "G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\handoffs\repo-cleanup\crm-cleanup.ps1"

$ErrorActionPreference = 'Stop'
$Repo   = 'G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS'
$Backup = 'C:\Work\backup\crm-cleanup-2026-10-11'
$Base   = 'origin/feat/crm-mvp-ui'
$StashSha = '7a8e31992cf9895555f7e03a525149abb4e6ae41'

# Run git against the repo; abort on any non-zero exit.
function Git {
    # Windows PowerShell 5.1 turns git's normal stderr progress into a terminating error under 'Stop';
    # rely on the exit code instead.
    $ErrorActionPreference = 'Continue'
    & git.exe -C $Repo @args 2>&1 | ForEach-Object { "$_" }
    if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed (exit $LASTEXITCODE)" }
}
function GitQuiet {   # returns exit code, never throws (for yes/no checks)
    $ErrorActionPreference = 'Continue'
    & git.exe -C $Repo @args *> $null
    return $LASTEXITCODE
}

# Branches that passed step 1 (is-ancestor of origin/feat/crm-mvp-ui) -- re-checked below before deleting.
$Branches = @(
    'feat/crm-charts', 'feat/crm-ec2', 'feat/crm-import', 'feat/crm-p1b', 'feat/crm-review-fix1',
    'feat/crm-review-fix2', 'feat/crm-server-search', 'feat/crm-ui-migration',
    'feat/crm-v3-dashboard', 'feat/crm-v3-nav-import'
)
# Worktrees clean in tracked files (git status --porcelain, step 4).
$Worktrees = @(
    'C:/Work/tsst-crm-codex', 'C:/Work/tsst-crm-lanes/charts', 'C:/Work/tsst-crm-lanes/dash',
    'C:/Work/tsst-crm-lanes/ec2', 'C:/Work/tsst-crm-lanes/import', 'C:/Work/tsst-crm-p1b'
)

Write-Host '== 0. Safety checks =='
if (-not (Test-Path "$Backup\crm-lanes-and-stash.bundle")) { throw 'Backup bundle missing - aborting.' }
Git bundle verify "$Backup\crm-lanes-and-stash.bundle"
foreach ($b in $Branches) {
    if ((GitQuiet merge-base --is-ancestor $b $Base) -ne 0) { throw "$b is NOT an ancestor of $Base - aborting." }
}
Write-Host 'All 10 branches are ancestors of' $Base

Write-Host '== 1. Remove clean worktrees (no --force) =='
# C:/Work/tsst-crm-p1b has one untracked file (SESSION_BRIEF_P1B.md) which makes a plain
# "git worktree remove" refuse. It is backed up; remove the original only if the backup copy is identical.
$p1bFile = 'C:\Work\tsst-crm-p1b\SESSION_BRIEF_P1B.md'
$p1bCopy = "$Backup\worktree-files\tsst-crm-p1b\SESSION_BRIEF_P1B.md"
if (Test-Path $p1bFile) {
    if (-not (Test-Path $p1bCopy)) { throw 'Backup copy of SESSION_BRIEF_P1B.md missing - aborting.' }
    if ((Get-FileHash $p1bFile).Hash -ne (Get-FileHash $p1bCopy).Hash) { throw 'SESSION_BRIEF_P1B.md differs from backup - aborting.' }
    Remove-Item -LiteralPath $p1bFile
}
foreach ($wt in $Worktrees) {
    Write-Host "removing worktree $wt"
    Git worktree remove $wt
}

Write-Host '== 2. Delete merged lane branches =='
foreach ($b in $Branches) {
    Git branch -D $b
}

Write-Host '== 3. Drop obsolete stash =='
# Obsolete: origin/feat/crm-mvp-ui:CRM_APP/package.json already has read-excel-file 9.3.10 and the lockfile entries match.
$cur = (& git.exe -C $Repo rev-parse 'stash@{0}').Trim()
if ($cur -ne $StashSha) { throw "stash@{0} is $cur, expected $StashSha - not dropping." }
Git stash drop 'stash@{0}'

Write-Host '== 4. Prune =='
Git worktree prune

Write-Host '== 5. Result =='
Git branch -vv
Git worktree list
Git stash list
Write-Host 'Done.'
