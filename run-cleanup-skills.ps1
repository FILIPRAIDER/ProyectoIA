# Script para ejecutar limpieza de skills huérfanas
# Uso: .\run-cleanup-skills.ps1

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "LIMPIEZA DE SKILLS HUERFANAS EN EQUIPOS" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Este script eliminara skills de equipos que ningún miembro tiene" -ForegroundColor Yellow
Write-Host ""
Write-Host "Ejecutando en: $(if ($env:DATABASE_URL -match 'localhost') { 'DESARROLLO' } else { 'PRODUCCION' })" -ForegroundColor $(if ($env:DATABASE_URL -match 'localhost') { 'Green' } else { 'Red' })
Write-Host ""

$response = Read-Host "Continuar? (s/n)"

if ($response -ne 's' -and $response -ne 'S') {
    Write-Host "Operación cancelada" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Ejecutando script de limpieza..." -ForegroundColor Cyan
Write-Host ""

node scripts/cleanup-orphan-team-skills.js

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Script completado" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
