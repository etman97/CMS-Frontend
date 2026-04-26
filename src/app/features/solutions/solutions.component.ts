import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { SolutionsPageService, SolutionsPageDto, SolutionCardDto } from '../../core/services/solutions-page.service';

@Component({
    selector: 'app-solutions',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './solutions.component.html',
    styleUrl: './solutions.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SolutionsComponent implements OnInit {
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly translateService = inject(TranslateService);
    private readonly dialogConfig = inject(DynamicDialogConfig, { optional: true });
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);

    readonly isPreview = !!this.dialogConfig?.data;

    isLoading = false;
    isError = false;

    heroImageUrl: string | null = null;
    introContent = '';
    cards: SolutionCardDto[] = [];

    private dto: SolutionsPageDto | null = null;

    ngOnInit(): void {
        const previewDto = this.dialogConfig?.data as SolutionsPageDto | undefined;

        if (previewDto) {
            this.dto = previewDto;
            this.populate(previewDto, this.currentLang);
            this.watchLang();
            return;
        }

        this.isLoading = true;
        this.solutionsPageService.get()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (dto) => {
                    this.dto = dto;
                    if (dto) this.populate(dto, this.currentLang);
                    this.isLoading = false;
                    this.watchLang();
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.isLoading = false;
                    this.isError = true;
                    this.cdr.markForCheck();
                }
            });
    }

    private get currentLang(): 'en' | 'ar' {
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        if (urlLang === 'en' || urlLang === 'ar') return urlLang;
        return document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
    }

    private populate(dto: SolutionsPageDto, lang: 'en' | 'ar'): void {
        this.heroImageUrl = dto.heroImageUrl;
        this.cards = dto.cards;
        this.introContent = lang === 'ar' ? dto.introContentAr : dto.introContentEn;
    }

    private watchLang(): void {
        this.translateService.onLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                if (this.dto) {
                    this.populate(this.dto, this.currentLang);
                    this.cdr.markForCheck();
                }
            });
    }

    cardTitle(card: SolutionCardDto): string {
        return this.currentLang === 'ar' ? card.titleAr : card.titleEn;
    }

    cardContent(card: SolutionCardDto): string {
        return this.currentLang === 'ar' ? card.contentAr : card.contentEn;
    }
}
