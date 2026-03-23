using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TuCreditoOnline.API.Extensions;
using TuCreditoOnline.Infrastructure.Persistence;
using TuCreditoOnline.Infrastructure.Repositories;
using TuCreditoOnline.Infrastructure.Services;

namespace TuCreditoOnline.Tests.UnitTests.API.Extensions;

public class ServiceExtensionsTests
{
    [Fact]
    public void AddApplicationServices_ShouldReturnSameServiceCollection()
    {
        var services = new ServiceCollection();

        var result = services.AddApplicationServices();

        result.Should().BeSameAs(services);
    }

    [Fact]
    public void AddInfrastructureServices_ShouldRegisterResolvableDependencies()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["MongoDbSettings:ConnectionString"] = "mongodb://127.0.0.1:27017",
                ["MongoDbSettings:DatabaseName"] = "TuCreditoOnline_UnitTests"
            })
            .Build();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddOptions();

        var result = services.AddInfrastructureServices(configuration);

        result.Should().BeSameAs(services);
        var provider = services.BuildServiceProvider(validateScopes: true);

        provider.GetRequiredService<MongoDbContext>();

        using var scope = provider.CreateScope();
        var scoped = scope.ServiceProvider;
        scoped.GetRequiredService<IDatabaseHealthService>();
        scoped.GetRequiredService<CreditRequestRepository>();
        scoped.GetRequiredService<UserRepository>();
        scoped.GetRequiredService<CreditTypeRepository>();
        scoped.GetRequiredService<ServiceRepository>();
        scoped.GetRequiredService<ContactMessageRepository>();
        scoped.GetRequiredService<CreditRequestService>();
        scoped.GetRequiredService<AuthService>();
        scoped.GetRequiredService<DashboardService>();
        scoped.GetRequiredService<UserManagementService>();
        scoped.GetRequiredService<CreditTypeService>();
        scoped.GetRequiredService<ServiceManagementService>();
        scoped.GetRequiredService<BackupService>();
        scoped.GetRequiredService<ContactMessageService>();
    }
}
