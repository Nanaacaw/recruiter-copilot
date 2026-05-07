# PostgreSQL Backup Script for AI Screening Copilot
# Usage: .\scripts\backup-db.ps1

param(
    [string]$ComposeFile = "..\docker-compose.yml",
    [string]$BackupDir = "..\backups",
    [string]$DbName = "ai_screening",
    [string]$DbUser = "postgres"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$BackupDir\ai_screening_$timestamp.sql"

# Ensure backup directory exists
if (!(Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

Write-Host "Creating PostgreSQL backup: $backupFile" -ForegroundColor Cyan

# Run pg_dump inside the db container
docker compose -f $ComposeFile exec -T db pg_dump -U $DbUser -d $DbName > $backupFile

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup created successfully: $backupFile" -ForegroundColor Green
} else {
    Write-Host "Backup failed!" -ForegroundColor Red
    exit 1
}
