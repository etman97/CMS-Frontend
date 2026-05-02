import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { AddSectionDialogComponent } from '../dashboard-services/dialogs/add-section-dialog/add-section-dialog.component';
import { AddSectionDialogResult } from '../dashboard-services/dialogs/add-section-dialog/add-section-dialog.model';
import { SolutionsPageService } from '../../../../core/services/solutions-page.service';
import { SolutionsComponent, SolutionsDialogData } from '../../../solutions/solutions.component';

type SolutionsLang = 'en' | 'ar';

interface SolutionCard {
    id: number;
    title: string;
    content: string;
    imageUrl: string | null;
}

@Component({
    selector: 'app-dashboard-solutions',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule, DashboardPageHeaderComponent],
    providers: [DialogService],
    templateUrl: './dashboard-solutions.component.html',
    styleUrl: './dashboard-solutions.component.scss'
})
export class DashboardSolutionsComponent implements OnInit {
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly dialogService = inject(DialogService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly ngZone = inject(NgZone);
    private readonly router = inject(Router);

    activeTab: SolutionsLang = 'en';
    isActive = true;
    isLoading = true;
    isSaving = false;
    topImageUrl: string | null = null;
    private persistedTopImageUrl: string | null = null;
    openMenuCardId: number | null = null;

    get canSave(): boolean {
        return !!this.persistedTopImageUrl
            && !!this.introContentByLang.en.trim()
            && !!this.introContentByLang.ar.trim()
            && this.solutionsByLang.en.length > 0
            && this.solutionsByLang.en.every(c => !!c.imageUrl && !!c.title.trim() && !!c.content.trim())
            && this.solutionsByLang.ar.every(c => !!c.title.trim() && !!c.content.trim());
    }

    private idCounter = 0;

    readonly solutionsByLang: Record<SolutionsLang, SolutionCard[]> = {
        en: [],
        ar: []
    };

    readonly introByLang: Record<SolutionsLang, { title: string; placeholder: string }> = {
        en: {
            title: 'Solutions',
            placeholder: 'Enter content, for ex: At WES, we empower businesses to navigate the complexities of the digital age'
        },
        ar: {
            title: 'الحلول',
            placeholder: 'ادخل المحتوى، مثال: في WES نساعد الشركات على التعامل مع تحديات العصر الرقمي'
        }
    };

    readonly introContentByLang: Record<SolutionsLang, string> = {
        en: '',
        ar: ''
    };

    ngOnInit(): void {
        this.solutionsPageService.get({ forceRefresh: true }).subscribe({
            next: (data) => {
                if (data) {
                    this.isActive = data.isActive;
                    this.topImageUrl = data.heroImageUrl;
                    this.persistedTopImageUrl = data.heroImageUrl;
                    this.introContentByLang.en = data.heroTextEn;
                    this.introContentByLang.ar = data.heroTextAr;

                    const sorted = [...data.solutionCards].sort((a, b) => a.displayOrder - b.displayOrder);
                    this.solutionsByLang.en = [];
                    this.solutionsByLang.ar = [];

                    for (const card of sorted) {
                        this.idCounter = Math.max(this.idCounter, card.id);
                        this.solutionsByLang.en.push({ id: card.id, title: card.groupNameEn, content: card.briefEn, imageUrl: card.imageUrl });
                        this.solutionsByLang.ar.push({ id: card.id, title: card.groupNameAr, content: card.briefAr, imageUrl: card.imageUrl });
                    }
                }
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.markForCheck();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load solutions data.' });
            }
        });
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.topImageUrl = URL.createObjectURL(file);
            this.cdr.detectChanges();
        }
    }

    onCardImageSelected(event: Event, lang: SolutionsLang, cardId: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        const targetCard = this.solutionsByLang[lang].find((card) => card.id === cardId);
        if (file && targetCard) {
            targetCard.imageUrl = URL.createObjectURL(file);
            const otherLang: SolutionsLang = lang === 'en' ? 'ar' : 'en';
            const sameCardOtherLang = this.solutionsByLang[otherLang].find((card) => card.id === cardId);
            if (sameCardOtherLang) {
                sameCardOtherLang.imageUrl = targetCard.imageUrl;
            }
            this.cdr.detectChanges();
        }
    }

    addSolutionsGroup(): void {
        const dialogRef = this.openSectionDialog();
        dialogRef?.onClose.subscribe((result?: AddSectionDialogResult) => {
            this.ngZone.run(() => {
                if (!result) return;

                this.idCounter += 1;
                this.solutionsByLang.en.push({
                    id: this.idCounter,
                    title: result.groupNameEn.trim(),
                    content: result.briefEn.trim(),
                    imageUrl: result.imageUrl
                });

                this.solutionsByLang.ar.push({
                    id: this.idCounter,
                    title: result.groupNameAr.trim(),
                    content: result.briefAr.trim(),
                    imageUrl: result.imageUrl
                });

                this.cdr.detectChanges();
            });
        });
    }

    toggleCardMenu(cardId: number, event: Event): void {
        event.stopPropagation();
        this.openMenuCardId = this.openMenuCardId === cardId ? null : cardId;
        this.cdr.detectChanges();
    }

    closeCardMenu(): void {
        this.openMenuCardId = null;
        this.cdr.detectChanges();
    }

    editSolutionCard(cardId: number): void {
        const enCard = this.solutionsByLang.en.find((card) => card.id === cardId);
        const arCard = this.solutionsByLang.ar.find((card) => card.id === cardId);
        if (!enCard && !arCard) {
            return;
        }

        const dialogRef = this.openSectionDialog({
            groupNameEn: enCard?.title ?? '',
            groupNameAr: arCard?.title ?? '',
            briefEn: enCard?.content ?? '',
            briefAr: arCard?.content ?? '',
            imageUrl: enCard?.imageUrl ?? arCard?.imageUrl ?? null
        });
        this.closeCardMenu();

        dialogRef?.onClose.subscribe((result?: AddSectionDialogResult) => {
            this.ngZone.run(() => {
                if (!result) return;

                if (enCard) {
                    enCard.title = result.groupNameEn.trim();
                    enCard.content = result.briefEn.trim();
                }

                if (arCard) {
                    arCard.title = result.groupNameAr.trim();
                    arCard.content = result.briefAr.trim();
                }

                if (enCard) enCard.imageUrl = result.imageUrl;
                if (arCard) arCard.imageUrl = result.imageUrl;

                this.cdr.detectChanges();
            });
        });
    }

    openCardAccess(): void {
        this.closeCardMenu();
        void this.router.navigate(['/dashboard/solutions/access']);
    }

    removeSolutionCard(cardId: number): void {
        this.solutionsByLang.en = this.solutionsByLang.en.filter((card) => card.id !== cardId);
        this.solutionsByLang.ar = this.solutionsByLang.ar.filter((card) => card.id !== cardId);
        this.closeCardMenu();
        this.cdr.detectChanges();
    }

    save(): void {
        if (this.isSaving || !this.canSave) return;

        this.isSaving = true;
        this.solutionsPageService.save({
            isActive: this.isActive,
            heroImageUrl: this.persistedTopImageUrl,
            heroTextEn: this.introContentByLang.en,
            heroTextAr: this.introContentByLang.ar,
            solutionCards: this.solutionsByLang.en.map((enCard, index) => {
                const arCard = this.solutionsByLang.ar.find(c => c.id === enCard.id);
                return {
                    id: enCard.id,
                    groupNameEn: enCard.title,
                    briefEn: enCard.content,
                    groupNameAr: arCard?.title ?? '',
                    briefAr: arCard?.content ?? '',
                    imageUrl: enCard.imageUrl,
                    displayOrder: index
                };
            })
        }).subscribe({
            next: () => {
                this.isSaving = false;
                this.solutionsPageService.invalidateCache();
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Solutions page saved.' });
                this.cdr.markForCheck();
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save solutions page.' });
                this.cdr.markForCheck();
            }
        });
    }

    onPreview(): void {
        const previewLang: 'en' | 'ar' = this.activeTab === 'ar' ? 'ar' : 'en';
        const previewHeader = previewLang === 'ar' ? 'معاينة صفحة الحلول' : 'Solutions Preview';

        const dialogData: SolutionsDialogData = {
            source: 'preview',
            data: {
                isActive: this.isActive,
                heroImageUrl: this.persistedTopImageUrl,
                heroTextEn: this.introContentByLang.en,
                heroTextAr: this.introContentByLang.ar,
                solutionCards: this.solutionsByLang.en.map((enCard, index) => {
                    const arCard = this.solutionsByLang.ar.find(c => c.id === enCard.id);
                    return {
                        id: enCard.id,
                        groupNameEn: enCard.title,
                        briefEn: enCard.content,
                        groupNameAr: arCard?.title ?? '',
                        briefAr: arCard?.content ?? '',
                        imageUrl: enCard.imageUrl,
                        displayOrder: index
                    };
                })
            },
            previewLang
        };

        this.dialogService.open(SolutionsComponent, {
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

    private openSectionDialog(initial?: {
        groupNameEn: string;
        groupNameAr: string;
        briefEn: string;
        briefAr: string;
        imageUrl: string | null;
    }): DynamicDialogRef | null {
        const lang = this.activeTab;
        const isRtl = lang === 'ar';
        const header = initial
            ? (lang === 'ar' ? 'Edit Solutions Group' : 'Edit Solutions Group')
            : (lang === 'ar' ? 'Add Solutions Group' : 'Add Solutions Group');

        return this.dialogService.open(AddSectionDialogComponent, {
            header,
            data: { lang, initial },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });
    }
}
