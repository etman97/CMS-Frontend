import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HomePageService, HomePageDto } from '../../../../core/services/home-page.service';
import { MediaService } from '../../../../core/services/media.service';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, Toast],
    providers: [MessageService],
    templateUrl: './dashboard-home.component.html',
    styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent implements OnInit {
    private readonly homePageService = inject(HomePageService);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    activeTab = 'en';
    isLoading = true;
    isActive = false;
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
    }

    onActiveToggle(input: HTMLInputElement): void {
        input.blur();
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.isUploadingImage = true;
        this.heroImageUrl = URL.createObjectURL(file);

        this.mediaService.upload(file, 'cms/home').subscribe({
            next: (res) => {
                this.heroImageUrl = res.url;
                this.isUploadingImage = false;
            },
            error: () => {
                this.heroImageUrl = null;
                this.isUploadingImage = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Image upload failed.' });
            }
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
            heroTitleAr: this.heroTitleAr,
            heroContentAr: this.heroContentAr,
            primaryButtonTextAr: this.primaryButtonTextAr,
            secondaryButtonTextAr: this.secondaryButtonTextAr,
            heroImageUrl: this.heroImageUrl
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
