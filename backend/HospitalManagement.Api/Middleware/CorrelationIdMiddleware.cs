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

        var clientIp = ResolveClientIp(context);
        context.Items["ClientIp"] = clientIp;

        var userAgent = context.Request.Headers.UserAgent.ToString();
        if (!string.IsNullOrWhiteSpace(userAgent))
        {
            if (userAgent.Length > 500) userAgent = userAgent[..500];
            context.Items["UserAgent"] = userAgent;
        }

        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("ClientIp", clientIp))
        using (LogContext.PushProperty("UserAgent", userAgent ?? "Unknown"))
        {
            await _next(context);
        }
    }

    private static string ResolveClientIp(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor) && !string.IsNullOrWhiteSpace(forwardedFor))
        {
            var ip = forwardedFor.ToString().Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(ip))
            {
                return ip;
            }
        }

        if (context.Request.Headers.TryGetValue("X-Real-IP", out var realIp) && !string.IsNullOrWhiteSpace(realIp))
        {
            return realIp.ToString().Trim();
        }

        var remoteIp = context.Connection.RemoteIpAddress;
        if (remoteIp is not null)
        {
            if (remoteIp.IsIPv4MappedToIPv6)
            {
                return remoteIp.MapToIPv4().ToString();
            }
            if (System.Net.IPAddress.IsLoopback(remoteIp))
            {
                return "127.0.0.1";
            }
            return remoteIp.ToString();
        }

        return "127.0.0.1";
    }
}
