using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Tests.IntegrationTests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        // Prioridad alta sobre el resto de fuentes (evita que otra capa sobrescriba el flag).
        builder.UseSetting("IntegrationTests:AllowRequestRoleInRegistration", "true");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Override configuration for testing. TCO_INTEGRATION_MONGO permite ejecutar dotnet test
            // dentro de Docker (p. ej. host.docker.internal) manteniendo localhost en el host.
            var mongoConn =
                Environment.GetEnvironmentVariable("TCO_INTEGRATION_MONGO")
                ?? "mongodb://localhost:27017";
            // JWT: appsettings.Testing.json (misma fuente que firma y valida el token).
            // Solo sobrescribimos Mongo si TCO_INTEGRATION_MONGO (Docker) está definido.
            var testOverrides = new Dictionary<string, string?>
            {
                ["MongoDbSettings:ConnectionString"] = mongoConn,
                ["MongoDbSettings:DatabaseName"] = "TuCreditoOnline_Test",
                ["IntegrationTests:AllowRequestRoleInRegistration"] = "true",
            };
            config.AddInMemoryCollection(testOverrides);
        });

        builder.ConfigureServices(services =>
        {
            // Additional service configuration for tests can be added here
        });
    }
}
