import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HlmCardImports } from '../../../libs/ui/card/src';
import { HlmProgressImports } from '../../../libs/ui/progress/src';
import { HlmButtonImports } from '../../../libs/ui/button/src';
import { HlmLabelImports } from '../../../libs/ui/label/src';
import { HlmInputImports } from '../../../libs/ui/input/src';
import { HlmFormFieldImports } from '../../../libs/ui/form-field/src';
import { CommonModule } from '@angular/common';
import { CVService } from '../../services/cvservice';
import { JDService } from '../../services/jdservice';

@Component({
  selector: 'app-index',
  imports: [
    CommonModule,
    FormsModule,
    HlmCardImports,
    HlmProgressImports,
    HlmButtonImports,
    HlmLabelImports,
    HlmInputImports,
    HlmFormFieldImports,
  ],
  templateUrl: './index.html',
  styleUrl: './index.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center justify-center min-h-screen w-full bg-background',
  },
})
export class Index {
  private cvService = inject(CVService);
  private jdService = inject(JDService);
  currentStep = signal(1);
  totalSteps = 3;
  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  isUploading = this.cvService.isLoading;

  cvData = computed(() => this.cvService.cvData());
  editableCV = signal<any>(null);
  jobData = signal({
    companyName: '',
    companyUrl: '',
    jobDescription: ''
  });

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
      if (this.currentStep() === 1 && this.selectedFile()) {
        this.cvService.uploadCV(this.selectedFile()!);
        const checkUpload = setInterval(() => {
          if (!this.isUploading()) {
            clearInterval(checkUpload);
            // Initialize editable CV with parsed data
            this.editableCV.set(JSON.parse(JSON.stringify(this.cvData().cvJson)));
            this.currentStep.update((step) => step + 1);
          }
        }, 100);
      } else {
        this.currentStep.update((step) => step + 1);
      }
    } else if (this.currentStep() === this.totalSteps) {
      // On the last step, parse the job description and analyze website if provided
      const jd = this.jobData();
      if (jd.jobDescription.trim()) {
        this.jdService.parseJD(jd.jobDescription);
      }

      // Analyze company website if a valid URL is provided
      if (jd.companyUrl.trim() && this.isValidUrl(jd.companyUrl)) {
        this.jdService.analyseWebsite(jd.companyUrl);
      }
    }
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  addExperience(): void {
    const cv = this.editableCV();
    if (cv) {
      cv.experience.push({
        title: '',
        company: '',
        startDate: '',
        endDate: '',
        details: ''
      });
      this.editableCV.set({...cv});
    }
  }

  removeExperience(index: number): void {
    const cv = this.editableCV();
    if (cv) {
      cv.experience.splice(index, 1);
      this.editableCV.set({...cv});
    }
  }

  addProject(): void {
    const cv = this.editableCV();
    if (cv) {
      cv.projects.push({
        name: '',
        description: '',
        technologies: []
      });
      this.editableCV.set({...cv});
    }
  }

  removeProject(index: number): void {
    const cv = this.editableCV();
    if (cv) {
      cv.projects.splice(index, 1);
      this.editableCV.set({...cv});
    }
  }

  addSkill(): void {
    const cv = this.editableCV();
    if (cv) {
      cv.skills.push('');
      this.editableCV.set({...cv});
    }
  }

  removeSkill(index: number): void {
    const cv = this.editableCV();
    if (cv) {
      cv.skills.splice(index, 1);
      this.editableCV.set({...cv});
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  updateTechnologies(project: any, value: string): void {
    project.technologies = value.split(',').map(t => t.trim()).filter(t => t);
  }

  updateLanguages(value: string): void {
    const cv = this.editableCV();
    if (cv) {
      cv.languages = value.split(',').map(l => l.trim()).filter(l => l);
      this.editableCV.set({...cv});
    }
  }

  updateCertifications(value: string): void {
    const cv = this.editableCV();
    if (cv) {
      cv.certifications = value.split(',').map(c => c.trim()).filter(c => c);
      this.editableCV.set({...cv});
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
