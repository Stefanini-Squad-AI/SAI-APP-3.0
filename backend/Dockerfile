# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files first (better caching)
COPY ["src/TuCreditoOnline.API/TuCreditoOnline.API.csproj", "TuCreditoOnline.API/"]
COPY ["src/TuCreditoOnline.Application/TuCreditoOnline.Application.csproj", "TuCreditoOnline.Application/"]
COPY ["src/TuCreditoOnline.Domain/TuCreditoOnline.Domain.csproj", "TuCreditoOnline.Domain/"]
COPY ["src/TuCreditoOnline.Infrastructure/TuCreditoOnline.Infrastructure.csproj", "TuCreditoOnline.Infrastructure/"]

# Restore dependencies (cached layer)
RUN dotnet restore "TuCreditoOnline.API/TuCreditoOnline.API.csproj"

# Copy source code
COPY src/ .

# Build the application
WORKDIR "/src/TuCreditoOnline.API"
RUN dotnet build "TuCreditoOnline.API.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "TuCreditoOnline.API.csproj" \
    -c Release \
    -o /app/publish \
    /p:UseAppHost=false \
    /p:PublishTrimmed=false \
    /p:PublishSingleFile=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS final
WORKDIR /app
EXPOSE 8080

# Create non-root user for security
RUN addgroup -g 1000 appuser && \
    adduser -u 1000 -G appuser -s /bin/sh -D appuser

# Install MongoDB Database Tools (mongodump) - Alpine version
RUN apk add --no-cache mongodb-tools

# Copy published app
COPY --from=publish --chown=appuser:appuser /app/publish .

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "TuCreditoOnline.API.dll"]
