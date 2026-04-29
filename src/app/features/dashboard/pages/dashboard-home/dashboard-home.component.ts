import { Component, ChangeDetectorRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { HomePageService, HomePageDto, HomeButtonLinkType } from '../../../../core/services/home-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { HomeComponent, HomeDialogData } from '../../../home/home.component';
import { HomeButtonDialogComponent } from './dialogs/home-button-dialog/home-button-dialog.component';
import { HomeButtonDialogResult } from './dialogs/home-button-dialog/home-button-dialog.model';

type HomeButtonKey = 'primary' | 'secondary';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule, DashboardPageHeaderComponent],
    providers: [DialogService],
    templateUrl: './dashboard-home.component.html',
    styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
    private readonly homePageService = inject(HomePageService);
    private readonly mediaService = inject(MediaService);
    private readonly dialogService = inject(DialogService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    activeTab = 'en';
    isLoading = true;
    isActive = true;
    isSaving = false;
    isUploadingImage = false;

    heroTitleEn = '';
    heroContentEn = '';
    primaryButtonTextEn = '';
    secondaryButtonTextEn = '';
    primaryButtonLinkTypeEn: HomeButtonLinkType = 'internal';
    primaryButtonLinkEn = '';
    secondaryButtonLinkTypeEn: HomeButtonLinkType = 'internal';
    secondaryButtonLinkEn = '';

    heroTitleAr = '';
    heroContentAr = '';
    primaryButtonTextAr = '';
    secondaryButtonTextAr = '';
    primaryButtonLinkTypeAr: HomeButtonLinkType = 'internal';
    primaryButtonLinkAr = '';
    secondaryButtonLinkTypeAr: HomeButtonLinkType = 'internal';
    secondaryButtonLinkAr = '';

    heroImageUrl: string | null = null;
    private persistedHeroImageUrl: string | null = null;
    private localPreviewUrl: string | null = null;

    ngOnInit(): void {
        this.homePageService.get().subscribe({
            next: (data) => {
                if (data) {
                    this.populate(data);
                }
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

    private populate(data: HomePageDto): void {
        this.isActive = data.isActive;
        this.heroTitleEn = data.heroTitleEn;
        this.heroContentEn = data.heroContentEn;
        this.primaryButtonTextEn = data.primaryButtonTextEn;
        this.secondaryButtonTextEn = data.secondaryButtonTextEn;
        this.primaryButtonLinkTypeEn = data.primaryButtonLinkTypeEn ?? 'internal';
        this.primaryButtonLinkEn = data.primaryButtonLinkEn ?? '';
        this.secondaryButtonLinkTypeEn = data.secondaryButtonLinkTypeEn ?? 'internal';
        this.secondaryButtonLinkEn = data.secondaryButtonLinkEn ?? '';
        this.heroTitleAr = data.heroTitleAr;
        this.heroContentAr = data.heroContentAr;
        this.primaryButtonTextAr = data.primaryButtonTextAr;
        this.secondaryButtonTextAr = data.secondaryButtonTextAr;
        this.primaryButtonLinkTypeAr = data.primaryButtonLinkTypeAr ?? 'internal';
        this.primaryButtonLinkAr = data.primaryButtonLinkAr ?? '';
        this.secondaryButtonLinkTypeAr = data.secondaryButtonLinkTypeAr ?? 'internal';
        this.secondaryButtonLinkAr = data.secondaryButtonLinkAr ?? '';
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

        this.mediaService.upload(file, 'cms/home').subscribe({
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

    openButtonDialog(button: HomeButtonKey, lang: 'en' | 'ar'): void {
        const dialogRef = this.createButtonDialog(button, lang);

        dialogRef?.onClose.subscribe((result?: HomeButtonDialogResult) => {
            if (!result) return;

            this.applyButtonDialogResult(button, lang, result);
            this.cdr.markForCheck();
        });
    }

    private createButtonDialog(button: HomeButtonKey, lang: 'en' | 'ar'): DynamicDialogRef | null {
        const isArabic = lang === 'ar';

        return this.dialogService.open(HomeButtonDialogComponent, {
            ...PRIME_NG_CONFIGS.dynamicDialog,
            header: isArabic ? 'تعديل الزر' : 'Edit Button',
            data: {
                lang,
                label: this.getButtonText(button, lang),
                linkType: this.getButtonLinkType(button, lang),
                linkValue: this.getButtonLinkValue(button, lang)
            },
            style: { direction: isArabic ? 'rtl' : 'ltr' },
            width: '520px'
        });
    }

    private applyButtonDialogResult(button: HomeButtonKey, lang: 'en' | 'ar', result: HomeButtonDialogResult): void {
        const normalizedLinkValue = result.linkType === 'external'
            ? this.normalizeExternalUrl(result.linkValue)
            : (result.linkValue || '/');

        if (button === 'primary' && lang === 'en') {
            this.primaryButtonTextEn = result.label;
            this.primaryButtonLinkTypeEn = result.linkType;
            this.primaryButtonLinkEn = normalizedLinkValue;
            return;
        }

        if (button === 'secondary' && lang === 'en') {
            this.secondaryButtonTextEn = result.label;
            this.secondaryButtonLinkTypeEn = result.linkType;
            this.secondaryButtonLinkEn = normalizedLinkValue;
            return;
        }

        if (button === 'primary') {
            this.primaryButtonTextAr = result.label;
            this.primaryButtonLinkTypeAr = result.linkType;
            this.primaryButtonLinkAr = normalizedLinkValue;
            return;
        }

        this.secondaryButtonTextAr = result.label;
        this.secondaryButtonLinkTypeAr = result.linkType;
        this.secondaryButtonLinkAr = normalizedLinkValue;
    }

    private getButtonText(button: HomeButtonKey, lang: 'en' | 'ar'): string {
        if (button === 'primary') {
            return lang === 'ar' ? this.primaryButtonTextAr : this.primaryButtonTextEn;
        }

        return lang === 'ar' ? this.secondaryButtonTextAr : this.secondaryButtonTextEn;
    }

    private getButtonLinkType(button: HomeButtonKey, lang: 'en' | 'ar'): HomeButtonLinkType {
        if (button === 'primary') {
            return lang === 'ar' ? this.primaryButtonLinkTypeAr : this.primaryButtonLinkTypeEn;
        }

        return lang === 'ar' ? this.secondaryButtonLinkTypeAr : this.secondaryButtonLinkTypeEn;
    }

    private getButtonLinkValue(button: HomeButtonKey, lang: 'en' | 'ar'): string {
        if (button === 'primary') {
            return lang === 'ar' ? this.primaryButtonLinkAr : this.primaryButtonLinkEn;
        }

        return lang === 'ar' ? this.secondaryButtonLinkAr : this.secondaryButtonLinkEn;
    }

    private normalizeExternalUrl(value: string): string {
        const trimmed = value.trim();
        if (!trimmed || /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
            return trimmed;
        }

        return `https://${trimmed}`;
    }

    onPreview(): void {
        const payload: HomePageDto = {
            isActive: this.isActive,
            heroTitleEn: this.heroTitleEn,
            heroContentEn: this.heroContentEn,
            primaryButtonTextEn: this.primaryButtonTextEn,
            secondaryButtonTextEn: this.secondaryButtonTextEn,
            primaryButtonLinkTypeEn: this.primaryButtonLinkTypeEn,
            primaryButtonLinkEn: this.primaryButtonLinkEn,
            secondaryButtonLinkTypeEn: this.secondaryButtonLinkTypeEn,
            secondaryButtonLinkEn: this.secondaryButtonLinkEn,
            heroTitleAr: this.heroTitleAr,
            heroContentAr: this.heroContentAr,
            primaryButtonTextAr: this.primaryButtonTextAr,
            secondaryButtonTextAr: this.secondaryButtonTextAr,
            primaryButtonLinkTypeAr: this.primaryButtonLinkTypeAr,
            primaryButtonLinkAr: this.primaryButtonLinkAr,
            secondaryButtonLinkTypeAr: this.secondaryButtonLinkTypeAr,
            secondaryButtonLinkAr: this.secondaryButtonLinkAr,
            heroImageUrl: this.heroImageUrl
        };

        const previewLang: 'en' | 'ar' = this.activeTab === 'ar' ? 'ar' : 'en';
        const previewHeader = previewLang === 'ar' ? 'الصفحة الرئيسية - معاينة' : 'Home Preview';

        const dialogData: HomeDialogData = {
            source: 'preview',
            data: payload,
            previewLang
        };

        this.dialogService.open(HomeComponent, {
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

        const dto: HomePageDto = {
            isActive: this.isActive,
            heroTitleEn: this.heroTitleEn,
            heroContentEn: this.heroContentEn,
            primaryButtonTextEn: this.primaryButtonTextEn,
            secondaryButtonTextEn: this.secondaryButtonTextEn,
            primaryButtonLinkTypeEn: this.primaryButtonLinkTypeEn,
            primaryButtonLinkEn: this.primaryButtonLinkEn,
            secondaryButtonLinkTypeEn: this.secondaryButtonLinkTypeEn,
            secondaryButtonLinkEn: this.secondaryButtonLinkEn,
            heroTitleAr: this.heroTitleAr,
            heroContentAr: this.heroContentAr,
            primaryButtonTextAr: this.primaryButtonTextAr,
            secondaryButtonTextAr: this.secondaryButtonTextAr,
            primaryButtonLinkTypeAr: this.primaryButtonLinkTypeAr,
            primaryButtonLinkAr: this.primaryButtonLinkAr,
            secondaryButtonLinkTypeAr: this.secondaryButtonLinkTypeAr,
            secondaryButtonLinkAr: this.secondaryButtonLinkAr,
            heroImageUrl: this.persistedHeroImageUrl
        };

        this.isSaving = true;
        this.homePageService.save(dto).subscribe({
            next: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Home page saved successfully.' });
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save home page.' });
            }
        });
    }
}

