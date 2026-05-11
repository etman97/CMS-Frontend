import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Injector, OnDestroy, OnInit, ViewChild, effect, inject } from '@angular/core';
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
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly aboutPageService = inject(AboutPageService);
    private readonly dialogConfig = inject(DynamicDialogConfig<AboutDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });
    private readonly injector = inject(Injector);
    private readonly cdr = inject(ChangeDetectorRef);

    @ViewChild('numbersSection') private numbersSection?: ElementRef<HTMLElement>;

    private dirObserver: MutationObserver | null = null;
    private numbersObserver: IntersectionObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private dataSource: AboutPageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;
    private previewLang: 'en' | 'ar' | null = null;
    private numbersAnimationFrameId: number | null = null;
    private hasNumbersEnteredViewport = false;
    private lastAnimatedNumbersSignature: string | null = null;

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

    displayedNumberOfEmployees = 0;
    displayedNumberOfProducts = 0;
    displayedNumberOfClients = 0;
    displayedNumberOfPartners = 0;

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

    ngAfterViewInit(): void {
        this.observeNumbersSection();
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
        this.numbersObserver?.disconnect();
        this.numbersObserver = null;
        this.queryParamSub?.unsubscribe();
        this.queryParamSub = null;
        this.cancelNumbersAnimation();
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

        this.numberOfEmployees = this.normalizeCount(data.numberOfEmployees);
        this.numberOfProducts = this.normalizeCount(data.numberOfProducts);
        this.numberOfClients = this.normalizeCount(data.numberOfClients);
        this.numberOfPartners = this.normalizeCount(data.numberOfPartners);
        this.syncDisplayedNumbers();

        this.heroImageUrl = data.heroImageUrl;
        this.sectionImages = {
            mission: data.missionImageUrl,
            vision: data.visionImageUrl,
            leadership: data.leadershipImageUrl
        };

        this.teamMembers = [...data.teamMembers].sort((a, b) => a.displayOrder - b.displayOrder);
    }

    private observeNumbersSection(): void {
        if (!this.numbersSection) {
            return;
        }

        if (!('IntersectionObserver' in window)) {
            this.hasNumbersEnteredViewport = true;
            this.animateNumbers();
            return;
        }

        this.numbersObserver = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) {
                    return;
                }

                this.hasNumbersEnteredViewport = true;
                this.animateNumbers();
                this.numbersObserver?.disconnect();
                this.numbersObserver = null;
            },
            { threshold: 0.25 }
        );

        this.numbersObserver.observe(this.numbersSection.nativeElement);
    }

    private syncDisplayedNumbers(): void {
        const signature = this.getNumbersSignature();

        if (!this.hasNumbersEnteredViewport) {
            this.cancelNumbersAnimation();
            this.displayedNumberOfProducts = 0;
            this.displayedNumberOfClients = 0;
            this.displayedNumberOfPartners = 0;
            this.displayedNumberOfEmployees = 0;
            this.cdr.markForCheck();
            return;
        }

        if (signature !== this.lastAnimatedNumbersSignature) {
            this.animateNumbers();
        }
    }

    private animateNumbers(): void {
        this.cancelNumbersAnimation();

        const duration = 1400;
        const startTime = performance.now();
        const startValues = {
            products: this.displayedNumberOfProducts,
            clients: this.displayedNumberOfClients,
            partners: this.displayedNumberOfPartners,
            employees: this.displayedNumberOfEmployees
        };
        const targetValues = {
            products: this.normalizeCount(this.numberOfProducts),
            clients: this.normalizeCount(this.numberOfClients),
            partners: this.normalizeCount(this.numberOfPartners),
            employees: this.normalizeCount(this.numberOfEmployees)
        };

        this.lastAnimatedNumbersSignature = this.getNumbersSignature();

        const tick = (time: number): void => {
            const progress = Math.min((time - startTime) / duration, 1);
            const easedProgress = 1 - Math.pow(1 - progress, 3);

            this.displayedNumberOfProducts = this.interpolateCount(startValues.products, targetValues.products, easedProgress);
            this.displayedNumberOfClients = this.interpolateCount(startValues.clients, targetValues.clients, easedProgress);
            this.displayedNumberOfPartners = this.interpolateCount(startValues.partners, targetValues.partners, easedProgress);
            this.displayedNumberOfEmployees = this.interpolateCount(startValues.employees, targetValues.employees, easedProgress);
            this.cdr.detectChanges();

            if (progress < 1) {
                this.numbersAnimationFrameId = requestAnimationFrame(tick);
                return;
            }

            this.numbersAnimationFrameId = null;
        };

        this.numbersAnimationFrameId = requestAnimationFrame(tick);
    }

    private interpolateCount(start: number, target: number, progress: number): number {
        return Math.round(start + (target - start) * progress);
    }

    private normalizeCount(value: unknown): number {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
    }

    private getNumbersSignature(): string {
        return [
            this.normalizeCount(this.numberOfProducts),
            this.normalizeCount(this.numberOfClients),
            this.normalizeCount(this.numberOfPartners),
            this.normalizeCount(this.numberOfEmployees)
        ].join('|');
    }

    private cancelNumbersAnimation(): void {
        if (this.numbersAnimationFrameId === null) {
            return;
        }

        cancelAnimationFrame(this.numbersAnimationFrameId);
        this.numbersAnimationFrameId = null;
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
