import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { PartnersPageService } from '../../../../core/services/partners-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { PartnersComponent, PartnersDialogData } from '../../../partners/partners.component';

type PartnersLang = 'en' | 'ar';
type PartnersFieldKey = 'subtitleEn' | 'subtitleAr';

interface PartnerCard {
    localId: number;
    backendId: number;
    imageUrl: string | null;
    persistedImageUrl: string | null;
    pendingFile: File | null;
    isUploading: boolean;
}

interface IntroContent {
    title: string;
    description: string;
}

@Component({
    selector: 'app-dashboard-partners',
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule, DashboardPageHeaderComponent],
    providers: [DialogService],
    standalone: true,
    templateUrl: './dashboard-partners.component.html',
    styleUrl: './dashboard-partners.component.scss'
})
export class DashboardPartnersComponent implements OnInit, OnDestroy {
    private readonly partnersPageService = inject(PartnersPageService);
    private readonly mediaService = inject(MediaService);
    private readonly dialogService = inject(DialogService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    activeTab: PartnersLang = 'en';
    isLoading = true;
    isActive = true;
    isSaving = false;
    isUploadingImage = false;
    attemptedSave = false;
    touchedFields: Partial<Record<PartnersFieldKey, boolean>> = {};

    topImageUrl: string | null = null;
    private persistedTopImageUrl: string | null = null;
    private localTopPreviewUrl: string | null = null;

    introByLang: Record<PartnersLang, IntroContent> = {
        en: { title: 'Our Partners', description: '' },
        ar: { title: 'شركاؤنا', description: '' }
    };

    partnerCards: PartnerCard[] = [];
    private nextLocalId = 1;
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly mixedLanguagePattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

    get canSave(): boolean {
        return this.areRequiredFieldsValid() && this.areRequiredImagesValid();
    }

    ngOnInit(): void {
        this.partnersPageService.get({ forceRefresh: true }).subscribe({
            next: (data) => {
                if (data) {
                    this.isActive = data.isActive;
                    this.topImageUrl = data.heroImageUrl;
                    this.persistedTopImageUrl = data.heroImageUrl;
                    this.introByLang.en.description = data.subtitleEn;
                    this.introByLang.ar.description = data.subtitleAr;
                    this.partnerCards = [...data.partnerLogos]
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map(logo => ({
                            localId: this.nextLocalId++,
                            backendId: logo.id,
                            imageUrl: logo.logoImageUrl,
                            persistedImageUrl: logo.logoImageUrl,
                            pendingFile: null,
                            isUploading: false
                        }));
                }
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.markForCheck();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load partners data.' });
            }
        });
    }

    ngOnDestroy(): void {
        this.revokeTopPreviewUrl();
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const previousUrl = this.topImageUrl;
        this.isUploadingImage = true;
        this.revokeTopPreviewUrl();
        this.localTopPreviewUrl = URL.createObjectURL(file);
        this.topImageUrl = this.localTopPreviewUrl;
        this.cdr.detectChanges();

        this.mediaService.upload(file, 'cms/partners').subscribe({
            next: (res) => {
                this.persistedTopImageUrl = res.url;
                this.isUploadingImage = false;
                input.value = '';
                this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Image uploaded.' });
                this.swapToRemoteTopImageWhenReady(res.url);
                this.cdr.detectChanges();
            },
            error: () => {
                this.revokeTopPreviewUrl();
                this.topImageUrl = previousUrl;
                this.persistedTopImageUrl = previousUrl;
                this.isUploadingImage = false;
                input.value = '';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Image upload failed.' });
                this.cdr.detectChanges();
            }
        });
    }

    private swapToRemoteTopImageWhenReady(url: string): void {
        const img = new Image();
        img.onload = () => {
            this.topImageUrl = url;
            this.revokeTopPreviewUrl();
            this.cdr.detectChanges();
        };
        img.onerror = () => {
            this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Image uploaded but preview is not ready yet.' });
            this.cdr.detectChanges();
        };
        img.src = url;
    }

    onPartnerLogoSelected(event: Event, localId: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const card = this.partnerCards.find(c => c.localId === localId);
        if (!card) return;

        const previousUrl = card.imageUrl;
        card.isUploading = true;
        const preview = URL.createObjectURL(file);
        card.imageUrl = preview;
        this.cdr.detectChanges();

        this.mediaService.upload(file, 'cms/partners').subscribe({
            next: (res) => {
                URL.revokeObjectURL(preview);
                card.persistedImageUrl = res.url;
                card.imageUrl = res.url;
                card.isUploading = false;
                input.value = '';
                this.cdr.detectChanges();
            },
            error: () => {
                URL.revokeObjectURL(preview);
                card.imageUrl = previousUrl;
                card.isUploading = false;
                input.value = '';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Logo upload failed.' });
                this.cdr.detectChanges();
            }
        });
    }

    onAddPartnerSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const localId = this.nextLocalId++;
        const preview = URL.createObjectURL(file);
        const newCard: PartnerCard = {
            localId,
            backendId: 0,
            imageUrl: preview,
            persistedImageUrl: null,
            pendingFile: null,
            isUploading: true
        };
        this.partnerCards.push(newCard);
        this.cdr.detectChanges();

        this.mediaService.upload(file, 'cms/partners').subscribe({
            next: (res) => {
                URL.revokeObjectURL(preview);
                newCard.persistedImageUrl = res.url;
                newCard.imageUrl = res.url;
                newCard.isUploading = false;
                input.value = '';
                this.messageService.add({
                    severity: 'success',
                    summary: this.activeTab === 'ar' ? '\u062a\u0645 \u0627\u0644\u0631\u0641\u0639' : 'Uploaded',
                    detail: this.activeTab === 'ar' ? '\u062a\u0645 \u0631\u0641\u0639 \u0634\u0639\u0627\u0631 \u0627\u0644\u0634\u0631\u064a\u0643.' : 'Partner logo uploaded.'
                });
                this.cdr.detectChanges();
            },
            error: () => {
                URL.revokeObjectURL(preview);
                this.partnerCards = this.partnerCards.filter(c => c.localId !== localId);
                input.value = '';
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Logo upload failed.' });
                this.cdr.detectChanges();
            }
        });
    }

    removePartner(localId: number): void {
        this.partnerCards = this.partnerCards.filter(c => c.localId !== localId);
    }

    get anyUploading(): boolean {
        return this.isUploadingImage || this.partnerCards.some(c => c.isUploading);
    }

    markFieldTouched(field: PartnersFieldKey): void {
        this.touchedFields[field] = true;
    }

    showRequiredError(field: PartnersFieldKey): boolean {
        return (this.attemptedSave || !!this.touchedFields[field]) && !this.getFieldValue(field).trim();
    }

    showPatternError(field: PartnersFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        return (this.attemptedSave || !!this.touchedFields[field]) && !!value && !this.isFieldPatternValid(field);
    }

    requiredMessage(lang: PartnersLang): string {
        return lang === 'ar' ? '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.' : 'This field is required.';
    }

    patternMessage(lang: PartnersLang): string {
        return lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0646\u0635 \u0639\u0631\u0628\u064a \u0623\u0648 \u0625\u0646\u062c\u0644\u064a\u0632\u064a \u0641\u0642\u0637.' : 'Please enter English text only.';
    }

    private areRequiredFieldsValid(): boolean {
        const fields: PartnersFieldKey[] = ['subtitleEn', 'subtitleAr'];
        return fields.every((field) => this.getFieldValue(field).trim() && this.isFieldPatternValid(field));
    }

    private areRequiredImagesValid(): boolean {
        return !!this.persistedTopImageUrl
            && this.partnerCards.length > 0
            && this.partnerCards.every((card) => !!card.persistedImageUrl);
    }

    private getFieldValue(field: PartnersFieldKey): string {
        return field === 'subtitleAr' ? this.introByLang.ar.description : this.introByLang.en.description;
    }

    private isFieldPatternValid(field: PartnersFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        if (!value) return false;

        return field === 'subtitleAr'
            ? this.mixedLanguagePattern.test(value)
            : this.englishPattern.test(value);
    }

    onPreview(): void {
        this.attemptedSave = true;

        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

        const previewLang: 'en' | 'ar' = this.activeTab === 'ar' ? 'ar' : 'en';
        const previewHeader = previewLang === 'ar' ? 'معاينة صفحة الشركاء' : 'Partners Preview';

        const dialogData: PartnersDialogData = {
            source: 'preview',
            data: {
                isActive: this.isActive,
                heroImageUrl: this.persistedTopImageUrl,
                subtitleEn: this.introByLang.en.description,
                subtitleAr: this.introByLang.ar.description,
                partnerLogos: this.partnerCards.map((card, index) => ({
                    id: card.backendId,
                    logoImageUrl: card.persistedImageUrl,
                    displayOrder: index
                }))
            },
            previewLang
        };

        this.dialogService.open(PartnersComponent, {
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

        if (this.isSaving || this.anyUploading) return;
        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

        this.isSaving = true;
        this.partnersPageService.save({
            isActive: this.isActive,
            heroImageUrl: this.persistedTopImageUrl,
            subtitleEn: this.introByLang.en.description,
            subtitleAr: this.introByLang.ar.description,
            partnerLogos: this.partnerCards.map((card, index) => ({
                id: card.backendId,
                logoImageUrl: card.persistedImageUrl,
                displayOrder: index
            }))
        }).subscribe({
            next: () => {
                this.isSaving = false;
                this.partnersPageService.invalidateCache();
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Partners page saved.' });
                this.cdr.markForCheck();
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save partners page.' });
                this.cdr.markForCheck();
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

    private revokeTopPreviewUrl(): void {
        if (this.localTopPreviewUrl) {
            URL.revokeObjectURL(this.localTopPreviewUrl);
            this.localTopPreviewUrl = null;
        }
    }
}
