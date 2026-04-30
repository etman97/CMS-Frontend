import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AboutSection, EditSectionDialogData, EditSectionDialogResult, SectionLang } from './edit-section-dialog.model';
import { MediaService } from '../../../../../../core/services/media.service';

@Component({
    selector: 'app-edit-section-dialog',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './edit-section-dialog.component.html',
    styleUrl: './edit-section-dialog.component.scss'
})
export class EditSectionDialogComponent implements OnInit, OnDestroy {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<EditSectionDialogData>);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    content = '';
    dir: 'ltr' | 'rtl' = 'ltr';
    lang = 'en';
    imageUrl: string | null = null;
    private persistedImageUrl: string | null = null;
    isUploading = false;
    attemptedSave = false;
    contentTouched = false;
    private localPreviewUrl: string | null = null;
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly arabicPattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

    get placeholder(): string {
        return this.lang === 'ar' ? 'أدخل المحتوى...' : 'Enter content...';
    }

    get uploadHint(): string {
        return this.lang === 'ar'
            ? 'ارفع الصور، يتم قبول صيغ PNG و JPEG.'
            : 'Upload images, PNG and JPEG formats are accepted.';
    }

    get showContentRequired(): boolean {
        return (this.attemptedSave || this.contentTouched) && !this.content.trim();
    }

    get showContentPattern(): boolean {
        const value = this.content.trim();
        return (this.attemptedSave || this.contentTouched) && !!value && !this.isContentPatternValid();
    }

    get canSave(): boolean {
        return !this.isUploading && !!this.content.trim() && this.isContentPatternValid();
    }

    get requiredMessage(): string {
        return this.lang === 'ar' ? '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.' : 'This field is required.';
    }

    get patternMessage(): string {
        return this.lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0646\u0635 \u0639\u0631\u0628\u064a \u0623\u0648 \u0625\u0646\u062c\u0644\u064a\u0632\u064a \u0641\u0642\u0637.' : 'Please enter English text only.';
    }

    ngOnInit(): void {
        const lang: SectionLang = this.config.data?.lang ?? 'en';
        this.lang = lang;
        this.content = this.config.data?.content ?? '';
        this.imageUrl = this.config.data?.imageUrl ?? null;
        this.persistedImageUrl = this.config.data?.imageUrl ?? null;
        this.dir = lang === 'ar' ? 'rtl' : 'ltr';
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
        const previousPersistedImageUrl = this.persistedImageUrl;

        this.isUploading = true;
        this.revokeLocalPreviewUrl();
        this.localPreviewUrl = URL.createObjectURL(file);
        this.imageUrl = this.localPreviewUrl;
        this.cdr.detectChanges();

        this.mediaService.upload(file, 'cms/sections').subscribe({
            next: (res) => {
                this.persistedImageUrl = res.url;
                this.isUploading = false;
                input.value = '';
                this.swapPreviewToRemoteWhenReady(res.url);
                this.cdr.detectChanges();
                this.messageService.add({
                    severity: 'success',
                    summary: this.lang === 'ar' ? 'تم' : 'Uploaded',
                    detail: this.lang === 'ar'
                        ? `تم رفع صورة ${this.getSectionLabel('ar')} بنجاح.`
                        : `${this.getSectionLabel('en')} image uploaded successfully.`
                });
            },
            error: () => {
                this.revokeLocalPreviewUrl();
                this.imageUrl = previousImageUrl;
                this.persistedImageUrl = previousPersistedImageUrl;
                this.isUploading = false;
                input.value = '';
                this.cdr.detectChanges();
                this.messageService.add({
                    severity: 'error',
                    summary: this.lang === 'ar' ? 'خطأ' : 'Error',
                    detail: this.lang === 'ar'
                        ? `فشل رفع صورة ${this.getSectionLabel('ar')}.`
                        : `${this.getSectionLabel('en')} image upload failed.`
                });
            }
        });
    }

    private swapPreviewToRemoteWhenReady(url: string): void {
        const img = new Image();
        img.onload = () => {
            this.imageUrl = url;
            this.revokeLocalPreviewUrl();
            this.cdr.detectChanges();
        };
        img.src = url;
    }

    private getSectionLabel(lang: SectionLang): string {
        const section: AboutSection = this.config.data?.section ?? 'mission';
        const labels: Record<SectionLang, Record<'mission' | 'vision' | 'leadership', string>> = {
            en: {
                mission: 'Mission',
                vision: 'Vision',
                leadership: 'Leadership'
            },
            ar: {
                mission: 'المهمة',
                vision: 'الرؤية',
                leadership: 'القيادة'
            }
        };

        return labels[lang][section];
    }

    private revokeLocalPreviewUrl(): void {
        if (this.localPreviewUrl) {
            URL.revokeObjectURL(this.localPreviewUrl);
            this.localPreviewUrl = null;
        }
    }

    markContentTouched(): void {
        this.contentTouched = true;
    }

    private isContentPatternValid(): boolean {
        const value = this.content.trim();
        if (!value) {
            return false;
        }

        return this.lang === 'ar'
            ? this.arabicPattern.test(value)
            : this.englishPattern.test(value);
    }

    save(): void {
        this.attemptedSave = true;

        if (!this.canSave) {
            this.cdr.detectChanges();
            return;
        }

        const result: EditSectionDialogResult = {
            content: this.content.trim(),
            imageUrl: this.persistedImageUrl
        };
        this.ref.close(result);
    }

    cancel(): void {
        if (this.isUploading) return;
        this.ref.close();
    }
}
