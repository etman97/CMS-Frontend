import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { PartnersPageDto, PartnersPageService } from '../../core/services/partners-page.service';

export interface PartnersDialogData {
    source?: 'preview' | 'api';
    data?: PartnersPageDto;
    previewLang?: 'en' | 'ar';
}

@Component({
    selector: 'app-partners',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './partners.component.html',
    styleUrl: './partners.component.scss'
})
export class PartnersComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly partnersPageService = inject(PartnersPageService);
    private readonly dialogConfig = inject(DynamicDialogConfig<PartnersDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });

    private dirObserver: MutationObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private dataSource: PartnersPageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;

    subtitle = '';
    heroImageUrl: string | null = null;
    partnerLogos: { id: number; logoImageUrl: string | null }[] = [];

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

        const resolvedData = this.route.snapshot.data['partnersPageData'] as PartnersPageDto | null | undefined;
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
        this.partnersPageService.get().subscribe({
            next: (data) => {
                this.dataSource = data;
                this.applyCurrentLanguage();
                this.hasLoadError = false;
                this.isLoading = false;
            },
            error: () => {
                this.hasLoadError = true;
                this.isLoading = false;
                this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load partners page data.' });
            }
        });
    }

    private populate(data: PartnersPageDto, lang: 'en' | 'ar'): void {
        this.isRtl = lang === 'ar';
        this.heroImageUrl = data.heroImageUrl;
        this.subtitle = lang === 'ar' ? data.subtitleAr : data.subtitleEn;
        this.partnerLogos = [...data.partnerLogos].sort((a, b) => a.displayOrder - b.displayOrder);
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
