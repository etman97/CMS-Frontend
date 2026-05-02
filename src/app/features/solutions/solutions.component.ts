import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SolutionsPageDto, SolutionsPageService } from '../../core/services/solutions-page.service';

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
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly dialogConfig = inject(DynamicDialogConfig<SolutionsDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });

    private dirObserver: MutationObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private dataSource: SolutionsPageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;

    heroText = '';
    heroImageUrl: string | null = null;
    solutionCards: { id: number; title: string; brief: string; imageUrl: string | null }[] = [];

    isRtl = false;
    isLoading = true;
    hasLoadError = false;
    isPreviewMode = false;

    ngOnInit(): void {
        this.routeLang = this.resolveRouteLang(this.route.snapshot.queryParamMap.get('lang'));

        const dialogData = this.dialogConfig?.data;
        if (dialogData?.source === 'preview' && dialogData.data) {
            this.isPreviewMode = true;
            this.dataSource = dialogData.data;
            this.populate(dialogData.data, dialogData.previewLang ?? 'en');
            this.isLoading = false;
            return;
        }

        this.observeDirectionChanges();
        this.observeQueryLangChanges();

        const resolvedData = this.route.snapshot.data['solutionsPageData'] as SolutionsPageDto | null | undefined;
        if (resolvedData !== undefined) {
            this.dataSource = resolvedData;
            this.applyCurrentLanguage();
            this.isLoading = false;
            return;
        }

        this.loadFromApi();
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
        this.queryParamSub?.unsubscribe();
        this.queryParamSub = null;
    }

    private loadFromApi(): void {
        this.solutionsPageService.get().subscribe({
            next: (data) => {
                this.dataSource = data;
                this.applyCurrentLanguage();
                this.hasLoadError = false;
                this.isLoading = false;
            },
            error: () => {
                this.hasLoadError = true;
                this.isLoading = false;
                this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load solutions page data.' });
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
