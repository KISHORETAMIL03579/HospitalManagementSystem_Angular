namespace HospitalManagement.Application.Common.Audit;

public class AuditLogDto
{
    public long AuditLogId { get; set; }
    public int? UserId { get; set; }
    public string? Username { get; set; }
    public string? Role { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime TimestampUtc { get; set; }
}

public class AuditLogFilter
{
    public string? Search { get; set; }
    public string? Action { get; set; }
    public string? EntityName { get; set; }
    public int? UserId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class AuditLogListResponse
{
    public IEnumerable<AuditLogDto> Items { get; set; } = Enumerable.Empty<AuditLogDto>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}

