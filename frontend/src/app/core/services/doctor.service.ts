import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  DepartmentDto,
  DoctorDto,
  CreateDoctorRequest,
  DoctorDirectoryItemDto,
  DoctorAvailabilityDto,
  DoctorScheduleDto,
  SaveDoctorScheduleDto,
  DoctorScheduleExceptionDto,
  CreateDoctorScheduleExceptionDto,
  ConflictCheckResultDto,
} from "../models/doctor.models";

import { API_BASE_URL } from "../tokens/api.tokens";

@Injectable({
  providedIn: "root",
})
export class DoctorService {
  private http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getDoctors(departmentId?: number): Observable<DoctorDto[]> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set("departmentId", departmentId.toString());
    }
    return this.http.get<DoctorDto[]>(`${this.baseUrl}/doctors`, { params });
  }

  getDoctorDirectory(
    departmentId?: number,
    search?: string,
    date?: string,
  ): Observable<DoctorDirectoryItemDto[]> {
    let params = new HttpParams();
    if (departmentId)
      params = params.set("departmentId", departmentId.toString());
    if (search) params = params.set("search", search);
    if (date) params = params.set("date", date);

    return this.http.get<DoctorDirectoryItemDto[]>(
      `${this.baseUrl}/doctors/directory`,
      {
        params,
      },
    );
  }

  getDoctorById(id: number): Observable<DoctorDto> {
    return this.http.get<DoctorDto>(`${this.baseUrl}/doctors/${id}`);
  }

  getDoctorAvailability(
    id: number,
    date?: string,
  ): Observable<DoctorAvailabilityDto> {
    let params = new HttpParams();
    if (date) params = params.set("date", date);

    return this.http.get<DoctorAvailabilityDto>(
      `${this.baseUrl}/doctors/${id}/availability`,
      {
        params,
      },
    );
  }

  getDoctorSchedules(id: number): Observable<DoctorScheduleDto[]> {
    return this.http.get<DoctorScheduleDto[]>(
      `${this.baseUrl}/doctors/${id}/schedules`,
    );
  }

  saveDoctorSchedules(
    id: number,
    schedules: SaveDoctorScheduleDto[],
  ): Observable<DoctorScheduleDto[]> {
    return this.http.put<DoctorScheduleDto[]>(
      `${this.baseUrl}/doctors/${id}/schedules`,
      schedules,
    );
  }

  getDoctorExceptions(
    id: number,
    fromDate?: string,
    toDate?: string,
  ): Observable<DoctorScheduleExceptionDto[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set("fromDate", fromDate);
    if (toDate) params = params.set("toDate", toDate);

    return this.http.get<DoctorScheduleExceptionDto[]>(
      `${this.baseUrl}/doctors/${id}/schedule-exceptions`,
      { params },
    );
  }

  checkConflicts(
    id: number,
    dto: CreateDoctorScheduleExceptionDto,
  ): Observable<ConflictCheckResultDto> {
    return this.http.post<ConflictCheckResultDto>(
      `${this.baseUrl}/doctors/${id}/schedule-exceptions/check-conflicts`,
      dto,
    );
  }

  createDoctorException(
    id: number,
    dto: CreateDoctorScheduleExceptionDto,
  ): Observable<DoctorScheduleExceptionDto> {
    return this.http.post<DoctorScheduleExceptionDto>(
      `${this.baseUrl}/doctors/${id}/schedule-exceptions`,
      dto,
    );
  }

  deleteDoctorException(id: number, exceptionId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/doctors/${id}/schedule-exceptions/${exceptionId}`,
    );
  }

  getDepartments(): Observable<DepartmentDto[]> {
    return this.http.get<DepartmentDto[]>(
      `${this.baseUrl}/doctors/departments`,
    );
  }

  createDoctor(data: CreateDoctorRequest): Observable<DoctorDto> {
    return this.http.post<DoctorDto>(`${this.baseUrl}/doctors`, data);
  }
}
