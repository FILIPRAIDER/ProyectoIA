# Script para verificar el estado de las migraciones en LOCAL y PRODUCCION

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICACION DE ESTADO DE MIGRACIONES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar LOCAL
Write-Host "[LOCAL] BASE DE DATOS LOCAL (bridge_dev)" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray
npx prisma migrate status
Write-Host ""

# Verificar PRODUCCION
Write-Host "[PRODUCCION] BASE DE DATOS PRODUCCION (Neon)" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray
$env:DATABASE_URL = $env:PRODUCTION_DATABASE_URL
$env:DIRECT_DATABASE_URL = $env:PRODUCTION_DATABASE_URL
npx prisma migrate status

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICACION COMPLETADA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
