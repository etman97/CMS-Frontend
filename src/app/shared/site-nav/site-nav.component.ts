import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DirectionService } from '../../core/i18n/direction.service';
import { PageStatusService, PublicPageKey, PublicPageStatusMap } from '../../core/services/page-status.service';

@Component({
    selector: 'app-site-nav',
    standalone: true,
    imports: [RouterLink, RouterLinkActive, TranslateModule],
    templateUrl: './site-nav.component.html',
    styleUrl: './site-nav.component.scss'
})
export class SiteNavComponent implements OnInit {
    private readonly directionService = inject(DirectionService);
    private readonly translate = inject(TranslateService);
    private readonly pageStatusService = inject(PageStatusService);
    isMenuOpen = false;

    readonly navItems: Array<{ key: PublicPageKey; route: string; labelKey: string; exact?: boolean }> = [
        { key: 'home', route: '/', labelKey: 'nav.home', exact: true },
        { key: 'about', route: '/about', labelKey: 'nav.about' },
        { key: 'partners', route: '/partners', labelKey: 'nav.partners' },
        { key: 'solutions', route: '/solutions', labelKey: 'nav.solutions' },
        { key: 'services', route: '/services', labelKey: 'nav.services' },
        { key: 'contact', route: '/contact', labelKey: 'nav.contact' }
    ];

    pageStatuses: PublicPageStatusMap = {
        home: true,
        about: true,
        partners: true,
        solutions: true,
        services: true,
        contact: true
    };

    ngOnInit(): void {
        this.pageStatusService.getStatuses().subscribe((statuses) => {
            this.pageStatuses = statuses;
        });
    }

    get isArabic(): boolean {
        const currentLang = this.translate.currentLang || this.translate.getDefaultLang() || 'en';
        return currentLang === 'ar';
    }

    get isSupportArabic(): boolean {
        return this.pageStatusService.supportArabic();
    }

    isPageEnabled(key: PublicPageKey): boolean {
        return this.pageStatuses[key];
    }

    toggleMenu(): void {
        this.isMenuOpen = !this.isMenuOpen;
    }

    closeMenu(): void {
        this.isMenuOpen = false;
    }

    toggleLanguage(): void {
        const nextLang = this.isArabic ? 'en' : 'ar';
        this.translate.use(nextLang);
        this.directionService.setDirection(nextLang);
        this.closeMenu();
    }
}
