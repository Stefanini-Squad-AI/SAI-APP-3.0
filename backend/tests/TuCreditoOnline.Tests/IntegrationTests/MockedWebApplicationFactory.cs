using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using TuCreditoOnline.Infrastructure.Persistence;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.IntegrationTests;

/// <summary>
/// WebApplicationFactory that replaces all CRUD services with Moq mocks and
/// overrides JWT authentication with a simple test token handler.
/// Environment is set to "Testing" so AdminUserSeeder is skipped (see Program.cs).
/// </summary>
public class MockedWebApplicationFactory : WebApplicationFactory<Program>
{
    // ── Mock instances ────────────────────────────────────────────────────────

    public Mock<ContactMessageService> MockContactMessageService { get; } =
        new((ContactMessageRepository)null!, (ILogger<ContactMessageService>)null!);

    public Mock<CreditRequestService> MockCreditRequestService { get; } =
        new((CreditRequestRepository)null!);

    public Mock<CreditTypeService> MockCreditTypeService { get; } =
        new((CreditTypeRepository)null!);

    public Mock<ServiceManagementService> MockServiceManagementService { get; } =
        new((ServiceRepository)null!);

    public Mock<UserManagementService> MockUserManagementService { get; } =
        new((UserRepository)null!);

    public Mock<DashboardService> MockDashboardService { get; } =
        new((CreditRequestRepository)null!, (UserRepository)null!);

    public Mock<BackupService> MockBackupService { get; } =
        new((MongoDbContext)null!, (ILogger<BackupService>)null!, (IConfiguration)null!);

    public Mock<AuthService> MockAuthService { get; } =
        new((UserRepository)null!, (IConfiguration)null!);

    public Mock<IDatabaseHealthService> MockDatabaseHealthService { get; } = new();

    // ── Configuration ─────────────────────────────────────────────────────────

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // "Testing" makes Program.cs skip AdminUserSeeder (no MongoDB needed at startup)
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["MongoDbSettings:ConnectionString"] = "mongodb://localhost:27017",
                ["MongoDbSettings:DatabaseName"] = "TuCreditoOnline_MockTest",
                ["IntegrationTests:AllowRequestRoleInRegistration"] = "true",
                // JWT settings must be valid strings (even though we override auth below)
                ["JwtSettings:Secret"] = "TestSecretKeyForIntegrationTestsThatIs64CharsLong!!",
                ["JwtSettings:Issuer"] = "TuCreditoOnline",
                ["JwtSettings:Audience"] = "TuCreditoOnlineUsers",
                ["JwtSettings:ExpirationInMinutes"] = "60",
            });
        });

        builder.ConfigureServices(services =>
        {
            // Override default/challenge scheme to point to test handler.
            // PostConfigure runs last so it overrides the JWT setup from Program.cs.
            services.PostConfigure<AuthenticationOptions>(opts =>
            {
                opts.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                opts.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                opts.DefaultScheme = TestAuthHandler.SchemeName;
            });

            services
                .AddAuthentication()
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName, _ => { });

            // Replace all real CRUD services with mocks
            ReplaceService(services, MockContactMessageService.Object);
            ReplaceService(services, MockCreditRequestService.Object);
            ReplaceService(services, MockCreditTypeService.Object);
            ReplaceService(services, MockServiceManagementService.Object);
            ReplaceService(services, MockUserManagementService.Object);
            ReplaceService(services, MockDashboardService.Object);
            ReplaceService(services, MockBackupService.Object);
            ReplaceService(services, MockAuthService.Object);
            ReplaceService<IDatabaseHealthService>(services, MockDatabaseHealthService.Object);
        });
    }

    private static void ReplaceService<T>(IServiceCollection services, T impl) where T : class
    {
        var existing = services.FirstOrDefault(s => s.ServiceType == typeof(T));
        if (existing != null) services.Remove(existing);
        services.AddSingleton(impl);
    }
}
