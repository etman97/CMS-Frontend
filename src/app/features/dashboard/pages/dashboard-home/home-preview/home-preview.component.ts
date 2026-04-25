import { Component, inject } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HomePreviewData } from './home-preview.model';

@Component({
    selector: 'app-home-preview',
    standalone: true,
    imports: [],
    templateUrl: './home-preview.component.html',
    styleUrl: './home-preview.component.scss'
})
export class HomePreviewComponent {
    private readonly config = inject(DynamicDialogConfig<HomePreviewData>);

    readonly data = this.config.data!;

    get heroBackground(): string {
        const overlay = 'linear-gradient(rgba(45, 46, 131, 0.25), rgba(45, 46, 131, 0.25))';
        const img = this.data.heroImageUrl
            ? `url('${this.data.heroImageUrl}') center center / cover no-repeat`
            : `url('https://www.figma.com/api/mcp/asset/ed172d86-718c-4793-911c-3302a8ba5382') center center / cover no-repeat`;
        return `${overlay}, ${img}`;
    }
}
