import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { EditSectionDialogData, SectionLang } from './edit-section-dialog.model';

interface EditSectionLabels {
    enterContent: string;
    uploadImage: string;
    uploadHint: string;
    cancel: string;
    save: string;
}

@Component({
    selector: 'app-edit-section-dialog',
    standalone: true,
    imports: [FormsModule, ButtonModule],
    templateUrl: './edit-section-dialog.component.html',
    styleUrl: './edit-section-dialog.component.scss'
})
export class EditSectionDialogComponent implements OnInit {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<EditSectionDialogData>);

    content = '';
    dir: 'ltr' | 'rtl' = 'ltr';
    lang = 'en';
    imageUrl: string | null = null;

    readonly labelMap: Record<string, EditSectionLabels> = {
        en: {
            enterContent: 'Enter content...',
            uploadImage: 'Upload Image',
            uploadHint: 'Upload images, PNG and JPEG formats are accepted.',
            cancel: 'Cancel',
            save: 'Save'
        },
        ar: {
            enterContent: 'أدخل المحتوى...',
            uploadImage: 'رفع صورة',
            uploadHint: 'ارفع الصور، يتم قبول صيغ PNG و JPEG.',
            cancel: 'إلغاء',
            save: 'حفظ'
        }
    };

    get labels(): EditSectionLabels { return this.labelMap[this.lang]; }

    ngOnInit(): void {
        const lang: SectionLang = this.config.data?.lang ?? 'en';
        this.lang = lang;
        this.content = this.config.data?.content ?? '';
        this.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.imageUrl = URL.createObjectURL(file);
        }
    }

    save(): void {
        this.ref.close({ content: this.content });
    }

    cancel(): void {
        this.ref.close();
    }
}
