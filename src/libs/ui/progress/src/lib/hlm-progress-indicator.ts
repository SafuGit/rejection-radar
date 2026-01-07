import { Directive, input } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmProgressIndicator]',
})
export class HlmProgressIndicator {
  public readonly value = input<number>(0);

  constructor() {
    classes(() => 'h-full w-full flex-1 bg-primary transition-all');
  }
}
