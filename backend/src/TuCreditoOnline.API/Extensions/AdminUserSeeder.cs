using TuCreditoOnline.Domain.Entities;
using TuCreditoOnline.Infrastructure.Repositories;

namespace TuCreditoOnline.API.Extensions;

public static class AdminUserSeeder
{
    public static async Task SeedAsync(WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("AdminUserSeeder");
        var userRepository = scope.ServiceProvider.GetRequiredService<UserRepository>();

        var email = (config["DefaultAdmin:Email"] ?? "admin@tucreditoonline.local").Trim().ToLowerInvariant();
        var password = (config["DefaultAdmin:Password"] ?? "Admin123!").Trim();
        var fullName = (config["DefaultAdmin:FullName"] ?? "System Administrator").Trim();
        var role = (config["DefaultAdmin:Role"] ?? "Admin").Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning("Skipping default admin seed because email/password are empty.");
            return;
        }

        const int maxAttempts = 12;
        var retryDelay = TimeSpan.FromSeconds(5);

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                var existing = await userRepository.GetByEmailAsync(email);
                if (existing != null)
                {
                    logger.LogInformation("Default admin user already exists: {Email}", email);
                    return;
                }

                var adminUser = new User
                {
                    Email = email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                    FullName = fullName,
                    Role = string.IsNullOrWhiteSpace(role) ? "Admin" : role,
                    IsActive = true,
                    LastLogin = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await userRepository.AddAsync(adminUser);
                logger.LogInformation("Default admin user created successfully: {Email}", email);
                return;
            }
            catch (Exception ex)
            {
                if (attempt == maxAttempts)
                {
                    logger.LogError(
                        ex,
                        "Failed to seed default admin user after {MaxAttempts} attempts. Startup continues without seeded admin.",
                        maxAttempts
                    );
                    return;
                }

                logger.LogWarning(
                    ex,
                    "Default admin seed attempt {Attempt}/{MaxAttempts} failed. Retrying in {RetryDelaySeconds}s.",
                    attempt,
                    maxAttempts,
                    retryDelay.TotalSeconds
                );
                await Task.Delay(retryDelay);
            }
        }
    }
}
