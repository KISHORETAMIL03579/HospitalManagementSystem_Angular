using HospitalManagement.Domain.Entities;

namespace HospitalManagement.Application.Common.Audit;

public interface IAuditService
{
    Task LogAsync(
        string action,
        string entityName,
        string? entityId = null,
        string? details = null,
        string? oldValues = null,
        string? newValues = null,
        int? userId = null,
        string? username = null,
        string? role = null,
        string? ipAddress = null,
        string? userAgent = null,
        string? correlationId = null,
        CancellationToken cancellationToken = default);

    Task LogAsync(AuditLog auditLog, CancellationToken cancellationToken = default);

    Task<AuditLogListResponse> GetAuditLogsAsync(AuditLogFilter filter, CancellationToken cancellationToken = default);
}

