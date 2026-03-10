# Script para ejecutar tests del backend
# Requiere tener .NET SDK 8.0 instalado localmente

Write-Host "Ejecutando tests del proyecto TuCreditoOnline..." -ForegroundColor Cyan

# Navegar al directorio de tests
$testsPath = Join-Path $PSScriptRoot "tests\TuCreditoOnline.Tests"

if (-not (Test-Path $testsPath)) {
    Write-Host "Error: No se encontró el directorio de tests en $testsPath" -ForegroundColor Red
    exit 1
}

Set-Location $testsPath

# Verificar si .NET SDK está instalado
try {
    $dotnetVersion = dotnet --version
    Write-Host ".NET SDK Version: $dotnetVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: .NET SDK no está instalado. Descárgalo desde https://dotnet.microsoft.com/download" -ForegroundColor Red
    exit 1
}

# Restaurar paquetes
Write-Host "`nRestaurando paquetes NuGet..." -ForegroundColor Yellow
dotnet restore

# Ejecutar tests
Write-Host "`nEjecutando tests..." -ForegroundColor Yellow
dotnet test --logger "console;verbosity=detailed"

# Ejecutar tests con cobertura
Write-Host "`nEjecutando tests con cobertura de código..." -ForegroundColor Yellow
dotnet test --collect:"XPlat Code Coverage"

Write-Host "`nTests completados!" -ForegroundColor Green
