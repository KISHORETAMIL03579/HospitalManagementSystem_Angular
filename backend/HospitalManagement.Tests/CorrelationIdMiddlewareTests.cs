using HospitalManagement.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace HospitalManagement.Tests;

public class CorrelationIdMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_WhenCorrelationIdHeaderPresent_ShouldPropagateExistingId()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var incomingId = "test-correlation-id-12345";
        context.Request.Headers["X-Correlation-ID"] = incomingId;

        string? capturedContextItem = null;

        var middleware = new CorrelationIdMiddleware(next: (innerContext) =>
        {
            capturedContextItem = innerContext.Items["CorrelationId"]?.ToString();
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(incomingId, capturedContextItem);
        Assert.Equal(incomingId, context.Response.Headers["X-Correlation-ID"].ToString());
    }

    [Fact]
    public async Task InvokeAsync_WhenCorrelationIdHeaderMissing_ShouldGenerateNewId()
    {
        // Arrange
        var context = new DefaultHttpContext();
        string? capturedContextItem = null;

        var middleware = new CorrelationIdMiddleware(next: (innerContext) =>
        {
            capturedContextItem = innerContext.Items["CorrelationId"]?.ToString();
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.False(string.IsNullOrWhiteSpace(capturedContextItem));
        Assert.Equal(capturedContextItem, context.Response.Headers["X-Correlation-ID"].ToString());
    }
}
