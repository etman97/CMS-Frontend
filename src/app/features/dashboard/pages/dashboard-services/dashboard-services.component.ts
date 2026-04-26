import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { AddSectionDialogComponent } from './dialogs/add-section-dialog/add-section-dialog.component';
import { AddSectionDialogResult } from './dialogs/add-section-dialog/add-section-dialog.model';
import { ServicesPageService, ServicesPageDto, ServiceSectionDto } from '../../../../core/services/services-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { ServicesComponent } from '../../../services/services.component';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';

type ServicesLang = 'en' | 'ar';

interface ServiceSection {
    id: number;
    titleByLang: Record<ServicesLang, string>;
    descriptionByLang: Record<ServicesLang, string>;
    imageUrl: string | null;
}

interface ServicesIntroContent {
    title: string;
    description: string;
}

@Component({
    selector: 'app-dashboard-services',
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule, DashboardPageHeaderComponent],
    providers: [DialogService],
    standalone: true,
    templateUrl: './dashboard-services.component.html',
    styleUrl: './dashboard-services.component.scss'
})
export class DashboardServicesComponent implements OnInit {
    private readonly dialogService = inject(DialogService);
    private readonly servicesPageService = inject(ServicesPageService);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    activeTab: ServicesLang = 'en';
    isLoading = true;
    isActive = true;
    isSaving = false;
    isUploadingImage = false;

    topImageUrl: string | null = null;

    introByLang: Record<ServicesLang, ServicesIntroContent> = {
        en: { title: '', description: '' },
        ar: { title: '', description: '' }
    };

    serviceSections: ServiceSection[] = [];
    openMenuSectionId: number | null = null;
    private nextSectionId = 1;

    ngOnInit(): void {
        this.servicesPageService.get().subscribe({
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

    private populate(data: ServicesPageDto): void {
        this.isActive = data.isActive;
        this.topImageUrl = data.heroImageUrl;
        this.introByLang.en.title = data.introTitleEn;
        this.introByLang.en.description = data.introDescriptionEn;
        this.introByLang.ar.title = data.introTitleAr;
        this.introByLang.ar.description = data.introDescriptionAr;
        this.serviceSections = data.sections.map((s, i) => ({
            id: i + 1,
            titleByLang: { en: s.titleEn, ar: s.titleAr },
            descriptionByLang: { en: s.descriptionEn, ar: s.descriptionAr },
            imageUrl: s.imageUrl
        }));
        this.nextSectionId = this.serviceSections.length + 1;
    }

    private buildDto(): ServicesPageDto {
        return {
            isActive: this.isActive,
            introTitleEn: this.introByLang.en.title,
            introDescriptionEn: this.introByLang.en.description,
            introTitleAr: this.introByLang.ar.title,
            introDescriptionAr: this.introByLang.ar.description,
            heroImageUrl: this.topImageUrl,
            sections: this.serviceSections.map((s, i): ServiceSectionDto => ({
                id: s.id,
                titleEn: s.titleByLang.en,
                descriptionEn: s.descriptionByLang.en,
                titleAr: s.titleByLang.ar,
                descriptionAr: s.descriptionByLang.ar,
                imageUrl: s.imageUrl,
                displayOrder: i
            }))
        };
    }

    openPreview(): void {
        this.dialogService.open(ServicesComponent, {
            data: this.buildDto(),
            header: 'Preview — Services',
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

        this.mediaService.upload(file, 'cms/services').subscribe({
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

    onSectionImageSelected(event: Event, sectionId: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const target = this.serviceSections.find((section) => section.id === sectionId);
        if (target) {
            target.imageUrl = URL.createObjectURL(file);
        }
    }

    openAddSectionDialog(): void {
        const dialogRef = this.openSectionDialog();
        dialogRef?.onClose.subscribe((result?: AddSectionDialogResult) => {
            if (!result) return;
            this.serviceSections.push(this.mapDialogResultToSection(result));
        });
    }

    toggleSectionMenu(sectionId: number, event: Event): void {
        event.stopPropagation();
        this.openMenuSectionId = this.openMenuSectionId === sectionId ? null : sectionId;
    }

    closeSectionMenu(): void {
        this.openMenuSectionId = null;
    }

    openEditSectionDialog(sectionId: number): void {
        const section = this.serviceSections.find((item) => item.id === sectionId);
        if (!section) return;

        const dialogRef = this.openSectionDialog(section);
        this.closeSectionMenu();

        dialogRef?.onClose.subscribe((result?: AddSectionDialogResult) => {
            if (!result) return;
            section.titleByLang.en = result.groupNameEn.trim();
            section.titleByLang.ar = result.groupNameAr.trim();
            section.descriptionByLang.en = result.briefEn.trim();
            section.descriptionByLang.ar = result.briefAr.trim();
            if (result.imageFile) {
                section.imageUrl = URL.createObjectURL(result.imageFile);
            }
        });
    }

    removeSection(sectionId: number): void {
        this.serviceSections = this.serviceSections.filter((section) => section.id !== sectionId);
        this.closeSectionMenu();
    }

    private openSectionDialog(section?: ServiceSection): DynamicDialogRef | null {
        const lang = this.activeTab;
        const isRtl = lang === 'ar';
        const header = section
            ? (lang === 'ar' ? 'تعديل قسم خدمة' : 'Edit Service Section')
            : (lang === 'ar' ? 'إضافة قسم خدمة' : 'Add Service Section');

        return this.dialogService.open(AddSectionDialogComponent, {
            header,
            data: {
                lang,
                initial: section
                    ? {
                        groupNameEn: section.titleByLang.en,
                        groupNameAr: section.titleByLang.ar,
                        briefEn: section.descriptionByLang.en,
                        briefAr: section.descriptionByLang.ar,
                        imageUrl: section.imageUrl
                    }
                    : undefined
            },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });
    }

    private mapDialogResultToSection(result: AddSectionDialogResult): ServiceSection {
        return {
            id: this.nextSectionId++,
            titleByLang: {
                en: result.groupNameEn.trim(),
                ar: result.groupNameAr.trim()
            },
            descriptionByLang: {
                en: result.briefEn.trim(),
                ar: result.briefAr.trim()
            },
            imageUrl: result.imageFile ? URL.createObjectURL(result.imageFile) : null
        };
    }

    save(): void {
        if (this.isSaving || this.isUploadingImage) return;

        this.isSaving = true;
        this.servicesPageService.save(this.buildDto()).subscribe({
            next: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Services page saved successfully.' });
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save services page.' });
            }
        });
    }
}
