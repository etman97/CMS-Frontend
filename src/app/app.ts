import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Toast } from 'primeng/toast';
import { DirectionService } from './core/i18n/direction.service';
import { AppInitService } from './core/services/app-init.service';
import { LoadingScreenComponent } from './shared/loading-screen/loading-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast, LoadingScreenComponent],
  template: `
    <!-- Loading screen overlay (fixed, z-index 99999) -->
    @if (!appInit.isDone()) {
      <app-loading-screen />
    }

    <!-- Toast always available -->
    <p-toast
      position="top-right"
      [baseZIndex]="12000"
      [preventOpenDuplicates]="true"
      [showTransformOptions]="'translateY(8px)'"
      [hideTransformOptions]="'translateY(-8px)'"
    />

    <!-- Router renders underneath while loading, becomes visible after fade-out -->
    <router-outlet />
  `
})
export class AppComponent {
  protected readonly appInit = inject(AppInitService);

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

    // Kick off parallel API pre-fetching immediately
    this.appInit.init();
  }
}
