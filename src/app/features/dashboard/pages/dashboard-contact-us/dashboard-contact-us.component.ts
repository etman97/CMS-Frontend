import { Component, ChangeDetectorRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ContactPageService, ContactPageDto } from '../../../../core/services/contact-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { ContactComponent, ContactDialogData } from '../../../contact/contact.component';

type ContactLang = 'en' | 'ar';
type ContactFieldKey = 'introDescriptionEn' | 'introDescriptionAr' | 'phone' | 'email' | 'address' | 'locationUrl' | 'facebookUrl' | 'linkedInUrl' | 'twitterUrl' | 'instagramUrl' | 'tiktokUrl' | 'youtubeUrl' | 'whatsappUrl';

@Component({
    selector: 'app-dashboard-contact-us',
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule, DashboardPageHeaderComponent],
    standalone: true,
    providers: [DialogService],
    templateUrl: './dashboard-contact-us.component.html',
    styleUrl: './dashboard-contact-us.component.scss'
})
export class DashboardContactUsComponent implements OnInit, OnDestroy {
    private readonly contactPageService = inject(ContactPageService);
    private readonly mediaService = inject(MediaService);
    private readonly dialogService = inject(DialogService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    activeTab: ContactLang = 'en';
    isLoading = true;
    isActive = true;
    isSaving = false;
    isUploadingImage = false;
    attemptedSave = false;
    touchedFields: Partial<Record<ContactFieldKey, boolean>> = {};

    heroImageUrl: string | null = null;
    private persistedHeroImageUrl: string | null = null;
    private localPreviewUrl: string | null = null;
    introDescriptionEn = '';
    introDescriptionAr = '';
    phone = '';
    email = '';
    address = '';
    locationUrl = '';
    facebookUrl = '';
    linkedInUrl = '';
    twitterUrl = '';
    instagramUrl = '';
    tiktokUrl = '';
    youtubeUrl = '';
    whatsappUrl = '';
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly mixedLanguagePattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;
    private readonly phonePattern = /^[0-9+\-\s()]{6,20}$/;
    private readonly emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    private readonly urlPattern = /^https?:\/\/[^\s]+$/i;

    readonly labels: Record<ContactLang, { introTitle: string; contactTitle: string; visitTitle: string }> = {
        en: { introTitle: 'Contact Us', contactTitle: 'Contact Us', visitTitle: 'Visit Us' },
        ar: { introTitle: 'تواصل معنا', contactTitle: 'تواصل معنا', visitTitle: 'زورونا' }
    };

    get canSave(): boolean {
        return this.areRequiredFieldsValid() && !!this.persistedHeroImageUrl;
    }

    ngOnInit(): void {
        this.contactPageService.get(true).subscribe({
            next: (data) => {
                if (data) this.populate(data);
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.markForCheck();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load page data.' });
            }
        });
    }

    ngOnDestroy(): void {
        this.revokeLocalPreviewUrl();
    }

    private populate(data: ContactPageDto): void {
        this.isActive = data.isActive;
        this.introDescriptionEn = data.introDescriptionEn;
        this.introDescriptionAr = data.introDescriptionAr;
        this.phone = data.phone;
        this.email = data.email;
        this.address = data.address;
        this.locationUrl = data.locationUrl;
        this.facebookUrl = data.facebookUrl ?? '';
        this.linkedInUrl = data.linkedInUrl ?? '';
        this.twitterUrl = data.twitterUrl ?? '';
        this.instagramUrl = data.instagramUrl ?? '';
        this.tiktokUrl = data.tiktokUrl ?? '';
        this.youtubeUrl = data.youtubeUrl ?? '';
        this.whatsappUrl = data.whatsappUrl ?? '';
        this.heroImageUrl = data.heroImageUrl;
        this.persistedHeroImageUrl = data.heroImageUrl;
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const previousImageUrl = this.heroImageUrl;

        this.isUploadingImage = true;
        this.revokeLocalPreviewUrl();
        this.localPreviewUrl = URL.createObjectURL(file);
        this.heroImageUrl = this.localPreviewUrl;
        this.cdr.detectChanges();

        this.mediaService.upload(file, 'cms/contact').subscribe({
            next: (res) => {
                this.persistedHeroImageUrl = res.url;
                this.isUploadingImage = false;
                input.value = '';
                this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Image uploaded successfully.' });
                this.swapToRemoteImageWhenReady(res.url);
                this.cdr.detectChanges();
            },
            error: () => {
                this.revokeLocalPreviewUrl();
                this.heroImageUrl = previousImageUrl;
                this.persistedHeroImageUrl = previousImageUrl;
                this.isUploadingImage = false;
                input.value = '';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Image upload failed.' });
                this.cdr.detectChanges();
            }
        });
    }

    private swapToRemoteImageWhenReady(url: string): void {
        const img = new Image();
        img.onload = () => {
            this.heroImageUrl = url;
            this.revokeLocalPreviewUrl();
            this.cdr.detectChanges();
        };
        img.onerror = () => {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Image uploaded but preview is not ready yet.' });
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

    private normalizeMapUrl(value: string): string {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }

        if (trimmed.startsWith('<')) {
            const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
            if (!srcMatch?.[1]) {
                return '';
            }

            return srcMatch[1].replace(/&amp;/g, '&').trim();
        }

        return trimmed.replace(/&amp;/g, '&');
    }

    markFieldTouched(field: ContactFieldKey): void {
        this.touchedFields[field] = true;
    }

    showRequiredError(field: ContactFieldKey): boolean {
        if (this.isSocialField(field)) return false;
        return (this.attemptedSave || !!this.touchedFields[field]) && !this.getFieldValue(field).trim();
    }

    showPatternError(field: ContactFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        return (this.attemptedSave || !!this.touchedFields[field]) && !!value && !this.isFieldPatternValid(field);
    }

    requiredMessage(lang: ContactLang): string {
        return lang === 'ar' ? '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.' : 'This field is required.';
    }

    patternMessage(field: ContactFieldKey, lang: ContactLang): string {
        if (field === 'phone') {
            return lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0631\u0642\u0645 \u0647\u0627\u062a\u0641 \u0635\u062d\u064a\u062d.' : 'Please enter a valid phone number.';
        }
        if (field === 'email') {
            return lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0628\u0631\u064a\u062f \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0635\u062d\u064a\u062d.' : 'Please enter a valid email address.';
        }
        if (field === 'locationUrl' || this.isSocialField(field)) {
            return lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0631\u0627\u0628\u0637 \u0635\u062d\u064a\u062d.' : 'Please enter a valid URL.';
        }

        return lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0646\u0635 \u0639\u0631\u0628\u064a \u0623\u0648 \u0625\u0646\u062c\u0644\u064a\u0632\u064a \u0641\u0642\u0637.' : 'Please enter English text only.';
    }

    private readonly socialFields: ContactFieldKey[] = ['facebookUrl', 'linkedInUrl', 'twitterUrl', 'instagramUrl', 'tiktokUrl', 'youtubeUrl', 'whatsappUrl'];

    private isSocialField(field: ContactFieldKey): boolean {
        return this.socialFields.includes(field);
    }

    private areRequiredFieldsValid(): boolean {
        const requiredFields: ContactFieldKey[] = ['introDescriptionEn', 'introDescriptionAr', 'phone', 'email', 'address', 'locationUrl'];
        const requiredValid = requiredFields.every((field) => this.getFieldValue(field).trim() && this.isFieldPatternValid(field));
        const socialValid = this.socialFields.every((field) => {
            const value = this.getFieldValue(field).trim();
            return !value || this.isFieldPatternValid(field);
        });
        return requiredValid && socialValid;
    }

    private getFieldValue(field: ContactFieldKey): string {
        const fieldMap: Record<ContactFieldKey, string> = {
            introDescriptionEn: this.introDescriptionEn,
            introDescriptionAr: this.introDescriptionAr,
            phone: this.phone,
            email: this.email,
            address: this.address,
            locationUrl: this.locationUrl,
            facebookUrl: this.facebookUrl,
            linkedInUrl: this.linkedInUrl,
            twitterUrl: this.twitterUrl,
            instagramUrl: this.instagramUrl,
            tiktokUrl: this.tiktokUrl,
            youtubeUrl: this.youtubeUrl,
            whatsappUrl: this.whatsappUrl
        };

        return fieldMap[field] ?? '';
    }

    private isFieldPatternValid(field: ContactFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        if (!value) return false;

        if (field === 'introDescriptionEn') return this.englishPattern.test(value);
        if (field === 'introDescriptionAr' || field === 'address') return this.mixedLanguagePattern.test(value);
        if (field === 'phone') return this.phonePattern.test(value);
        if (field === 'email') return this.emailPattern.test(value);

        return this.urlPattern.test(field === 'locationUrl' ? this.normalizeMapUrl(value) : value);
    }

    onPreview(): void {
        this.attemptedSave = true;

        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

        const normalizedLocationUrl = this.normalizeMapUrl(this.locationUrl);

        const payload: ContactPageDto = {
            isActive: this.isActive,
            introDescriptionEn: this.introDescriptionEn,
            introDescriptionAr: this.introDescriptionAr,
            phone: this.phone,
            email: this.email,
            address: this.address,
            locationUrl: normalizedLocationUrl,
            facebookUrl: this.facebookUrl.trim() || null,
            linkedInUrl: this.linkedInUrl.trim() || null,
            twitterUrl: this.twitterUrl.trim() || null,
            instagramUrl: this.instagramUrl.trim() || null,
            tiktokUrl: this.tiktokUrl.trim() || null,
            youtubeUrl: this.youtubeUrl.trim() || null,
            whatsappUrl: this.whatsappUrl.trim() || null,
            heroImageUrl: this.heroImageUrl
        };

        const previewLang: 'en' | 'ar' = this.activeTab === 'ar' ? 'ar' : 'en';
        const previewHeader = previewLang === 'ar' ? 'معاينة التواصل معنا' : 'Contact Us Preview';

        const dialogData: ContactDialogData = {
            source: 'preview',
            data: payload,
            previewLang
        };

        this.dialogService.open(ContactComponent, {
            ...PRIME_NG_CONFIGS.dynamicDialog,
            header: previewHeader,
            data: dialogData,
            width: '95vw',
            height: '95vh',
            style: { direction: previewLang === 'ar' ? 'rtl' : 'ltr' },
            contentStyle: { padding: '0' },
            maximizable: false,
            closable: true
        });
    }

    save(): void {
        this.attemptedSave = true;

        if (this.isSaving || this.isUploadingImage) return;
        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

        const normalizedLocationUrl = this.normalizeMapUrl(this.locationUrl);

        const dto: ContactPageDto = {
            isActive: this.isActive,
            introDescriptionEn: this.introDescriptionEn,
            introDescriptionAr: this.introDescriptionAr,
            phone: this.phone,
            email: this.email,
            address: this.address,
            locationUrl: normalizedLocationUrl,
            facebookUrl: this.facebookUrl.trim() || null,
            linkedInUrl: this.linkedInUrl.trim() || null,
            twitterUrl: this.twitterUrl.trim() || null,
            instagramUrl: this.instagramUrl.trim() || null,
            tiktokUrl: this.tiktokUrl.trim() || null,
            youtubeUrl: this.youtubeUrl.trim() || null,
            whatsappUrl: this.whatsappUrl.trim() || null,
            heroImageUrl: this.persistedHeroImageUrl
        };

        this.isSaving = true;
        this.contactPageService.save(dto).subscribe({
            next: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Contact page saved successfully.' });
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save contact page.' });
            }
        });
    }

    private showValidationWarning(): void {
        const isArabic = this.activeTab === 'ar';
        this.messageService.add({
            severity: 'warn',
            summary: isArabic ? '\u062a\u0646\u0628\u064a\u0647' : 'Validation',
            detail: isArabic ? '\u064a\u0631\u062c\u0649 \u0645\u0644\u0621 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.' : 'Please fill all required fields.'
        });
    }
}
