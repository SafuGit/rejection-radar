import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JDService {
  constructor (private http: HttpClient) {}

  jdJson = signal<any>(null);
  htmlReport = signal<string>('');

  parseJD(jobDescription: string) {
    return this.http.post<{message: string, jdJson: any}>('/api/parse-jd', { jd: jobDescription })
      .subscribe({
        next: (response) => {
          this.jdJson.set(response.jdJson);
        },
        error: (error) => {
          console.error('Error parsing JD:', error);
        }
      });
  }

  analyseWebsite(url: string) {
    return this.http.post<{analysis: string}>('/api/analyse-website', { url })
      .subscribe({
        next: (response) => {
          this.htmlReport.set(response.analysis);
        },
        error: (error) => {
          console.error('Error analysing website:', error);
        }
      });
  }
}
