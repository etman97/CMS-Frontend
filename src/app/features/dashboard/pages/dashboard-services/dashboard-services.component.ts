import { Component, ChangeDetectorRef, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { AddSectionDialogComponent } from './dialogs/add-section-dialog/add-section-dialog.component';
import { AddSectionDialogResult } from './dialogs/add-section-dialog/add-section-dialog.model';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { ServicesPageService } from '../../../../core/services/services-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { ServicesComponent, ServicesDialogData } from '../../../services/services.component';

type ServicesLang = 'en' | 'ar';

interface ServiceSection {
    localId: number;
    backendId: number;
    titleByLang: Record<ServicesLang, string>;
    descriptionByLang: Record<ServicesLang, string>;
    imageUrl: string | null;
    persistedImageUrl: string | null;
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
export class DashboardServicesComponent implements OnInit, OnDestroy {
    private readonly servicesPageService = inject(ServicesPageService);
    private readonly mediaService = inject(MediaService);
    private readonly dialogService = inject(DialogService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    activeTab: ServicesLang = 'en';
    isLoading = true;
    isActive = true;
    isSaving = false;
    isUploadingImage = false;

    topImageUrl: string | null = null;
    private persistedTopImageUrl: string | null = null;
    private localTopPreviewUrl: string | null = null;

    introByLang: Record<ServicesLang, ServicesIntroContent> = {
        en: { title: 'Services', description: '' },
        ar: { title: 'الخدمات', description: '' }
    };

    serviceSections: ServiceSection[] = [];
    openMenuSectionId: number | null = null;
    private nextLocalId = 1;

    ngOnInit(): void {
        this.servicesPageService.get().subscribe({
            next: (data) => {
                if (data) {
                    this.isActive = data.isActive;
                    this.topImageUrl = data.heroImageUrl;
                    this.persistedTopImageUrl = data.heroImageUrl;
                    this.introByLang.en.description = data.heroTextEn;
                    this.introByLang.ar.description = data.heroTextAr;
                    this.serviceSections = [...data.serviceItems]
                        .sort((a, b) => a.displayOrder - b.displayOrder)
                        .map(item => ({
                            localId: this.nextLocalId++,
                            backendId: item.id,
                            titleByLang: { en: item.groupNameEn, ar: item.groupNameAr },
                            descriptionByLang: { en: item.briefEn, ar: item.briefAr },
                            imageUrl: item.imageUrl,
                            persistedImageUrl: item.imageUrl
                        }));
                }
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.markForCheck();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load services data.' });
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

        this.mediaService.upload(file, 'cms/services').subscribe({
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

    openAddSectionDialog(): void {
        const dialogRef = this.openSectionDialog();
        dialogRef?.onClose.subscribe((result?: AddSectionDialogResult) => {
            if (!result) return;
            this.addSectionFromResult(result);
        });
    }

    toggleSectionMenu(localId: number, event: Event): void {
        event.stopPropagation();
        this.openMenuSectionId = this.openMenuSectionId === localId ? null : localId;
    }

    closeSectionMenu(): void {
        this.openMenuSectionId = null;
    }

    openEditSectionDialog(localId: number): void {
        const section = this.serviceSections.find(s => s.localId === localId);
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
                const preview = URL.createObjectURL(result.imageFile);
                section.imageUrl = preview;
                this.mediaService.upload(result.imageFile, 'cms/services').subscribe({
                    next: (res) => {
                        URL.revokeObjectURL(preview);
                        section.persistedImageUrl = res.url;
                        section.imageUrl = res.url;
                        this.cdr.detectChanges();
                    },
                    error: () => {
                        URL.revokeObjectURL(preview);
                        section.imageUrl = section.persistedImageUrl;
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Image upload failed.' });
                        this.cdr.detectChanges();
                    }
                });
            }
        });
    }

    removeSection(localId: number): void {
        this.serviceSections = this.serviceSections.filter(s => s.localId !== localId);
        this.closeSectionMenu();
    }

    onPreview(): void {
        const previewLang: 'en' | 'ar' = this.activeTab === 'ar' ? 'ar' : 'en';
        const previewHeader = previewLang === 'ar' ? 'معاينة صفحة الخدمات' : 'Services Preview';

        const dialogData: ServicesDialogData = {
            source: 'preview',
            data: {
                isActive: this.isActive,
                heroImageUrl: this.persistedTopImageUrl,
                heroTextEn: this.introByLang.en.description,
                heroTextAr: this.introByLang.ar.description,
                serviceItems: this.serviceSections.map((section, index) => ({
                    id: section.backendId,
                    groupNameEn: section.titleByLang.en,
                    briefEn: section.descriptionByLang.en,
                    groupNameAr: section.titleByLang.ar,
                    briefAr: section.descriptionByLang.ar,
                    imageUrl: section.persistedImageUrl,
                    displayOrder: index
                }))
            },
            previewLang
        };

        this.dialogService.open(ServicesComponent, {
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

        this.isSaving = true;
        this.servicesPageService.save({
            isActive: this.isActive,
            heroImageUrl: this.persistedTopImageUrl,
            heroTextEn: this.introByLang.en.description,
            heroTextAr: this.introByLang.ar.description,
            serviceItems: this.serviceSections.map((section, index) => ({
                id: section.backendId,
                groupNameEn: section.titleByLang.en,
                briefEn: section.descriptionByLang.en,
                groupNameAr: section.titleByLang.ar,
                briefAr: section.descriptionByLang.ar,
                imageUrl: section.persistedImageUrl,
                displayOrder: index
            }))
        }).subscribe({
            next: () => {
                this.isSaving = false;
                this.servicesPageService.invalidateCache();
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Services page saved.' });
                this.cdr.markForCheck();
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save services page.' });
                this.cdr.markForCheck();
            }
        });
    }

    private addSectionFromResult(result: AddSectionDialogResult): void {
        const localId = this.nextLocalId++;
        const newSection: ServiceSection = {
            localId,
            backendId: 0,
            titleByLang: { en: result.groupNameEn.trim(), ar: result.groupNameAr.trim() },
            descriptionByLang: { en: result.briefEn.trim(), ar: result.briefAr.trim() },
            imageUrl: null,
            persistedImageUrl: null
        };
        this.serviceSections.push(newSection);

        if (result.imageFile) {
            const preview = URL.createObjectURL(result.imageFile);
            newSection.imageUrl = preview;
            this.cdr.detectChanges();

            this.mediaService.upload(result.imageFile, 'cms/services').subscribe({
                next: (res) => {
                    URL.revokeObjectURL(preview);
                    newSection.persistedImageUrl = res.url;
                    newSection.imageUrl = res.url;
                    this.cdr.detectChanges();
                },
                error: () => {
                    URL.revokeObjectURL(preview);
                    newSection.imageUrl = null;
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Image upload failed.' });
                    this.cdr.detectChanges();
                }
            });
        }
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
                initial: section ? {
                    groupNameEn: section.titleByLang.en,
                    groupNameAr: section.titleByLang.ar,
                    briefEn: section.descriptionByLang.en,
                    briefAr: section.descriptionByLang.ar,
                    imageUrl: section.imageUrl
                } : undefined
            },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });
    }

    private revokeTopPreviewUrl(): void {
        if (this.localTopPreviewUrl) {
            URL.revokeObjectURL(this.localTopPreviewUrl);
            this.localTopPreviewUrl = null;
        }
    }
}
