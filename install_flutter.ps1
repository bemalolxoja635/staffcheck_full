$ErrorActionPreference = "Stop"

Write-Host "C:\src papkasi yaratilmoqda..."
if (-not (Test-Path -Path "C:\src")) {
    New-Item -ItemType Directory -Force -Path "C:\src" | Out-Null
}

$zipPath = "C:\src\flutter.zip"
$extractPath = "C:\src"

Write-Host "Flutter SDK yuklab olinmoqda (https://storage.googleapis.com)... Bu biroz vaqt olishi mumkin."
# Use WebClient for faster download in some cases, or Invoke-WebRequest
Invoke-WebRequest -Uri "https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.22.1-stable.zip" -OutFile $zipPath

Write-Host "Yuklab olindi. arxivdan chiqarilmoqda (Extracting)..."
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

Write-Host "Flutter PATH ga qo'shilmoqda..."
$flutterBin = "C:\src\flutter\bin"

# Temporary PATH for current session
$env:Path += ";$flutterBin"

# Permanent PATH for user
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notmatch "$flutterBin") {
    $newUserPath = $userPath + ";$flutterBin"
    [Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")
}

Write-Host "O'rnatish yakunlandi! Tekshirilayotgan Flutter versiyasi:"
& "$flutterBin\flutter.bat" --version
