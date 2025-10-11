# Script para aplicar migraciones a produccion
# Este script aplica las migraciones pendientes a la base de datos de produccion

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOY DE MIGRACIONES A PRODUCCION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: No se encontró el archivo .env" -ForegroundColor Red
    exit 1
}

# Mostrar las migraciones que se aplicarán
Write-Host "Migraciones disponibles:" -ForegroundColor Yellow
Get-ChildItem "prisma\migrations" -Directory | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Gray
}
Write-Host ""

# Confirmar antes de continuar
$confirm = Read-Host "Deseas aplicar estas migraciones a PRODUCCION? (escribe 'SI' para confirmar)"
if ($confirm -ne "SI") {
    Write-Host "Operacion cancelada por el usuario" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Aplicando migraciones a produccion..." -ForegroundColor Cyan

# Configurar temporalmente la variable de entorno para produccion
$env:DATABASE_URL = $env:PRODUCTION_DATABASE_URL
$env:DIRECT_DATABASE_URL = $env:PRODUCTION_DATABASE_URL

# Ejecutar migrate deploy (solo aplica migraciones, no genera nuevas)
Write-Host "Ejecutando: npx prisma migrate deploy" -ForegroundColor Gray
npx prisma migrate deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Migraciones aplicadas exitosamente a produccion" -ForegroundColor Green
    Write-Host ""
    Write-Host "Generando cliente de Prisma actualizado..." -ForegroundColor Cyan
    npx prisma generate
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Cliente de Prisma generado correctamente" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Advertencia: Error al generar el cliente de Prisma" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "[ERROR] Error al aplicar las migraciones" -ForegroundColor Red
    Write-Host "Verifica los logs anteriores para mas detalles" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROCESO COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
