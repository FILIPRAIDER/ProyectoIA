# Script PowerShell para ejecutar el seed de equipo de prueba
# Uso: .\scripts\run-test-team-seed.ps1

Write-Host "🧪 Ejecutando seed de equipo de prueba..." -ForegroundColor Cyan
Write-Host ""

try {
    # Ejecutar el seed
    node prisma/seed-test-team.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Seed ejecutado exitosamente!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
        Write-Host "  1. Usa las credenciales para hacer login" -ForegroundColor Gray
        Write-Host "     Email: leader.devteam@test.com" -ForegroundColor Gray
        Write-Host "     Password: DevTeam2025!" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  2. Prueba los endpoints de equipos:" -ForegroundColor Gray
        Write-Host "     GET /teams (listar todos los equipos)" -ForegroundColor Gray
        Write-Host "     GET /teams/:id (obtener equipo específico)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "  3. Crea un proyecto y prueba el matching" -ForegroundColor Gray
        Write-Host "     POST /projects (crear proyecto)" -ForegroundColor Gray
        Write-Host "     POST /matching/projects/:id/teams (buscar equipos para el proyecto)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Error al ejecutar el seed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
