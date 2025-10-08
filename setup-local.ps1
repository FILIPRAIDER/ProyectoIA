# 🚀 Script de Inicialización de Entorno Local

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🚀 CONFIGURACIÓN DE ENTORNO LOCAL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker está instalado
Write-Host "🔍 Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker encontrado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor instala Docker Desktop desde:" -ForegroundColor Yellow
    Write-Host "https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Verificar que Docker está corriendo
Write-Host ""
Write-Host "🔍 Verificando que Docker esté corriendo..." -ForegroundColor Yellow
try {
    docker ps > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker no está corriendo"
    }
    Write-Host "✅ Docker está corriendo" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está corriendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor inicia Docker Desktop y vuelve a ejecutar este script" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Paso 1: Iniciar PostgreSQL con Docker
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📦 PASO 1: Iniciando PostgreSQL con Docker" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ejecutando: docker-compose up -d" -ForegroundColor Yellow
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ PostgreSQL iniciado correctamente" -ForegroundColor Green
    Write-Host "   - Host: localhost" -ForegroundColor Gray
    Write-Host "   - Puerto: 5432" -ForegroundColor Gray
    Write-Host "   - Usuario: postgres" -ForegroundColor Gray
    Write-Host "   - Password: postgres" -ForegroundColor Gray
    Write-Host "   - Database: bridge_dev" -ForegroundColor Gray
} else {
    Write-Host "❌ Error iniciando PostgreSQL" -ForegroundColor Red
    exit 1
}

# Esperar a que PostgreSQL esté listo
Write-Host ""
Write-Host "⏳ Esperando a que PostgreSQL esté listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$retries = 10
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
    Write-Host "   Intento $i de $retries..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $ready) {
    Write-Host "❌ PostgreSQL no está listo después de esperar" -ForegroundColor Red
    Write-Host "Verifica los logs con: docker-compose logs" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL está listo" -ForegroundColor Green

# Paso 2: Instalar dependencias
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📦 PASO 2: Instalando dependencias" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "node_modules") {
    Write-Host "⚠️  node_modules ya existe, omitiendo npm install" -ForegroundColor Yellow
} else {
    Write-Host "Ejecutando: npm install" -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
    } else {
        Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
        exit 1
    }
}

# Paso 3: Generar cliente de Prisma
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔧 PASO 3: Generando cliente de Prisma" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ejecutando: npx prisma generate" -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Cliente de Prisma generado" -ForegroundColor Green
} else {
    Write-Host "❌ Error generando cliente de Prisma" -ForegroundColor Red
    exit 1
}

# Paso 4: Aplicar migraciones
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🗄️  PASO 4: Aplicando migraciones" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ejecutando: npx prisma migrate dev" -ForegroundColor Yellow
npx prisma migrate dev --name init

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migraciones aplicadas" -ForegroundColor Green
} else {
    Write-Host "❌ Error aplicando migraciones" -ForegroundColor Red
    Write-Host "Si ya existen migraciones, esto es normal" -ForegroundColor Yellow
}

# Paso 5: Seed (opcional)
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🌱 PASO 5: Datos de prueba (Seed)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$seedResponse = Read-Host "¿Quieres crear datos de prueba? (s/n)"

if ($seedResponse -eq "s" -or $seedResponse -eq "S") {
    Write-Host "Ejecutando: npm run seed" -ForegroundColor Yellow
    npm run seed
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Datos de prueba creados" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Error creando datos de prueba (puede ser normal si no existe el script)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Omitiendo seed" -ForegroundColor Gray
}

# Resumen final
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Tu entorno local está listo!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Iniciar el backend:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Abrir Prisma Studio (opcional):" -ForegroundColor White
Write-Host "   npx prisma studio" -ForegroundColor Yellow
Write-Host "   URL: http://localhost:5555" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Probar API:" -ForegroundColor White
Write-Host "   http://localhost:4001/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Ver logs de PostgreSQL:" -ForegroundColor White
Write-Host "   docker-compose logs -f" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Detener PostgreSQL (cuando termines):" -ForegroundColor White
Write-Host "   docker-compose down" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📚 Documentación completa en:" -ForegroundColor Cyan
Write-Host "   SETUP_LOCAL_DEVELOPMENT.md" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
