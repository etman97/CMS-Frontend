import { CommonModule } from '@angular/common';
import { Component, Injector, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ServicesPageDto, ServicesPageService } from '../../core/services/services-page.service';

export interface ServicesDialogData {
    source?: 'preview' | 'api';
    data?: ServicesPageDto;
    previewLang?: 'en' | 'ar';
}

@Component({
    selector: 'app-services',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './services.component.html',
    styleUrl: './services.component.scss'
})
export class ServicesComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly servicesPageService = inject(ServicesPageService);
    private readonly dialogConfig = inject(DynamicDialogConfig<ServicesDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });
    private readonly injector = inject(Injector);

    private dirObserver: MutationObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private dataSource: ServicesPageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;

    heroText = '';
    heroImageUrl: string | null = null;
    serviceItems: { id: number; title: string; brief: string; imageUrl: string | null }[] = [];

    isRtl = false;
    isPreviewMode = false;

    get isLoading(): boolean {
        return this.servicesPageService.isLoading();
    }

    get hasLoadError(): boolean {
        return !!this.servicesPageService.error();
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
        const resolvedData = this.route.snapshot.data['servicesPageData'] as ServicesPageDto | null | undefined;
        this.dataSource = resolvedData !== undefined ? resolvedData : this.servicesPageService.data();
        this.applyCurrentLanguage();

        // Reactive effect for async data arrival (fallback)
        effect(() => {
            const data = this.servicesPageService.data();
            if (!data) return;
            this.dataSource = data;
            this.applyCurrentLanguage();
        }, { injector: this.injector });

        // Error display effect
        effect(() => {
            const err = this.servicesPageService.error();
            if (!err) return;
            this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load services page data.' });
        }, { injector: this.injector });

        this.servicesPageService.load();
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
        this.queryParamSub?.unsubscribe();
        this.queryParamSub = null;
    }

    private populate(data: ServicesPageDto, lang: 'en' | 'ar'): void {
        this.isRtl = lang === 'ar';
        this.heroImageUrl = data.heroImageUrl;
        this.heroText = lang === 'ar' ? data.heroTextAr : data.heroTextEn;
        this.serviceItems = [...data.serviceItems]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(item => ({
                id: item.id,
                title: lang === 'ar' ? item.groupNameAr : item.groupNameEn,
                brief: this.formatBrief(lang === 'ar' ? item.briefAr : item.briefEn),
                imageUrl: item.imageUrl
            }));
    }

    private formatBrief(value: string): string {
        return value.replace(/\.\s+/g, '.\n\n');
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
