# Script de verificación de Swagger UI
Write-Host "=== VERIFICACIÓN DE SWAGGER UI ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: HTML principal
Write-Host "1. Verificando HTML principal (/api/docs/)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/docs/" -UseBasicParsing
    Write-Host "   ✓ Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: JavaScript bundle
Write-Host "2. Verificando swagger-ui-bundle.js..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/docs/swagger-ui-bundle.js" -UseBasicParsing
    Write-Host "   ✓ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ✓ Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: CSS
Write-Host "3. Verificando swagger-ui.css..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/docs/swagger-ui.css" -UseBasicParsing
    Write-Host "   ✓ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   ✓ Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Preset
Write-Host "4. Verificando swagger-ui-standalone-preset.js..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/docs/swagger-ui-standalone-preset.js" -UseBasicParsing
    Write-Host "   ✓ Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: JSON spec
Write-Host "5. Verificando swagger-ui-init.js..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/docs/swagger-ui-init.js" -UseBasicParsing
    Write-Host "   ✓ Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIN DE VERIFICACIÓN ===" -ForegroundColor Cyan
