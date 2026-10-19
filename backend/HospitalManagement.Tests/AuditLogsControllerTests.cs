using HospitalManagement.Api.Controllers;
using HospitalManagement.Application.Common.Audit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HospitalManagement.Tests;

public class AuditLogsControllerTests
{
    private readonly Mock<IAuditService> _auditServiceMock;
    private readonly Mock<ILogger<AuditLogsController>> _loggerMock;
    private readonly AuditLogsController _controller;

    public AuditLogsControllerTests()
    {
        _auditServiceMock = new Mock<IAuditService>();
        _loggerMock = new Mock<ILogger<AuditLogsController>>();
        _controller = new AuditLogsController(_auditServiceMock.Object, _loggerMock.Object);
    }

    [Fact]
    public async Task GetAuditLogs_WithFilter_ShouldReturnOkWithPaginatedList()
    {
        // Arrange
        var mockResponse = new AuditLogListResponse
        {
            Items = new List<AuditLogDto>
            {
                new AuditLogDto
                {
                    AuditLogId = 1,
                    Action = "LOGIN",
                    EntityName = "User",
                    EntityId = "10",
                    Username = "admin",
                    TimestampUtc = DateTime.UtcNow
                }
            },
            TotalCount = 1,
            Page = 1,
            PageSize = 20
        };

        _auditServiceMock.Setup(s => s.GetAuditLogsAsync(It.IsAny<AuditLogFilter>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(mockResponse);

        // Act
        var result = await _controller.GetAuditLogs(
            search: "admin",
            action: "LOGIN",
            entityName: "User",
            userId: 10,
            fromDate: null,
            toDate: null,
            page: 1,
            pageSize: 20);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<AuditLogListResponse>(okResult.Value);
        Assert.Single(response.Items);
        Assert.Equal("LOGIN", response.Items.First().Action);
    }
}

