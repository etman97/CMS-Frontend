import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { HomeButtonLinkType, HomePageDto, HomePageService } from '../../core/services/home-page.service';
import { PageStatusService } from '../../core/services/page-status.service';

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
    private readonly dialogConfig = inject(DynamicDialogConfig<HomeDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });
    private dirObserver: MutationObserver | null = null;
    private dataSource: HomePageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;

    heroTitle = '';
    heroContent = '';
    primaryButtonText = '';
    secondaryButtonText = '';
    primaryButtonLinkType: HomeButtonLinkType = 'internal';
    primaryButtonLink = '/contact';
    secondaryButtonLinkType: HomeButtonLinkType = 'internal';
    secondaryButtonLink = '/services';
    heroBackgroundImageStyle: string | null = null;
    isRtl = false;
    isPreviewMode = false;
    isLoading = true;
    showServices = false;
    showPartners = false;

    ngOnInit(): void {
        this.routeLang = this.resolveRouteLang(this.route.snapshot.queryParamMap.get('lang'));
        this.observeDirectionChanges();

        const dialogData = this.dialogConfig?.data;
        if (dialogData?.source === 'preview' && dialogData.data) {
            this.isPreviewMode = true;
            this.dataSource = dialogData.data;
            this.populate(dialogData.data, dialogData.previewLang ?? 'en');
            this.isLoading = false;
            return;
        }

        const resolvedData = this.route.snapshot.data['homePageData'] as HomePageDto | null | undefined;
        if (resolvedData !== undefined) {
            this.dataSource = resolvedData;
            this.applyCurrentLanguage();
            this.isLoading = false;
        } else {
            this.loadFromApi();
        }

        this.pageStatusService.getStatuses().subscribe(statuses => {
            this.showServices = statuses.services;
            this.showPartners = statuses.partners;
        });
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
    }

    private populate(data: HomePageDto, lang: 'en' | 'ar'): void {
        this.isRtl = lang === 'ar';

        if (lang === 'ar') {
            this.heroTitle = data.heroTitleAr ?? '';
            this.heroContent = data.heroContentAr ?? '';
            this.primaryButtonText = data.primaryButtonTextAr ?? '';
            this.secondaryButtonText = data.secondaryButtonTextAr ?? '';
            this.primaryButtonLinkType = data.primaryButtonLinkTypeAr ?? 'internal';
            this.primaryButtonLink = data.primaryButtonLinkAr ?? '/contact';
            this.secondaryButtonLinkType = data.secondaryButtonLinkTypeAr ?? 'internal';
            this.secondaryButtonLink = data.secondaryButtonLinkAr ?? '/services';
        } else {
            this.heroTitle = data.heroTitleEn ?? '';
            this.heroContent = data.heroContentEn ?? '';
            this.primaryButtonText = data.primaryButtonTextEn ?? '';
            this.secondaryButtonText = data.secondaryButtonTextEn ?? '';
            this.primaryButtonLinkType = data.primaryButtonLinkTypeEn ?? 'internal';
            this.primaryButtonLink = data.primaryButtonLinkEn ?? '/contact';
            this.secondaryButtonLinkType = data.secondaryButtonLinkTypeEn ?? 'internal';
            this.secondaryButtonLink = data.secondaryButtonLinkEn ?? '/services';
        }

        this.heroBackgroundImageStyle = this.buildHeroBackgroundStyle(data.heroImageUrl);
    }

    private buildHeroBackgroundStyle(imageUrl: string | null): string | null {
        if (!imageUrl) {
            return null;
        }

        return `linear-gradient(rgba(45, 46, 131, 0.25), rgba(45, 46, 131, 0.25)), url('${imageUrl}') center center / cover no-repeat`;
    }

    private loadFromApi(): void {
        this.homePageService.get().subscribe({
            next: (data) => {
                this.dataSource = data;
                this.applyCurrentLanguage();
                this.isLoading = false;
            },
            error: () => {
                this.isLoading = false;
                this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load home page data.' });
            }
        });
    }

    private resolveRouteLang(value: string | null): 'en' | 'ar' | null {
        if (value === 'ar') return 'ar';
        if (value === 'en') return 'en';
        return null;
    }

    private applyCurrentLanguage(): void {
        if (!this.dataSource) {
            return;
        }

        const lang = this.routeLang ?? this.getLangFromDocumentDir();
        this.populate(this.dataSource, lang);
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
