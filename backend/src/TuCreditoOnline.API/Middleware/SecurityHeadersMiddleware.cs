using Microsoft.Net.Http.Headers;

namespace TuCreditoOnline.API.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Remove server information
        context.Response.Headers.Remove(HeaderNames.Server);
        context.Response.Headers.Remove(HeaderNames.XPoweredBy);
        
        // Prevent clickjacking
        context.Response.Headers.Append(HeaderNames.XFrameOptions, "DENY");

        // Prevent MIME type sniffing
        context.Response.Headers.Append(HeaderNames.XContentTypeOptions, "nosniff");

        // Enable XSS protection
        context.Response.Headers.Append(HeaderNames.XXSSProtection, "1; mode=block");
        
        // Referrer policy
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        
        // Content Security Policy
        context.Response.Headers.Append(HeaderNames.ContentSecurityPolicy, 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' data:; " +
            "connect-src 'self' http://localhost:3000 http://frontend:3000; " +
            "frame-ancestors 'none';");
        
        // Permissions Policy (formerly Feature-Policy)
        context.Response.Headers.Append("Permissions-Policy",
            "geolocation=(), " +
            "microphone=(), " +
            "camera=(), " +
            "payment=(), " +
            "usb=()");
        
        // Strict Transport Security (HSTS)
        context.Response.Headers.Append(HeaderNames.StrictTransportSecurity,
            "max-age=31536000; includeSubDomains");

        await _next(context);
    }
}

public static class SecurityHeadersMiddlewareExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<SecurityHeadersMiddleware>();
    }
}
