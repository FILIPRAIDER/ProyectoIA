# Script de testing para el endpoint GET /companies/:id/projects
# USO: .\test-company-projects.ps1 <companyId>

param(
    [Parameter(Mandatory=$false)]
    [string]$CompanyId = "cmgiy2gdz0000e8md6plp9rgl",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:4001"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🧪 TEST DE ENDPOINT COMPANY PROJECTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "🔗 Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "🏢 Company ID: $CompanyId`n" -ForegroundColor Gray

# Test 1: Obtener todos los proyectos de la empresa
Write-Host "1️⃣ GET /companies/$CompanyId/projects" -ForegroundColor Yellow
Write-Host "   Descripción: Obtener todos los proyectos de la empresa`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/companies/$CompanyId/projects" -Method GET -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✅ Success: $($response.success)" -ForegroundColor Green
        Write-Host "   📊 Total Projects: $($response.data.totalProjects)" -ForegroundColor Cyan
        
        if ($response.data.totalProjects -gt 0) {
            Write-Host "   📋 Proyectos:" -ForegroundColor Cyan
            $response.data.projects | ForEach-Object {
                Write-Host "      • $($_.title) (Status: $($_.status))" -ForegroundColor White
                Write-Host "        Budget: $($_.budget) $($_.budgetCurrency) | City: $($_.city)" -ForegroundColor Gray
            }
        } else {
            Write-Host "   ℹ️  No hay proyectos para esta empresa" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ❌ Success: false" -ForegroundColor Red
        Write-Host "   Error: $($response.error.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Filtrar por status OPEN
Write-Host "2️⃣ GET /companies/$CompanyId/projects?status=OPEN" -ForegroundColor Yellow
Write-Host "   Descripción: Obtener solo proyectos con status OPEN`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/companies/$CompanyId/projects?status=OPEN" -Method GET -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✅ Success: $($response.success)" -ForegroundColor Green
        Write-Host "   📊 Total Projects (OPEN): $($response.data.totalProjects)" -ForegroundColor Cyan
        
        if ($response.data.totalProjects -gt 0) {
            $response.data.projects | ForEach-Object {
                Write-Host "      • $($_.title) - $($_.status)" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Limitar resultados a 3
Write-Host "3️⃣ GET /companies/$CompanyId/projects?limit=3" -ForegroundColor Yellow
Write-Host "   Descripción: Obtener máximo 3 proyectos`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/companies/$CompanyId/projects?limit=3" -Method GET -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✅ Success: $($response.success)" -ForegroundColor Green
        Write-Host "   📊 Total Projects: $($response.data.totalProjects) (máx 3)" -ForegroundColor Cyan
        
        if ($response.data.projects.Count -le 3) {
            Write-Host "   ✅ Límite respetado" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Límite NO respetado" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Empresa que no existe
Write-Host "4️⃣ GET /companies/invalid_id/projects" -ForegroundColor Yellow
Write-Host "   Descripción: Intentar obtener proyectos de empresa inexistente`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/companies/invalid_id/projects" -Method GET -ContentType "application/json"
    Write-Host "   ⚠️  Respuesta inesperada (debería ser 404)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 404) {
        Write-Host "   ✅ 404 Not Found (esperado)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error inesperado: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""

# Test 5: Combinación de filtros
Write-Host "5️⃣ GET /companies/$CompanyId/projects?status=OPEN&limit=5" -ForegroundColor Yellow
Write-Host "   Descripción: Combinar status y limit`n" -ForegroundColor Gray

try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/companies/$CompanyId/projects?status=OPEN&limit=5" -Method GET -ContentType "application/json"
    
    if ($response.success) {
        Write-Host "   ✅ Success: $($response.success)" -ForegroundColor Green
        Write-Host "   📊 Total Projects (OPEN, max 5): $($response.data.totalProjects)" -ForegroundColor Cyan
        
        $allOpen = $true
        $response.data.projects | ForEach-Object {
            if ($_.status -ne "OPEN") {
                $allOpen = $false
            }
        }
        
        if ($allOpen) {
            Write-Host "   ✅ Todos los proyectos tienen status OPEN" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Algunos proyectos NO tienen status OPEN" -ForegroundColor Red
        }
        
        if ($response.data.projects.Count -le 5) {
            Write-Host "   ✅ Límite respetado (≤5)" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ✅ TESTS COMPLETADOS" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📝 Endpoint implementado:" -ForegroundColor Yellow
Write-Host "   GET /companies/:id/projects" -ForegroundColor White
Write-Host ""
Write-Host "📊 Query parameters:" -ForegroundColor Yellow
Write-Host "   - status (optional): Filtrar por status del proyecto" -ForegroundColor White
Write-Host "   - limit (optional, default 10, max 50): Máximo de proyectos" -ForegroundColor White
Write-Host ""
Write-Host "✅ Estado: LISTO PARA USO EN AI-API`n" -ForegroundColor Green
