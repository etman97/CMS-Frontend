import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EditSectionDialogData, SectionLang } from './edit-section-dialog.model';

@Component({
    selector: 'app-edit-section-dialog',
    standalone: true,
    imports: [FormsModule, ButtonModule, TranslateModule],
    templateUrl: './edit-section-dialog.component.html',
    styleUrl: './edit-section-dialog.component.scss'
})
export class EditSectionDialogComponent implements OnInit {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<EditSectionDialogData>);
    private readonly translate = inject(TranslateService);

    content = '';
    dir: 'ltr' | 'rtl' = 'ltr';

    ngOnInit(): void {
        const lang: SectionLang = this.config.data?.lang ?? 'en';
        this.content = this.config.data?.content ?? '';
        this.dir = lang === 'ar' ? 'rtl' : 'ltr';
        this.translate.use(lang);
    }

    save(): void {
        this.ref.close({ content: this.content });
    }

    cancel(): void {
        this.ref.close();
    }
}
