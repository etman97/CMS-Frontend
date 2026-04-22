import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DirectionService } from '../../core/i18n/direction.service';

@Component({
    selector: 'app-site-nav',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './site-nav.component.html',
    styleUrl: './site-nav.component.scss'
})
export class SiteNavComponent {
    constructor(private readonly directionService: DirectionService) {}

    get isArabic(): boolean {
        return document.documentElement.getAttribute('dir') === 'rtl';
    }

    toggleLanguage(): void {
        this.directionService.setDirection(this.isArabic ? 'en' : 'ar');
    }
}
