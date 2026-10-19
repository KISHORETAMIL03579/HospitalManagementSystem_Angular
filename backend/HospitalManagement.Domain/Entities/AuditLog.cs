namespace HospitalManagement.Domain.Entities;

public class AuditLog
{
    public long AuditLogId { get; set; }
    public int? UserId { get; set; }
    public string? Username { get; set; }
    public string? Role { get; set; }
    public string Action { get; set; } = string.Empty; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, STATUS_CHANGE
    public string EntityName { get; set; } = string.Empty; // Patient, Appointment, Doctor, User, StaffRegistrationRequest
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? CorrelationId { get; set; }
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}

