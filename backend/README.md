# Backend - TuCreditoOnline API

.NET 8 Web API implementando Clean Architecture.

## 🏛️ Arquitectura Limpia (Clean Architecture)

```
backend/
├── src/
│   ├── TuCreditoOnline.Domain/          # Entidades, Value Objects, Interfaces de Repositorio
│   ├── TuCreditoOnline.Application/     # Casos de Uso, DTOs, Interfaces de Servicios
│   ├── TuCreditoOnline.Infrastructure/  # Implementación de Repositorios, MongoDB, External Services
│   └── TuCreditoOnline.API/             # Controllers, Middleware, Program.cs
└── tests/
    ├── TuCreditoOnline.Domain.Tests/
    ├── TuCreditoOnline.Application.Tests/
    └── TuCreditoOnline.API.Tests/
```

## 🔄 Principios SOLID

- **S**ingle Responsibility
- **O**pen/Closed
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion

## 🚀 Ejecutar Localmente

```bash
cd backend/src/TuCreditoOnline.API
dotnet restore
dotnet run
```

## 📦 Dependencias Principales

- ASP.NET Core 8.0
- MongoDB.Driver
- FluentValidation
- MediatR
- AutoMapper
- Swashbuckle (Swagger)

## 🔐 Autenticación

JWT (JSON Web Tokens) con refresh tokens.
