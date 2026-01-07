import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CVService {
  constructor (private http: HttpClient) {}
  cvData = signal<{message: string, text: string, pages: number, cvJson: any}>({message: '', text: '', pages: 0, cvJson: null});

  uploadCV(file: File) {
    const formdata = new FormData();
    formdata.append('cv', file);

    return this.http.post<{message: string, text: string, pages: number, cvJson: any}>('/api/parse-cv', formdata)
      .subscribe({
        next: (response) => {
          this.cvData.set(response);
        },
        error: (error) => {
          console.error('Error uploading CV:', error);
        }
      });
  }
}
