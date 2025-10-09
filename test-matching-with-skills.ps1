# Script para verificar que el matching funciona después de sincronizar skills
# Uso: .\test-matching-with-skills.ps1 -ProjectId "..." [-BaseUrl "http://localhost:3000"]

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "🔍 VERIFICACIÓN DE MATCHING CON SKILLS SINCRONIZADAS" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Función para hacer requests
function Invoke-ApiRequest {
    param($Url, $Method = "GET", $Body = $null)
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json -Depth 10
        }
        
        $response = Invoke-RestMethod @params
        return $response
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        return $null
    }
}

# Test 1: Verificar equipos y sus skills
Write-Host "📊 TEST 1: Verificar equipos con skills" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Gray
Write-Host ""

$teamsUrl = "$BaseUrl/teams?page=1`&limit=10"
Write-Host "GET $teamsUrl" -ForegroundColor Gray
$teamsResponse = Invoke-ApiRequest -Url $teamsUrl

if ($teamsResponse) {
    Write-Host "✅ Respuesta recibida" -ForegroundColor Green
    Write-Host ""
    
    $teamsWithSkills = 0
    $teamsWithoutSkills = 0
    $totalSkills = 0
    
    foreach ($team in $teamsResponse.data) {
        $skillCount = if ($team.skills) { $team.skills.Count } else { 0 }
        $totalSkills += $skillCount
        
        if ($skillCount -gt 0) {
            $teamsWithSkills++
            Write-Host "✅ $($team.name)" -ForegroundColor Green
            Write-Host "   ID: $($team.id)" -ForegroundColor Gray
            Write-Host "   Miembros: $($team._count.members)" -ForegroundColor Gray
            Write-Host "   Skills: $skillCount" -ForegroundColor Cyan
            
            # Mostrar primeras 5 skills
            $firstSkills = $team.skills | Select-Object -First 5
            foreach ($teamSkill in $firstSkills) {
                Write-Host "      - $($teamSkill.skill.name)" -ForegroundColor White
            }
            if ($team.skills.Count -gt 5) {
                Write-Host "      ... y $($team.skills.Count - 5) más" -ForegroundColor Gray
            }
        } else {
            $teamsWithoutSkills++
            Write-Host "⚠️  $($team.name)" -ForegroundColor Yellow
            Write-Host "   ID: $($team.id)" -ForegroundColor Gray
            Write-Host "   Miembros: $($team._count.members)" -ForegroundColor Gray
            Write-Host "   Skills: 0" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    Write-Host "📊 Resumen:" -ForegroundColor Cyan
    Write-Host "   Total de equipos: $($teamsResponse.data.Count)" -ForegroundColor White
    Write-Host "   Equipos con skills: $teamsWithSkills" -ForegroundColor Green
    Write-Host "   Equipos sin skills: $teamsWithoutSkills" -ForegroundColor Yellow
    Write-Host "   Total de skills: $totalSkills" -ForegroundColor Cyan
    Write-Host "   Promedio skills/equipo: $([math]::Round($totalSkills / $teamsResponse.data.Count, 2))" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "======================================================================" -ForegroundColor Gray
Write-Host ""

# Test 2: Matching de equipos (si se proporciona projectId)
if ($ProjectId -ne "") {
    Write-Host "🎯 TEST 2: Matching de equipos para proyecto" -ForegroundColor Yellow
    Write-Host "======================================================================" -ForegroundColor Gray
    Write-Host ""
    
    $matchingUrl = "$BaseUrl/matching/projects/$ProjectId/candidates"
    Write-Host "POST $matchingUrl" -ForegroundColor Gray
    $matchingResponse = Invoke-ApiRequest -Url $matchingUrl -Method "POST"
    
    if ($matchingResponse) {
        Write-Host "✅ Respuesta recibida" -ForegroundColor Green
        Write-Host ""
        
        if ($matchingResponse.data.totalMatches -gt 0) {
            Write-Host "🎉 ¡MATCHING FUNCIONA!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 Resultados:" -ForegroundColor Cyan
            Write-Host "   Total matches: $($matchingResponse.data.totalMatches)" -ForegroundColor White
            Write-Host "   Equipos: $($matchingResponse.data.teams)" -ForegroundColor White
            Write-Host "   Freelancers: $($matchingResponse.data.freelancers)" -ForegroundColor White
            Write-Host ""
            
            # Mostrar primeros 3 candidatos
            Write-Host "🏆 Top 3 Candidatos:" -ForegroundColor Yellow
            $topCandidates = $matchingResponse.data.candidates | Select-Object -First 3
            
            foreach ($candidate in $topCandidates) {
                if ($candidate.type -eq "team") {
                    Write-Host ""
                    Write-Host "   Equipo: $($candidate.team.name)" -ForegroundColor Cyan
                    Write-Host "      Score: $($candidate.score)%" -ForegroundColor Green
                    Write-Host "      Skills Match: $($candidate.skillsMatch)%" -ForegroundColor Cyan
                    Write-Host "      Budget Match: $($candidate.budgetMatch)%" -ForegroundColor Cyan
                    Write-Host "      Timeline Match: $($candidate.timelineMatch)%" -ForegroundColor Cyan
                    
                    if ($candidate.matchedSkills -and $candidate.matchedSkills.Count -gt 0) {
                        Write-Host "      Skills coincidentes:" -ForegroundColor White
                        $firstMatchedSkills = $candidate.matchedSkills | Select-Object -First 5
                        foreach ($skill in $firstMatchedSkills) {
                            Write-Host "         ✅ $skill" -ForegroundColor Green
                        }
                        if ($candidate.matchedSkills.Count -gt 5) {
                            Write-Host "         ... y $($candidate.matchedSkills.Count - 5) más" -ForegroundColor Gray
                        }
                    }
                }
            }
            Write-Host ""
        } else {
            Write-Host "⚠️  Matching devolvió 0 resultados" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Posibles causas:" -ForegroundColor Yellow
            Write-Host "   - El proyecto no tiene skills configuradas" -ForegroundColor Gray
            Write-Host "   - Los equipos no tienen skills que coincidan con el proyecto" -ForegroundColor Gray
            Write-Host "   - Los filtros de budget/timeline son muy restrictivos" -ForegroundColor Gray
            Write-Host ""
        }
    }
    
    Write-Host "======================================================================" -ForegroundColor Gray
    Write-Host ""
}

# Test 3: Verificar skills más comunes
Write-Host "📈 TEST 3: Skills más comunes en equipos" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Gray
Write-Host ""

if ($teamsResponse) {
    $skillCounts = @{}
    
    foreach ($team in $teamsResponse.data) {
        if ($team.skills) {
            foreach ($teamSkill in $team.skills) {
                $skillName = $teamSkill.skill.name
                if ($skillCounts.ContainsKey($skillName)) {
                    $skillCounts[$skillName]++
                } else {
                    $skillCounts[$skillName] = 1
                }
            }
        }
    }
    
    if ($skillCounts.Count -gt 0) {
        $topSkills = $skillCounts.GetEnumerator() | Sort-Object -Property Value -Descending | Select-Object -First 10
        
        Write-Host "🏆 Top 10 Skills en equipos:" -ForegroundColor Cyan
        Write-Host ""
        
        $rank = 1
        foreach ($skill in $topSkills) {
            $percentage = [math]::Round(($skill.Value / $teamsResponse.data.Count) * 100, 1)
            Write-Host "   $rank. $($skill.Key)" -ForegroundColor White
            Write-Host "      Equipos con esta skill: $($skill.Value) ($percentage%)" -ForegroundColor Gray
            $rank++
        }
    } else {
        Write-Host "⚠️  No hay skills configuradas en ningún equipo" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Gray
Write-Host ""

# Resumen final
Write-Host "✅ RESUMEN FINAL" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Gray
Write-Host ""

if ($teamsWithSkills -gt 0) {
    Write-Host "✅ Sistema funcionando correctamente" -ForegroundColor Green
    Write-Host "   - Equipos con skills: $teamsWithSkills" -ForegroundColor Green
    Write-Host "   - Skills sincronizadas correctamente" -ForegroundColor Green
    
    if ($ProjectId -ne "" -and $matchingResponse -and $matchingResponse.data.totalMatches -gt 0) {
        Write-Host "   - Matching funcional: ✅" -ForegroundColor Green
        Write-Host "   - Resultados de matching: $($matchingResponse.data.totalMatches)" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Sistema necesita atención" -ForegroundColor Yellow
    Write-Host "   - Equipos sin skills: $teamsWithoutSkills" -ForegroundColor Yellow
    Write-Host "   - Se requiere que los miembros agreguen skills a sus perfiles" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""
