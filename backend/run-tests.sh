#!/bin/bash
# Script para ejecutar tests del backend
# Requiere tener .NET SDK 8.0 instalado localmente

echo -e "\033[0;36mEjecutando tests del proyecto TuCreditoOnline...\033[0m"

# Navegar al directorio de tests
TESTS_PATH="$(dirname "$0")/tests/TuCreditoOnline.Tests"

if [ ! -d "$TESTS_PATH" ]; then
    echo -e "\033[0;31mError: No se encontró el directorio de tests en $TESTS_PATH\033[0m"
    exit 1
fi

cd "$TESTS_PATH" || exit 1

# Verificar si .NET SDK está instalado
if ! command -v dotnet &> /dev/null; then
    echo -e "\033[0;31mError: .NET SDK no está instalado. Descárgalo desde https://dotnet.microsoft.com/download\033[0m"
    exit 1
fi

DOTNET_VERSION=$(dotnet --version)
echo -e "\033[0;32m.NET SDK Version: $DOTNET_VERSION\033[0m"

# Restaurar paquetes
echo -e "\n\033[0;33mRestaurando paquetes NuGet...\033[0m"
dotnet restore

# Ejecutar tests
echo -e "\n\033[0;33mEjecutando tests...\033[0m"
dotnet test --logger "console;verbosity=detailed"

# Ejecutar tests con cobertura
echo -e "\n\033[0;33mEjecutando tests con cobertura de código...\033[0m"
dotnet test --collect:"XPlat Code Coverage"

echo -e "\n\033[0;32mTests completados!\033[0m"
