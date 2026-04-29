import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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

    private dirObserver: MutationObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private dataSource: ServicesPageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;

    heroText = '';
    heroImageUrl: string | null = null;
    serviceItems: { id: number; title: string; brief: string; imageUrl: string | null }[] = [];

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

        const resolvedData = this.route.snapshot.data['servicesPageData'] as ServicesPageDto | null | undefined;
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
        this.servicesPageService.get().subscribe({
            next: (data) => {
                this.dataSource = data;
                this.applyCurrentLanguage();
                this.hasLoadError = false;
                this.isLoading = false;
            },
            error: () => {
                this.hasLoadError = true;
                this.isLoading = false;
                this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load services page data.' });
            }
        });
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
                brief: lang === 'ar' ? item.briefAr : item.briefEn,
                imageUrl: item.imageUrl
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
