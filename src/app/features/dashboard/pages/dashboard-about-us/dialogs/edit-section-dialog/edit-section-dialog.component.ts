import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { EditSectionDialogData, EditSectionDialogResult, SectionLang } from './edit-section-dialog.model';
import { MediaService } from '../../../../../../core/services/media.service';

@Component({
    selector: 'app-edit-section-dialog',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './edit-section-dialog.component.html',
    styleUrl: './edit-section-dialog.component.scss'
})
export class EditSectionDialogComponent implements OnInit {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<EditSectionDialogData>);
    private readonly mediaService = inject(MediaService);

    content = '';
    dir: 'ltr' | 'rtl' = 'ltr';
    lang = 'en';
    imageUrl: string | null = null;
    isUploading = false;

    get placeholder(): string {
        return this.lang === 'ar' ? 'أدخل المحتوى...' : 'Enter content...';
    }

    get uploadHint(): string {
        return this.lang === 'ar'
            ? 'ارفع الصور، يتم قبول صيغ PNG و JPEG.'
            : 'Upload images, PNG and JPEG formats are accepted.';
    }

    ngOnInit(): void {
        const lang: SectionLang = this.config.data?.lang ?? 'en';
        this.lang = lang;
        this.content = this.config.data?.content ?? '';
        this.imageUrl = this.config.data?.imageUrl ?? null;
        this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.isUploading = true;
        this.imageUrl = URL.createObjectURL(file);

        this.mediaService.upload(file, 'cms/sections').subscribe({
            next: (res) => {
                this.imageUrl = res.url;
                this.isUploading = false;
            },
            error: () => {
                this.isUploading = false;
            }
        });
    }

    save(): void {
        const result: EditSectionDialogResult = {
            content: this.content,
            imageUrl: this.imageUrl
        };
        this.ref.close(result);
    }

    cancel(): void {
        this.ref.close();
    }
}
