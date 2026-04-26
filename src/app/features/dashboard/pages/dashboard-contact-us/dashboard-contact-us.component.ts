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

    heroImageUrl: string | null = null;
    private persistedHeroImageUrl: string | null = null;
    private localPreviewUrl: string | null = null;
    introDescriptionEn = '';
    introDescriptionAr = '';
    phone = '';
    email = '';
    address = '';
    locationUrl = '';

    readonly labels: Record<ContactLang, { introTitle: string; contactTitle: string; visitTitle: string }> = {
        en: { introTitle: 'Contact Us', contactTitle: 'Contact Us', visitTitle: 'Visit Us' },
        ar: { introTitle: 'تواصل معنا', contactTitle: 'تواصل معنا', visitTitle: 'زورونا' }
    };

    ngOnInit(): void {
        this.contactPageService.get().subscribe({
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

    onPreview(): void {
        const normalizedLocationUrl = this.normalizeMapUrl(this.locationUrl);

        const payload: ContactPageDto = {
            isActive: this.isActive,
            introDescriptionEn: this.introDescriptionEn,
            introDescriptionAr: this.introDescriptionAr,
            phone: this.phone,
            email: this.email,
            address: this.address,
            locationUrl: normalizedLocationUrl,
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
        if (this.isSaving || this.isUploadingImage) return;

        const normalizedLocationUrl = this.normalizeMapUrl(this.locationUrl);

        const dto: ContactPageDto = {
            isActive: this.isActive,
            introDescriptionEn: this.introDescriptionEn,
            introDescriptionAr: this.introDescriptionAr,
            phone: this.phone,
            email: this.email,
            address: this.address,
            locationUrl: normalizedLocationUrl,
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
}
