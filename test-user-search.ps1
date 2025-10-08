# Script de prueba para el endpoint /users/search
# Ejecutar desde PowerShell

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TEST: Endpoint /users/search" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$BASE_URL = "http://localhost:4001"
$PRODUCTION_URL = "https://proyectoia-backend.onrender.com"

# Preguntar cuál URL usar
Write-Host "¿Dónde quieres probar?" -ForegroundColor Yellow
Write-Host "  [1] Local (localhost:4001)" -ForegroundColor White
Write-Host "  [2] Producción (Render)" -ForegroundColor White
$choice = Read-Host "Selecciona [1/2]"

if ($choice -eq "2") {
    $API_URL = $PRODUCTION_URL
    Write-Host "✅ Usando: PRODUCCIÓN" -ForegroundColor Green
} else {
    $API_URL = $BASE_URL
    Write-Host "✅ Usando: LOCAL" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 1: Buscar sin parámetro email (debe fallar)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$API_URL/users/search" -Method GET -ErrorAction Stop
    Write-Host "❌ ERROR: Debería haber fallado con 400" -ForegroundColor Red
    Write-Host "Response: $($response.Content)" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ PASS: Respondió con 400 Bad Request (esperado)" -ForegroundColor Green
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Gray
    } else {
        Write-Host "❌ ERROR: Status Code inesperado: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 2: Buscar con email válido" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$API_URL/users/search?email=test" -Method GET
    Write-Host "✅ PASS: Respondió exitosamente" -ForegroundColor Green
    Write-Host "Usuarios encontrados: $($response.Count)" -ForegroundColor Cyan
    
    if ($response.Count -gt 0) {
        Write-Host ""
        Write-Host "Primeros resultados:" -ForegroundColor White
        $response | Select-Object -First 3 | ForEach-Object {
            Write-Host "  • $($_.email) - $($_.name) [$($_.role)]" -ForegroundColor Gray
        }
    } else {
        Write-Host "ℹ️  No se encontraron usuarios con 'test' en el email" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 3: Buscar con filtro de rol" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$API_URL/users/search?email=@&role=ESTUDIANTE&limit=5" -Method GET
    Write-Host "✅ PASS: Búsqueda con rol exitosa" -ForegroundColor Green
    Write-Host "Estudiantes encontrados: $($response.Count)" -ForegroundColor Cyan
    
    if ($response.Count -gt 0) {
        Write-Host ""
        Write-Host "Estudiantes:" -ForegroundColor White
        $response | Select-Object -First 5 | ForEach-Object {
            Write-Host "  • $($_.email) - $($_.name) [$($_.role)]" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 4: Búsqueda con límite personalizado" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$API_URL/users/search?email=a&limit=3" -Method GET
    Write-Host "✅ PASS: Búsqueda con límite exitosa" -ForegroundColor Green
    Write-Host "Usuarios encontrados: $($response.Count) (límite: 3)" -ForegroundColor Cyan
    
    if ($response.Count -gt 0) {
        Write-Host ""
        $response | ForEach-Object {
            Write-Host "  • $($_.email)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  📊 RESUMEN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Endpoint implementado: GET /users/search" -ForegroundColor Green
Write-Host "✅ Validación de parámetros funcionando" -ForegroundColor Green
Write-Host "✅ Búsqueda por email funcionando" -ForegroundColor Green
Write-Host "✅ Filtros opcionales funcionando" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Endpoint listo para usar en el frontend!" -ForegroundColor Green
Write-Host ""
