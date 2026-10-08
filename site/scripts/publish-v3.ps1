# Publish the Next.js export to GitHub Pages (gem2.csaladen.es/v3)

$ErrorActionPreference = 'Stop'
$site = 'E:\OneDrive\2 Academics\22 UBB\223 Research\Projects\GEM\gem-site'
$out = Join-Path $site 'out'
$repo = 'E:\OneDrive\5 Github\52 denesdata\gem'
$dest = Join-Path $repo 'v3'

Set-Location $site
$env:NEXT_PUBLIC_BASE_PATH = '/v3'
npm run build
if ($LASTEXITCODE -ne 0) { throw 'next build failed' }
if (-not (Test-Path (Join-Path $out 'index.html'))) { throw 'build did not produce out/index.html' }

$drop = @(
  'panels-legacy',
  'server-export\promo',
  'server-export\media',
  'server-export\test',
  'server-export\track',
  'server-export\style',
  'server-export\host',
  'server-export\path',
  'server-export\img',
  'server-export\panels\.ipynb_checkpoints',
  'server-export\panels\reports'
)
foreach ($rel in $drop) {
  $p = Join-Path $out $rel
  if (Test-Path $p) { Remove-Item $p -Recurse -Force }
}

$keep = [regex]'unstacked_|countries-110m-fixed|romania-counties|romania-regio\.json|romania-nuts2|news\.json|upcoming\.json|reports\.json|legal_def'
$panels = Join-Path $out 'server-export\panels'
if (Test-Path $panels) {
  Get-ChildItem $panels -File | Where-Object { $_.Name -notmatch $keep } | Remove-Item -Force
  Get-ChildItem $panels -Directory | Remove-Item -Recurse -Force
}

New-Item -ItemType File -Path (Join-Path $out '.nojekyll') -Force | Out-Null
Set-Content -Path (Join-Path $repo '.nojekyll') -Value '' -NoNewline

if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest | Out-Null }
robocopy $out $dest /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with code $LASTEXITCODE" }
Copy-Item (Join-Path $site 'README.md') (Join-Path $dest 'README.md') -Force

$size = Get-ChildItem $dest -Recurse -File | Measure-Object Length -Sum
Write-Host ("staged {0} ({1} files, {2} MB)" -f $dest, $size.Count, [math]::Round($size.Sum / 1MB, 1))
