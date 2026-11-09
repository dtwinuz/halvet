# v1/img/src/*.png -> v1/img/<nom>-<eni>.webp (640/1024/1600/2000) — srcset uchun.
# Ishlatish: pwsh tools/images.ps1   (ffmpeg libwebp kerak)
$ErrorActionPreference = 'Stop'
$img = Join-Path $PSScriptRoot '..\v1\img'
foreach ($png in Get-ChildItem (Join-Path $img 'src') -Filter *.png) {
  foreach ($w in 640, 1024, 1600, 2000) {
    $out = Join-Path $img ("{0}-{1}.webp" -f $png.BaseName, $w)
    ffmpeg -hide_banner -loglevel error -y -i $png.FullName -vf "scale=${w}:-2:flags=lanczos" -c:v libwebp -quality 78 -compression_level 6 $out
  }
  Write-Host "ok $($png.BaseName)"
}
