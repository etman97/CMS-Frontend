import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { HomePageService, HomePageDto } from '../../core/services/home-page.service';
import { SolutionsPageService, SolutionCardDto } from '../../core/services/solutions-page.service';
import { PartnersPageService, PartnerDto } from '../../core/services/partners-page.service';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
    private readonly homePageService = inject(HomePageService);
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly partnersPageService = inject(PartnersPageService);
    private readonly translateService = inject(TranslateService);
    private readonly dialogConfig = inject(DynamicDialogConfig, { optional: true });
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);

    readonly isPreview = !!this.dialogConfig?.data;

    isLoading = false;
    isError = false;

    heroTitle = '';
    heroContent = '';
    primaryButtonText = '';
    secondaryButtonText = '';
    heroImageUrl: string | null = null;
    solutionCards: SolutionCardDto[] = [];
    partnerLogos: PartnerDto[] = [];

    private dto: HomePageDto | null = null;

    get heroImageStyle(): string {
        const gradient = 'linear-gradient(rgba(45, 46, 131, 0.25), rgba(45, 46, 131, 0.25))';
        if (!this.heroImageUrl) return gradient;
        return `${gradient}, url(${this.heroImageUrl}) center center / cover no-repeat`;
    }

    ngOnInit(): void {
        const previewDto = this.dialogConfig?.data as HomePageDto | undefined;

        if (previewDto) {
            this.dto = previewDto;
            this.populate(previewDto, this.currentLang);
            this.loadSolutionsAndPartners();
            this.watchLang();
            return;
        }

        this.isLoading = true;
        this.homePageService.get()
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

        this.loadSolutionsAndPartners();
    }

    private loadSolutionsAndPartners(): void {
        this.solutionsPageService.get()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (dto) => {
                    this.solutionCards = dto?.cards ?? [];
                    this.cdr.markForCheck();
                }
            });

        this.partnersPageService.get()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (dto) => {
                    this.partnerLogos = dto?.partners ?? [];
                    this.cdr.markForCheck();
                }
            });
    }

    private get currentLang(): 'en' | 'ar' {
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        if (urlLang === 'en' || urlLang === 'ar') return urlLang;
        return document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
    }

    private populate(dto: HomePageDto, lang: 'en' | 'ar'): void {
        this.heroImageUrl = dto.heroImageUrl;
        if (lang === 'ar') {
            this.heroTitle = dto.heroTitleAr;
            this.heroContent = dto.heroContentAr;
            this.primaryButtonText = dto.primaryButtonTextAr;
            this.secondaryButtonText = dto.secondaryButtonTextAr;
        } else {
            this.heroTitle = dto.heroTitleEn;
            this.heroContent = dto.heroContentEn;
            this.primaryButtonText = dto.primaryButtonTextEn;
            this.secondaryButtonText = dto.secondaryButtonTextEn;
        }
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

    solutionTitle(card: SolutionCardDto): string {
        return this.currentLang === 'ar' ? card.titleAr : card.titleEn;
    }

    solutionContent(card: SolutionCardDto): string {
        return this.currentLang === 'ar' ? card.contentAr : card.contentEn;
    }
}
