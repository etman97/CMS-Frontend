import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { MessageService } from 'primeng/api';
import { ContactPageService, ContactPageDto } from '../../../../core/services/contact-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';

type ContactLang = 'en' | 'ar';

@Component({
    selector: 'app-dashboard-contact-us',
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DashboardPageHeaderComponent],
    standalone: true,
    templateUrl: './dashboard-contact-us.component.html',
    styleUrl: './dashboard-contact-us.component.scss'
})
export class DashboardContactUsComponent implements OnInit {
    private readonly contactPageService = inject(ContactPageService);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    activeTab: ContactLang = 'en';
    isLoading = true;
    isActive = true;
    isSaving = false;
    isUploadingImage = false;

    heroImageUrl: string | null = null;
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

    private populate(data: ContactPageDto): void {
        this.isActive = data.isActive;
        this.introDescriptionEn = data.introDescriptionEn;
        this.introDescriptionAr = data.introDescriptionAr;
        this.phone = data.phone;
        this.email = data.email;
        this.address = data.address;
        this.locationUrl = data.locationUrl;
        this.heroImageUrl = data.heroImageUrl;
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.isUploadingImage = true;
        this.heroImageUrl = URL.createObjectURL(file);

        this.mediaService.upload(file, 'cms/contact').subscribe({
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

        const dto: ContactPageDto = {
            isActive: this.isActive,
            introDescriptionEn: this.introDescriptionEn,
            introDescriptionAr: this.introDescriptionAr,
            phone: this.phone,
            email: this.email,
            address: this.address,
            locationUrl: this.locationUrl,
            heroImageUrl: this.heroImageUrl
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
