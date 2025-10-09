# Script para probar el upload de avatar
# Uso: .\test-avatar-upload-fix.ps1 -UserId "cmgiw6p640004mazji8kolds4" -ImagePath "path/to/image.jpg"

param(
    [Parameter(Mandatory=$true)]
    [string]$UserId,
    
    [Parameter(Mandatory=$false)]
    [string]$ImagePath = "",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "PRUEBA DE UPLOAD DE AVATAR" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Usuario ID: $UserId" -ForegroundColor White
Write-Host "Base URL: $BaseUrl" -ForegroundColor White
Write-Host ""

# Si no se proporcionó imagen, crear una temporal de prueba (placeholder)
if ($ImagePath -eq "") {
    Write-Host "No se proporciono imagen. Generando URL de prueba..." -ForegroundColor Yellow
    
    # Crear datos de prueba simulando un upload
    $testData = @{
        userId = $UserId
        avatarUrl = "https://ik.imagekit.io/n9g1xv1xl/avatars/test_avatar_$UserId.png"
        note = "Esta es una prueba sin archivo real"
    }
    
    Write-Host "Datos de prueba:" -ForegroundColor Gray
    Write-Host ($testData | ConvertTo-Json) -ForegroundColor Gray
    Write-Host ""
    Write-Host "NOTA: Para prueba real, proporciona -ImagePath" -ForegroundColor Yellow
    exit
}

# Verificar que el archivo existe
if (-not (Test-Path $ImagePath)) {
    Write-Host "Error: Archivo no encontrado: $ImagePath" -ForegroundColor Red
    exit 1
}

Write-Host "Imagen: $ImagePath" -ForegroundColor White
Write-Host ""

# Leer archivo
$fileBytes = [System.IO.File]::ReadAllBytes($ImagePath)
$fileName = Split-Path $ImagePath -Leaf

Write-Host "Subiendo avatar..." -ForegroundColor Cyan

try {
    $uploadUrl = "$BaseUrl/uploads/users/$UserId/avatar"
    
    # Crear boundary para multipart/form-data
    $boundary = [System.Guid]::NewGuid().ToString()
    
    # Crear body multipart
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: image/jpeg",
        "",
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    $response = Invoke-RestMethod -Uri $uploadUrl -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($body))
    
    Write-Host "Respuesta recibida" -ForegroundColor Green
    Write-Host ""
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    Write-Host ""
    
    # Verificar en DB
    Write-Host "Verificando en base de datos..." -ForegroundColor Cyan
    $userUrl = "$BaseUrl/users/$UserId"
    $user = Invoke-RestMethod -Uri $userUrl -Method GET
    
    Write-Host "User.avatarUrl: $($user.avatarUrl)" -ForegroundColor $(if ($user.avatarUrl) { 'Green' } else { 'Red' })
    Write-Host "Profile.avatarUrl: $($user.profile.avatarUrl)" -ForegroundColor $(if ($user.profile.avatarUrl) { 'Green' } else { 'Red' })
    
    if ($user.avatarUrl -and $user.profile.avatarUrl) {
        Write-Host "" 
        Write-Host "EXITO: Avatar guardado correctamente" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "ERROR: Avatar NO se guardo en la base de datos" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
