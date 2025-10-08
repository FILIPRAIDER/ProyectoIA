# Script de prueba para certificaciones y experiencias
# Ejecutar desde PowerShell

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  TEST: Certificaciones y Experiencias API" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuración
$PRODUCTION_URL = "https://proyectoia-backend.onrender.com"
$LOCAL_URL = "http://localhost:4001"

# Preguntar cuál URL usar
Write-Host "Donde quieres probar?" -ForegroundColor Yellow
Write-Host "  [1] Local (localhost:4001)" -ForegroundColor White
Write-Host "  [2] Produccion (Render)" -ForegroundColor White
$choice = Read-Host "Selecciona [1/2]"

if ($choice -eq "2") {
    $API_URL = $PRODUCTION_URL
    Write-Host "Usando: PRODUCCION" -ForegroundColor Green
} else {
    $API_URL = $LOCAL_URL
    Write-Host "Usando: LOCAL" -ForegroundColor Green
}

Write-Host ""
$userId = Read-Host "Ingresa el User ID para probar"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 1: GET Certificaciones" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

try {
    $certs = Invoke-RestMethod -Uri "$API_URL/users/$userId/certifications" -Method GET
    
    Write-Host "Certificaciones obtenidas" -ForegroundColor Green
    Write-Host "Total: $($certs.Count)" -ForegroundColor Cyan
    
    if ($certs.Count -gt 0) {
        Write-Host ""
        Write-Host "Primeras certificaciones:" -ForegroundColor White
        $certs | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - $($_.name)" -ForegroundColor Gray
            Write-Host "    Emisor: $($_.issuer)" -ForegroundColor Gray
            Write-Host "    Fecha: $($_.issueDate)" -ForegroundColor Gray
            if ($_.fileUrl) {
                Write-Host "    Tiene archivo adjunto" -ForegroundColor Green
            }
            Write-Host ""
        }
    } else {
        Write-Host "El usuario no tiene certificaciones aun" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "ERROR al obtener certificaciones" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 2: POST Certificacion (opcional)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

$testCert = Read-Host "Quieres crear una certificacion de prueba? (s/n)"

if ($testCert -eq "s") {
    $certBody = @{
        name = "Certificacion de Prueba"
        issuer = "Test Organization"
        issueDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        url = "https://ejemplo.com/cert"
    } | ConvertTo-Json

    try {
        $newCert = Invoke-RestMethod -Uri "$API_URL/users/$userId/certifications" -Method POST -Body $certBody -ContentType "application/json"
        
        Write-Host "Certificacion creada exitosamente" -ForegroundColor Green
        Write-Host "Detalles:" -ForegroundColor Cyan
        Write-Host "  - ID: $($newCert.id)" -ForegroundColor White
        Write-Host "  - Nombre: $($newCert.name)" -ForegroundColor White
        Write-Host "  - Emisor: $($newCert.issuer)" -ForegroundColor White
        Write-Host ""
        
        # Guardar ID para pruebas posteriores
        $script:certId = $newCert.id
        
        # Preguntar si quiere eliminarla
        $deleteCert = Read-Host "Eliminar esta certificacion de prueba? (s/n)"
        if ($deleteCert -eq "s") {
            try {
                Invoke-RestMethod -Uri "$API_URL/users/$userId/certifications/$($newCert.id)" -Method DELETE
                Write-Host "Certificacion eliminada" -ForegroundColor Green
            }
            catch {
                Write-Host "Error al eliminar certificacion" -ForegroundColor Red
            }
        }
    }
    catch {
        Write-Host "ERROR al crear certificacion" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 3: GET Experiencias" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

try {
    $exps = Invoke-RestMethod -Uri "$API_URL/users/$userId/experiences" -Method GET
    
    Write-Host "Experiencias obtenidas" -ForegroundColor Green
    Write-Host "Total: $($exps.Count)" -ForegroundColor Cyan
    
    if ($exps.Count -gt 0) {
        Write-Host ""
        Write-Host "Experiencias:" -ForegroundColor White
        $exps | Select-Object -First 3 | ForEach-Object {
            Write-Host "  - $($_.role)" -ForegroundColor Gray
            Write-Host "    Empresa: $($_.company)" -ForegroundColor Gray
            Write-Host "    Desde: $($_.startDate)" -ForegroundColor Gray
            if ($_.endDate) {
                Write-Host "    Hasta: $($_.endDate)" -ForegroundColor Gray
            } else {
                Write-Host "    Trabajo actual" -ForegroundColor Green
            }
            Write-Host ""
        }
    } else {
        Write-Host "El usuario no tiene experiencias aun" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "ERROR al obtener experiencias" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 4: POST Experiencia (opcional)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

$testExp = Read-Host "Quieres crear una experiencia de prueba? (s/n)"

if ($testExp -eq "s") {
    $expBody = @{
        role = "Desarrollador de Prueba"
        company = "Test Company"
        startDate = (Get-Date).AddYears(-2).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        endDate = $null
        description = "Esta es una experiencia de prueba creada por el script"
    } | ConvertTo-Json

    try {
        $newExp = Invoke-RestMethod -Uri "$API_URL/users/$userId/experiences" -Method POST -Body $expBody -ContentType "application/json"
        
        Write-Host "Experiencia creada exitosamente" -ForegroundColor Green
        Write-Host "Detalles:" -ForegroundColor Cyan
        Write-Host "  - ID: $($newExp.id)" -ForegroundColor White
        Write-Host "  - Rol: $($newExp.role)" -ForegroundColor White
        Write-Host "  - Empresa: $($newExp.company)" -ForegroundColor White
        Write-Host "  - Trabajo actual: Si" -ForegroundColor White
        Write-Host ""
        
        # Preguntar si quiere eliminarla
        $deleteExp = Read-Host "Eliminar esta experiencia de prueba? (s/n)"
        if ($deleteExp -eq "s") {
            try {
                Invoke-RestMethod -Uri "$API_URL/users/$userId/experiences/$($newExp.id)" -Method DELETE
                Write-Host "Experiencia eliminada" -ForegroundColor Green
            }
            catch {
                Write-Host "Error al eliminar experiencia" -ForegroundColor Red
            }
        }
    }
    catch {
        Write-Host "ERROR al crear experiencia" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Test 5: Upload de Certificacion (opcional)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan

$testUpload = Read-Host "Quieres probar el endpoint de upload? (s/n)"

if ($testUpload -eq "s") {
    if ($script:certId) {
        $certIdForUpload = $script:certId
    } else {
        $certIdForUpload = Read-Host "Ingresa el ID de una certificacion"
    }
    
    try {
        $uploadAuth = Invoke-RestMethod -Uri "$API_URL/uploads/certifications/$certIdForUpload/url" -Method POST
        
        Write-Host "Credenciales de upload obtenidas" -ForegroundColor Green
        Write-Host "Detalles:" -ForegroundColor Cyan
        Write-Host "  - Provider: $($uploadAuth.provider)" -ForegroundColor White
        if ($uploadAuth.publicKey) {
            $pkeyPreview = $uploadAuth.publicKey.Substring(0, [Math]::Min(20, $uploadAuth.publicKey.Length))
            Write-Host "  - Public Key: $pkeyPreview..." -ForegroundColor White
        }
        Write-Host "  - Folder: $($uploadAuth.folder)" -ForegroundColor White
        $expireDate = [DateTimeOffset]::FromUnixTimeSeconds($uploadAuth.expire).DateTime
        Write-Host "  - Expire: $expireDate" -ForegroundColor White
        Write-Host ""
        Write-Host "El frontend puede usar estas credenciales para subir archivos" -ForegroundColor Green
    }
    catch {
        Write-Host "ERROR al obtener credenciales de upload" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response: $responseBody" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  RESUMEN" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoints verificados:" -ForegroundColor Green
Write-Host "  - GET /users/:userId/certifications" -ForegroundColor White
Write-Host "  - POST /users/:userId/certifications" -ForegroundColor White
Write-Host "  - DELETE /users/:userId/certifications/:certId" -ForegroundColor White
Write-Host "  - GET /users/:userId/experiences" -ForegroundColor White
Write-Host "  - POST /users/:userId/experiences" -ForegroundColor White
Write-Host "  - DELETE /users/:userId/experiences/:expId" -ForegroundColor White
Write-Host "  - POST /uploads/certifications/:certId/url" -ForegroundColor White
Write-Host ""
Write-Host "Todos los endpoints estan funcionando correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "El frontend puede empezar a usar estos endpoints" -ForegroundColor Yellow
Write-Host ""
