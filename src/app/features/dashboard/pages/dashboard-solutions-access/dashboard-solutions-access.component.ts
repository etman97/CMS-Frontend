import { ChangeDetectorRef, Component, NgZone, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { AddSectionAccessDialogComponent } from './dialogs/add-section-access-dialog/add-section-access-dialog.component';
import { AddSectionAccessDialogResult } from './dialogs/add-section-access-dialog/add-section-access-dialog.model';

type SolutionsLang = 'en' | 'ar';

interface SolutionSection {
    id: number;
    title: string;
    description: string;
    imageUrls: string[];
    imageFirst: boolean;
}

@Component({
    selector: 'app-dashboard-solutions-access',
    standalone: true,
    imports: [RouterLink, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule],
    providers: [DialogService],
    templateUrl: './dashboard-solutions-access.component.html',
    styleUrl: './dashboard-solutions-access.component.scss'
})
export class DashboardSolutionsAccessComponent {
    private readonly dialogService = inject(DialogService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly ngZone = inject(NgZone);

    activeTab: SolutionsLang = 'en';
    openMenuSectionId: number | null = null;

    private nextSectionId = 1;

    sectionsByLang: Record<SolutionsLang, SolutionSection[]> = {
        en: [],
        ar: []
    };

    private get requiredImageMode(): 'one' | 'two' | null {
        const firstSection = this.sectionsByLang.en[0] ?? null;
        if (!firstSection) return null;
        return firstSection.imageUrls.length > 1 ? 'two' : 'one';
    }

    addSection(): void {
        const isRtl = this.activeTab === 'ar';
        const dialogRef = this.dialogService.open(AddSectionAccessDialogComponent, {
            header: isRtl ? 'إضافة قسم' : 'Add Section',
            data: {
                lang: this.activeTab,
                requiredImageMode: this.requiredImageMode
            },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });

        dialogRef?.onClose.subscribe((result?: AddSectionAccessDialogResult) => {
            this.ngZone.run(() => {
                if (!result) return;

                const imageUrls = this.buildImageUrls(result);
                const hasContent = Boolean(
                    result.titleEn.trim() ||
                    result.titleAr.trim() ||
                    result.paragraphEn.trim() ||
                    result.paragraphAr.trim() ||
                    imageUrls.length
                );
                if (!hasContent) return;

                const id = this.nextSectionId++;

                const enSection: SolutionSection = {
                    id,
                    title: result.titleEn.trim(),
                    description: result.paragraphEn.trim(),
                    imageUrls,
                    imageFirst: id % 2 === 0
                };

                const arSection: SolutionSection = {
                    id,
                    title: result.titleAr.trim(),
                    description: result.paragraphAr.trim(),
                    imageUrls,
                    imageFirst: id % 2 === 0
                };

                this.sectionsByLang.en = [...this.sectionsByLang.en, enSection];
                this.sectionsByLang.ar = [...this.sectionsByLang.ar, arSection];
                this.cdr.detectChanges();
            });
        });
    }

    toggleSectionMenu(sectionId: number, event: Event): void {
        event.stopPropagation();
        this.openMenuSectionId = this.openMenuSectionId === sectionId ? null : sectionId;
        this.cdr.detectChanges();
    }

    closeSectionMenu(): void {
        this.openMenuSectionId = null;
        this.cdr.detectChanges();
    }

    editSection(sectionId: number): void {
        const enSection = this.sectionsByLang.en.find((section) => section.id === sectionId);
        const arSection = this.sectionsByLang.ar.find((section) => section.id === sectionId);
        if (!enSection && !arSection) return;

        const baseSection = enSection ?? arSection;
        if (!baseSection) return;

        const isRtl = this.activeTab === 'ar';
        const dialogRef = this.dialogService.open(AddSectionAccessDialogComponent, {
            header: isRtl ? 'تعديل قسم' : 'Edit Section',
            data: {
                lang: this.activeTab,
                requiredImageMode: this.requiredImageMode,
                initial: {
                    titleEn: enSection?.title ?? '',
                    titleAr: arSection?.title ?? '',
                    paragraphEn: enSection?.description ?? '',
                    paragraphAr: arSection?.description ?? '',
                    imageUrls: [...baseSection.imageUrls]
                }
            },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });
        this.closeSectionMenu();

        dialogRef?.onClose.subscribe((result?: AddSectionAccessDialogResult) => {
            this.ngZone.run(() => {
                if (!result) return;

                const mergedUrls = this.buildMergedImageUrls(result, baseSection.imageUrls);
                const hasContent = Boolean(
                    result.titleEn.trim() ||
                    result.titleAr.trim() ||
                    result.paragraphEn.trim() ||
                    result.paragraphAr.trim() ||
                    mergedUrls.length
                );
                if (!hasContent) return;

                if (enSection) {
                    enSection.title = result.titleEn.trim();
                    enSection.description = result.paragraphEn.trim();
                    enSection.imageUrls = [...mergedUrls];
                }

                if (arSection) {
                    arSection.title = result.titleAr.trim();
                    arSection.description = result.paragraphAr.trim();
                    arSection.imageUrls = [...mergedUrls];
                }

                this.cdr.detectChanges();
            });
        });
    }

    removeSection(sectionId: number): void {
        this.sectionsByLang.en = this.sectionsByLang.en.filter((section) => section.id !== sectionId);
        this.sectionsByLang.ar = this.sectionsByLang.ar.filter((section) => section.id !== sectionId);
        this.closeSectionMenu();
        this.cdr.detectChanges();
    }

    private buildImageUrls(result: AddSectionAccessDialogResult): string[] {
        const urls: string[] = [];
        if (result.firstImageFile) {
            urls.push(URL.createObjectURL(result.firstImageFile));
        }
        if (result.imageMode === 'two' && result.secondImageFile) {
            urls.push(URL.createObjectURL(result.secondImageFile));
        }
        return urls;
    }

    private buildMergedImageUrls(result: AddSectionAccessDialogResult, currentUrls: string[]): string[] {
        const first = result.firstImageFile ? URL.createObjectURL(result.firstImageFile) : (currentUrls[0] ?? null);

        if (result.imageMode === 'one') {
            return first ? [first] : [];
        }

        const second = result.secondImageFile ? URL.createObjectURL(result.secondImageFile) : (currentUrls[1] ?? null);
        return [first, second].filter((url): url is string => Boolean(url));
    }
}
