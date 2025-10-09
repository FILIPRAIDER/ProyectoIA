# Script para probar el endpoint de subida de logo de empresa
# Uso: .\scripts\test-company-logo-upload.ps1

$API_URL = "http://localhost:4001"
# $API_URL = "https://tu-backend-produccion.onrender.com"

$companyId = "cmgiw8e3p0000sol9u5n8u0q0"  # Reemplazar con un ID real de tu BD
$imagePath = "C:\Users\filip\Pictures\test-logo.png"  # Ruta a una imagen de prueba

Write-Host "🧪 Probando endpoint de subida de logo de empresa" -ForegroundColor Cyan
Write-Host ""

# Verificar que existe la imagen
if (-not (Test-Path $imagePath)) {
    Write-Host "❌ Error: No se encontró la imagen en $imagePath" -ForegroundColor Red
    Write-Host "   Por favor, coloca una imagen PNG/JPG en esa ruta o modifica la variable `$imagePath" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Archivo: $imagePath" -ForegroundColor Gray
Write-Host "🏢 Company ID: $companyId" -ForegroundColor Gray
Write-Host "🌐 API URL: $API_URL" -ForegroundColor Gray
Write-Host ""

# Test 1: Subir logo
Write-Host "📤 Test 1: Subir logo de empresa..." -ForegroundColor Yellow

try {
    $form = @{
        file = Get-Item -Path $imagePath
    }

    $response = Invoke-RestMethod -Uri "$API_URL/uploads/companies/$companyId/logo" `
        -Method Post `
        -Form $form `
        -ErrorAction Stop

    Write-Host "✅ Logo subido exitosamente!" -ForegroundColor Green
    Write-Host "   URL: $($response.url)" -ForegroundColor Gray
    Write-Host "   Company ID: $($response.companyId)" -ForegroundColor Gray
    Write-Host "   Mensaje: $($response.message)" -ForegroundColor Gray
    Write-Host ""

    # Guardar URL para verificación
    $logoUrl = $response.url

    # Test 2: Verificar que se actualizó en la BD
    Write-Host "🔍 Test 2: Verificar que se actualizó en GET /companies/:id..." -ForegroundColor Yellow
    
    $companyResponse = Invoke-RestMethod -Uri "$API_URL/companies/$companyId" `
        -Method Get `
        -ErrorAction Stop

    if ($companyResponse.logoUrl -eq $logoUrl) {
        Write-Host "✅ Campo logoUrl actualizado correctamente en la BD" -ForegroundColor Green
        Write-Host "   logoUrl: $($companyResponse.logoUrl)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Advertencia: logoUrl no coincide" -ForegroundColor Yellow
        Write-Host "   Esperado: $logoUrl" -ForegroundColor Gray
        Write-Host "   Recibido: $($companyResponse.logoUrl)" -ForegroundColor Gray
    }

} catch {
    Write-Host "❌ Error en la prueba:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Detalles del error:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Pruebas completadas" -ForegroundColor Cyan
