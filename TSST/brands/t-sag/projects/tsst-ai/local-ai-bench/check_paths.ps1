# Extract repo-relative paths cited in out/<task>_<tag>.md and Test-Path each one. Writes out/path_check.csv
. "$PSScriptRoot\common.ps1"
$rx = '(?<![\w/])((?:TSST|\.claude)/[^\s`|*,;:()\[\]"''<>]+)'
$rows = foreach ($f in Get-ChildItem $Out -Filter 'T?_*.md') {
    $name = $f.BaseName -split '_'; $task=$name[0]; $tag=$name[1]
    $txt = Get-Content $f.FullName -Raw
    $paths = [regex]::Matches($txt, $rx) | ForEach-Object { $_.Groups[1].Value.TrimEnd('.','/') } | Sort-Object -Unique
    foreach ($p in $paths) {
        [pscustomobject]@{ task=$task; tag=$tag; path=$p; exists=(Test-Path -LiteralPath (Join-Path $Repo $p)) }
    }
}
$rows | Export-Csv -NoTypeInformation -Encoding utf8 (Join-Path $Out 'path_check.csv')
$rows | Group-Object task,tag | ForEach-Object { "{0}: cited={1} exist={2}" -f $_.Name, $_.Count, ($_.Group | Where-Object exists).Count }
