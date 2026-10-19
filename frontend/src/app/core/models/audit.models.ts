export interface AuditLogDto {
  auditLogId?: number;
  id?: string;
  userId?: number | string | null;
  username?: string | null;
  userEmail?: string | null;
  role?: string | null;
  action: string;
  entityName: string;
  entityId?: string | null;
  details?: string | null;
  oldValues?: string | null;
  newValues?: string | null;
  ipAddress?: string | null;
  clientIp?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  timestampUtc: string;
}

export interface PagedAuditLogsResponse {
  items: AuditLogDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface AuditLogFilter {
  userId?: string;
  action?: string;
  entityName?: string;
  fromUtc?: string;
  toUtc?: string;
  page?: number;
  pageSize?: number;
}

export interface HealthCheckEntry {
  name: string;
  status: "Healthy" | "Degraded" | "Unhealthy" | string;
  description?: string;
  duration: string;
  data?: Record<string, unknown>;
}

export interface SystemHealthReport {
  status: "Healthy" | "Degraded" | "Unhealthy" | string;
  totalDuration: string;
  entries: HealthCheckEntry[];
}
