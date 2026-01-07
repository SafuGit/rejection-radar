import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JDService {
  constructor (private http: HttpClient) {}

  jdJson = signal<any>(null);

  parseJD(jobDescription: string) {
    return this.http.post<{message: string, jdJson: any}>('/api/parse-jd', { jobDescription })
      .subscribe({
        next: (response) => {
          this.jdJson.set(response.jdJson);
        },
        error: (error) => {
          console.error('Error parsing JD:', error);
        }
      });
  }
}
