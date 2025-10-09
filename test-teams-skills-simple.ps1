# Script para verificar que el matching funciona después de sincronizar skills
# Uso: .\test-teams-skills-simple.ps1

param(
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "http://localhost:3000"
)

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "VERIFICACION DE SKILLS EN EQUIPOS" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Construir URL
$teamsUrl = $BaseUrl + "/teams?page=1" + "&" + "limit=10"

Write-Host "GET $teamsUrl" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $teamsUrl -Method GET -ContentType "application/json"
    
    if ($response -and $response.data) {
        Write-Host "Respuesta recibida" -ForegroundColor Green
        Write-Host ""
        
        $teamsWithSkills = 0
        $teamsWithoutSkills = 0
        $totalSkills = 0
        
        foreach ($team in $response.data) {
            $skillCount = 0
            if ($team.skills) {
                $skillCount = $team.skills.Count
            }
            $totalSkills += $skillCount
            
            if ($skillCount -gt 0) {
                $teamsWithSkills++
                Write-Host "OK $($team.name)" -ForegroundColor Green
                Write-Host "   ID: $($team.id)" -ForegroundColor Gray
                Write-Host "   Skills: $skillCount" -ForegroundColor Cyan
                
                # Mostrar primeras 5 skills
                $maxSkills = [Math]::Min(5, $team.skills.Count)
                for ($i = 0; $i -lt $maxSkills; $i++) {
                    Write-Host "      - $($team.skills[$i].skill.name)" -ForegroundColor White
                }
                if ($team.skills.Count -gt 5) {
                    Write-Host "      ... y mas" -ForegroundColor Gray
                }
            } else {
                $teamsWithoutSkills++
                Write-Host "WARN $($team.name)" -ForegroundColor Yellow
                Write-Host "   ID: $($team.id)" -ForegroundColor Gray
                Write-Host "   Skills: 0" -ForegroundColor Yellow
            }
            Write-Host ""
        }
        
        Write-Host "======================================================================" -ForegroundColor Gray
        Write-Host "RESUMEN:" -ForegroundColor Cyan
        Write-Host "   Total de equipos: $($response.data.Count)" -ForegroundColor White
        Write-Host "   Equipos con skills: $teamsWithSkills" -ForegroundColor Green
        Write-Host "   Equipos sin skills: $teamsWithoutSkills" -ForegroundColor Yellow
        Write-Host "   Total de skills: $totalSkills" -ForegroundColor Cyan
        
        if ($response.data.Count -gt 0) {
            $avg = [Math]::Round($totalSkills / $response.data.Count, 2)
            Write-Host "   Promedio skills/equipo: $avg" -ForegroundColor Cyan
        }
        Write-Host ""
        
        if ($teamsWithSkills -gt 0) {
            Write-Host "SISTEMA FUNCIONANDO CORRECTAMENTE" -ForegroundColor Green
        } else {
            Write-Host "SISTEMA NECESITA ATENCION" -ForegroundColor Yellow
            Write-Host "Los equipos no tienen skills configuradas" -ForegroundColor Yellow
        }
        Write-Host ""
        Write-Host "======================================================================" -ForegroundColor Gray
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
