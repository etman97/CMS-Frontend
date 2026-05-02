import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { AddSectionAccessDialogComponent } from './dialogs/add-section-access-dialog/add-section-access-dialog.component';
import { AddSectionAccessDialogResult } from './dialogs/add-section-access-dialog/add-section-access-dialog.model';
import {
    SolutionSectionsService,
    ImageChoice,
    UpsertSolutionSectionItem
} from '../../../../core/services/solution-sections.service';
import { OneImage, OneImageDialogData } from '../../../solutions/one-image/one-image';
import { TwoImages, TwoImagesDialogData } from '../../../solutions/two-images/two-images';

type SolutionsLang = 'en' | 'ar';

interface SolutionSection {
    uid: number;       // in-memory unique id for template tracking
    id: number;        // backend id (0 for new sections)
    titleEn: string;
    titleAr: string;
    paragraphEn: string;
    paragraphAr: string;
    imageChoice: ImageChoice;
    imageUrl1: string | null;
    imageUrl2: string | null;
    displayOrder: number;
}

@Component({
    selector: 'app-dashboard-solutions-access',
    standalone: true,
    imports: [RouterLink, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule],
    providers: [DialogService],
    templateUrl: './dashboard-solutions-access.component.html',
    styleUrl: './dashboard-solutions-access.component.scss'
})
export class DashboardSolutionsAccessComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly dialogService = inject(DialogService);
    private readonly solutionSectionsService = inject(SolutionSectionsService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly ngZone = inject(NgZone);

    cardId = 0;
    cardTitle = '';
    activeTab: SolutionsLang = 'en';
    openMenuSectionId: number | null = null;
    isLoading = true;
    isSaving = false;

    sections: SolutionSection[] = [];

    private nextUid = 1;

    get canSave(): boolean {
        return this.sections.length > 0
            && this.sections.every((section) => this.isSectionComplete(section));
    }

    private get requiredImageMode(): 'one' | 'two' | null {
        const first = this.sections[0] ?? null;
        if (!first) return null;
        return first.imageChoice === 'TwoImages' ? 'two' : 'one';
    }

    ngOnInit(): void {
        this.cardId = Number(this.route.snapshot.paramMap.get('cardId'));
        this.cardTitle = (window.history.state as { cardTitle?: string })?.cardTitle || `Card ${this.cardId}`;

        this.solutionSectionsService.getByCardId(this.cardId).subscribe({
            next: (data) => {
                this.sections = data.map(s => ({
                    uid: this.nextUid++,
                    id: s.id,
                    titleEn: s.titleEn,
                    titleAr: s.titleAr,
                    paragraphEn: s.paragraphEn,
                    paragraphAr: s.paragraphAr,
                    imageChoice: s.imageChoice,
                    imageUrl1: s.imageUrl1,
                    imageUrl2: s.imageUrl2,
                    displayOrder: s.displayOrder
                }));
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load sections.' });
                this.cdr.markForCheck();
            }
        });
    }

    addSection(): void {
        const isRtl = this.activeTab === 'ar';
        const dialogRef = this.dialogService.open(AddSectionAccessDialogComponent, {
            header: isRtl ? 'إضافة قسم' : 'Add Section',
            data: { lang: this.activeTab, requiredImageMode: this.requiredImageMode },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });

        dialogRef?.onClose.subscribe((result?: AddSectionAccessDialogResult) => {
            this.ngZone.run(() => {
                if (!result) return;

                const imageChoice: ImageChoice = result.imageMode === 'two' ? 'TwoImages' : 'OneImage';
                this.sections = [...this.sections, {
                    uid: this.nextUid++,
                    id: 0,
                    titleEn: result.titleEn,
                    titleAr: result.titleAr,
                    paragraphEn: result.paragraphEn,
                    paragraphAr: result.paragraphAr,
                    imageChoice,
                    imageUrl1: result.imageUrl1,
                    imageUrl2: result.imageMode === 'two' ? result.imageUrl2 : null,
                    displayOrder: this.sections.length
                }];
                this.cdr.detectChanges();
            });
        });
    }

    editSection(uid: number): void {
        const section = this.sections.find(s => s.uid === uid);
        if (!section) return;

        const isRtl = this.activeTab === 'ar';
        const existingUrls = [section.imageUrl1, section.imageUrl2].filter((u): u is string => Boolean(u));

        const dialogRef = this.dialogService.open(AddSectionAccessDialogComponent, {
            header: isRtl ? 'تعديل قسم' : 'Edit Section',
            data: {
                lang: this.activeTab,
                requiredImageMode: this.requiredImageMode,
                initial: {
                    titleEn: section.titleEn,
                    titleAr: section.titleAr,
                    paragraphEn: section.paragraphEn,
                    paragraphAr: section.paragraphAr,
                    imageUrls: existingUrls
                }
            },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });
        this.closeSectionMenu();

        dialogRef?.onClose.subscribe((result?: AddSectionAccessDialogResult) => {
            this.ngZone.run(() => {
                if (!result) return;

                const imageChoice: ImageChoice = result.imageMode === 'two' ? 'TwoImages' : 'OneImage';
                this.sections = this.sections.map(s => s.uid !== uid ? s : {
                    ...s,
                    titleEn: result.titleEn,
                    titleAr: result.titleAr,
                    paragraphEn: result.paragraphEn,
                    paragraphAr: result.paragraphAr,
                    imageChoice,
                    imageUrl1: result.imageUrl1,
                    imageUrl2: imageChoice === 'TwoImages' ? result.imageUrl2 : null
                });
                this.cdr.detectChanges();
            });
        });
    }

    removeSection(uid: number): void {
        this.sections = this.sections.filter(s => s.uid !== uid);
        this.closeSectionMenu();
        this.cdr.detectChanges();
    }

    toggleSectionMenu(uid: number, event: Event): void {
        event.stopPropagation();
        this.openMenuSectionId = this.openMenuSectionId === uid ? null : uid;
        this.cdr.detectChanges();
    }

    closeSectionMenu(): void {
        this.openMenuSectionId = null;
        this.cdr.detectChanges();
    }

    onPreview(): void {
        if (!this.canSave) {
            this.showValidationWarning('preview');
            return;
        }

        const lang = this.activeTab;
        const isRtl = lang === 'ar';
        const imageChoice = this.sections[0]?.imageChoice ?? 'OneImage';

        if (imageChoice === 'TwoImages') {
            const data: TwoImagesDialogData = {
                source: 'preview',
                previewLang: lang,
                sections: this.sections.map((s, i) => ({
                    title: lang === 'ar' ? s.titleAr : s.titleEn,
                    images: [
                        { src: s.imageUrl1 ?? '', alt: lang === 'ar' ? s.titleAr : s.titleEn },
                        { src: s.imageUrl2 ?? '', alt: lang === 'ar' ? s.titleAr : s.titleEn }
                    ],
                    paragraphs: [lang === 'ar' ? s.paragraphAr : s.paragraphEn],
                    reverse: i % 2 !== 0
                }))
            };
            this.dialogService.open(TwoImages, {
                ...PRIME_NG_CONFIGS.dynamicDialog,
                header: isRtl ? 'معاينة' : 'Preview',
                data,
                width: '95vw',
                height: '95vh',
                style: { direction: isRtl ? 'rtl' : 'ltr' },
                contentStyle: { padding: '0' },
                maximizable: false,
                closable: true
            });
        } else {
            const data: OneImageDialogData = {
                source: 'preview',
                previewLang: lang,
                sections: this.sections.map((s, i) => ({
                    title: lang === 'ar' ? s.titleAr : s.titleEn,
                    image: s.imageUrl1 ?? '',
                    imageAlt: lang === 'ar' ? s.titleAr : s.titleEn,
                    paragraphs: [lang === 'ar' ? s.paragraphAr : s.paragraphEn],
                    reverse: i % 2 !== 0
                }))
            };
            this.dialogService.open(OneImage, {
                ...PRIME_NG_CONFIGS.dynamicDialog,
                header: isRtl ? 'معاينة' : 'Preview',
                data,
                width: '95vw',
                height: '95vh',
                style: { direction: isRtl ? 'rtl' : 'ltr' },
                contentStyle: { padding: '0' },
                maximizable: false,
                closable: true
            });
        }
    }

    save(): void {
        if (this.isSaving) return;
        if (!this.canSave) {
            this.showValidationWarning('save');
            return;
        }

        this.isSaving = true;
        const items: UpsertSolutionSectionItem[] = this.sections.map((s, index) => ({
            id: s.id,
            titleEn: s.titleEn,
            paragraphEn: s.paragraphEn,
            titleAr: s.titleAr,
            paragraphAr: s.paragraphAr,
            imageChoice: s.imageChoice,
            imageUrl1: s.imageUrl1,
            imageUrl2: s.imageUrl2,
            displayOrder: index
        }));

        this.solutionSectionsService.save(this.cardId, items).subscribe({
            next: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Sections saved.' });
                // Reload to get backend-assigned IDs for newly added sections
                this.solutionSectionsService.getByCardId(this.cardId).subscribe({
                    next: (data) => {
                        this.sections = data.map(s => ({
                            uid: this.nextUid++,
                            id: s.id,
                            titleEn: s.titleEn,
                            titleAr: s.titleAr,
                            paragraphEn: s.paragraphEn,
                            paragraphAr: s.paragraphAr,
                            imageChoice: s.imageChoice,
                            imageUrl1: s.imageUrl1,
                            imageUrl2: s.imageUrl2,
                            displayOrder: s.displayOrder
                        }));
                        this.cdr.markForCheck();
                    }
                });
                this.cdr.markForCheck();
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save sections.' });
                this.cdr.markForCheck();
            }
        });
    }

    private isSectionComplete(section: SolutionSection): boolean {
        return Boolean(
            section.titleEn.trim()
            && section.titleAr.trim()
            && section.paragraphEn.trim()
            && section.paragraphAr.trim()
            && section.imageUrl1
            && (section.imageChoice !== 'TwoImages' || section.imageUrl2)
        );
    }

    private showValidationWarning(action: 'preview' | 'save'): void {
        const isArabic = this.activeTab === 'ar';
        const englishDetail = action === 'preview'
            ? 'Please add a complete section before preview.'
            : 'Please add a complete section before saving.';
        const arabicDetail = action === 'preview'
            ? 'يرجى إضافة قسم مكتمل قبل المعاينة.'
            : 'يرجى إضافة قسم مكتمل قبل الحفظ.';

        this.messageService.add({
            severity: 'warn',
            summary: isArabic ? 'تنبيه' : 'Validation',
            detail: isArabic ? arabicDetail : englishDetail
        });
    }

}
