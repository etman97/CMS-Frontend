import { ChangeDetectorRef, Component, NgZone, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { AddSectionDialogComponent } from '../dashboard-services/dialogs/add-section-dialog/add-section-dialog.component';
import { AddSectionDialogResult } from '../dashboard-services/dialogs/add-section-dialog/add-section-dialog.model';
import { SolutionsPageService, SolutionsPageDto, SolutionCardDto } from '../../../../core/services/solutions-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { SolutionsComponent } from '../../../solutions/solutions.component';

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
    private readonly dialogService = inject(DialogService);
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly ngZone = inject(NgZone);

    activeTab: SolutionsLang = 'en';
    isLoading = true;
    isActive = true;
    isSaving = false;
    isUploadingImage = false;
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

    ngOnInit(): void {
        this.solutionsPageService.get().subscribe({
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

    private populate(data: SolutionsPageDto): void {
        this.isActive = data.isActive;
        this.topImageUrl = data.heroImageUrl;
        this.introContentByLang.en = data.introContentEn;
        this.introContentByLang.ar = data.introContentAr;
        this.solutionsByLang.en = data.cards.map((c): SolutionCard => ({
            id: c.id,
            title: c.titleEn,
            content: c.contentEn,
            imageUrl: c.imageUrl
        }));
        this.solutionsByLang.ar = data.cards.map((c): SolutionCard => ({
            id: c.id,
            title: c.titleAr,
            content: c.contentAr,
            imageUrl: c.imageUrl
        }));
        this.idCounter = data.cards.length > 0 ? Math.max(...data.cards.map((c) => c.id)) : 0;
    }

    private buildDto(): SolutionsPageDto {
        const enCards = this.solutionsByLang.en;
        const arCards = this.solutionsByLang.ar;

        const cards: SolutionCardDto[] = enCards.map((enCard, i): SolutionCardDto => {
            const arCard = arCards.find((c) => c.id === enCard.id);
            return {
                id: enCard.id,
                titleEn: enCard.title,
                contentEn: enCard.content,
                titleAr: arCard?.title ?? '',
                contentAr: arCard?.content ?? '',
                imageUrl: enCard.imageUrl,
                displayOrder: i
            };
        });

        return {
            isActive: this.isActive,
            introContentEn: this.introContentByLang.en,
            introContentAr: this.introContentByLang.ar,
            heroImageUrl: this.topImageUrl,
            cards
        };
    }

    openPreview(): void {
        this.dialogService.open(SolutionsComponent, {
            data: this.buildDto(),
            header: 'Preview — Solutions',
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

        this.mediaService.upload(file, 'cms/solutions').subscribe({
            next: (res) => {
                this.topImageUrl = res.url;
                this.isUploadingImage = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.topImageUrl = null;
                this.isUploadingImage = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Image upload failed.' });
            }
        });
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
        if (!enCard && !arCard) return;

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
        const header = initial ? 'Edit Solutions Group' : 'Add Solutions Group';

        return this.dialogService.open(AddSectionDialogComponent, {
            header,
            data: { lang, initial },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });
    }

    save(): void {
        if (this.isSaving || this.isUploadingImage) return;

        this.isSaving = true;
        this.solutionsPageService.save(this.buildDto()).subscribe({
            next: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Solutions page saved successfully.' });
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save solutions page.' });
            }
        });
    }
}
