Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Data.Pdf.PdfDocument,Windows.Data.Pdf,ContentType=WindowsRuntime]
[void][Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
[void][Windows.Storage.Streams.InMemoryRandomAccessStream,Windows.Storage.Streams,ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op,$t){ $m=$asTask.MakeGenericMethod($t); $x=$m.Invoke($null,@($op)); $x.Wait(-1)|Out-Null; $x.Result }
$f = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($args[0])) ([Windows.Storage.StorageFile])
$d = Await ([Windows.Data.Pdf.PdfDocument]::LoadFromFileAsync($f)) ([Windows.Data.Pdf.PdfDocument])
$p = $d.GetPage(0)
"size: $($p.Size.Width) x $($p.Size.Height)"
$o = New-Object Windows.Data.Pdf.PdfPageRenderOptions
$o.DestinationWidth = [uint32]$args[2]
$o.DestinationHeight = [uint32]$args[3]
$o.BackgroundColor = [Windows.UI.Color]::FromArgb(0,0,0,0)
$s = New-Object Windows.Storage.Streams.InMemoryRandomAccessStream
$null = $p.RenderToStreamAsync($s,$o).AsTask().Wait()
$s.Seek(0)
$st=[System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($s)
$fs=[IO.File]::Create($args[1]); $st.CopyTo($fs); $fs.Close()
"done"
