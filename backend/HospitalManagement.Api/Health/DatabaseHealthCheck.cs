using System.Diagnostics;
using HospitalManagement.Infrastructure.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace HospitalManagement.Api.Health;

public class DatabaseHealthCheck : IHealthCheck
{
    private readonly HospitalDbContext _dbContext;
    private readonly ILogger<DatabaseHealthCheck> _logger;

    public DatabaseHealthCheck(HospitalDbContext dbContext, ILogger<DatabaseHealthCheck> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var stopwatch = Stopwatch.StartNew();

        try
        {
            var canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
            stopwatch.Stop();

            var data = new Dictionary<string, object>
            {
                ["Database"] = _dbContext.Database.ProviderName ?? "Unknown",
                ["ResponseTimeMs"] = stopwatch.ElapsedMilliseconds
            };

            if (canConnect)
            {
                if (stopwatch.ElapsedMilliseconds > 1000)
                {
                    return HealthCheckResult.Degraded($"Database connection is slow ({stopwatch.ElapsedMilliseconds} ms)", data: data);
                }

                return HealthCheckResult.Healthy($"Database connection is healthy ({stopwatch.ElapsedMilliseconds} ms)", data);
            }

            return HealthCheckResult.Unhealthy("Cannot connect to SQL Server database.", data: data);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(ex, "Health check failed for SQL Server database after {ElapsedMilliseconds} ms.", stopwatch.ElapsedMilliseconds);

            return HealthCheckResult.Unhealthy(
                "Database health check threw an exception.",
                exception: ex,
                data: new Dictionary<string, object>
                {
                    ["ResponseTimeMs"] = stopwatch.ElapsedMilliseconds,
                    ["Error"] = ex.Message
                });
        }
    }
}

