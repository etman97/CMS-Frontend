import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DirectionService {
  private readonly rtlLangs = new Set(['ar', 'he', 'fa', 'ur']);
  private readonly bootstrapLinkId = 'bootstrap-css';

  setDirection(lang: string): void {
    const normalizedLang = lang.toLowerCase();
    const isRtl = this.rtlLangs.has(normalizedLang);

    document.documentElement.setAttribute('lang', normalizedLang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');

    const href = isRtl
      ? 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.rtl.min.css'
      : 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css';

    this.setBootstrapHref(href);
  }

  private setBootstrapHref(href: string): void {
    let linkEl = document.getElementById(this.bootstrapLinkId) as HTMLLinkElement | null;

    if (!linkEl) {
      linkEl = document.createElement('link');
      linkEl.id = this.bootstrapLinkId;
      linkEl.rel = 'stylesheet';
      document.head.appendChild(linkEl);
    }

    if (linkEl.getAttribute('href') !== href) {
      linkEl.setAttribute('href', href);
    }
  }
}
