using HospitalManagement.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace HospitalManagement.Tests;

public class SecurityHeadersMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_ShouldAddMandatorySecurityHeaders()
    {
        // Arrange
        var context = new DefaultHttpContext();
        var middleware = new SecurityHeadersMiddleware(next: (innerHttpContext) => Task.CompletedTask);

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.True(context.Response.Headers.ContainsKey("X-Content-Type-Options"));
        Assert.Equal("nosniff", context.Response.Headers["X-Content-Type-Options"].ToString());

        Assert.True(context.Response.Headers.ContainsKey("X-Frame-Options"));
        Assert.Equal("DENY", context.Response.Headers["X-Frame-Options"].ToString());

        Assert.True(context.Response.Headers.ContainsKey("X-XSS-Protection"));
        Assert.Equal("1; mode=block", context.Response.Headers["X-XSS-Protection"].ToString());

        Assert.True(context.Response.Headers.ContainsKey("Referrer-Policy"));
        Assert.Equal("strict-origin-when-cross-origin", context.Response.Headers["Referrer-Policy"].ToString());
    }
}
