# Script de pruebas automatizadas del CRM
Write-Host "`n=== AUDITORÍA COMPLETA DEL CRM ===" -ForegroundColor Cyan
Write-Host "Fecha: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

$ErrorActionPreference = "Stop"
$results = @()

# Función para registrar resultados
function Add-TestResult {
    param($Test, $Status, $Details)
    $script:results += [PSCustomObject]@{
        Test = $Test
        Status = $Status
        Details = $Details
    }
    $color = if ($Status -eq "✅") { "Green" } elseif ($Status -eq "❌") { "Red" } else { "Yellow" }
    Write-Host "$Status $Test" -ForegroundColor $color
    if ($Details) { Write-Host "   $Details" -ForegroundColor Gray }
}

try {
    # TEST 1: LOGIN
    Write-Host "`n[1/15] Probando LOGIN..." -ForegroundColor Yellow
    $loginBody = @{
        email = "admin@nexohub.com"
        password = "Admin123!"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResponse.accessToken
    $headers = @{Authorization = "Bearer $token"}
    Add-TestResult "LOGIN con credenciales correctas" "✅" "Token obtenido"

    # TEST 2: GET ROLES
    Write-Host "`n[2/15] Probando GET /api/roles..." -ForegroundColor Yellow
    $roles = Invoke-RestMethod -Uri "http://localhost:3000/api/roles" -Method GET -Headers $headers
    Add-TestResult "GET /api/roles" "✅" "$($roles.Count) roles encontrados"
    
    # TEST 3: GET USERS
    Write-Host "`n[3/15] Probando GET /api/users..." -ForegroundColor Yellow
    $users = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method GET -Headers $headers
    Add-TestResult "GET /api/users" "✅" "$($users.Count) usuarios encontrados"

    # TEST 4: CREATE USER
    Write-Host "`n[4/15] Probando POST /api/users (crear usuario)..." -ForegroundColor Yellow
    $tecnicoRole = $roles | Where-Object { $_.key -eq 'TECNICO' } | Select-Object -First 1
    $randomEmail = "tecnico.test$(Get-Random -Minimum 1000 -Maximum 9999)@test.com"
    $newUserData = @{
        name = "Técnico Prueba"
        email = $randomEmail
        password = "Test123!@"
        roleId = $tecnicoRole.id
    } | ConvertTo-Json
    
    $newUser = Invoke-RestMethod -Uri "http://localhost:3000/api/users" -Method POST -ContentType "application/json" -Headers $headers -Body $newUserData
    Add-TestResult "POST /api/users (crear usuario)" "✅" "Usuario creado: $($newUser.name) - Rol: $($newUser.role.name)"

    # TEST 5: GET INSURERS
    Write-Host "`n[5/15] Probando GET /api/insurers..." -ForegroundColor Yellow
    $insurers = Invoke-RestMethod -Uri "http://localhost:3000/api/insurers" -Method GET -Headers $headers
    Add-TestResult "GET /api/insurers" "✅" "$($insurers.Count) aseguradoras encontradas"

    # TEST 6: CREATE CASE
    Write-Host "`n[6/15] Probando POST /api/cases (crear caso)..." -ForegroundColor Yellow
    $insurer = $insurers | Select-Object -First 1
    $caseData = @{
        insurerId = $insurer.id
        externalId = "AUDIT-$(Get-Random -Minimum 1000 -Maximum 9999)"
        serviceType = "Grúa"
    } | ConvertTo-Json
    
    $newCase = Invoke-RestMethod -Uri "http://localhost:3000/api/cases" -Method POST -ContentType "application/json" -Headers $headers -Body $caseData
    Add-TestResult "POST /api/cases (crear caso)" "✅" "Caso creado: $($newCase.externalId) - Estado: $($newCase.status)"
    $caseId = $newCase.id

    # TEST 7: GET CASES
    Write-Host "`n[7/15] Probando GET /api/cases..." -ForegroundColor Yellow
    $cases = Invoke-RestMethod -Uri "http://localhost:3000/api/cases" -Method GET -Headers $headers
    Add-TestResult "GET /api/cases" "✅" "Total: $($cases.total) casos, Página: $($cases.data.Count) casos"

    # TEST 8: GET CASE BY ID
    Write-Host "`n[8/15] Probando GET /api/cases/:id..." -ForegroundColor Yellow
    $case = Invoke-RestMethod -Uri "http://localhost:3000/api/cases/$caseId" -Method GET -Headers $headers
    Add-TestResult "GET /api/cases/:id" "✅" "Caso obtenido: $($case.externalId)"

    # TEST 9: UPDATE CASE
    Write-Host "`n[9/15] Probando PATCH /api/cases/:id..." -ForegroundColor Yellow
    $updateData = @{
        driverName = "Juan Pérez"
    } | ConvertTo-Json
    $updatedCase = Invoke-RestMethod -Uri "http://localhost:3000/api/cases/$caseId" -Method PATCH -ContentType "application/json" -Headers $headers -Body $updateData
    Add-TestResult "PATCH /api/cases/:id (actualizar caso)" "✅" "Conductor actualizado: $($updatedCase.driverName)"

    # TEST 10: ASSIGN CASE TO USER
    Write-Host "`n[10/15] Probando POST /api/cases/:id/assign..." -ForegroundColor Yellow
    $assignData = @{
        userId = $newUser.id
        reason = "Asignación de prueba"
    } | ConvertTo-Json
    $assignedCase = Invoke-RestMethod -Uri "http://localhost:3000/api/cases/$caseId/assign" -Method POST -ContentType "application/json" -Headers $headers -Body $assignData
    Add-TestResult "POST /api/cases/:id/assign" "✅" "Caso asignado a: $($assignedCase.assignedToUser.name)"

    # TEST 11: GET DASHBOARD STATS
    Write-Host "`n[11/15] Probando GET /api/dashboard/stats..." -ForegroundColor Yellow
    $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard/stats" -Method GET -Headers $headers
    Add-TestResult "GET /api/dashboard/stats" "✅" "Total: $($stats.totalCases), Activos: $($stats.activeCases), Listos: $($stats.readyToInvoice)"

    # TEST 12: CREATE SURCHARGE
    Write-Host "`n[12/15] Probando POST /api/surcharges (crear recargo)..." -ForegroundColor Yellow
    $surchargeData = @{
        caseId = $caseId
        requestedAmount = 10000
        surchargeAmount = 2000
        reason = "Peaje adicional - Prueba automatizada"
    } | ConvertTo-Json
    $surcharge = Invoke-RestMethod -Uri "http://localhost:3000/api/surcharges" -Method POST -ContentType "application/json" -Headers $headers -Body $surchargeData
    Add-TestResult "POST /api/surcharges (crear recargo)" "✅" "Recargo creado: $($surcharge.reason)"
    $surchargeId = $surcharge.id

    # TEST 13: GET SURCHARGES
    Write-Host "`n[13/15] Probando GET /api/surcharges..." -ForegroundColor Yellow
    $surcharges = Invoke-RestMethod -Uri "http://localhost:3000/api/surcharges" -Method GET -Headers $headers
    Add-TestResult "GET /api/surcharges" "✅" "$($surcharges.Count) recargos encontrados"

    # TEST 14: APPROVE SURCHARGE
    Write-Host "`n[14/15] Probando POST /api/surcharges/:id/approve..." -ForegroundColor Yellow
    $approveData = @{
        approvedAmount = 1500
        notes = "Aprobado parcialmente - Prueba"
    } | ConvertTo-Json
    $approvedSurcharge = Invoke-RestMethod -Uri "http://localhost:3000/api/surcharges/$surchargeId/approve" -Method POST -ContentType "application/json" -Headers $headers -Body $approveData
    Add-TestResult "POST /api/surcharges/:id/approve" "✅" "Recargo aprobado: $($approvedSurcharge.approvedAmount/100) EUR"

    # TEST 15: GET BILLING READY CASES
    Write-Host "`n[15/15] Probando GET /api/billing/ready-cases..." -ForegroundColor Yellow
    $readyCases = Invoke-RestMethod -Uri "http://localhost:3000/api/billing/ready-cases" -Method GET -Headers $headers
    Add-TestResult "GET /api/billing/ready-cases" "✅" "$($readyCases.Count) casos listos para facturar"

} catch {
    Add-TestResult "ERROR CRÍTICO" "❌" $_.Exception.Message
}

# RESUMEN
Write-Host "`n`n=== RESUMEN DE PRUEBAS ===" -ForegroundColor Cyan
$passed = ($results | Where-Object { $_.Status -eq "✅" }).Count
$failed = ($results | Where-Object { $_.Status -eq "❌" }).Count
$total = $results.Count

Write-Host "Total de pruebas: $total" -ForegroundColor White
Write-Host "Exitosas: $passed" -ForegroundColor Green
Write-Host "Fallidas: $failed" -ForegroundColor Red
Write-Host "Porcentaje de éxito: $([math]::Round(($passed/$total)*100, 2))%" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })

# Guardar resultados
$results | Export-Csv -Path "test-results.csv" -NoTypeInformation -Encoding UTF8
Write-Host "`nResultados guardados en: test-results.csv" -ForegroundColor Gray

if ($failed -eq 0) {
    Write-Host "`n✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  ALGUNAS PRUEBAS FALLARON - REVISAR ERRORES" -ForegroundColor Yellow
}
