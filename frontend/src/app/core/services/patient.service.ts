import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable } from "rxjs";
import {
  PatientDto,
  CreatePatientRequest,
  PatientListResponse,
} from "../models/patient.models";

import { API_BASE_URL } from "../tokens/api.tokens";

@Injectable({
  providedIn: "root",
})
export class PatientService {
  private http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getPatients(
    search?: string,
    page = 1,
    pageSize = 10,
  ): Observable<PatientListResponse> {
    let params = new HttpParams()
      .set("page", page.toString())
      .set("pageSize", pageSize.toString());

    if (search) {
      params = params.set("search", search);
    }

    return this.http.get<PatientListResponse>(`${this.baseUrl}/patients`, {
      params,
    });
  }

  getPatientById(id: number): Observable<PatientDto> {
    return this.http.get<PatientDto>(`${this.baseUrl}/patients/${id}`);
  }

  createPatient(data: CreatePatientRequest): Observable<PatientDto> {
    return this.http.post<PatientDto>(`${this.baseUrl}/patients`, data);
  }

  getMyProfile(): Observable<PatientDto> {
    return this.http.get<PatientDto>(`${this.baseUrl}/patients/me`);
  }

  getMyPatientProfile(): Observable<PatientDto> {
    return this.getMyProfile();
  }
}
