using System.Net;
using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var correlationId = context.Items["CorrelationId"]?.ToString() ?? context.TraceIdentifier;

        var statusCode = exception switch
        {
            ValidationException => HttpStatusCode.BadRequest,
            ArgumentException => HttpStatusCode.BadRequest,
            InvalidOperationException => HttpStatusCode.BadRequest,
            KeyNotFoundException => HttpStatusCode.NotFound,
            UnauthorizedAccessException => HttpStatusCode.Unauthorized,
            _ => HttpStatusCode.InternalServerError
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled system error occurred on {Method} {Path} [CorrId: {CorrelationId}]: {Message}",
                context.Request.Method, context.Request.Path, correlationId, exception.Message);
        }
        else
        {
            _logger.LogWarning("Handled business exception on {Method} {Path} ({StatusCode}) [CorrId: {CorrelationId}]: {Message}",
                context.Request.Method, context.Request.Path, (int)statusCode, correlationId, exception.Message);
        }

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = GetTitleForStatusCode(statusCode),
            Detail = statusCode == HttpStatusCode.InternalServerError
                ? "An unexpected error occurred while processing your request. Please reference the correlation ID with system support."
                : exception.Message,
            Instance = context.Request.Path
        };

        problemDetails.Extensions["correlationId"] = correlationId;
        problemDetails.Extensions["timestamp"] = DateTime.UtcNow;

        if (exception is ValidationException validationEx)
        {
            var validationErrors = validationEx.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

            problemDetails.Extensions["errors"] = validationErrors;
        }

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(problemDetails, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });

        await context.Response.WriteAsync(json);
    }

    private static string GetTitleForStatusCode(HttpStatusCode statusCode) => statusCode switch
    {
        HttpStatusCode.BadRequest => "Bad Request - Validation or parameter failure",
        HttpStatusCode.Unauthorized => "Unauthorized - Authentication required",
        HttpStatusCode.Forbidden => "Forbidden - Insufficient permissions",
        HttpStatusCode.NotFound => "Not Found - Requested resource does not exist",
        _ => "Internal Server Error - Unexpected failure"
    };
}

