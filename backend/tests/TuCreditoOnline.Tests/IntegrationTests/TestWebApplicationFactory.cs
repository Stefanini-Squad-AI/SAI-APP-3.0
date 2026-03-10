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
        builder.ConfigureAppConfiguration((context, config) =>
        {
            // Override configuration for testing
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["MongoDbSettings:ConnectionString"] = "mongodb://localhost:27017",
                ["MongoDbSettings:DatabaseName"] = "TuCreditoOnline_Test",
                ["JwtSettings:Secret"] = "superSecretKeyForTestingOnly123456789012345678901234567890",
                ["JwtSettings:Issuer"] = "TuCreditoOnline",
                ["JwtSettings:Audience"] = "TuCreditoOnlineUsers",
                ["JwtSettings:ExpirationMinutes"] = "60",
                ["JwtSettings:RefreshTokenExpirationDays"] = "7"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Additional service configuration for tests can be added here
        });
    }
}
