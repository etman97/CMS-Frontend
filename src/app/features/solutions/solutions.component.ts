import { CommonModule } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SolutionsPageDto, SolutionsPageService } from '../../core/services/solutions-page.service';
import { SolutionSectionDto, SolutionSectionsService } from '../../core/services/solution-sections.service';

export interface SolutionsDialogData {
    source?: 'preview' | 'api';
    data?: SolutionsPageDto;
    previewLang?: 'en' | 'ar';
}

@Component({
    selector: 'app-solutions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './solutions.component.html',
    styleUrl: './solutions.component.scss'
})
export class SolutionsComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly solutionSectionsService = inject(SolutionSectionsService);
    private readonly dialogConfig = inject(DynamicDialogConfig<SolutionsDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });
    private readonly injector = inject(Injector);

    private dirObserver: MutationObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private dataSource: SolutionsPageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;
    private sectionPrefetchSub: Subscription | null = null;
    private readonly sectionsByCardId = new Map<number, SolutionSectionDto[]>();
    private readonly prefetchedCardIds = new Set<number>();

    heroText = '';
    heroImageUrl: string | null = null;
    solutionCards: { id: number; title: string; brief: string; imageUrl: string | null }[] = [];

    isRtl = false;
    isPreviewMode = false;
    openingCardId: number | null = null;

    get isLoading(): boolean {
        return this.solutionsPageService.isLoading();
    }

    get hasLoadError(): boolean {
        return !!this.solutionsPageService.error();
    }

    ngOnInit(): void {
        this.routeLang = this.resolveRouteLang(this.route.snapshot.queryParamMap.get('lang'));

        const dialogData = this.dialogConfig?.data;
        if (dialogData?.source === 'preview' && dialogData.data) {
            this.isPreviewMode = true;
            this.dataSource = dialogData.data;
            this.populate(dialogData.data, dialogData.previewLang ?? 'en');
            return;
        }

        this.observeDirectionChanges();
        this.observeQueryLangChanges();

        // Synchronous read: data already loaded by AppInitService or resolver
        const resolvedData = this.route.snapshot.data['solutionsPageData'] as SolutionsPageDto | null | undefined;
        this.dataSource = resolvedData !== undefined ? resolvedData : this.solutionsPageService.data();
        this.applyCurrentLanguage();
        this.prefetchSolutionSections();

        // Reactive effect for async data arrival (fallback)
        effect(() => {
            const data = this.solutionsPageService.data();
            if (!data) return;
            this.dataSource = data;
            this.applyCurrentLanguage();
            this.prefetchSolutionSections();
        }, { injector: this.injector });

        // Error display effect
        effect(() => {
            const err = this.solutionsPageService.error();
            if (!err) return;
            this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load solutions page data.' });
        }, { injector: this.injector });

        this.solutionsPageService.load();
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
        this.queryParamSub?.unsubscribe();
        this.queryParamSub = null;
        this.sectionPrefetchSub?.unsubscribe();
        this.sectionPrefetchSub = null;
    }

    openSolutionCard(card: { id: number; title: string }): void {
        if (this.isPreviewMode || this.openingCardId !== null) return;

        const cachedSections = this.sectionsByCardId.get(card.id);
        if (cachedSections) {
            this.navigateToSolutionDetails(card, cachedSections);
            return;
        }

        this.openingCardId = card.id;
        this.solutionSectionsService.getByCardId(card.id).subscribe({
            next: (sections) => {
                this.openingCardId = null;
                this.sectionsByCardId.set(card.id, sections);
                this.navigateToSolutionDetails(card, sections);
            },
            error: () => {
                this.openingCardId = null;
                this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load solution details.' });
            }
        });
    }

    private populate(data: SolutionsPageDto, lang: 'en' | 'ar'): void {
        this.isRtl = lang === 'ar';
        this.heroImageUrl = data.heroImageUrl;
        this.heroText = lang === 'ar' ? data.heroTextAr : data.heroTextEn;
        this.solutionCards = [...data.solutionCards]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(card => ({
                id: card.id,
                title: lang === 'ar' ? card.groupNameAr : card.groupNameEn,
                brief: lang === 'ar' ? card.briefAr : card.briefEn,
                imageUrl: card.imageUrl
            }));
    }

    private prefetchSolutionSections(): void {
        if (!this.dataSource?.solutionCards.length || this.isPreviewMode) return;

        const cardsToFetch = this.dataSource.solutionCards.filter((card) => !this.prefetchedCardIds.has(card.id));
        if (!cardsToFetch.length) return;

        this.sectionPrefetchSub?.unsubscribe();
        this.sectionPrefetchSub = forkJoin(
            cardsToFetch.map((card) =>
                this.solutionSectionsService.getByCardId(card.id).pipe(
                    catchError(() => of([] as SolutionSectionDto[]))
                )
            )
        ).subscribe((sectionsByIndex) => {
            sectionsByIndex.forEach((sections, index) => {
                const cardId = cardsToFetch[index].id;
                this.prefetchedCardIds.add(cardId);
                this.sectionsByCardId.set(cardId, sections);
            });
        });
    }

    private navigateToSolutionDetails(card: { id: number; title: string }, sections: SolutionSectionDto[]): void {
        const firstSection = [...sections].sort((a, b) => a.displayOrder - b.displayOrder)[0];
        if (!firstSection) {
            this.messageService?.add({ severity: 'warn', summary: 'Unavailable', detail: 'No details have been added for this solution yet.' });
            return;
        }

        const detailType = firstSection.imageChoice === 'TwoImages' ? 'two-images' : 'one-image';
        const queryParams = this.routeLang ? { lang: this.routeLang } : undefined;

        void this.router.navigate(['/solutions', card.id, detailType], {
            queryParams,
            state: { title: card.title, sections }
        });
    }

    private applyCurrentLanguage(): void {
        if (!this.dataSource) return;
        const lang = this.routeLang ?? this.getLangFromDocumentDir();
        this.populate(this.dataSource, lang);
    }

    private resolveRouteLang(value: string | null): 'en' | 'ar' | null {
        if (value === 'ar') return 'ar';
        if (value === 'en') return 'en';
        return null;
    }

    private getLangFromDocumentDir(): 'en' | 'ar' {
        return document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
    }

    private observeQueryLangChanges(): void {
        this.queryParamSub = this.route.queryParamMap.subscribe((params) => {
            this.routeLang = this.resolveRouteLang(params.get('lang'));
            this.applyCurrentLanguage();
        });
    }

    private observeDirectionChanges(): void {
        this.dirObserver = new MutationObserver(() => {
            if (!this.routeLang) {
                this.applyCurrentLanguage();
            }
        });

        this.dirObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['dir']
        });
    }
}
