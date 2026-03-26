using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using TuCreditoOnline.API.Extensions;
using TuCreditoOnline.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

ConfigureSwagger(builder);

var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://frontend:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin => IsOriginAllowed(origin, allowedOrigins))
              .WithHeaders("Content-Type", "Authorization", "Accept")
              .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = ResolveJwtSecret(builder);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Map "role" del JWT a ClaimTypes.Role para que [Authorize(Roles = "...")] reconozca el rol.
    options.MapInboundClaims = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero,
        // Debe coincidir con el tipo de claim emitido en AuthService.GenerateJwtToken ("role").
        RoleClaimType = "role",
    };
});

builder.Services.AddAuthorization();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApplicationServices();

var app = builder.Build();

if (!app.Environment.IsEnvironment("Testing"))
{
    try
    {
        await AdminUserSeeder.SeedAsync(app);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Warning: default admin seed failed but startup will continue. Error: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "TuCreditoOnline API v1");
        options.RoutePrefix = "swagger";
        options.DocumentTitle = "TuCreditoOnline API Documentation";
    });
}

app.UseSecurityHeaders();
app.UseRequestValidation();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await app.RunAsync();

// --- Local helpers ---

static void ConfigureSwagger(WebApplicationBuilder b)
{
    b.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
        {
            Title = "TuCreditoOnline API",
            Version = "v1",
            Description = "Credit management system API with MongoDB backend",
            Contact = new Microsoft.OpenApi.Models.OpenApiContact
            {
                Name = "TuCreditoOnline Team",
                Email = "support@tucreditoonline.com"
            }
        });

        var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
        var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
        if (File.Exists(xmlPath))
            options.IncludeXmlComments(xmlPath);
    });
}

static bool IsOriginAllowed(string origin, string[] allowedOrigins)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
    var host = uri.Host;
    if (allowedOrigins.Contains(origin)) return true;
    // GitHub Pages deployments: *.github.io only
    if (host.EndsWith(".github.io")) return true;
    // Surge.sh PR preview deployments: *.surge.sh only
    if (host.EndsWith(".surge.sh")) return true;
    return false;
}

static string ResolveJwtSecret(WebApplicationBuilder b)
{
    var secret = b.Configuration.GetSection("JwtSettings")["Secret"];
    if (!string.IsNullOrEmpty(secret) && secret.Length >= 32)
        return secret;

    if (b.Environment.IsProduction())
        throw new InvalidOperationException(
            "JwtSettings:Secret must be set to a string of 32+ characters in production. " +
            "Set it via the JWT_SECRET environment variable or appsettings.");

    // Development only: generate a random secret so the app starts without configuration.
    // Tokens will be invalidated on every restart — acceptable for local dev.
    var fallback = $"{Guid.NewGuid():N}{Guid.NewGuid():N}";
    b.Configuration["JwtSettings:RuntimeFallbackSecret"] = fallback;
    Console.WriteLine("Warning: JwtSettings:Secret not configured. Using a random secret for this session.");
    return fallback;
}

// Make the implicit Program class public so test projects can access it
public partial class Program
{
    protected Program() { }
}
