import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Toast } from 'primeng/toast';
import { DirectionService } from './core/i18n/direction.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast],
  template: `
    <p-toast
      position="top-right"
      [baseZIndex]="12000"
      [preventOpenDuplicates]="true"
      [showTransformOptions]="'translateY(8px)'"
      [hideTransformOptions]="'translateY(-8px)'"
    />
    <router-outlet />
  `
})
export class AppComponent {
  private readonly translate = inject(TranslateService);
  private readonly directionService = inject(DirectionService);

  constructor() {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    this.directionService.setDirection('en');

    this.translate.onLangChange.subscribe(({ lang }) => {
      this.directionService.setDirection(lang);
    });
  }
}
