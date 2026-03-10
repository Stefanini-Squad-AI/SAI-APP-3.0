using System.Text;
using TuCreditoOnline.Infrastructure.Security;

namespace TuCreditoOnline.API.Middleware;

public class RequestValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestValidationMiddleware> _logger;
    private const int MaxRequestBodySize = 10 * 1024 * 1024; // 10 MB

    public RequestValidationMiddleware(RequestDelegate next, ILogger<RequestValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Check request body size
        if (context.Request.ContentLength.HasValue && 
            context.Request.ContentLength.Value > MaxRequestBodySize)
        {
            _logger.LogWarning("Request body too large: {Size} bytes from {IP}", 
                context.Request.ContentLength.Value, 
                context.Connection.RemoteIpAddress);
            
            context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
            await context.Response.WriteAsync("Request body too large");
            return;
        }

        // Validate query parameters
        if (context.Request.Query.Any())
        {
            foreach (var (key, value) in context.Request.Query)
            {
                var queryValue = value.ToString();
                if (DtoValidator.ContainsSuspiciousPatterns(queryValue))
                {
                    _logger.LogWarning("Suspicious pattern detected in query parameter '{Key}': {Value} from {IP}",
                        key, queryValue, context.Connection.RemoteIpAddress);
                    
                    context.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await context.Response.WriteAsync("Invalid request parameters");
                    return;
                }
            }
        }

        // Validate headers
        if (context.Request.Headers.Any(h => DtoValidator.ContainsSuspiciousPatterns(h.Value.ToString())))
        {
            _logger.LogWarning("Suspicious pattern detected in headers from {IP}",
                context.Connection.RemoteIpAddress);
            
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsync("Invalid request headers");
            return;
        }

        await _next(context);
    }
}

public static class RequestValidationMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestValidation(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestValidationMiddleware>();
    }
}
