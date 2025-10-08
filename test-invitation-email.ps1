# Script de prueba para verificar el email de invitación
# Ejecutar desde PowerShell

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TEST: Email de Invitación - Verificación" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$PRODUCTION_URL = "https://proyectoia-backend.onrender.com"
$LOCAL_URL = "http://localhost:4001"

# Preguntar cuál URL usar
Write-Host "¿Dónde quieres probar?" -ForegroundColor Yellow
Write-Host "  [1] Local (localhost:4001)" -ForegroundColor White
Write-Host "  [2] Producción (Render)" -ForegroundColor White
$choice = Read-Host "Selecciona [1/2]"

if ($choice -eq "2") {
    $API_URL = $PRODUCTION_URL
    Write-Host "✅ Usando: PRODUCCIÓN" -ForegroundColor Green
} else {
    $API_URL = $LOCAL_URL
    Write-Host "✅ Usando: LOCAL" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Configuración Requerida" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar datos
$teamId = Read-Host "Ingresa el ID del equipo"
$userId = Read-Host "Ingresa tu User ID (quien invita)"
$emailDestino = Read-Host "Ingresa el email a invitar"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Enviando invitación..." -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

$body = @{
    email = $emailDestino
    role = "MIEMBRO"
    byUserId = $userId
    expiresInDays = 7
    target = "frontend"
} | ConvertTo-Json

Write-Host "📦 Request Body:" -ForegroundColor Gray
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "$API_URL/teams/$teamId/invites" `
        -Method POST `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ INVITACIÓN ENVIADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 Detalles del Email:" -ForegroundColor Cyan
    Write-Host "  - Destinatario: $($response.email)" -ForegroundColor White
    Write-Host "  - Token: $($response.token.Substring(0, 16))..." -ForegroundColor White
    Write-Host "  - Expira: $($response.expiresAt)" -ForegroundColor White
    Write-Host "  - Email enviado: $($response.emailSent)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 URL de Aceptación:" -ForegroundColor Cyan
    Write-Host "  $($response.acceptUrlExample)" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  ✅ VERIFICACIONES" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Verificar que la URL es del frontend
    if ($response.acceptUrlExample -like "https://cresia-app.vercel.app/*") {
        Write-Host "✅ URL apunta al FRONTEND (correcto)" -ForegroundColor Green
    } else {
        Write-Host "❌ URL NO apunta al frontend" -ForegroundColor Red
        Write-Host "   URL actual: $($response.acceptUrlExample)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "  📋 Siguiente Paso" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Revisa el email en:" -ForegroundColor White
    Write-Host "   filipraider123@gmail.com" -ForegroundColor Yellow
    Write-Host "   (todos los emails de dev van ahí)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Verifica que el email muestre:" -ForegroundColor White
    Write-Host "   ✅ Nombre del invitador (NO 'undefined')" -ForegroundColor White
    Write-Host "   ✅ Botón con URL del frontend" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Haz clic en 'Aceptar invitación'" -ForegroundColor White
    Write-Host "   Debería redirigir a:" -ForegroundColor White
    Write-Host "   https://cresia-app.vercel.app/join?token=..." -ForegroundColor Yellow
    Write-Host ""
    
} catch {
    Write-Host "❌ ERROR al enviar invitación" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalles del error:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Sugerencias:" -ForegroundColor Yellow
    Write-Host "  - Verifica que el teamId sea correcto" -ForegroundColor White
    Write-Host "  - Verifica que tu userId tenga permisos de líder" -ForegroundColor White
    Write-Host "  - Asegúrate de que el servidor esté corriendo" -ForegroundColor White
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  🔍 Cómo Obtener IDs" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para obtener tu User ID y Team ID:" -ForegroundColor White
Write-Host ""
Write-Host "1. Ve al dashboard del frontend" -ForegroundColor Gray
Write-Host "2. Abre las DevTools (F12)" -ForegroundColor Gray
Write-Host "3. En la pestaña Console, escribe:" -ForegroundColor Gray
Write-Host "   localStorage.getItem('userId')" -ForegroundColor Cyan
Write-Host ""
Write-Host "O consulta directamente la base de datos:" -ForegroundColor Gray
Write-Host "   SELECT id, name, email FROM users;" -ForegroundColor Cyan
Write-Host "   SELECT id, name FROM teams;" -ForegroundColor Cyan
Write-Host ""
