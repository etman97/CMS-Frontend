import { ChangeDetectorRef, Component, NgZone, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { AddSectionDialogComponent } from '../dashboard-services/dialogs/add-section-dialog/add-section-dialog.component';
import { AddSectionDialogResult } from '../dashboard-services/dialogs/add-section-dialog/add-section-dialog.model';

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
export class DashboardSolutionsComponent {
    private readonly dialogService = inject(DialogService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly ngZone = inject(NgZone);
    private readonly router = inject(Router);

    activeTab: SolutionsLang = 'en';
    isActive = true;
    topImageUrl: string | null = null;
    openMenuCardId: number | null = null;

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
                const imageUrl = result.imageFile ? URL.createObjectURL(result.imageFile) : null;

                this.solutionsByLang.en.push({
                    id: this.idCounter,
                    title: result.groupNameEn.trim(),
                    content: result.briefEn.trim(),
                    imageUrl
                });

                this.solutionsByLang.ar.push({
                    id: this.idCounter,
                    title: result.groupNameAr.trim(),
                    content: result.briefAr.trim(),
                    imageUrl
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

                if (result.imageFile) {
                    const imageUrl = URL.createObjectURL(result.imageFile);
                    if (enCard) enCard.imageUrl = imageUrl;
                    if (arCard) arCard.imageUrl = imageUrl;
                }

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
