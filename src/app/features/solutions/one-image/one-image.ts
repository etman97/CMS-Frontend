import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { Subscription } from 'rxjs';
import { SolutionSectionDto, SolutionSectionsService } from '../../../core/services/solution-sections.service';
import { SolutionsPageService } from '../../../core/services/solutions-page.service';

export interface OneImageSection {
    title: string;
    image: string;
    imageAlt: string;
    paragraphs: string[];
    reverse?: boolean;
}

export interface OneImageDialogData {
    source: 'preview';
    sections: OneImageSection[];
    previewLang: 'en' | 'ar';
    title?: string;
}

@Component({
  selector: 'app-one-image',
  imports: [RouterLink],
  templateUrl: './one-image.html',
  styleUrl: './one-image.scss',
})
export class OneImage implements OnInit, OnDestroy {
    private readonly dialogConfig = inject(DynamicDialogConfig<OneImageDialogData>, { optional: true });
    private readonly route = inject(ActivatedRoute);
    private readonly solutionSectionsService = inject(SolutionSectionsService);
    private readonly solutionsPageService = inject(SolutionsPageService);
    private readonly messageService = inject(MessageService, { optional: true });

    private cardId = 0;
    private dirObserver: MutationObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private routeLang: 'en' | 'ar' | null = null;
    private sourceSections: SolutionSectionDto[] | null = null;

    isPreviewMode = false;
    isRtl = false;
    pageTitle = 'IT Solutions';

    sections: OneImageSection[] = [];

    private readonly fallbackSections: OneImageSection[] = [
        {
            title: 'Digital Transformations',
            image: 'https://www.figma.com/api/mcp/asset/2981136d-a609-460e-868b-e9c8747ec9a0',
            imageAlt: 'Finger interacting with a digital transformation interface',
            paragraphs: [
                'We guide organizations through the intricate process of adopting digital technology to fundamentally improve and reimagine their operations, organizational culture, and overall customer experiences. This involves a holistic re-evaluation of processes, technology, and people.',
                'WES adds transformative value by providing a truly holistic approach to digital transformation. This encompasses everything from meticulous strategic planning and optimal technology selection to seamless implementation and effective change management. Our comprehensive methodology ensures a smooth transition, measurable improvements in operational efficiency, enhanced customer engagement, and a future-ready enterprise capable of adapting to market shifts.',
            ],
        },
        {
            title: 'Hybrid Multi-Cloud',
            image: 'https://www.figma.com/api/mcp/asset/c543617d-595b-4f24-93fe-f4a7ce9bba16',
            imageAlt: 'Cloud infrastructure network visualization',
            reverse: true,
            paragraphs: [
                'We develop and implement sophisticated strategies for managing and optimizing diverse workloads across a dynamic combination of on-premises infrastructure, private cloud environments, and multiple public cloud platforms. This ensures maximum flexibility and control.',
                'WES empowers clients to confidently navigate the inherent complexities of hybrid and multi-cloud environments. We specialize in optimizing resource allocation, rigorously ensuring data sovereignty and compliance, and significantly reducing operational costs, all while maximizing flexibility and scalability across diverse cloud platforms. This strategic approach provides unparalleled agility and resilience.',
            ],
        },
        {
            title: 'Containerization',
            image: 'https://www.figma.com/api/mcp/asset/e084809c-aace-4468-9409-e6daf8b8cf65',
            imageAlt: 'Containerization technology represented on a circuit board',
            paragraphs: [
                'We expertly implement cutting-edge container technologies, such as Docker and Kubernetes, to efficiently package applications and all their necessary dependencies. This ensures absolute consistency across various development, testing, and production environments, dramatically improving deployment efficiency and reliability.',
                'By implementing robust containerization strategies, WES enables significantly faster application deployment cycles, vastly improved scalability, and greater environmental consistency from development to production. This directly translates into reduced development cycles, more reliable software delivery, and ultimately, a more agile and responsive IT infrastructure for our clients.',
            ],
        },
        {
            title: 'ITSM and IOTM',
            image: 'https://www.figma.com/api/mcp/asset/8e218b30-8d63-406d-93e1-ae148225779c',
            imageAlt: 'IT service management dashboard interface',
            reverse: true,
            paragraphs: [
                'We provide advanced IT Service Management (ITSM) and IT Operations Management (IOTM) solutions designed to streamline IT service delivery, enhance support capabilities, and optimize operational efficiency. Our solutions leverage intelligent automation and insightful analytics to transform IT operations.',
                'WES fundamentally streamlines IT operations, drastically reduces manual effort, and significantly improves service quality through the deployment of advanced ITSM and IOTM solutions. This provides our clients with unprecedented control, real-time visibility, and enhanced responsiveness across their entire IT environment, leading to proactive problem resolution and superior service delivery.',
            ],
        },
        {
            title: 'IoT As-a-Service',
            image: 'https://www.figma.com/api/mcp/asset/3f91df06-6d67-475f-b489-982c4e5f0fe4',
            imageAlt: 'Robotic hand connected to IoT network points',
            paragraphs: [
                'We offer comprehensive Internet of Things (IoT) solutions delivered as a fully managed service. This spans the entire IoT life cycle, from seamless device connectivity and robust data collection to advanced analytics and intricate application integration.',
                'WES simplifies the complex adoption of IoT, allowing clients to effortlessly harness real-time data from connected devices. This enables enhanced, data-driven decision-making, predictive maintenance capabilities, and the creation of entirely new service offerings, all managed seamlessly and efficiently by our expert team, allowing clients to focus on core business innovation.',
            ],
        },
    ];

    ngOnInit(): void {
        const dialogData = this.dialogConfig?.data;
        if (dialogData?.source === 'preview') {
            this.isPreviewMode = true;
            this.isRtl = dialogData.previewLang === 'ar';
            this.pageTitle = dialogData.title || this.pageTitle;
            this.sections = dialogData.sections;
            return;
        }

        this.routeLang = this.resolveRouteLang(this.route.snapshot.queryParamMap.get('lang'));
        this.observeDirectionChanges();
        this.observeQueryLangChanges();

        this.cardId = Number(this.route.snapshot.paramMap.get('cardId'));
        if (!this.cardId) {
            this.sections = this.fallbackSections;
            this.applyCurrentLanguage();
            return;
        }

        const routeState = window.history.state as { title?: string; sections?: SolutionSectionDto[] };
        this.pageTitle = routeState.title || this.pageTitle;
        const lang = this.getCurrentLang();
        this.isRtl = lang === 'ar';
        this.loadCardTitle(this.cardId, lang);
        if (routeState.sections?.length) {
            this.sourceSections = routeState.sections;
            this.populateSections(this.sourceSections, lang);
            return;
        }
        this.loadSections(this.cardId, lang);
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
        this.queryParamSub?.unsubscribe();
        this.queryParamSub = null;
    }

    private loadSections(cardId: number, lang: 'en' | 'ar'): void {
        this.solutionSectionsService.getByCardId(cardId).subscribe({
            next: (sections) => {
                this.sourceSections = sections;
                this.populateSections(sections, lang);
            },
            error: () => {
                this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load solution details.' });
            }
        });
    }

    private populateSections(sections: SolutionSectionDto[], lang: 'en' | 'ar'): void {
        this.sections = [...sections]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((section, index) => ({
                title: lang === 'ar' ? section.titleAr : section.titleEn,
                image: section.imageUrl1 ?? '',
                imageAlt: lang === 'ar' ? section.titleAr : section.titleEn,
                paragraphs: [lang === 'ar' ? section.paragraphAr : section.paragraphEn].filter(Boolean),
                reverse: index % 2 !== 0
            }));
    }

    private loadCardTitle(cardId: number, lang: 'en' | 'ar'): void {
        this.solutionsPageService.get().subscribe({
            next: (data) => {
                const card = data?.solutionCards.find((item) => item.id === cardId);
                if (!card) return;
                this.pageTitle = lang === 'ar' ? card.groupNameAr : card.groupNameEn;
            }
        });
    }

    private getCurrentLang(): 'en' | 'ar' {
        if (this.routeLang) return this.routeLang;
        return document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
    }

    private applyCurrentLanguage(): void {
        const lang = this.getCurrentLang();
        this.isRtl = lang === 'ar';
        if (this.cardId) {
            this.loadCardTitle(this.cardId, lang);
        }
        if (this.sourceSections?.length) {
            this.populateSections(this.sourceSections, lang);
        }
    }

    private resolveRouteLang(value: string | null): 'en' | 'ar' | null {
        if (value === 'ar') return 'ar';
        if (value === 'en') return 'en';
        return null;
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
