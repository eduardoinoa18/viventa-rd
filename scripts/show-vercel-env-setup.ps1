# Script to display environment variables needed for Vercel
# Run this and copy the values to Vercel Dashboard → Settings → Environment Variables

Write-Host "`n=== VERCEL ENVIRONMENT VARIABLES SETUP ===" -ForegroundColor Cyan
Write-Host "Copy these to: Vercel Dashboard → Settings → Environment Variables`n" -ForegroundColor Yellow

# Load .env.local
$rootPath = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $rootPath ".env.local"
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    # Extract values
    $vars = @(
        'FIREBASE_ADMIN_PROJECT_ID',
        'FIREBASE_ADMIN_CLIENT_EMAIL',
        'FIREBASE_ADMIN_PRIVATE_KEY',
        'SESSION_SECRET',
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'SENDGRID_API_KEY',
        'MASTER_ADMIN_EMAIL'
    )
    
    Write-Host "REQUIRED Environment Variables:" -ForegroundColor Green
    Write-Host "================================`n" -ForegroundColor Green
    
    foreach ($var in $vars) {
        if ($envContent -match "(?m)^$var=(.+)$") {
            $value = $matches[1].Trim()
            
            # Mask sensitive values
            if ($var -match 'PRIVATE_KEY') {
                Write-Host "$var=" -NoNewline -ForegroundColor White
                Write-Host "[COPY FROM .env.local - Line 33]" -ForegroundColor Yellow
            }
            elseif ($var -match 'SECRET|API_KEY') {
                $masked = $value.Substring(0, [Math]::Min(10, $value.Length)) + "..."
                Write-Host "$var=" -NoNewline -ForegroundColor White
                Write-Host "$masked" -ForegroundColor Yellow
                Write-Host "  → Full value in .env.local" -ForegroundColor DarkGray
            }
            else {
                Write-Host "$var=" -NoNewline -ForegroundColor White
                Write-Host "$value" -ForegroundColor Cyan
            }
        }
        else {
            Write-Host "$var=" -NoNewline -ForegroundColor White
            Write-Host "[NOT SET - Check .env.local]" -ForegroundColor Red
        }
    }
    
    Write-Host "`n================================" -ForegroundColor Green
    Write-Host "`nIMPORTANT NOTES:" -ForegroundColor Cyan
    Write-Host "1. Set these for BOTH Production and Preview environments" -ForegroundColor White
    Write-Host "2. After setting, trigger a new deployment (git push)" -ForegroundColor White
    Write-Host "3. For FIREBASE_ADMIN_PRIVATE_KEY, copy the ENTIRE value including quotes" -ForegroundColor White
    Write-Host "4. Vercel will handle newline escaping automatically`n" -ForegroundColor White
}
else {
    Write-Host "ERROR: .env.local not found!" -ForegroundColor Red
}
