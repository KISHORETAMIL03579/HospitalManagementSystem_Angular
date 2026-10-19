namespace HospitalManagement.Api.Middleware;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        headers.TryAdd("X-Content-Type-Options", "nosniff");
        headers.TryAdd("X-Frame-Options", "DENY");
        headers.TryAdd("X-XSS-Protection", "1; mode=block");
        headers.TryAdd("Referrer-Policy", "strict-origin-when-cross-origin");
        headers.TryAdd("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
        headers.TryAdd("X-Permitted-Cross-Domain-Policies", "none");

        // Strip server fingerprinting headers
        headers.Remove("Server");
        headers.Remove("X-Powered-By");
        headers.Remove("X-AspNet-Version");

        await _next(context);
    }
}
