# Test de los endpoints de industrias
# USO: .\test-industries-endpoints.ps1

$BASE_URL = "http://localhost:4001"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   🧪 TEST DE ENDPOINTS DE INDUSTRIAS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. GET /industries
Write-Host "1️⃣ GET /industries (Listar todas las industrias)" -ForegroundColor Yellow
Write-Host "   Endpoint: $BASE_URL/industries`n" -ForegroundColor Gray
$response = Invoke-RestMethod -Uri "$BASE_URL/industries" -Method GET
Write-Host "   ✅ Total industrias: $($response.total)" -ForegroundColor Green
Write-Host "   📋 Primeras 3 industrias:" -ForegroundColor Cyan
$response.industries | Select-Object -First 3 | ForEach-Object {
    Write-Host "      $($_.icon) $($_.name)" -ForegroundColor White
}
Write-Host ""

# 2. GET /industries/keywords
Write-Host "2️⃣ GET /industries/keywords (Listar keywords para AI-API)" -ForegroundColor Yellow
Write-Host "   Endpoint: $BASE_URL/industries/keywords`n" -ForegroundColor Gray
$keywordsResponse = Invoke-RestMethod -Uri "$BASE_URL/industries/keywords?language=es" -Method GET
Write-Host "   ✅ Total industrias: $($keywordsResponse.total)" -ForegroundColor Green
Write-Host "   ✅ Total keywords: $($keywordsResponse.totalKeywords)" -ForegroundColor Green
Write-Host "   📋 Primera industria y sus keywords:" -ForegroundColor Cyan
$first = $keywordsResponse.industries[0]
Write-Host "      $($first.name): $($first.keywords -join ', ')" -ForegroundColor White
Write-Host ""

# 3. POST /industries/detect (Detectar industria)
Write-Host "3️⃣ POST /industries/detect (Detectar industria del texto)" -ForegroundColor Yellow

$testCases = @(
    @{text = "Quiero crear una tienda online para vender productos"; expectedIndustry = "E-commerce"},
    @{text = "Necesito un sistema para mi restaurante de comida"; expectedIndustry = "Alimentos"},
    @{text = "App para gestión de pacientes en mi clínica médica"; expectedIndustry = "Salud"},
    @{text = "Plataforma educativa para cursos online"; expectedIndustry = "Educación"}
)

foreach ($test in $testCases) {
    Write-Host "   📝 Texto: '$($test.text.Substring(0, [Math]::Min(50, $test.text.Length)))...'" -ForegroundColor Gray
    
    $body = @{
        text = $test.text
        language = "es"
    } | ConvertTo-Json

    $detectResponse = Invoke-RestMethod -Uri "$BASE_URL/industries/detect" -Method POST -Body $body -ContentType "application/json"
    
    if ($detectResponse.industry) {
        Write-Host "      ✅ Detectado: $($detectResponse.icon) $($detectResponse.industry) (confianza: $($detectResponse.confidence))" -ForegroundColor Green
        Write-Host "      🔑 Keyword: '$($detectResponse.keyword)'" -ForegroundColor Cyan
    } else {
        Write-Host "      ❌ No se detectó industria" -ForegroundColor Red
    }
    Write-Host ""
}

# 4. GET /industries/:id (Obtener industria específica)
Write-Host "4️⃣ GET /industries/:id (Obtener una industria específica)" -ForegroundColor Yellow
$firstIndustryId = $response.industries[0].id
Write-Host "   Endpoint: $BASE_URL/industries/$firstIndustryId`n" -ForegroundColor Gray
$industryDetail = Invoke-RestMethod -Uri "$BASE_URL/industries/$firstIndustryId" -Method GET
Write-Host "   ✅ $($industryDetail.icon) $($industryDetail.name)" -ForegroundColor Green
Write-Host "   📝 Descripción: $($industryDetail.description)" -ForegroundColor Cyan
Write-Host "   🔑 Total keywords: $($industryDetail.keywords.Count)" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ✅ TODOS LOS TESTS COMPLETADOS" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan
