import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { AddSectionDialogComponent } from './dialogs/add-section-dialog/add-section-dialog.component';
import { AddSectionDialogResult } from './dialogs/add-section-dialog/add-section-dialog.model';

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
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule],
    providers: [DialogService],
    standalone: true,
    templateUrl: './dashboard-services.component.html',
    styleUrl: './dashboard-services.component.scss'
})
export class DashboardServicesComponent {
    private readonly dialogService = inject(DialogService);

    activeTab: ServicesLang = 'en';
    isActive = true;

    topImageUrl: string | null = null;

    introByLang: Record<ServicesLang, ServicesIntroContent> = {
        en: {
            title: 'Services',
            description: ''
        },
        ar: {
            title: 'الخدمات',
            description: ''
        }
    };

    serviceSections: ServiceSection[] = [];
    openMenuSectionId: number | null = null;

    private nextSectionId = 1;

    onActiveToggle(input: HTMLInputElement): void {
        input.blur();
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.topImageUrl = URL.createObjectURL(file);
        }
    }

    onSectionImageSelected(event: Event, sectionId: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

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
        if (!section) {
            return;
        }

        const dialogRef = this.openSectionDialog(section);
        this.closeSectionMenu();

        dialogRef?.onClose.subscribe((result?: AddSectionDialogResult) => {
            if (!result) return;

            section.titleByLang.en = result.groupNameEn.trim() || section.titleByLang.en;
            section.titleByLang.ar = result.groupNameAr.trim() || section.titleByLang.ar;
            section.descriptionByLang.en = result.briefEn.trim() || section.descriptionByLang.en;
            section.descriptionByLang.ar = result.briefAr.trim() || section.descriptionByLang.ar;
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
                en: result.groupNameEn.trim() || 'New service',
                ar: result.groupNameAr.trim() || 'خدمة جديدة'
            },
            descriptionByLang: {
                en: result.briefEn.trim() || 'Enter content for this service section',
                ar: result.briefAr.trim() || 'أدخل المحتوى لهذا القسم'
            },
            imageUrl: result.imageFile ? URL.createObjectURL(result.imageFile) : null
        };
    }
}
