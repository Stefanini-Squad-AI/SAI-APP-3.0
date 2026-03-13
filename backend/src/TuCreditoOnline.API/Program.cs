using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using TuCreditoOnline.API.Extensions;
using TuCreditoOnline.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with detailed documentation
builder.Services.AddSwaggerGen(options =>
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

    // Include XML comments for better documentation
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// Add CORS
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:3000", "http://frontend:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.SetIsOriginAllowed(origin =>
              {
                  // Explicitly configured origins (e.g. from appsettings or env)
                  if (allowedOrigins.Contains(origin)) return true;
                  // GitHub Pages deployments
                  if (origin.Contains(".github.io")) return true;
                  // Surge.sh PR preview deployments
                  if (origin.EndsWith(".surge.sh")) return true;
                  return false;
              })
              .WithHeaders("Content-Type", "Authorization", "Accept")
              .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"];

if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
{
    if (builder.Environment.IsProduction())
        throw new InvalidOperationException(
            "JwtSettings:Secret must be set to a string of 32+ characters in production. " +
            "Set it via the JWT_SECRET environment variable or appsettings.");

    // Development only: generate a random secret so the app starts without configuration.
    // Tokens will be invalidated on every restart — acceptable for local dev.
    secretKey = $"{Guid.NewGuid():N}{Guid.NewGuid():N}";
    Console.WriteLine("Warning: JwtSettings:Secret not configured. Using a random secret for this session.");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Add Infrastructure services (MongoDB, Repositories, Services)
builder.Services.AddInfrastructureServices(builder.Configuration);

// Add Application services
builder.Services.AddApplicationServices();

var app = builder.Build();

// Seed default admin account on startup (idempotent)
try
{
    await AdminUserSeeder.SeedAsync(app);
}
catch (Exception ex)
{
    Console.WriteLine($"Warning: default admin seed failed but startup will continue. Error: {ex.Message}");
}

// Configure the HTTP request pipeline
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

// Security middlewares
app.UseSecurityHeaders();
app.UseRequestValidation();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

// Make the implicit Program class public so test projects can access it
public partial class Program { }
