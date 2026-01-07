import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmCardImports } from '../../../libs/ui/card/src';
import { HlmButtonImports } from '../../../libs/ui/button/src';
import { JDService } from '../../services/jdservice';

@Component({
  selector: 'app-website-report',
  imports: [
    CommonModule,
    HlmCardImports,
    HlmButtonImports,
  ],
  templateUrl: './website-report.html',
  styleUrl: './website-report.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex items-center justify-center min-h-screen w-full bg-background p-6',
  },
})
export class WebsiteReport {
  private jdService = inject(JDService);

  htmlReport = computed(() => this.jdService.htmlReport());
  hasReport = computed(() => !!this.htmlReport() && this.htmlReport().trim().length > 0);

  printReport(): void {
    window.print();
  }
}
