param(
    [Parameter(Mandatory=$true)]
    [string]$Environment
)

$sourceFile = ".env.local.$Environment"
$targetFile = ".env"

Write-Host "============================================================"
Write-Host "  Configuration de l'environnement pour le développeur"
Write-Host "============================================================"
Write-Host ""

# 1. Vérifie si le fichier de configuration personnel existe
if (-not (Test-Path $sourceFile)) {
    Write-Host "ERREUR: Le fichier '$sourceFile' n'existe pas !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez d'abord créer ce fichier à partir de .env.example."
    exit 1
}

# 2. Copie le fichier vers le fichier actif
try {
    Copy-Item -Path $sourceFile -Destination $targetFile -Force
    Write-Host "SUCCESS! Fichier .env créé depuis $sourceFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration active: Développeur $Environment"
    Write-Host ""
    Write-Host "Vous pouvez maintenant lancer Docker:"
    Write-Host "  docker-compose up -d"
} catch {
    Write-Host "ERREUR lors de la copie du fichier: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}