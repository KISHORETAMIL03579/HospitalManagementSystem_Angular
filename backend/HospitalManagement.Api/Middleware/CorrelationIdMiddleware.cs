using Serilog.Context;

namespace HospitalManagement.Api.Middleware;

public class CorrelationIdMiddleware
{
    public const string CorrelationHeader = "X-Correlation-ID";
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers[CorrelationHeader].FirstOrDefault()
            ?? context.Request.Headers["X-Request-ID"].FirstOrDefault()
            ?? Guid.NewGuid().ToString("N");

        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers.TryAdd(CorrelationHeader, correlationId);

        var clientIp = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("ClientIp", clientIp))
        {
            await _next(context);
        }
    }
}
