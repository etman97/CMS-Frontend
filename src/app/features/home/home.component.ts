import { Component, Injector, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { ButtonDirection, HomePageDto, HomePageService } from '../../core/services/home-page.service';
import { isVideoUrl } from '../../shared/utils/media.utils';
import { SolutionsPageDto, SolutionsPageService } from '../../core/services/solutions-page.service';
import { PageStatusService } from '../../core/services/page-status.service';
import { PartnersPageService } from '../../core/services/partners-page.service';

export interface HomeDialogData {
    source?: 'preview' | 'api';
    data?: HomePageDto;
    previewLang?: 'en' | 'ar';
}

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly homePageService = inject(HomePageService);
    private readonly pageStatusService = inject(PageStatusService);
    private readonly partnersPageService = inject(PartnersPageService);
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly dialogConfig = inject(DynamicDialogConfig<HomeDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });
    private readonly injector = inject(Injector);
    private dirObserver: MutationObserver | null = null;
    private solutionsDataSource: SolutionsPageDto | null = null;
    private dataSource: HomePageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;

    heroTitle = '';
    heroContent = '';
    primaryButtonText = '';
    secondaryButtonText = '';
    primaryButtonDirection: ButtonDirection = 'Internal';
    primaryButtonLink: string | null = null;
    secondaryButtonDirection: ButtonDirection = 'Internal';
    secondaryButtonLink: string | null = null;
    heroBackgroundImageStyle: string | null = null;
    heroVideoUrl: string | null = null;
    heroIsVideo = false;
    isRtl = false;
    isPreviewMode = false;
    showSolutions = false;
    showPartners = false;
    discoverSolutionsTitle = 'Discover Our Solutions';
    valuedPartnersTitle = 'Our Valued Partners';
    partnerLogos: { id: number; logoImageUrl: string | null }[] = [];
    solutionCards: { id: number; title: string; brief: string; imageUrl: string | null }[] = [];

    get isLoading(): boolean {
        return this.homePageService.isLoading();
    }

    ngOnInit(): void {
        this.routeLang = this.resolveRouteLang(this.route.snapshot.queryParamMap.get('lang'));
        this.observeDirectionChanges();

        const dialogData = this.dialogConfig?.data;
        if (dialogData?.source === 'preview' && dialogData.data) {
            this.isPreviewMode = true;
            this.dataSource = dialogData.data;
            this.populate(dialogData.data, dialogData.previewLang ?? 'en');
            return;
        }

        // Synchronous read: data already loaded by AppInitService or resolver
        const resolvedData = this.route.snapshot.data['homePageData'] as HomePageDto | null | undefined;
        this.dataSource = resolvedData !== undefined ? resolvedData : this.homePageService.data();
        this.applyCurrentLanguage();

        // Synchronous read for secondary data
        const partnersData = this.partnersPageService.data();
        if (partnersData) {
            this.partnerLogos = [...partnersData.partnerLogos].sort((a, b) => a.displayOrder - b.displayOrder);
        }

        const solutionsData = this.solutionsPageService.data();
        if (solutionsData) {
            this.solutionsDataSource = solutionsData;
            this.populateSolutionCards(solutionsData, this.routeLang ?? this.getLangFromDocumentDir());
        }

        const statuses = this.pageStatusService.statuses();
        if (statuses) {
            this.showSolutions = statuses.solutions;
            this.showPartners = statuses.partners;
        }

        // Reactive effects for async data arrival (fallback when not preloaded)
        effect(() => {
            const data = this.homePageService.data();
            if (!data) return;
            this.dataSource = data;
            this.applyCurrentLanguage();
        }, { injector: this.injector });

        effect(() => {
            const data = this.partnersPageService.data();
            if (!data) return;
            this.partnerLogos = [...data.partnerLogos].sort((a, b) => a.displayOrder - b.displayOrder);
        }, { injector: this.injector });

        effect(() => {
            const data = this.solutionsPageService.data();
            if (!data) return;
            this.solutionsDataSource = data;
            this.populateSolutionCards(data, this.routeLang ?? this.getLangFromDocumentDir());
        }, { injector: this.injector });

        effect(() => {
            const s = this.pageStatusService.statuses();
            if (!s) return;
            this.showSolutions = s.solutions;
            this.showPartners = s.partners;
        }, { injector: this.injector });

        // Trigger loads — no-ops if already loaded by AppInitService
        this.homePageService.load();
        this.partnersPageService.load();
        this.solutionsPageService.load();
        this.pageStatusService.load();
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
    }

    private populate(data: HomePageDto, lang: 'en' | 'ar'): void {
        this.isRtl = lang === 'ar';
        this.discoverSolutionsTitle = lang === 'ar' ? 'اكتشف حلولنا' : 'Discover Our Solutions';
        this.valuedPartnersTitle = lang === 'ar' ? 'شركاؤنا المميزون' : 'Our Valued Partners';

        if (lang === 'ar') {
            this.heroTitle = data.heroTitleAr ?? '';
            this.heroContent = data.heroContentAr ?? '';
            this.primaryButtonText = data.primaryButton?.ar ?? '';
            this.secondaryButtonText = data.secondaryButton?.ar ?? '';
        } else {
            this.heroTitle = data.heroTitleEn ?? '';
            this.heroContent = data.heroContentEn ?? '';
            this.primaryButtonText = data.primaryButton?.en ?? '';
            this.secondaryButtonText = data.secondaryButton?.en ?? '';
        }

        this.primaryButtonDirection = data.primaryButton?.direction ?? 'Internal';
        this.primaryButtonLink = this.resolveButtonLink(data.primaryButton);
        this.secondaryButtonDirection = data.secondaryButton?.direction ?? 'Internal';
        this.secondaryButtonLink = this.resolveButtonLink(data.secondaryButton);

        this.heroIsVideo = isVideoUrl(data.heroImageUrl);
        if (this.heroIsVideo) {
            this.heroVideoUrl = data.heroImageUrl;
            this.heroBackgroundImageStyle = null;
        } else {
            this.heroVideoUrl = null;
            this.heroBackgroundImageStyle = this.buildHeroBackgroundStyle(data.heroImageUrl);
        }
    }

    private resolveButtonLink(button: HomePageDto['primaryButton'] | null | undefined): string | null {
        if (!button) {
            return null;
        }

        return button.direction === 'External'
            ? button.externalUrl
            : button.selectedTab;
    }

    private buildHeroBackgroundStyle(imageUrl: string | null): string | null {
        if (!imageUrl) {
            return null;
        }

        return `linear-gradient(rgba(45, 46, 131, 0.25), rgba(45, 46, 131, 0.25)), url('${imageUrl}') center center / cover no-repeat`;
    }

    private populateSolutionCards(data: SolutionsPageDto, lang: 'en' | 'ar'): void {
        this.solutionCards = [...data.solutionCards]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(card => ({
                id: card.id,
                title: lang === 'ar' ? card.groupNameAr : card.groupNameEn,
                brief: lang === 'ar' ? card.briefAr : card.briefEn,
                imageUrl: card.imageUrl
            }));
    }

    private resolveRouteLang(value: string | null): 'en' | 'ar' | null {
        if (value === 'ar') return 'ar';
        if (value === 'en') return 'en';
        return null;
    }

    private applyCurrentLanguage(): void {
        const lang = this.routeLang ?? this.getLangFromDocumentDir();

        if (this.dataSource) {
            this.populate(this.dataSource, lang);
        }

        if (this.solutionsDataSource) {
            this.populateSolutionCards(this.solutionsDataSource, lang);
        }
    }

    private getLangFromDocumentDir(): 'en' | 'ar' {
        return document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
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

    onPreviewSurfaceClick(event: Event): void {
        if (!this.isPreviewMode) {
            return;
        }

        const target = event.target as HTMLElement | null;
        if (!target) {
            return;
        }

        if (target.closest('a,button,[role="button"]')) {
            event.preventDefault();
            event.stopPropagation();
        }
    }
}
