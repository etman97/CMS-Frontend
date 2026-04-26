import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { PageStatusService, PublicPageKey, PublicPageStatusMap } from '../../core/services/page-status.service';

@Component({
    selector: 'app-site-footer',
    standalone: true,
    imports: [RouterLink, TranslateModule],
    templateUrl: './site-footer.component.html',
    styleUrl: './site-footer.component.scss'
})
export class SiteFooterComponent implements OnInit {
    private readonly pageStatusService = inject(PageStatusService);

    readonly quickLinks: Array<{ key: PublicPageKey; route: string; labelKey: string }> = [
        { key: 'home', route: '/', labelKey: 'nav.home' },
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

    isPageEnabled(key: PublicPageKey): boolean {
        return this.pageStatuses[key];
    }
}
