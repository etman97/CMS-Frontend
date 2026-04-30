import { Component, ChangeDetectorRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { HomePageService, HomePageDto, ButtonConfigDto } from '../../../../core/services/home-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { HomeComponent, HomeDialogData } from '../../../home/home.component';
import { HomeButtonDialogComponent } from './dialogs/home-button-dialog/home-button-dialog.component';
import { HomeButtonDialogResult } from './dialogs/home-button-dialog/home-button-dialog.model';

type HomeButtonKey = 'primary' | 'secondary';
type HomeFieldKey =
    | 'heroTitleEn'
    | 'heroContentEn'
    | 'primaryButtonEn'
    | 'secondaryButtonEn'
    | 'heroTitleAr'
    | 'heroContentAr'
    | 'primaryButtonAr'
    | 'secondaryButtonAr';

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
    attemptedSave = false;
    touchedFields: Partial<Record<HomeFieldKey, boolean>> = {};

    heroTitleEn = '';
    heroContentEn = '';
    heroTitleAr = '';
    heroContentAr = '';

    primaryButton: ButtonConfigDto = { en: '', ar: '', direction: 'Internal', selectedTab: null, externalUrl: null };
    secondaryButton: ButtonConfigDto = { en: '', ar: '', direction: 'Internal', selectedTab: null, externalUrl: null };

    heroImageUrl: string | null = null;
    private persistedHeroImageUrl: string | null = null;
    private localPreviewUrl: string | null = null;
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly arabicPattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

    get canSave(): boolean {
        return this.areRequiredFieldsValid() && !!this.persistedHeroImageUrl;
    }

    ngOnInit(): void {
        this.homePageService.get({ forceRefresh: true }).subscribe({
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
        this.heroTitleAr = data.heroTitleAr;
        this.heroContentAr = data.heroContentAr;
        this.primaryButton = { ...data.primaryButton };
        this.secondaryButton = { ...data.secondaryButton };
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

    markFieldTouched(field: HomeFieldKey): void {
        this.touchedFields[field] = true;
    }

    showRequiredError(field: HomeFieldKey): boolean {
        return (this.attemptedSave || !!this.touchedFields[field]) && !this.getRequiredFieldValue(field).trim();
    }

    showPatternError(field: HomeFieldKey): boolean {
        const value = this.getRequiredFieldValue(field).trim();
        return (this.attemptedSave || !!this.touchedFields[field]) && !!value && !this.isFieldPatternValid(field);
    }

    requiredMessage(lang: 'en' | 'ar'): string {
        return lang === 'ar' ? 'هذا الحقل مطلوب.' : 'This field is required.';
    }

    patternMessage(lang: 'en' | 'ar'): string {
        return lang === 'ar' ? 'يرجى إدخال نص عربي أو إنجليزي فقط.' : 'Please enter English text only.';
    }

    private areRequiredFieldsValid(): boolean {
        const fields: HomeFieldKey[] = [
            'heroTitleEn',
            'heroContentEn',
            'primaryButtonEn',
            'secondaryButtonEn',
            'heroTitleAr',
            'heroContentAr',
            'primaryButtonAr',
            'secondaryButtonAr'
        ];

        return fields.every((field) => {
            const value = this.getRequiredFieldValue(field).trim();
            return !!value && this.isFieldPatternValid(field);
        });
    }

    private getRequiredFieldValue(field: HomeFieldKey): string {
        const fieldMap: Record<HomeFieldKey, string> = {
            heroTitleEn: this.heroTitleEn,
            heroContentEn: this.heroContentEn,
            primaryButtonEn: this.primaryButton.en,
            secondaryButtonEn: this.secondaryButton.en,
            heroTitleAr: this.heroTitleAr,
            heroContentAr: this.heroContentAr,
            primaryButtonAr: this.primaryButton.ar,
            secondaryButtonAr: this.secondaryButton.ar
        };

        return fieldMap[field] ?? '';
    }

    private isFieldPatternValid(field: HomeFieldKey): boolean {
        const value = this.getRequiredFieldValue(field).trim();
        if (!value) {
            return false;
        }

        return field.endsWith('Ar')
            ? this.arabicPattern.test(value)
            : this.englishPattern.test(value);
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
        const cfg = button === 'primary' ? this.primaryButton : this.secondaryButton;

        return this.dialogService.open(HomeButtonDialogComponent, {
            ...PRIME_NG_CONFIGS.dynamicDialog,
            header: isArabic ? 'تعديل الزر' : 'Edit Button',
            data: {
                lang,
                label: lang === 'ar' ? cfg.ar : cfg.en,
                direction: cfg.direction,
                linkValue: cfg.direction === 'Internal' ? (cfg.selectedTab ?? '') : (cfg.externalUrl ?? '')
            },
            style: { direction: isArabic ? 'rtl' : 'ltr' },
            width: '520px'
        });
    }

    private applyButtonDialogResult(button: HomeButtonKey, lang: 'en' | 'ar', result: HomeButtonDialogResult): void {
        const cfg = button === 'primary' ? this.primaryButton : this.secondaryButton;

        if (lang === 'ar') {
            cfg.ar = result.label;
        } else {
            cfg.en = result.label;
        }

        cfg.direction = result.direction;
        if (result.direction === 'Internal') {
            cfg.selectedTab = result.linkValue || null;
            cfg.externalUrl = null;
        } else {
            cfg.externalUrl = this.normalizeExternalUrl(result.linkValue);
            cfg.selectedTab = null;
        }
    }

    private normalizeExternalUrl(value: string): string {
        const trimmed = value.trim();
        if (!trimmed || /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
            return trimmed;
        }

        return `https://${trimmed}`;
    }

    onPreview(): void {
        this.attemptedSave = true;

        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

        const payload: HomePageDto = {
            isActive: this.isActive,
            heroTitleEn: this.heroTitleEn,
            heroContentEn: this.heroContentEn,
            heroTitleAr: this.heroTitleAr,
            heroContentAr: this.heroContentAr,
            heroImageUrl: this.heroImageUrl,
            primaryButton: { ...this.primaryButton },
            secondaryButton: { ...this.secondaryButton }
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
        this.attemptedSave = true;

        if (this.isSaving || this.isUploadingImage) return;
        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

        const dto: HomePageDto = {
            isActive: this.isActive,
            heroTitleEn: this.heroTitleEn,
            heroContentEn: this.heroContentEn,
            heroTitleAr: this.heroTitleAr,
            heroContentAr: this.heroContentAr,
            heroImageUrl: this.persistedHeroImageUrl,
            primaryButton: { ...this.primaryButton },
            secondaryButton: { ...this.secondaryButton }
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

    private showValidationWarning(): void {
        const isArabic = this.activeTab === 'ar';
        this.messageService.add({
            severity: 'warn',
            summary: isArabic ? 'تنبيه' : 'Validation',
            detail: isArabic ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill all required fields.'
        });
    }
}

