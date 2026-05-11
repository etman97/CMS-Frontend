import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class IdleService implements OnDestroy {
  private readonly IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
  private readonly onActivity = () => this.resetTimer();
  private running = false;

  constructor(private authService: AuthService, private ngZone: NgZone) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.ngZone.runOutsideAngular(() => {
      this.events.forEach(event =>
        document.addEventListener(event, this.onActivity, { passive: true })
      );
      this.resetTimer();
    });
  }

  stop(): void {
    this.running = false;
    this.events.forEach(event =>
      document.removeEventListener(event, this.onActivity)
    );
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private resetTimer(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.timeoutId = setTimeout(() => {
      this.ngZone.run(() => this.authService.logout());
    }, this.IDLE_TIMEOUT);
  }
}
