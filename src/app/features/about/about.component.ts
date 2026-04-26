import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AboutPageService, AboutPageDto, TeamMemberDto } from '../../core/services/about-page.service';

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.component.html',
    styleUrl: './about.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutComponent implements OnInit {
    private readonly aboutPageService = inject(AboutPageService);
    private readonly translateService = inject(TranslateService);
    private readonly dialogConfig = inject(DynamicDialogConfig, { optional: true });
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);

    readonly isPreview = !!this.dialogConfig?.data;

    isLoading = false;
    isError = false;

    heroImageUrl: string | null = null;
    aboutUsContent = '';
    subContent = '';
    whyUsContent = '';
    numbersSubtitle = '';
    missionContent = '';
    visionContent = '';
    leadershipContent = '';

    numberOfEmployees = 0;
    numberOfProducts = 0;
    numberOfClients = 0;
    numberOfPartners = 0;

    missionImageUrl: string | null = null;
    visionImageUrl: string | null = null;
    leadershipImageUrl: string | null = null;

    teamMembers: TeamMemberDto[] = [];

    private dto: AboutPageDto | null = null;

    get heroImageStyle(): string {
        const gradient = 'linear-gradient(to bottom, rgba(0, 0, 0, 0) 24%, rgba(0, 0, 0, 1) 100%)';
        if (!this.heroImageUrl) return 'none';
        return `${gradient}, url(${this.heroImageUrl}) center / cover no-repeat`;
    }

    ngOnInit(): void {
        const previewDto = this.dialogConfig?.data as AboutPageDto | undefined;

        if (previewDto) {
            this.dto = previewDto;
            this.populate(previewDto, this.currentLang);
            this.watchLang();
            return;
        }

        this.isLoading = true;
        this.aboutPageService.get()
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

    private populate(dto: AboutPageDto, lang: 'en' | 'ar'): void {
        this.heroImageUrl = dto.heroImageUrl;
        this.missionImageUrl = dto.missionImageUrl;
        this.visionImageUrl = dto.visionImageUrl;
        this.leadershipImageUrl = dto.leadershipImageUrl;
        this.numberOfEmployees = dto.numberOfEmployees;
        this.numberOfProducts = dto.numberOfProducts;
        this.numberOfClients = dto.numberOfClients;
        this.numberOfPartners = dto.numberOfPartners;
        this.teamMembers = dto.teamMembers;
        this.subContent = dto.subContentEn;

        if (lang === 'ar') {
            this.aboutUsContent = dto.aboutUsContentAr;
            this.whyUsContent = dto.whyUsContentAr;
            this.numbersSubtitle = dto.numbersSubtitleEn;
            this.missionContent = dto.missionContentAr;
            this.visionContent = dto.visionContentAr;
            this.leadershipContent = dto.leadershipContentAr;
        } else {
            this.aboutUsContent = dto.aboutUsContentEn;
            this.whyUsContent = dto.whyUsContentEn;
            this.numbersSubtitle = dto.numbersSubtitleEn;
            this.missionContent = dto.missionContentEn;
            this.visionContent = dto.visionContentEn;
            this.leadershipContent = dto.leadershipContentEn;
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

    memberName(m: TeamMemberDto): string {
        return this.currentLang === 'ar' ? m.nameAr : m.nameEn;
    }

    memberTitle(m: TeamMemberDto): string {
        return this.currentLang === 'ar' ? m.jobTitleAr : m.jobTitleEn;
    }

    memberBrief(m: TeamMemberDto): string {
        return this.currentLang === 'ar' ? m.briefAr : m.briefEn;
    }
}
