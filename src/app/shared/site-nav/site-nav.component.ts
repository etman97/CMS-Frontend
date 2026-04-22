import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-site-nav',
    standalone: true,
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './site-nav.component.html',
    styleUrl: './site-nav.component.scss'
})
export class SiteNavComponent {}
