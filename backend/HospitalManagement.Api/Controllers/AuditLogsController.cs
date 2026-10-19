using HospitalManagement.Application.Common.Audit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HospitalManagement.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,HospitalManager")]
[Tags("Admin - Audit Logs")]
[Route("api/v1/admin/audit-logs")]
public class AuditLogsController : ControllerBase
{
    private readonly IAuditService _auditService;
    private readonly ILogger<AuditLogsController> _logger;

    public AuditLogsController(IAuditService auditService, ILogger<AuditLogsController> logger)
    {
        _auditService = auditService;
        _logger = logger;
    }

    /// <summary>
    /// Retrieve paginated and filtered security and operational audit logs for hospital compliance
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(AuditLogListResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAuditLogs(
        [FromQuery] string? search,
        [FromQuery] string? action,
        [FromQuery] string? entityName,
        [FromQuery] int? userId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var filter = new AuditLogFilter
        {
            Search = search,
            Action = action,
            EntityName = entityName,
            UserId = userId,
            FromDate = fromDate,
            ToDate = toDate,
            Page = page,
            PageSize = pageSize
        };

        var response = await _auditService.GetAuditLogsAsync(filter, cancellationToken);
        _logger.LogInformation("Admin user retrieved {Count} audit log records (Page {Page}).", response.Items.Count(), page);

        return Ok(response);
    }
}

