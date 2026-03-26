using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using TuCreditoOnline.Infrastructure.Persistence;

namespace TuCreditoOnline.Tests.IntegrationTests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("IntegrationTests:AllowRequestRoleInRegistration", "true");

        builder.ConfigureAppConfiguration((context, config) =>
        {
            var mongoConn =
                Environment.GetEnvironmentVariable("TCO_INTEGRATION_MONGO")
                ?? "mongodb://localhost:27017/?serverSelectionTimeoutMS=2000&connectTimeoutMS=2000";
            // Add short-timeout suffix only when using the default localhost URL so that
            // integration tests fail fast instead of hanging 30 s per test when MongoDB
            // is unavailable.
            if (!mongoConn.Contains("serverSelectionTimeout", StringComparison.OrdinalIgnoreCase))
                mongoConn += (mongoConn.Contains('?') ? "&" : "?")
                             + "serverSelectionTimeoutMS=2000&connectTimeoutMS=2000";

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

    protected override void Dispose(bool disposing)
    {
        if (disposing)
        {
            try
            {
                var host = Services.GetService<IHost>();
                host?.StopAsync(TimeSpan.FromSeconds(5)).GetAwaiter().GetResult();
            }
            catch
            {
                // Swallow shutdown exceptions to prevent test host crash
            }
        }
        base.Dispose(disposing);
    }
}
