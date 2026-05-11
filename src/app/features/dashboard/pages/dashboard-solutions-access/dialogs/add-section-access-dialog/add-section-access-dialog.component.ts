import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AddSectionAccessDialogData, AddSectionAccessDialogResult, SectionImageMode } from './add-section-access-dialog.model';
import { MediaService } from '../../../../../../core/services/media.service';

type AddSectionAccessFieldKey = 'titleEn' | 'titleAr' | 'paragraphEn' | 'paragraphAr';

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
export class AddSectionAccessDialogComponent implements OnInit, OnDestroy {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<AddSectionAccessDialogData>);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    titleEn = '';
    titleAr = '';
    paragraphEn = '';
    paragraphAr = '';

    imageMode: SectionImageMode = 'one';
    imageUrl1: string | null = null;
    imageUrl2: string | null = null;

    firstImagePreview: string | null = null;
    secondImagePreview: string | null = null;
    requiredImageMode: SectionImageMode | null = null;
    isUploadingFirstImage = false;
    isUploadingSecondImage = false;

    lang: 'en' | 'ar' = 'en';
    dir: 'ltr' | 'rtl' = 'ltr';
    attemptedSave = false;
    touchedFields: Partial<Record<AddSectionAccessFieldKey, boolean>> = {};
    private firstLocalPreviewUrl: string | null = null;
    private secondLocalPreviewUrl: string | null = null;

    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly mixedLanguagePattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

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

    get canSave(): boolean {
        const fields: AddSectionAccessFieldKey[] = ['titleEn', 'titleAr', 'paragraphEn', 'paragraphAr'];
        return !this.isUploading
            && fields.every((field) => this.getFieldValue(field).trim() && this.isFieldPatternValid(field))
            && this.hasFirstImage
            && (this.imageMode !== 'two' || this.hasSecondImage);
    }

    get isUploading(): boolean {
        return this.isUploadingFirstImage || this.isUploadingSecondImage;
    }

    get showFirstImageRequired(): boolean {
        return this.attemptedSave && !this.hasFirstImage;
    }

    get showSecondImageRequired(): boolean {
        return this.attemptedSave && this.imageMode === 'two' && !this.hasSecondImage;
    }

    private get hasFirstImage(): boolean {
        return Boolean(this.imageUrl1);
    }

    private get hasSecondImage(): boolean {
        return Boolean(this.imageUrl2);
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
            this.imageUrl1 = initial.imageUrls?.[0] ?? null;
            this.imageUrl2 = this.requiredImageMode === 'two' ? (initial.imageUrls?.[1] ?? null) : null;
            this.firstImagePreview = this.imageUrl1;
            this.secondImagePreview = this.imageUrl2;
            return;
        }

        if ((initial.imageUrls?.length ?? 0) > 1) {
            this.imageMode = 'two';
            this.imageUrl1 = initial.imageUrls[0] ?? null;
            this.imageUrl2 = initial.imageUrls[1] ?? null;
            this.firstImagePreview = this.imageUrl1;
            this.secondImagePreview = this.imageUrl2;
        } else {
            this.imageMode = 'one';
            this.imageUrl1 = initial.imageUrls?.[0] ?? null;
            this.firstImagePreview = this.imageUrl1;
            this.imageUrl2 = null;
            this.secondImagePreview = null;
        }
    }

    ngOnDestroy(): void {
        this.revokeFirstLocalPreviewUrl();
        this.revokeSecondLocalPreviewUrl();
    }

    onImageModeChange(mode: SectionImageMode): void {
        if (this.requiredImageMode) {
            return;
        }
        this.imageMode = mode;
        if (mode === 'one') {
            this.imageUrl2 = null;
            this.secondImagePreview = null;
            this.revokeSecondLocalPreviewUrl();
        }
    }

    onFirstImageChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file || this.isUploadingFirstImage) return;

        this.uploadImage(file, 'first', input);
    }

    onSecondImageChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file || this.isUploadingSecondImage) return;

        this.uploadImage(file, 'second', input);
    }

    markFieldTouched(field: AddSectionAccessFieldKey): void {
        this.touchedFields[field] = true;
    }

    showRequiredError(field: AddSectionAccessFieldKey): boolean {
        return (this.attemptedSave || !!this.touchedFields[field]) && !this.getFieldValue(field).trim();
    }

    showPatternError(field: AddSectionAccessFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        return (this.attemptedSave || !!this.touchedFields[field]) && !!value && !this.isFieldPatternValid(field);
    }

    requiredMessage(lang: 'en' | 'ar'): string {
        return lang === 'ar' ? 'هذا الحقل مطلوب.' : 'This field is required.';
    }

    patternMessage(lang: 'en' | 'ar'): string {
        return lang === 'ar' ? 'يرجى إدخال نص إنجليزي فقط.' : 'Please enter English text only.';
    }

    save(): void {
        this.attemptedSave = true;
        if (!this.canSave) return;

        const result: AddSectionAccessDialogResult = {
            titleEn: this.titleEn.trim(),
            titleAr: this.titleAr.trim(),
            paragraphEn: this.paragraphEn.trim(),
            paragraphAr: this.paragraphAr.trim(),
            imageMode: this.imageMode,
            imageUrl1: this.imageUrl1,
            imageUrl2: this.imageMode === 'two' ? this.imageUrl2 : null
        };

        this.ref.close(result);
    }

    cancel(): void {
        if (this.isUploading) return;
        this.ref.close();
    }

    private uploadImage(file: File, target: 'first' | 'second', input: HTMLInputElement): void {
        const previousImageUrl = target === 'first' ? this.imageUrl1 : this.imageUrl2;
        const previousImagePreview = target === 'first' ? this.firstImagePreview : this.secondImagePreview;
        const localPreviewUrl = URL.createObjectURL(file);

        if (target === 'first') {
            this.isUploadingFirstImage = true;
            this.imageUrl1 = null;
            this.revokeFirstLocalPreviewUrl();
            this.firstLocalPreviewUrl = localPreviewUrl;
            this.firstImagePreview = localPreviewUrl;
        } else {
            this.isUploadingSecondImage = true;
            this.imageUrl2 = null;
            this.revokeSecondLocalPreviewUrl();
            this.secondLocalPreviewUrl = localPreviewUrl;
            this.secondImagePreview = localPreviewUrl;
        }
        this.cdr.detectChanges();

        this.mediaService
            .upload(file, 'cms/solutions/sections')
            .pipe(
                finalize(() => {
                    if (target === 'first') {
                        this.isUploadingFirstImage = false;
                    } else {
                        this.isUploadingSecondImage = false;
                    }
                    input.value = '';
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (res) => {
                    const uploadedUrl = res?.url;
                    if (!uploadedUrl) {
                        this.restoreImage(target, previousImageUrl, previousImagePreview);
                        this.showImageUploadError();
                        return;
                    }

                    if (target === 'first') {
                        this.imageUrl1 = uploadedUrl;
                    } else {
                        this.imageUrl2 = uploadedUrl;
                    }
                    this.swapPreviewToRemoteWhenReady(uploadedUrl, target);
                    this.messageService.add({
                        severity: 'success',
                        summary: this.lang === 'ar' ? 'تم' : 'Uploaded',
                        detail: this.lang === 'ar' ? 'تم رفع صورة القسم بنجاح.' : 'Section image uploaded successfully.'
                    });
                },
                error: () => {
                    this.restoreImage(target, previousImageUrl, previousImagePreview);
                    this.showImageUploadError();
                }
            });
    }

    private restoreImage(target: 'first' | 'second', imageUrl: string | null, imagePreview: string | null): void {
        if (target === 'first') {
            this.revokeFirstLocalPreviewUrl();
            this.imageUrl1 = imageUrl;
            this.firstImagePreview = imagePreview;
        } else {
            this.revokeSecondLocalPreviewUrl();
            this.imageUrl2 = imageUrl;
            this.secondImagePreview = imagePreview;
        }
    }

    private showImageUploadError(): void {
        this.messageService.add({
            severity: 'error',
            summary: this.lang === 'ar' ? 'خطأ' : 'Error',
            detail: this.lang === 'ar' ? 'فشل رفع صورة القسم.' : 'Section image upload failed.'
        });
    }

    private swapPreviewToRemoteWhenReady(url: string, target: 'first' | 'second'): void {
        const img = new Image();
        img.onload = () => {
            if (target === 'first') {
                this.firstImagePreview = url;
                this.revokeFirstLocalPreviewUrl();
            } else {
                this.secondImagePreview = url;
                this.revokeSecondLocalPreviewUrl();
            }
            this.cdr.detectChanges();
        };
        img.onerror = () => {
            this.cdr.detectChanges();
        };
        img.src = url;
    }

    private revokeFirstLocalPreviewUrl(): void {
        if (this.firstLocalPreviewUrl) {
            URL.revokeObjectURL(this.firstLocalPreviewUrl);
            this.firstLocalPreviewUrl = null;
        }
    }

    private revokeSecondLocalPreviewUrl(): void {
        if (this.secondLocalPreviewUrl) {
            URL.revokeObjectURL(this.secondLocalPreviewUrl);
            this.secondLocalPreviewUrl = null;
        }
    }

    private getFieldValue(field: AddSectionAccessFieldKey): string {
        const fieldMap: Record<AddSectionAccessFieldKey, string> = {
            titleEn: this.titleEn,
            titleAr: this.titleAr,
            paragraphEn: this.paragraphEn,
            paragraphAr: this.paragraphAr
        };

        return fieldMap[field] ?? '';
    }

    private isFieldPatternValid(field: AddSectionAccessFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        if (!value) return false;

        return field.endsWith('Ar')
            ? this.mixedLanguagePattern.test(value)
            : this.englishPattern.test(value);
    }
}
