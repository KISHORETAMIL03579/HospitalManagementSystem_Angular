using System.Diagnostics;

namespace HospitalManagement.Api.Middleware;

public class RequestPerformanceMiddleware
{
    private const int SlowRequestThresholdMs = 500;
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestPerformanceMiddleware> _logger;

    public RequestPerformanceMiddleware(RequestDelegate next, ILogger<RequestPerformanceMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var elapsedMs = stopwatch.ElapsedMilliseconds;

            if (elapsedMs > SlowRequestThresholdMs && !context.Request.Path.StartsWithSegments("/swagger"))
            {
                var correlationId = context.Items["CorrelationId"]?.ToString() ?? context.TraceIdentifier;
                _logger.LogWarning("PERFORMANCE: Slow request detected: {Method} {Path} completed in {ElapsedMilliseconds} ms (HTTP {StatusCode}) [CorrId: {CorrelationId}]",
                    context.Request.Method, context.Request.Path, elapsedMs, context.Response.StatusCode, correlationId);
            }
        }
    }
}

