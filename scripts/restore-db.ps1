# PostgreSQL Restore Script for AI Screening Copilot
# Usage: .\scripts\restore-db.ps1 -BackupFile "..\backups\ai_screening_20260101_120000.sql"

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupFile,
    [string]$ComposeFile = "..\docker-compose.yml",
    [string]$DbName = "ai_screening",
    [string]$DbUser = "postgres"
)

if (!(Test-Path $BackupFile)) {
    Write-Host "Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "WARNING: This will DROP the existing database and restore from backup!" -ForegroundColor Yellow
$confirm = Read-Host "Type 'yes' to continue"

if ($confirm -ne "yes") {
    Write-Host "Restore cancelled." -ForegroundColor Cyan
    exit 0
}

Write-Host "Restoring database from: $BackupFile" -ForegroundColor Cyan

# Drop and recreate database, then restore
docker compose -f $ComposeFile exec -T db psql -U $DbUser -c "DROP DATABASE IF EXISTS $DbName;" postgres
if ($LASTEXITCODE -ne 0) { exit 1 }

docker compose -f $ComposeFile exec -T db psql -U $DbUser -c "CREATE DATABASE $DbName;" postgres
if ($LASTEXITCODE -ne 0) { exit 1 }

Get-Content $BackupFile | docker compose -f $ComposeFile exec -T db psql -U $DbUser -d $DbName

if ($LASTEXITCODE -eq 0) {
    Write-Host "Restore completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Restore failed!" -ForegroundColor Red
    exit 1
}
