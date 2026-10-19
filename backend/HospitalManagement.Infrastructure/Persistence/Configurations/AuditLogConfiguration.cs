using HospitalManagement.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace HospitalManagement.Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(a => a.AuditLogId);

        builder.Property(a => a.Action)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(a => a.EntityName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(a => a.EntityId)
            .HasMaxLength(100);

        builder.Property(a => a.Username)
            .HasMaxLength(150);

        builder.Property(a => a.Role)
            .HasMaxLength(50);

        builder.Property(a => a.IpAddress)
            .HasMaxLength(50);

        builder.Property(a => a.CorrelationId)
            .HasMaxLength(100);

        builder.Property(a => a.UserAgent)
            .HasMaxLength(500);

        builder.Property(a => a.TimestampUtc)
            .IsRequired();

        builder.HasIndex(a => a.TimestampUtc);
        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.EntityName);
        builder.HasIndex(a => a.CorrelationId);
    }
}

