import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ContactPageService } from '../../core/services/contact-page.service';
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
    private readonly contactPageService = inject(ContactPageService);

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
    phone = '';
    email = '';
    address = '';
    facebookUrl = '';
    linkedInUrl = '';

    ngOnInit(): void {
        this.pageStatusService.getStatuses().subscribe((statuses) => {
            this.pageStatuses = statuses;
        });

        this.contactPageService.get().subscribe((data) => {
            this.phone = data?.phone ?? '';
            this.email = data?.email ?? '';
            this.address = data?.address ?? '';
            this.facebookUrl = data?.facebookUrl ?? '';
            this.linkedInUrl = data?.linkedInUrl ?? '';
        });
    }

    isPageEnabled(key: PublicPageKey): boolean {
        return this.pageStatuses[key];
    }
}
