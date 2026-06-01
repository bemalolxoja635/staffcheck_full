$ProgressPreference = 'SilentlyContinue'
$ErrorActionPreference = "Stop"

$installDir = "C:\src_fast_flutter"
if (-not (Test-Path -Path $installDir)) {
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
}

$zipPath = "$installDir\flutter.zip"
$flutterFolder = "$installDir\flutter"

if (Test-Path -Path $flutterFolder) {
    Write-Host "Avvalgi xato yuklash o'chirilmoqda..."
    Remove-Item -Recurse -Force $flutterFolder
}

Write-Host "1. Flutter yuklab olinmoqda (Tezlashtirilgan WebClient orqali)..."
(New-Object System.Net.WebClient).DownloadFile("https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.22.1-stable.zip", $zipPath)

Write-Host "2. Arxiv tezkor ochilmoqda..."
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $installDir)

Write-Host "3. Tizim PATH ornatilmoqda..."
$flutterBin = "$flutterFolder\bin"
$env:Path += ";$flutterBin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notmatch "$flutterBin") {
    $newUserPath = $userPath + ";$flutterBin"
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
}

Write-Host "4. Flutter yaratilmoqda..."
Set-Location -Path "c:\Users\user\Desktop\staffcheck_full\staffcheck_full"
& "$flutterBin\flutter.bat" create staffcheck_app

Write-Host "O'rnatish yakunlandi!"
