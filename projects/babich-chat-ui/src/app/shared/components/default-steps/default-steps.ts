import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'default-steps',
  standalone: true,
  templateUrl: './default-steps.html',
  styleUrl: './default-steps.scss',
})
export class DefaultSteps {
  readonly totalSteps = input.required<number>();
  readonly activeStep = input.required<number>();

  readonly steps = computed(() =>
    Array.from({ length: Math.max(0, Math.floor(this.totalSteps())) }, (_, index) => index + 1),
  );
}
