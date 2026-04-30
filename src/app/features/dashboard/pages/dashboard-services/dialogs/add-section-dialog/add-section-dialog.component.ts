import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AddSectionDialogData, AddSectionDialogResult } from './add-section-dialog.model';
import { MediaService } from '../../../../../../core/services/media.service';

type AddSectionFieldKey = 'groupNameEn' | 'groupNameAr' | 'briefEn' | 'briefAr';

interface AddSectionLabels {
    groupNameEn: string;
    enterGroupNameEn: string;
    groupNameAr: string;
    enterGroupNameAr: string;
    briefEn: string;
    enterBriefEn: string;
    briefAr: string;
    enterBriefAr: string;
    uploadImage: string;
    uploadHint: string;
    cancel: string;
    save: string;
}

@Component({
    selector: 'app-add-section-dialog',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './add-section-dialog.component.html',
    styleUrl: './add-section-dialog.component.scss'
})
export class AddSectionDialogComponent implements OnInit, OnDestroy {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<AddSectionDialogData>);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    groupNameEn = '';
    groupNameAr = '';
    briefEn = '';
    briefAr = '';
    imageUrl: string | null = null;
    imagePreview: string | null = null;
    isUploading = false;
    isImageUploaded = false;
    dir: 'ltr' | 'rtl' = 'ltr';
    lang: 'en' | 'ar' = 'en';
    attemptedSave = false;
    touchedFields: Partial<Record<AddSectionFieldKey, boolean>> = {};
    private localPreviewUrl: string | null = null;
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly mixedLanguagePattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

    readonly labelMap: Record<'en' | 'ar', AddSectionLabels> = {
        en: {
            groupNameEn: 'Group Name EN',
            enterGroupNameEn: 'Enter English group name',
            groupNameAr: 'Group Name AR',
            enterGroupNameAr: 'Enter Arabic group name',
            briefEn: 'Brief EN',
            enterBriefEn: 'Enter English brief',
            briefAr: 'Brief AR',
            enterBriefAr: 'Enter Arabic brief',
            uploadImage: 'Upload Image',
            uploadHint: 'Upload image, PNG and JPEG formats are accepted.',
            cancel: 'Cancel',
            save: 'Save'
        },
        ar: {
            groupNameEn: 'اسم المجموعة (إنجليزي)',
            enterGroupNameEn: 'أدخل اسم المجموعة بالإنجليزية',
            groupNameAr: 'اسم المجموعة (عربي)',
            enterGroupNameAr: 'أدخل اسم المجموعة بالعربية',
            briefEn: 'نبذة (إنجليزي)',
            enterBriefEn: 'أدخل النبذة بالإنجليزية',
            briefAr: 'نبذة (عربي)',
            enterBriefAr: 'أدخل النبذة بالعربية',
            uploadImage: 'رفع صورة',
            uploadHint: 'ارفع صورة، صيغ PNG و JPEG مدعومة.',
            cancel: 'إلغاء',
            save: 'حفظ'
        }
    };

    get labels(): AddSectionLabels {
        return this.labelMap[this.lang];
    }

    get canSave(): boolean {
        const fields: AddSectionFieldKey[] = ['groupNameEn', 'groupNameAr', 'briefEn', 'briefAr'];
        return !this.isUploading
            && this.isImageUploaded
            && !!this.imageUrl
            && fields.every((field) => this.getFieldValue(field).trim() && this.isFieldPatternValid(field));
    }

    get showImageRequired(): boolean {
        return this.attemptedSave && !this.imageUrl;
    }

    ngOnInit(): void {
        this.lang = this.config.data?.lang ?? 'en';
        this.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

        const initial = this.config.data?.initial;
        if (initial) {
            this.groupNameEn = initial.groupNameEn;
            this.groupNameAr = initial.groupNameAr;
            this.briefEn = initial.briefEn;
            this.briefAr = initial.briefAr;
            this.imageUrl = initial.imageUrl;
            this.imagePreview = initial.imageUrl;
            this.isImageUploaded = !!initial.imageUrl;
        }
    }

    ngOnDestroy(): void {
        this.revokeLocalPreviewUrl();
    }

    onFileChange(event: Event): void {
        if (this.isUploading) return;

        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const previousImageUrl = this.imageUrl;
        const previousImagePreview = this.imagePreview;

        this.isUploading = true;
        this.isImageUploaded = false;
        this.revokeLocalPreviewUrl();
        this.localPreviewUrl = URL.createObjectURL(file);
        this.imagePreview = this.localPreviewUrl;
        this.imageUrl = null;
        this.cdr.detectChanges();

        this.mediaService
            .upload(file, 'cms/services')
            .pipe(
                finalize(() => {
                    this.isUploading = false;
                    input.value = '';
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (res) => {
                    const uploadedUrl = res?.url;
                    if (!uploadedUrl) {
                        this.restoreImage(previousImageUrl, previousImagePreview);
                        this.showImageUploadError();
                        return;
                    }

                    this.imageUrl = uploadedUrl;
                    this.isImageUploaded = true;
                    this.swapPreviewToRemoteWhenReady(uploadedUrl);
                    this.messageService.add({
                        severity: 'success',
                        summary: this.lang === 'ar' ? '\u062a\u0645' : 'Uploaded',
                        detail: this.lang === 'ar' ? '\u062a\u0645 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0628\u0646\u062c\u0627\u062d.' : 'Services image uploaded successfully.'
                    });
                },
                error: () => {
                    this.restoreImage(previousImageUrl, previousImagePreview);
                    this.showImageUploadError();
                }
            });
    }

    markFieldTouched(field: AddSectionFieldKey): void {
        this.touchedFields[field] = true;
    }

    showRequiredError(field: AddSectionFieldKey): boolean {
        return (this.attemptedSave || !!this.touchedFields[field]) && !this.getFieldValue(field).trim();
    }

    showPatternError(field: AddSectionFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        return (this.attemptedSave || !!this.touchedFields[field]) && !!value && !this.isFieldPatternValid(field);
    }

    requiredMessage(lang: 'en' | 'ar'): string {
        return lang === 'ar' ? '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.' : 'This field is required.';
    }

    patternMessage(lang: 'en' | 'ar'): string {
        return lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0646\u0635 \u0639\u0631\u0628\u064a \u0623\u0648 \u0625\u0646\u062c\u0644\u064a\u0632\u064a \u0641\u0642\u0637.' : 'Please enter English text only.';
    }

    save(): void {
        this.attemptedSave = true;
        if (!this.canSave) return;

        const result: AddSectionDialogResult = {
            groupNameEn: this.groupNameEn.trim(),
            groupNameAr: this.groupNameAr.trim(),
            briefEn: this.briefEn.trim(),
            briefAr: this.briefAr.trim(),
            imageUrl: this.imageUrl
        };
        this.ref.close(result);
    }

    cancel(): void {
        if (this.isUploading) return;
        this.ref.close();
    }

    private restoreImage(imageUrl: string | null, imagePreview: string | null): void {
        this.revokeLocalPreviewUrl();
        this.imageUrl = imageUrl;
        this.imagePreview = imagePreview;
        this.isImageUploaded = !!imageUrl;
    }

    private showImageUploadError(): void {
        this.messageService.add({
            severity: 'error',
            summary: this.lang === 'ar' ? '\u062e\u0637\u0623' : 'Error',
            detail: this.lang === 'ar' ? '\u0641\u0634\u0644 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0627\u0644\u062e\u062f\u0645\u0629.' : 'Service section image upload failed.'
        });
    }

    private swapPreviewToRemoteWhenReady(url: string): void {
        const img = new Image();
        img.onload = () => {
            this.imagePreview = url;
            this.revokeLocalPreviewUrl();
            this.cdr.detectChanges();
        };
        img.onerror = () => {
            this.cdr.detectChanges();
        };
        img.src = url;
    }

    private revokeLocalPreviewUrl(): void {
        if (this.localPreviewUrl) {
            URL.revokeObjectURL(this.localPreviewUrl);
            this.localPreviewUrl = null;
        }
    }

    private getFieldValue(field: AddSectionFieldKey): string {
        const fieldMap: Record<AddSectionFieldKey, string> = {
            groupNameEn: this.groupNameEn,
            groupNameAr: this.groupNameAr,
            briefEn: this.briefEn,
            briefAr: this.briefAr
        };

        return fieldMap[field] ?? '';
    }

    private isFieldPatternValid(field: AddSectionFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        if (!value) return false;

        return field.endsWith('Ar')
            ? this.mixedLanguagePattern.test(value)
            : this.englishPattern.test(value);
    }
}
