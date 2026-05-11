import { DOCUMENT } from '@angular/common';
import { Component, effect, inject, OnDestroy } from '@angular/core';
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
export class AppComponent implements OnDestroy {
  protected readonly appInit = inject(AppInitService);

  private readonly document = inject(DOCUMENT);
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

    // Remove the lock when the loading screen STARTS fading (not when fully gone),
    // so page animations begin in sync with the fade-out transition.
    effect(() => {
      const isLoading = !this.appInit.isFading();
      this.document.documentElement.classList.toggle('app-loading-lock', isLoading);
      this.document.body.classList.toggle('app-loading-lock', isLoading);
    });

    // Kick off parallel API pre-fetching immediately
    this.appInit.init();
  }

  ngOnDestroy(): void {
    this.document.documentElement.classList.remove('app-loading-lock');
    this.document.body.classList.remove('app-loading-lock');
  }
}
