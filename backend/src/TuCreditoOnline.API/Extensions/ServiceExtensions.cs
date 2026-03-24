using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using TuCreditoOnline.Infrastructure.Persistence;
using TuCreditoOnline.Infrastructure.Services;
using TuCreditoOnline.Infrastructure.Repositories;

namespace TuCreditoOnline.API.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Add application services here (use cases, handlers, etc.)
        
        return services;
    }

    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IConfiguration>(configuration);

        // Configure MongoDB settings
        services.Configure<MongoDbSettings>(configuration.GetSection("MongoDbSettings"));
        
        // Register MongoDB context
        services.AddSingleton<MongoDbContext>();
        
        // Register services
        services.AddScoped<IDatabaseHealthService, DatabaseHealthService>();
        services.AddScoped<CreditRequestService>();
        services.AddScoped<AuthService>();
        services.AddScoped<DashboardService>();
        services.AddScoped<UserManagementService>();
        services.AddScoped<CreditTypeService>();
        services.AddScoped<ServiceManagementService>();
        services.AddScoped<BackupService>();
        services.AddScoped<ContactMessageService>();
        
        // Register repositories
        services.AddScoped<CreditRequestRepository>();
        services.AddScoped<UserRepository>();
        services.AddScoped<CreditTypeRepository>();
        services.AddScoped<ServiceRepository>();
        services.AddScoped<ContactMessageRepository>();
        
        return services;
    }
}
