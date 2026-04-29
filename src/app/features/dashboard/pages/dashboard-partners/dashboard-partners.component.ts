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

    topImageUrl: string | null = null;
    private persistedTopImageUrl: string | null = null;
    private localTopPreviewUrl: string | null = null;

    introByLang: Record<PartnersLang, IntroContent> = {
        en: { title: 'Our Partners', description: '' },
        ar: { title: 'شركاؤنا', description: '' }
    };

    partnerCards: PartnerCard[] = [];
    private nextLocalId = 1;

    ngOnInit(): void {
        this.partnersPageService.get().subscribe({
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
                this.topImageUrl = res.url;
                this.revokeTopPreviewUrl();
                this.isUploadingImage = false;
                input.value = '';
                this.messageService.add({ severity: 'success', summary: 'Uploaded', detail: 'Image uploaded.' });
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

    onPreview(): void {
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
        if (this.isSaving || this.anyUploading) return;

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

    private revokeTopPreviewUrl(): void {
        if (this.localTopPreviewUrl) {
            URL.revokeObjectURL(this.localTopPreviewUrl);
            this.localTopPreviewUrl = null;
        }
    }
}
