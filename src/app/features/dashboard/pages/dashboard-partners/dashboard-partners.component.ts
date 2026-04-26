import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { PartnersPageService, PartnersPageDto, PartnerDto } from '../../../../core/services/partners-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { PartnersComponent } from '../../../partners/partners.component';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';

type PartnersLang = 'en' | 'ar';

interface PartnerCard {
    id: number;
    imageUrl: string | null;
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
export class DashboardPartnersComponent implements OnInit {
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

    introByLang: Record<PartnersLang, IntroContent> = {
        en: { title: '', description: '' },
        ar: { title: '', description: '' }
    };

    partnerCards: PartnerCard[] = [];
    private nextPartnerId = 1;

    ngOnInit(): void {
        this.partnersPageService.get().subscribe({
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

    private populate(data: PartnersPageDto): void {
        this.isActive = data.isActive;
        this.topImageUrl = data.heroImageUrl;
        this.introByLang.en.title = data.introTitleEn;
        this.introByLang.en.description = data.introDescriptionEn;
        this.introByLang.ar.title = data.introTitleAr;
        this.introByLang.ar.description = data.introDescriptionAr;
        this.partnerCards = data.partners.map((p, i) => ({
            id: i + 1,
            imageUrl: p.imageUrl
        }));
        this.nextPartnerId = this.partnerCards.length + 1;
    }

    private buildDto(): PartnersPageDto {
        return {
            isActive: this.isActive,
            introTitleEn: this.introByLang.en.title,
            introDescriptionEn: this.introByLang.en.description,
            introTitleAr: this.introByLang.ar.title,
            introDescriptionAr: this.introByLang.ar.description,
            heroImageUrl: this.topImageUrl,
            partners: this.partnerCards
                .filter((c): c is PartnerCard & { imageUrl: string } => !!c.imageUrl)
                .map((c, i): PartnerDto => ({
                    id: c.id,
                    imageUrl: c.imageUrl,
                    displayOrder: i
                }))
        };
    }

    openPreview(): void {
        this.dialogService.open(PartnersComponent, {
            data: this.buildDto(),
            header: 'Preview — Partners',
            width: '100vw',
            height: '100vh',
            modal: true,
            closable: true,
            styleClass: 'preview-dialog',
            contentStyle: { padding: '0', overflow: 'auto' }
        });
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.isUploadingImage = true;
        this.topImageUrl = URL.createObjectURL(file);

        this.mediaService.upload(file, 'cms/partners').subscribe({
            next: (res) => {
                this.topImageUrl = res.url;
                this.isUploadingImage = false;
            },
            error: () => {
                this.topImageUrl = null;
                this.isUploadingImage = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Image upload failed.' });
            }
        });
    }

    onPartnerLogoSelected(event: Event, partnerId: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const target = this.partnerCards.find((card) => card.id === partnerId);
        if (target) {
            target.imageUrl = URL.createObjectURL(file);
        }
    }

    onAddPartnerSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.partnerCards.push({
            id: this.nextPartnerId++,
            imageUrl: URL.createObjectURL(file)
        });
    }

    removePartner(partnerId: number): void {
        this.partnerCards = this.partnerCards.filter((card) => card.id !== partnerId);
    }

    save(): void {
        if (this.isSaving || this.isUploadingImage) return;

        this.isSaving = true;
        this.partnersPageService.save(this.buildDto()).subscribe({
            next: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Partners page saved successfully.' });
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save partners page.' });
            }
        });
    }
}
