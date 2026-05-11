import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
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
import { MediaService } from '../../../../core/services/media.service';
import { SolutionsComponent, SolutionsDialogData } from '../../../solutions/solutions.component';

type SolutionsLang = 'en' | 'ar';
type SolutionsFieldKey = 'heroTextEn' | 'heroTextAr';

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
export class DashboardSolutionsComponent implements OnInit, OnDestroy {
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly mediaService = inject(MediaService);
    private readonly dialogService = inject(DialogService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly ngZone = inject(NgZone);
    private readonly router = inject(Router);

    activeTab: SolutionsLang = 'en';
    isActive = true;
    isLoading = true;
    isSaving = false;
    isUploadingImage = false;
    attemptedSave = false;
    touchedFields: Partial<Record<SolutionsFieldKey, boolean>> = {};
    topImageUrl: string | null = null;
    private persistedTopImageUrl: string | null = null;
    private localTopPreviewUrl: string | null = null;
    openMenuCardId: number | null = null;

    get canSave(): boolean {
        return this.areRequiredFieldsValid() && this.areRequiredCardsValid();
    }

    get anyUploading(): boolean {
        return this.isUploadingImage;
    }

    private idCounter = 0;
    private readonly persistedCardIds = new Set<number>();
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly mixedLanguagePattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

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
                    this.persistedCardIds.clear();

                    for (const card of sorted) {
                        this.idCounter = Math.max(this.idCounter, card.id);
                        this.persistedCardIds.add(card.id);
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
        this.persistedTopImageUrl = null;
        this.cdr.detectChanges();

        this.mediaService.upload(file, 'cms/solutions').subscribe({
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

    openCardAccess(cardId: number): void {
        this.closeCardMenu();

        if (!this.persistedCardIds.has(cardId)) {
            this.showAccessRequiresSavedCardWarning();
            return;
        }

        const cardTitle = this.solutionsByLang[this.activeTab].find((card) => card.id === cardId)?.title
            ?? this.solutionsByLang.en.find((card) => card.id === cardId)?.title
            ?? `Card ${cardId}`;
        const cardTitleEn = this.solutionsByLang.en.find((card) => card.id === cardId)?.title ?? cardTitle;
        const cardTitleAr = this.solutionsByLang.ar.find((card) => card.id === cardId)?.title ?? cardTitle;

        void this.router.navigate(['/dashboard/solutions/access', cardId], {
            state: { cardTitle, cardTitleEn, cardTitleAr }
        });
    }

    removeSolutionCard(cardId: number): void {
        this.solutionsByLang.en = this.solutionsByLang.en.filter((card) => card.id !== cardId);
        this.solutionsByLang.ar = this.solutionsByLang.ar.filter((card) => card.id !== cardId);
        this.closeCardMenu();
        this.cdr.detectChanges();
    }

    markFieldTouched(field: SolutionsFieldKey): void {
        this.touchedFields[field] = true;
    }

    showRequiredError(field: SolutionsFieldKey): boolean {
        return (this.attemptedSave || !!this.touchedFields[field]) && !this.getFieldValue(field).trim();
    }

    showPatternError(field: SolutionsFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        return (this.attemptedSave || !!this.touchedFields[field]) && !!value && !this.isFieldPatternValid(field);
    }

    requiredMessage(lang: SolutionsLang): string {
        return lang === 'ar' ? 'هذا الحقل مطلوب.' : 'This field is required.';
    }

    patternMessage(lang: SolutionsLang): string {
        return lang === 'ar' ? 'يرجى إدخال نص عربي أو إنجليزي فقط.' : 'Please enter English text only.';
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
                this.persistedCardIds.clear();
                this.solutionsByLang.en.forEach((card) => this.persistedCardIds.add(card.id));
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
        this.attemptedSave = true;

        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

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

    private areRequiredFieldsValid(): boolean {
        const fields: SolutionsFieldKey[] = ['heroTextEn', 'heroTextAr'];
        return fields.every((field) => this.getFieldValue(field).trim() && this.isFieldPatternValid(field));
    }

    private areRequiredCardsValid(): boolean {
        return !!this.persistedTopImageUrl
            && this.solutionsByLang.en.length > 0
            && this.solutionsByLang.en.every((enCard) => {
                const arCard = this.solutionsByLang.ar.find((card) => card.id === enCard.id);
                return !!enCard.imageUrl
                    && !!enCard.title.trim()
                    && !!enCard.content.trim()
                    && !!arCard?.title.trim()
                    && !!arCard?.content.trim()
                    && this.englishPattern.test(enCard.title.trim())
                    && this.englishPattern.test(enCard.content.trim())
                    && this.mixedLanguagePattern.test(arCard.title.trim())
                    && this.mixedLanguagePattern.test(arCard.content.trim());
            });
    }

    private getFieldValue(field: SolutionsFieldKey): string {
        return field === 'heroTextAr' ? this.introContentByLang.ar : this.introContentByLang.en;
    }

    private isFieldPatternValid(field: SolutionsFieldKey): boolean {
        const value = this.getFieldValue(field).trim();
        if (!value) return false;

        return field === 'heroTextAr'
            ? this.mixedLanguagePattern.test(value)
            : this.englishPattern.test(value);
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

    private revokeTopPreviewUrl(): void {
        if (this.localTopPreviewUrl) {
            URL.revokeObjectURL(this.localTopPreviewUrl);
            this.localTopPreviewUrl = null;
        }
    }

    private showValidationWarning(): void {
        const isArabic = this.activeTab === 'ar';
        this.messageService.add({
            severity: 'warn',
            summary: isArabic ? 'تنبيه' : 'Validation',
            detail: isArabic ? 'يرجى ملء جميع الحقول المطلوبة.' : 'Please fill all required fields.'
        });
    }

    private showAccessRequiresSavedCardWarning(): void {
        const isArabic = this.activeTab === 'ar';
        this.messageService.add({
            severity: 'warn',
            summary: isArabic ? 'تنبيه' : 'Warning',
            detail: isArabic
                ? 'يرجى حفظ بطاقة الحلول أولا حتى تظهر في الخلفية، ثم افتح الوصول.'
                : 'Please save this solution card first so it appears in the backend, then open Access.'
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
            ? (lang === 'ar' ? 'تعديل مجموعة الحلول' : 'Edit Solutions Group')
            : (lang === 'ar' ? 'إضافة مجموعة حلول' : 'Add Solutions Group');

        return this.dialogService.open(AddSectionDialogComponent, {
            header,
            data: { lang, initial },
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });
    }
}
