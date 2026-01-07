import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CVService {
  constructor (private http: HttpClient) {}
  cvData = signal<{message: string, text: string, pages: number, cvJson: any}>({message: '', text: '', pages: 0, cvJson: null});
  isLoading = signal(false);

  uploadCV(file: File) {
    const formdata = new FormData();
    formdata.append('cv', file);

    this.isLoading.set(true);
    return this.http.post<{message: string, text: string, pages: number, cvJson: any}>('/api/upload-cv', formdata)
      .subscribe({
        next: (response) => {
          this.cvData.set(response);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error uploading CV:', error);
          this.isLoading.set(false);
        }
      });
  }
}
