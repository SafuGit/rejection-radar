import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmCardImports } from '../../../libs/ui/card/src';
import { HlmProgressImports } from '../../../libs/ui/progress/src';
import { HlmButtonImports } from '../../../libs/ui/button/src';
import { HlmLabelImports } from '../../../libs/ui/label/src';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-index',
  imports: [
    CommonModule,
    HlmCardImports,
    HlmProgressImports,
    HlmButtonImports,
    HlmLabelImports,
  ],
  templateUrl: './index.html',
  styleUrl: './index.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center justify-center min-h-screen w-full bg-background',
  },
})
export class Index {
  currentStep = signal(1);
  totalSteps = 3;
  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);

  readonly steps = [
    { number: 1, title: 'Upload CV', description: 'Upload your resume in PDF format' },
    {
      number: 2,
      title: 'Edit Parsed Profile',
      description: 'Review and edit your information',
    },
    {
      number: 3,
      title: 'Paste Job Description',
      description: 'Add the job description',
    },
  ];

  get progressValue(): number {
    return (this.currentStep() / this.totalSteps) * 100;
  }

  get currentStepInfo() {
    return this.steps[this.currentStep() - 1];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile.set(file);
      } else {
        alert('Please select a PDF file');
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile.set(file);
      } else {
        alert('Please select a PDF file');
      }
    }
  }

  triggerFileInput(): void {
    document.getElementById('cv-upload')?.click();
  }

  removeFile(): void {
    this.selectedFile.set(null);
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update((step) => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((step) => step - 1);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
