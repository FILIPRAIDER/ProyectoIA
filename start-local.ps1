# 🚀 Script para Iniciar Entorno de Desarrollo Local

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO ENTORNO LOCAL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker está corriendo
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker no está corriendo"
    }
    Write-Host "✅ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está corriendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor inicia Docker Desktop primero" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Iniciar PostgreSQL
Write-Host ""
Write-Host "📦 Iniciando PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL iniciado" -ForegroundColor Green
} else {
    Write-Host "❌ Error iniciando PostgreSQL" -ForegroundColor Red
    exit 1
}

# Esperar a que esté listo
Write-Host ""
Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$retries = 5
$ready = $false
for ($i = 1; $i -le $retries; $i++) {
    try {
        docker exec bridge-postgres pg_isready -U postgres > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
    } catch {
        # Continuar esperando
    }
    Start-Sleep -Seconds 1
}

if ($ready) {
    Write-Host "✅ PostgreSQL está listo" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL está iniciando, puede tardar unos segundos más" -ForegroundColor Yellow
}

# Mostrar info
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ ENTORNO LISTO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Ahora puedes:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar el backend:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Ver la base de datos:" -ForegroundColor White
Write-Host "   npx prisma studio" -ForegroundColor Yellow
Write-Host "   (Se abrirá en http://localhost:5555)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Probar la API:" -ForegroundColor White
Write-Host "   http://localhost:4001/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
