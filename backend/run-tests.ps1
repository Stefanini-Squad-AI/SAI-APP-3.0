# Script para ejecutar tests del backend
# Requiere tener .NET SDK 8.0 instalado localmente

Write-Host "Ejecutando tests del proyecto TuCreditoOnline..." -ForegroundColor Cyan

# Preserve the caller's working directory
Push-Location

try {
    # Navegar al directorio raíz del backend (donde está la solución)
    $backendRoot = $PSScriptRoot
    $testsPath = Join-Path $backendRoot "tests\TuCreditoOnline.Tests"

    if (-not (Test-Path $testsPath)) {
        Write-Host "Error: No se encontró el directorio de tests en $testsPath" -ForegroundColor Red
        exit 1
    }

    Set-Location $backendRoot

    # Verificar si .NET SDK está instalado
    $dotnetVersion = dotnet --version 2>&1
    if ($LASTEXITCODE -ne 0 -or $dotnetVersion -notmatch '^\d') {
        Write-Host "Error: .NET SDK no está instalado o no se encontró ningún SDK." -ForegroundColor Red
        Write-Host "Descárgalo desde: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Yellow
        exit 1
    }
    Write-Host ".NET SDK Version: $dotnetVersion" -ForegroundColor Green

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
}
finally {
    # Always restore the caller's working directory
    Pop-Location
}
