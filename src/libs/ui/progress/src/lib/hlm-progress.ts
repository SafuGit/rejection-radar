import { Directive, input, signal } from '@angular/core';
import { classes } from '@spartan-ng/helm/utils';

@Directive({
  selector: '[hlmProgress]',
})
export class HlmProgress {
  private readonly _additionalClasses = signal('');

  public readonly value = input<number>(0);
  public readonly max = input<number>(100);

  constructor() {
    classes(() => [
      'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
      this._additionalClasses(),
    ]);
  }

  setClass(classes: string): void {
    this._additionalClasses.set(classes);
  }
}
