using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace TuCreditoOnline.Tests.IntegrationTests;

/// <summary>
/// Authentication handler for mocked integration tests.
/// Validates a static bearer token and returns an Admin ClaimsPrincipal,
/// bypassing JWT validation and MongoDB dependency entirely.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "IntegrationTestScheme";
    public const string AdminToken = "integration-test-admin-bearer-token";

    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authHeader = Request.Headers["Authorization"].ToString();

        if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult(AuthenticateResult.NoResult());

        var token = authHeader["Bearer ".Length..].Trim();

        if (token != AdminToken)
            return Task.FromResult(AuthenticateResult.Fail("Invalid test token"));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "test-admin-id"),
            new Claim(ClaimTypes.Name, "admin@test.com"),
            new Claim(ClaimTypes.Email, "admin@test.com"),
            // "role" matches the app's JWT RoleClaimType = "role" config in Program.cs
            new Claim("role", "Admin"),
        };

        // Set roleClaimType to "role" so [Authorize(Roles = "Admin")] resolves correctly
        var identity = new ClaimsIdentity(claims, SchemeName, ClaimTypes.Name, "role");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
