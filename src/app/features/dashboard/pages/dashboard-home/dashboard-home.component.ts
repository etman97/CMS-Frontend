import { Component, ChangeDetectorRef, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { HomePageService, HomePageDto } from '../../../../core/services/home-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DashboardPageHeaderComponent],
    templateUrl: './dashboard-home.component.html',
    styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit, OnDestroy {
    private readonly homePageService = inject(HomePageService);
    private readonly mediaService = inject(MediaService);
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

    heroTitleAr = '';
    heroContentAr = '';
    primaryButtonTextAr = '';
    secondaryButtonTextAr = '';

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
        this.heroTitleAr = data.heroTitleAr;
        this.heroContentAr = data.heroContentAr;
        this.primaryButtonTextAr = data.primaryButtonTextAr;
        this.secondaryButtonTextAr = data.secondaryButtonTextAr;
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

    save(): void {
        if (this.isSaving || this.isUploadingImage) return;

        const dto: HomePageDto = {
            isActive: this.isActive,
            heroTitleEn: this.heroTitleEn,
            heroContentEn: this.heroContentEn,
            primaryButtonTextEn: this.primaryButtonTextEn,
            secondaryButtonTextEn: this.secondaryButtonTextEn,
            heroTitleAr: this.heroTitleAr,
            heroContentAr: this.heroContentAr,
            primaryButtonTextAr: this.primaryButtonTextAr,
            secondaryButtonTextAr: this.secondaryButtonTextAr,
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
