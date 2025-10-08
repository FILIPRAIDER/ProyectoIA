# Script de prueba para verificar que el perfil se retorna correctamente
# Ejecutar desde PowerShell

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TEST: Profile Data in API Responses" -ForegroundColor Cyan
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
Write-Host "  Test 1: GET /users/:id (con profile)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$userId = Read-Host "Ingresa un User ID para probar"

try {
    $user = Invoke-RestMethod -Uri "$API_URL/users/$userId" -Method GET
    
    Write-Host "✅ Usuario obtenido exitosamente" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Información básica:" -ForegroundColor Cyan
    Write-Host "  - ID: $($user.id)" -ForegroundColor White
    Write-Host "  - Nombre: $($user.name)" -ForegroundColor White
    Write-Host "  - Email: $($user.email)" -ForegroundColor White
    Write-Host "  - Rol: $($user.role)" -ForegroundColor White
    Write-Host ""
    
    # Verificar que el profile existe
    if ($user.profile) {
        Write-Host "✅ PROFILE INCLUIDO" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Datos del perfil:" -ForegroundColor Cyan
        Write-Host "  - Headline: $($user.profile.headline)" -ForegroundColor White
        Write-Host "  - Bio: $($user.profile.bio?.Substring(0, [Math]::Min(50, $user.profile.bio.Length)))..." -ForegroundColor White
        Write-Host "  - País: $($user.profile.country)" -ForegroundColor White
        Write-Host "  - Ciudad: $($user.profile.city)" -ForegroundColor White
        Write-Host "  - Teléfono: $($user.profile.phone)" -ForegroundColor White
        Write-Host "  - Disponibilidad: $($user.profile.availability) hrs/semana" -ForegroundColor White
        Write-Host ""
        
        # Verificar que el sector existe
        if ($user.profile.sector) {
            Write-Host "✅ SECTOR INCLUIDO" -ForegroundColor Green
            Write-Host ""
            Write-Host "📋 Datos del sector:" -ForegroundColor Cyan
            Write-Host "  - ID: $($user.profile.sector.id)" -ForegroundColor White
            Write-Host "  - Nombre: $($user.profile.sector.name)" -ForegroundColor White
            Write-Host "  - Español: $($user.profile.sector.nameEs)" -ForegroundColor White
            Write-Host "  - Icono: $($user.profile.sector.icon)" -ForegroundColor White
        } else {
            Write-Host "⚠️  SECTOR NO INCLUIDO" -ForegroundColor Yellow
            Write-Host "   El usuario tiene perfil pero no sector asignado" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  PROFILE NO INCLUIDO" -ForegroundColor Yellow
        Write-Host "   El usuario no tiene perfil creado aún" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Verificar otros datos
    if ($user.experiences) {
        Write-Host "✅ EXPERIENCIAS: $($user.experiences.Count)" -ForegroundColor Green
    }
    
    if ($user.certifications) {
        Write-Host "✅ CERTIFICACIONES: $($user.certifications.Count)" -ForegroundColor Green
    }
    
    if ($user.skills) {
        Write-Host "✅ HABILIDADES: $($user.skills.Count)" -ForegroundColor Green
    }
    
    if ($user.teamMemberships) {
        Write-Host "✅ EQUIPOS: $($user.teamMemberships.Count)" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ ERROR al obtener usuario" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 2: POST /auth/login (con profile)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ingresa credenciales para probar el login:" -ForegroundColor White
$email = Read-Host "Email"
$password = Read-Host "Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

$loginBody = @{
    email = $email
    password = $passwordPlain
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    Write-Host "✅ LOGIN EXITOSO" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Usuario retornado:" -ForegroundColor Cyan
    Write-Host "  - ID: $($loginResponse.id)" -ForegroundColor White
    Write-Host "  - Nombre: $($loginResponse.name)" -ForegroundColor White
    Write-Host "  - Email: $($loginResponse.email)" -ForegroundColor White
    Write-Host "  - Rol: $($loginResponse.role)" -ForegroundColor White
    Write-Host ""
    
    # Verificar profile
    if ($loginResponse.profile) {
        Write-Host "✅ PROFILE INCLUIDO EN LOGIN" -ForegroundColor Green
        Write-Host ""
        
        if ($loginResponse.profile.sector) {
            Write-Host "✅ SECTOR INCLUIDO EN PROFILE" -ForegroundColor Green
            Write-Host "   Sector: $($loginResponse.profile.sector.nameEs)" -ForegroundColor White
        } else {
            Write-Host "⚠️  Sector no incluido" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  PROFILE NO INCLUIDO EN LOGIN" -ForegroundColor Yellow
    }
    
    # Verificar que NO incluya passwordHash
    if ($loginResponse.passwordHash) {
        Write-Host "❌ SEGURIDAD: passwordHash EXPUESTO" -ForegroundColor Red
        Write-Host "   ¡ESTO ES UN PROBLEMA DE SEGURIDAD!" -ForegroundColor Red
    } else {
        Write-Host "✅ SEGURIDAD: passwordHash NO expuesto" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ ERROR en login" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 401) {
            Write-Host "Credenciales inválidas" -ForegroundColor Yellow
        }
        
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    } else {
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  📊 RESUMEN DE VERIFICACIÓN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoints verificados:" -ForegroundColor White
Write-Host "  ✅ GET /users/:id" -ForegroundColor Green
Write-Host "  ✅ POST /auth/login" -ForegroundColor Green
Write-Host ""
Write-Host "Datos que DEBEN estar incluidos:" -ForegroundColor White
Write-Host "  - user.profile (objeto completo)" -ForegroundColor Gray
Write-Host "  - user.profile.sector (objeto con nameEs, icon, etc.)" -ForegroundColor Gray
Write-Host "  - user.experiences (array)" -ForegroundColor Gray
Write-Host "  - user.certifications (array)" -ForegroundColor Gray
Write-Host "  - user.skills (array con skill: {...})" -ForegroundColor Gray
Write-Host ""
Write-Host "Datos que NO deben estar:" -ForegroundColor White
Write-Host "  - user.passwordHash (seguridad)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Si el perfil no aparece:" -ForegroundColor Yellow
Write-Host "  1. Verificar que el usuario tenga un registro en MemberProfile" -ForegroundColor White
Write-Host "  2. Verificar que el userId coincida" -ForegroundColor White
Write-Host "  3. Revisar los logs del backend" -ForegroundColor White
Write-Host "  4. Limpiar caché del frontend" -ForegroundColor White
Write-Host ""
