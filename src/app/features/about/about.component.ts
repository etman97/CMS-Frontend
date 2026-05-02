import { CommonModule } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AboutPageDto, AboutPageService, TeamMemberDto } from '../../core/services/about-page.service';

export interface AboutDialogData {
    source?: 'preview' | 'api';
    data?: AboutPageDto;
    previewLang?: 'en' | 'ar';
}

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './about.component.html',
    styleUrl: './about.component.scss'
})
export class AboutComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly aboutPageService = inject(AboutPageService);
    private readonly dialogConfig = inject(DynamicDialogConfig<AboutDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });
    private readonly injector = inject(Injector);

    private dirObserver: MutationObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private dataSource: AboutPageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;
    private previewLang: 'en' | 'ar' | null = null;

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

    heroImageUrl: string | null = null;
    sectionImages: { mission: string | null; vision: string | null; leadership: string | null } = {
        mission: null,
        vision: null,
        leadership: null
    };
    teamMembers: TeamMemberDto[] = [];

    isRtl = false;
    isPreviewMode = false;

    get isLoading(): boolean {
        return this.aboutPageService.isLoading();
    }

    get hasLoadError(): boolean {
        return !!this.aboutPageService.error();
    }

    private readonly labels = {
        en: {
            loadError: 'Failed to load About page data.',
            title: 'About Us',
            whyWes: 'Why WES',
            wesInNumbers: 'WES in numbers',
            products: 'Products',
            clients: 'Clients',
            partners: 'Partners',
            employees: 'Employees',
            mission: 'Mission',
            ourMission: 'Our Mission',
            vision: 'Vision',
            ourVision: 'Our Vision',
            leadership: 'Leadership',
            ourTeam: 'Our Team'
        },
        ar: {
            loadError: 'فشل تحميل بيانات صفحة من نحن.',
            title: 'من نحن',
            whyWes: 'لماذا WES',
            wesInNumbers: 'WES بالأرقام',
            products: 'المنتجات',
            clients: 'العملاء',
            partners: 'الشركاء',
            employees: 'الموظفون',
            mission: 'المهمة',
            ourMission: 'مهمتنا',
            vision: 'الرؤية',
            ourVision: 'رؤيتنا',
            leadership: 'القيادة',
            ourTeam: 'فريقنا'
        }
    } as const;

    ngOnInit(): void {
        this.routeLang = this.resolveRouteLang(this.route.snapshot.queryParamMap.get('lang'));

        const dialogData = this.dialogConfig?.data;
        if (dialogData?.source === 'preview' && dialogData.data) {
            this.isPreviewMode = true;
            const previewLang: 'en' | 'ar' = dialogData.previewLang ?? 'en';
            this.previewLang = previewLang;
            this.dataSource = dialogData.data;
            this.populate(dialogData.data, previewLang);
            return;
        }

        this.observeDirectionChanges();
        this.observeQueryLangChanges();

        // Synchronous read: data already loaded by AppInitService or resolver
        const resolvedData = this.route.snapshot.data['aboutPageData'] as AboutPageDto | null | undefined;
        this.dataSource = resolvedData !== undefined ? resolvedData : this.aboutPageService.data();
        this.applyCurrentLanguage();

        // Reactive effect for async data arrival (fallback)
        effect(() => {
            const data = this.aboutPageService.data();
            if (!data) return;
            this.dataSource = data;
            this.applyCurrentLanguage();
        }, { injector: this.injector });

        // Error display effect
        effect(() => {
            const err = this.aboutPageService.error();
            if (!err) return;
            this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load about page data.' });
        }, { injector: this.injector });

        this.aboutPageService.load();
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
        this.queryParamSub?.unsubscribe();
        this.queryParamSub = null;
    }

    private populate(data: AboutPageDto, lang: 'en' | 'ar'): void {
        this.isRtl = lang === 'ar';

        if (lang === 'ar') {
            this.aboutUsContent = data.aboutUsContentAr;
            this.subContent = data.subContentAr;
            this.whyUsContent = data.whyUsContentAr;
            this.numbersSubtitle = data.numbersSubtitleAr;
            this.missionContent = data.missionContentAr;
            this.visionContent = data.visionContentAr;
            this.leadershipContent = data.leadershipContentAr;
        } else {
            this.aboutUsContent = data.aboutUsContentEn;
            this.subContent = data.subContentEn;
            this.whyUsContent = data.whyUsContentEn;
            this.numbersSubtitle = data.numbersSubtitleEn;
            this.missionContent = data.missionContentEn;
            this.visionContent = data.visionContentEn;
            this.leadershipContent = data.leadershipContentEn;
        }

        this.numberOfEmployees = data.numberOfEmployees;
        this.numberOfProducts = data.numberOfProducts;
        this.numberOfClients = data.numberOfClients;
        this.numberOfPartners = data.numberOfPartners;

        this.heroImageUrl = data.heroImageUrl;
        this.sectionImages = {
            mission: data.missionImageUrl,
            vision: data.visionImageUrl,
            leadership: data.leadershipImageUrl
        };

        this.teamMembers = [...data.teamMembers].sort((a, b) => a.displayOrder - b.displayOrder);
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

        const lang = this.previewLang ?? this.routeLang ?? this.getLangFromDocumentDir();
        this.populate(this.dataSource, lang);
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

    getLabel(key: keyof (typeof this.labels)['en']): string {
        return this.isRtl ? this.labels.ar[key] : this.labels.en[key];
    }
}
