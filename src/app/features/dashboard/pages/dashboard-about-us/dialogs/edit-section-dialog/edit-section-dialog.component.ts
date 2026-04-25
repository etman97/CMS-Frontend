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
    private localPreviewUrl: string | null = null;

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

    save(): void {
        if (this.isUploading) return;

        const result: EditSectionDialogResult = {
            content: this.content,
            imageUrl: this.persistedImageUrl
        };
        this.ref.close(result);
    }

    cancel(): void {
        if (this.isUploading) return;
        this.ref.close();
    }
}
