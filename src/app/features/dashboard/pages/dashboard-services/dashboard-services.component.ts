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
type ServicesFieldKey = 'heroTextEn' | 'heroTextAr';

interface ServiceSection {
    localId: number;
    backendId: number;
    titleByLang: Record<ServicesLang, string>;
    descriptionByLang: Record<ServicesLang, string>;
    imageUrl: string | null;
    persistedImageUrl: string | null;
    isUploading: boolean;
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
    attemptedSave = false;
    touchedFields: Partial<Record<ServicesFieldKey, boolean>> = {};

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
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly mixedLanguagePattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

    get canSave(): boolean {
        return this.areRequiredFieldsValid() && this.areRequiredSectionsValid();
    }

    get anyUploading(): boolean {
        return this.isUploadingImage || this.serviceSections.some(section => section.isUploading);
    }

    ngOnInit(): void {
        this.servicesPageService.get({ forceRefresh: true }).subscribe({
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
                            persistedImageUrl: item.imageUrl,
                            isUploading: false
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
            section.imageUrl = result.imageUrl;
            section.persistedImageUrl = result.imageUrl;
            section.isUploading = false;
            this.cdr.detectChanges();
        });
    }

    removeSection(localId: number): void {
        this.serviceSections = this.serviceSections.filter(s => s.localId !== localId);
        this.closeSectionMenu();
    }

    markFieldTouched(field: ServicesFieldKey): void {
        this.touchedFields[field] = true;
    }

    showRequiredError(field: ServicesFieldKey): boolean {
        return (this.attemptedSave || !!this.touchedFields[field]) && !this.getFieldValue(field).trim();
    }

    showPatternError(field: ServicesFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        return (this.attemptedSave || !!this.touchedFields[field]) && !!value && !this.isFieldPatternValid(field);
    }

    requiredMessage(lang: ServicesLang): string {
        return lang === 'ar' ? '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.' : 'This field is required.';
    }

    patternMessage(lang: ServicesLang): string {
        return lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0646\u0635 \u0639\u0631\u0628\u064a \u0623\u0648 \u0625\u0646\u062c\u0644\u064a\u0632\u064a \u0641\u0642\u0637.' : 'Please enter English text only.';
    }

    private areRequiredFieldsValid(): boolean {
        const fields: ServicesFieldKey[] = ['heroTextEn', 'heroTextAr'];
        return fields.every((field) => this.getFieldValue(field).trim() && this.isFieldPatternValid(field));
    }

    private areRequiredSectionsValid(): boolean {
        return !!this.persistedTopImageUrl
            && this.serviceSections.length > 0
            && this.serviceSections.every((section) =>
                !!section.persistedImageUrl
                && !!section.titleByLang.en.trim()
                && !!section.titleByLang.ar.trim()
                && !!section.descriptionByLang.en.trim()
                && !!section.descriptionByLang.ar.trim()
                && this.englishPattern.test(section.titleByLang.en.trim())
                && this.englishPattern.test(section.descriptionByLang.en.trim())
                && this.mixedLanguagePattern.test(section.titleByLang.ar.trim())
                && this.mixedLanguagePattern.test(section.descriptionByLang.ar.trim())
            );
    }

    private getFieldValue(field: ServicesFieldKey): string {
        return field === 'heroTextAr' ? this.introByLang.ar.description : this.introByLang.en.description;
    }

    private isFieldPatternValid(field: ServicesFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        if (!value) return false;

        return field === 'heroTextAr'
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
        this.attemptedSave = true;

        if (this.isSaving || this.anyUploading) return;
        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

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
            imageUrl: result.imageUrl,
            persistedImageUrl: result.imageUrl,
            isUploading: false
        };
        this.serviceSections.push(newSection);
        this.cdr.detectChanges();
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
