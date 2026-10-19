using HospitalManagement.Application.Common.Audit;
using HospitalManagement.Domain.Entities;
using HospitalManagement.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace HospitalManagement.Infrastructure.Services;

public class AuditService : IAuditService
{
    private readonly HospitalDbContext _dbContext;
    private readonly ILogger<AuditService> _logger;

    public AuditService(HospitalDbContext dbContext, ILogger<AuditService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task LogAsync(
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
        CancellationToken cancellationToken = default)
    {
        var auditLog = new AuditLog
        {
            Action = action.ToUpperInvariant(),
            EntityName = entityName,
            EntityId = entityId,
            Details = details,
            OldValues = oldValues,
            NewValues = newValues,
            UserId = userId,
            Username = username,
            Role = role,
            IpAddress = ipAddress,
            UserAgent = userAgent,
            CorrelationId = correlationId,
            TimestampUtc = DateTime.UtcNow
        };

        await LogAsync(auditLog, cancellationToken);
    }

    public async Task LogAsync(AuditLog auditLog, CancellationToken cancellationToken = default)
    {
        try
        {
            _dbContext.AuditLogs.Add(auditLog);
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("AUDIT: [{Action}] on {EntityName} (#{EntityId}) by {Username} [CorrId: {CorrelationId}]",
                auditLog.Action, auditLog.EntityName, auditLog.EntityId ?? "N/A", auditLog.Username ?? "Anonymous", auditLog.CorrelationId ?? "N/A");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record audit log for action '{Action}' on '{EntityName}'.", auditLog.Action, auditLog.EntityName);
        }
    }

    public async Task<AuditLogListResponse> GetAuditLogsAsync(AuditLogFilter filter, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Action))
        {
            query = query.Where(a => a.Action == filter.Action.Trim().ToUpper());
        }

        if (!string.IsNullOrWhiteSpace(filter.EntityName))
        {
            query = query.Where(a => a.EntityName == filter.EntityName.Trim());
        }

        if (filter.UserId.HasValue)
        {
            query = query.Where(a => a.UserId == filter.UserId.Value);
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(a => a.TimestampUtc >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            query = query.Where(a => a.TimestampUtc <= filter.ToDate.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(a =>
                (a.Username != null && a.Username.ToLower().Contains(search)) ||
                (a.EntityId != null && a.EntityId.Contains(search)) ||
                (a.Details != null && a.Details.ToLower().Contains(search)) ||
                (a.CorrelationId != null && a.CorrelationId.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var page = Math.Max(1, filter.Page);
        var pageSize = Math.Clamp(filter.PageSize, 1, 100);

        var items = await query
            .OrderByDescending(a => a.TimestampUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto
            {
                AuditLogId = a.AuditLogId,
                UserId = a.UserId,
                Username = a.Username,
                Role = a.Role,
                Action = a.Action,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                Details = a.Details,
                OldValues = a.OldValues,
                NewValues = a.NewValues,
                IpAddress = a.IpAddress,
                UserAgent = a.UserAgent,
                CorrelationId = a.CorrelationId,
                TimestampUtc = a.TimestampUtc
            })
            .ToListAsync(cancellationToken);

        return new AuditLogListResponse
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }
}

