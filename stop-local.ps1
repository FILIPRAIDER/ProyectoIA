# 🛑 Script para Detener Entorno de Desarrollo Local

Write-Host ""
Write-Host "============================================" -ForegroundColor Yellow
Write-Host "🛑 DETENIENDO ENTORNO LOCAL" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "📦 Deteniendo PostgreSQL..." -ForegroundColor Yellow
docker-compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL detenido" -ForegroundColor Green
} else {
    Write-Host "⚠️  Error deteniendo PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ ENTORNO DETENIDO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Nota: Los datos se mantienen guardados" -ForegroundColor Cyan
Write-Host "   Puedes reiniciar cuando quieras con:" -ForegroundColor Cyan
Write-Host "   ./start-local.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  Si quieres borrar TODOS los datos:" -ForegroundColor Yellow
Write-Host "   docker-compose down -v" -ForegroundColor Red
Write-Host ""
