import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SiteNavComponent } from '../../shared/site-nav/site-nav.component';
import { SiteFooterComponent } from '../../shared/site-footer/site-footer.component';

@Component({
    selector: 'app-public-layout',
    standalone: true,
    imports: [RouterOutlet, SiteNavComponent, SiteFooterComponent],
    templateUrl: './public-layout.component.html',
    styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent {}
