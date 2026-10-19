import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  AuditLogFilter,
  PagedAuditLogsResponse,
  SystemHealthReport,
} from "../models/audit.models";
import { API_BASE_URL } from "../tokens/api.tokens";

@Injectable({
  providedIn: "root",
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAuditLogs(filter?: AuditLogFilter): Observable<PagedAuditLogsResponse> {
    let params = new HttpParams();

    if (filter) {
      if (filter.userId) {
        params = params.set("userId", filter.userId);
      }
      if (filter.action) {
        params = params.set("action", filter.action);
      }
      if (filter.entityName) {
        params = params.set("entityName", filter.entityName);
      }
      if (filter.fromUtc) {
        params = params.set("fromUtc", filter.fromUtc);
      }
      if (filter.toUtc) {
        params = params.set("toUtc", filter.toUtc);
      }
      if (filter.page) {
        params = params.set("page", filter.page.toString());
      }
      if (filter.pageSize) {
        params = params.set("pageSize", filter.pageSize.toString());
      }
    }

    return this.http.get<PagedAuditLogsResponse>(
      `${this.baseUrl}/admin/audit-logs`,
      { params },
    );
  }

  getSystemHealth(): Observable<SystemHealthReport> {
    // Attempt /api/v1/health, which proxies seamlessly
    return this.http.get<SystemHealthReport>(`${this.baseUrl}/health`);
  }
}
