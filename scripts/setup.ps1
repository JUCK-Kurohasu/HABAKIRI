# HABAKIRI setup (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "=== HABAKIRI setup ===" -ForegroundColor Cyan

# 1. API key
if (Test-Path .env) {
    Write-Host ".env already exists (skipping key prompt)" -ForegroundColor Yellow
} else {
    $secure = Read-Host "OrcaRouter API key" -AsSecureString
    $key = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
    if ([string]::IsNullOrWhiteSpace($key)) {
        $key = "sk-your-key-here"
        Write-Host "No key entered; placeholder written. Edit .env later."
    }
    "ORCAROUTER_API_KEY=$key" | Set-Content -Path .env -Encoding utf8 -NoNewline
    Write-Host "created .env" -ForegroundColor Green
}

# 2. opencode.json
if (-not (Test-Path opencode.json)) {
    Copy-Item opencode.json.example opencode.json
    Write-Host "created opencode.json" -ForegroundColor Green
} else {
    Write-Host "opencode.json already exists" -ForegroundColor Yellow
}

# 3. Ensure packages/cli can read .env
Copy-Item .env packages/cli/.env -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Setup complete. Run: bun run dev" -ForegroundColor Green