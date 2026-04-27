import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AddSectionAccessDialogData, AddSectionAccessDialogResult, SectionImageMode } from './add-section-access-dialog.model';

interface AddSectionAccessLabels {
    titleEn: string;
    titleEnPlaceholder: string;
    titleAr: string;
    titleArPlaceholder: string;
    paragraphEn: string;
    paragraphEnPlaceholder: string;
    paragraphAr: string;
    paragraphArPlaceholder: string;
    imageChoice: string;
    oneImage: string;
    twoImages: string;
    firstImage: string;
    secondImage: string;
    uploadHint: string;
    imageModeLocked: string;
    cancel: string;
    save: string;
}

@Component({
    selector: 'app-add-section-access-dialog',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './add-section-access-dialog.component.html',
    styleUrl: './add-section-access-dialog.component.scss'
})
export class AddSectionAccessDialogComponent implements OnInit {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<AddSectionAccessDialogData>);

    titleEn = '';
    titleAr = '';
    paragraphEn = '';
    paragraphAr = '';

    imageMode: SectionImageMode = 'one';
    firstImageFile: File | null = null;
    secondImageFile: File | null = null;

    firstImagePreview: string | null = null;
    secondImagePreview: string | null = null;
    requiredImageMode: SectionImageMode | null = null;

    lang: 'en' | 'ar' = 'en';
    dir: 'ltr' | 'rtl' = 'ltr';

    readonly labelMap: Record<'en' | 'ar', AddSectionAccessLabels> = {
        en: {
            titleEn: 'Title EN',
            titleEnPlaceholder: 'Enter title in English',
            titleAr: 'Title AR',
            titleArPlaceholder: 'Enter title in Arabic',
            paragraphEn: 'Paragraph EN',
            paragraphEnPlaceholder: 'Enter paragraph in English',
            paragraphAr: 'Paragraph AR',
            paragraphArPlaceholder: 'Enter paragraph in Arabic',
            imageChoice: 'Image Choice',
            oneImage: 'One image',
            twoImages: 'Two images',
            firstImage: 'First Image',
            secondImage: 'Second Image',
            uploadHint: 'Upload image, PNG and JPEG formats are accepted.',
            imageModeLocked: 'Image mode is locked based on the first section.',
            cancel: 'Cancel',
            save: 'Save'
        },
        ar: {
            titleEn: 'العنوان (إنجليزي)',
            titleEnPlaceholder: 'أدخل العنوان باللغة الإنجليزية',
            titleAr: 'العنوان (عربي)',
            titleArPlaceholder: 'أدخل العنوان باللغة العربية',
            paragraphEn: 'الفقرة (إنجليزي)',
            paragraphEnPlaceholder: 'أدخل الفقرة باللغة الإنجليزية',
            paragraphAr: 'الفقرة (عربي)',
            paragraphArPlaceholder: 'أدخل الفقرة باللغة العربية',
            imageChoice: 'اختيار الصور',
            oneImage: 'صورة واحدة',
            twoImages: 'صورتان',
            firstImage: 'الصورة الأولى',
            secondImage: 'الصورة الثانية',
            uploadHint: 'ارفع صورة، صيغ PNG و JPEG مدعومة.',
            imageModeLocked: 'وضع الصور ثابت حسب أول قسم.',
            cancel: 'إلغاء',
            save: 'حفظ'
        }
    };

    get labels(): AddSectionAccessLabels {
        return this.labelMap[this.lang];
    }

    ngOnInit(): void {
        this.lang = this.config.data?.lang ?? 'en';
        this.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
        this.requiredImageMode = this.config.data?.requiredImageMode ?? null;
        if (this.requiredImageMode) {
            this.imageMode = this.requiredImageMode;
        }

        const initial = this.config.data?.initial;
        if (!initial) return;

        this.titleEn = initial.titleEn ?? '';
        this.titleAr = initial.titleAr ?? '';
        this.paragraphEn = initial.paragraphEn ?? '';
        this.paragraphAr = initial.paragraphAr ?? '';

        if (this.requiredImageMode) {
            this.imageMode = this.requiredImageMode;
            this.firstImagePreview = initial.imageUrls?.[0] ?? null;
            this.secondImagePreview = this.requiredImageMode === 'two' ? (initial.imageUrls?.[1] ?? null) : null;
            return;
        }

        if ((initial.imageUrls?.length ?? 0) > 1) {
            this.imageMode = 'two';
            this.firstImagePreview = initial.imageUrls[0] ?? null;
            this.secondImagePreview = initial.imageUrls[1] ?? null;
        } else {
            this.imageMode = 'one';
            this.firstImagePreview = initial.imageUrls?.[0] ?? null;
            this.secondImagePreview = null;
        }
    }

    onImageModeChange(mode: SectionImageMode): void {
        if (this.requiredImageMode) {
            return;
        }
        this.imageMode = mode;
        if (mode === 'one') {
            this.secondImageFile = null;
            this.secondImagePreview = null;
        }
    }

    onFirstImageChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.firstImageFile = file;
        this.firstImagePreview = file ? URL.createObjectURL(file) : null;
    }

    onSecondImageChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.secondImageFile = file;
        this.secondImagePreview = file ? URL.createObjectURL(file) : null;
    }

    save(): void {
        const hasFirstImage = Boolean(this.firstImageFile || this.firstImagePreview);
        const hasSecondImage = Boolean(this.secondImageFile || this.secondImagePreview);
        if (!hasFirstImage) {
            return;
        }
        if (this.imageMode === 'two' && !hasSecondImage) {
            return;
        }

        const result: AddSectionAccessDialogResult = {
            titleEn: this.titleEn.trim(),
            titleAr: this.titleAr.trim(),
            paragraphEn: this.paragraphEn.trim(),
            paragraphAr: this.paragraphAr.trim(),
            imageMode: this.imageMode,
            firstImageFile: this.firstImageFile,
            secondImageFile: this.imageMode === 'two' ? this.secondImageFile : null
        };

        this.ref.close(result);
    }

    cancel(): void {
        this.ref.close();
    }
}
