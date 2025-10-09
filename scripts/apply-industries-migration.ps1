# Script para crear y aplicar migración de industrias
# USO: .\scripts\apply-industries-migration.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🏭 APLICANDO MIGRACIÓN DE INDUSTRIAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Crear migración
Write-Host "📝 Creando migración..." -ForegroundColor Yellow
bunx prisma migrate dev --name add_industries_and_keywords --create-only

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error al crear la migración" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Migración creada exitosamente`n" -ForegroundColor Green

# Aplicar migración
Write-Host "⚙️ Aplicando migración a la base de datos..." -ForegroundColor Yellow
bunx prisma migrate deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error al aplicar la migración" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Migración aplicada exitosamente`n" -ForegroundColor Green

# Ejecutar seed
Write-Host "🌱 Ejecutando seed de industrias..." -ForegroundColor Yellow
node prisma/seed-industries.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Error al ejecutar el seed" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🎉 PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 Endpoints disponibles:" -ForegroundColor Yellow
Write-Host "   GET  /industries" -ForegroundColor White
Write-Host "   GET  /industries/keywords" -ForegroundColor White
Write-Host "   POST /industries/detect" -ForegroundColor White
Write-Host "   POST /industries/keywords (admin)" -ForegroundColor White
Write-Host ""
