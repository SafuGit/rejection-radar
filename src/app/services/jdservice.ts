import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JDService {
  constructor (private http: HttpClient) {}

  jdJson = signal<any>(null);
  htmlReport = signal<string>('');
  isLoadingJD = signal(false);
  isLoadingWebsite = signal(false);
  jdError = signal<string | null>(null);
  websiteError = signal<string | null>(null);

  parseJD(jobDescription: string) {
    this.isLoadingJD.set(true);
    this.jdError.set(null);
    return this.http.post<{message: string, jdJson: any}>('/api/parse-jd', { jd: jobDescription })
      .subscribe({
        next: (response) => {
          this.jdJson.set(response.jdJson);
          this.isLoadingJD.set(false);
        },
        error: (error) => {
          console.error('Error parsing JD:', error);
          this.jdError.set('Failed to parse job description');
          this.isLoadingJD.set(false);
        }
      });
  }

  analyseWebsite(url: string) {
    this.isLoadingWebsite.set(true);
    this.websiteError.set(null);
    return this.http.post<{analysis: string}>('/api/website-analysis', { url })
      .subscribe({
        next: (response) => {
          this.htmlReport.set(response.analysis);
          this.isLoadingWebsite.set(false);
        },
        error: (error) => {
          console.error('Error analysing website:', error);
          this.websiteError.set('Failed to analyze website');
          this.isLoadingWebsite.set(false);
        }
      });
  }
}
