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

// Add CORS - Restrictive configuration
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:3000", "http://frontend:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .WithHeaders("Content-Type", "Authorization", "Accept")
              .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
              .AllowCredentials()
              .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
    });
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["Secret"];

// Fall back to a safe default if the secret is missing or too short
if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
{
    secretKey = "TuCreditoOnline-SecretKey-32chars-minimum-security-2026-production";
    Console.WriteLine("Warning: Using default JWT secret. Configure JwtSettings:Secret in production.");
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
