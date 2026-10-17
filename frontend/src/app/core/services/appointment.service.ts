import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  AppointmentDto,
  AppointmentStatus,
  CreateAppointmentRequest,
  UpdateAppointmentStatusRequest,
} from "../models/appointment.models";

import { API_BASE_URL } from "../tokens/api.tokens";

@Injectable({
  providedIn: "root",
})
export class AppointmentService {
  private http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getAppointments(
    patientId?: number,
    doctorId?: number,
    date?: string,
  ): Observable<AppointmentDto[]> {
    let params = new HttpParams();
    if (patientId) params = params.set("patientId", patientId.toString());
    if (doctorId) params = params.set("doctorId", doctorId.toString());
    if (date) params = params.set("date", date);

    return this.http.get<AppointmentDto[]>(`${this.baseUrl}/appointments`, {
      params,
    });
  }

  getAppointmentById(id: number): Observable<AppointmentDto> {
    return this.http.get<AppointmentDto>(`${this.baseUrl}/appointments/${id}`);
  }

  createAppointment(
    data: CreateAppointmentRequest,
  ): Observable<AppointmentDto> {
    return this.http.post<AppointmentDto>(`${this.baseUrl}/appointments`, data);
  }

  updateStatus(
    id: number,
    data: UpdateAppointmentStatusRequest,
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.baseUrl}/appointments/${id}/status`,
      data,
    );
  }

  updateAppointmentStatus(
    id: number,
    status: AppointmentStatus | number,
    notes?: string,
  ): Observable<void> {
    return this.updateStatus(id, {
      status: status as AppointmentStatus,
      notes,
    });
  }
}
