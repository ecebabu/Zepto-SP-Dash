import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { DashboardData, StatusBreakdown } from '../user.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(private httpClient: HttpClientService) { }

  getDashboardData(): Observable<{ dashboard: DashboardData }> {
    return this.httpClient.get<{ dashboard: DashboardData }>('/route/dashboard');
  }

  // Inside DashboardComponent class

  trackByStatus(index: number, item: StatusBreakdown): string | undefined {
    return item.project_status;
  }

  trackByTaskStatus(index: number, item: StatusBreakdown): string | undefined {
    return item.status;
  }
}
