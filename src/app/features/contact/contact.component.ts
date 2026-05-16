import { Component, Injector, OnDestroy, OnInit, effect, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Subscription } from 'rxjs';
import { ContactPageDto, ContactPageService } from '../../core/services/contact-page.service';

export interface ContactDialogData {
    source?: 'preview' | 'api';
    data?: ContactPageDto;
    previewLang?: 'en' | 'ar';
}

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, OnDestroy {
    private readonly route = inject(ActivatedRoute);
    private readonly contactPageService = inject(ContactPageService);
    private readonly dialogConfig = inject(DynamicDialogConfig<ContactDialogData>, { optional: true });
    private readonly messageService = inject(MessageService, { optional: true });
    private readonly sanitizer = inject(DomSanitizer);
    private readonly injector = inject(Injector);

    private dirObserver: MutationObserver | null = null;
    private queryParamSub: Subscription | null = null;
    private dataSource: ContactPageDto | null = null;
    private routeLang: 'en' | 'ar' | null = null;
    private previewLang: 'en' | 'ar' | null = null;

    isPreviewMode = false;
    isRtl = false;

    get isLoading(): boolean {
        return this.contactPageService.isLoading();
    }

    get hasLoadError(): boolean {
        return !!this.contactPageService.error();
    }

    heroDescription = '';
    contactTitle = '';
    messageTitle = '';
    visitTitle = '';
    firstNamePlaceholder = '';
    lastNamePlaceholder = '';
    phonePlaceholder = '';
    emailPlaceholder = '';
    messagePlaceholder = '';
    submitLabel = '';

    phone = '';
    email = '';
    address = '';
    locationUrl = '';
    safeLocationUrl: SafeResourceUrl | null = null;
    heroImageUrl: string | null = null;
    facebookUrl: string | null = null;
    linkedInUrl: string | null = null;
    twitterUrl: string | null = null;
    instagramUrl: string | null = null;
    tiktokUrl: string | null = null;
    youtubeUrl: string | null = null;
    whatsappUrl: string | null = null;

    get hasSocialLinks(): boolean {
        return !!(this.facebookUrl || this.linkedInUrl || this.twitterUrl || this.instagramUrl || this.tiktokUrl || this.youtubeUrl || this.whatsappUrl);
    }

    ngOnInit(): void {
        this.routeLang = this.resolveRouteLang(this.route.snapshot.queryParamMap.get('lang'));

        const dialogData = this.dialogConfig?.data;
        if (dialogData?.source === 'preview' && dialogData.data) {
            this.isPreviewMode = true;
            const lang: 'en' | 'ar' = dialogData.previewLang ?? 'en';
            this.previewLang = lang;
            this.dataSource = dialogData.data;
            this.populate(dialogData.data, lang);
            return;
        }

        this.observeDirectionChanges();
        this.observeQueryLangChanges();

        // Synchronous read: data already loaded by AppInitService or resolver
        const resolvedData = this.route.snapshot.data['contactPageData'] as ContactPageDto | null | undefined;
        this.dataSource = resolvedData !== undefined ? resolvedData : this.contactPageService.data();
        this.applyCurrentLanguage();

        // Reactive effect for async data arrival (fallback)
        effect(() => {
            const data = this.contactPageService.data();
            if (!data) return;
            this.dataSource = data;
            this.applyCurrentLanguage();
        }, { injector: this.injector });

        // Error display effect
        effect(() => {
            const err = this.contactPageService.error();
            if (!err) return;
            this.messageService?.add({ severity: 'error', summary: 'Error', detail: 'Failed to load contact page data.' });
        }, { injector: this.injector });

        this.contactPageService.load();
    }

    ngOnDestroy(): void {
        this.dirObserver?.disconnect();
        this.dirObserver = null;
        this.queryParamSub?.unsubscribe();
        this.queryParamSub = null;
    }

    private populate(data: ContactPageDto, lang: 'en' | 'ar'): void {
        this.isRtl = lang === 'ar';

        this.heroDescription = lang === 'ar' ? (data.introDescriptionAr ?? '') : (data.introDescriptionEn ?? '');

        this.contactTitle = this.isRtl ? 'تواصل معنا' : 'Contact Us';
        this.messageTitle = this.isRtl ? 'راسلنا' : 'Message Us';
        this.visitTitle = this.isRtl ? 'زورونا' : 'Visit Us';
        this.firstNamePlaceholder = this.isRtl ? 'الاسم الأول' : 'First Name';
        this.lastNamePlaceholder = this.isRtl ? 'اسم العائلة' : 'Last Name';
        this.phonePlaceholder = this.isRtl ? 'رقم الهاتف' : 'Phone Number';
        this.emailPlaceholder = this.isRtl ? 'البريد الإلكتروني' : 'Email';
        this.messagePlaceholder = this.isRtl ? 'اكتب رسالتك' : 'Enter your message';
        this.submitLabel = this.isRtl ? 'إرسال' : 'Submit';

        this.phone = data.phone ?? '';
        this.email = data.email ?? '';
        this.address = data.address ?? '';
        this.locationUrl = data.locationUrl ?? '';
        const normalizedMapUrl = this.normalizeMapUrl(this.locationUrl);
        this.safeLocationUrl = normalizedMapUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(normalizedMapUrl) : null;
        this.heroImageUrl = data.heroImageUrl ?? null;
        this.facebookUrl = data.facebookUrl ?? null;
        this.linkedInUrl = data.linkedInUrl ?? null;
        this.twitterUrl = data.twitterUrl ?? null;
        this.instagramUrl = data.instagramUrl ?? null;
        this.tiktokUrl = data.tiktokUrl ?? null;
        this.youtubeUrl = data.youtubeUrl ?? null;
        this.whatsappUrl = data.whatsappUrl ?? null;
    }

    private normalizeMapUrl(value: string): string {
        const trimmed = value.trim();
        if (!trimmed) {
            return '';
        }

        if (trimmed.startsWith('<')) {
            const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
            if (!srcMatch?.[1]) {
                return '';
            }

            return srcMatch[1].replace(/&amp;/g, '&').trim();
        }

        return trimmed.replace(/&amp;/g, '&');
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

    private applyCurrentLanguage(): void {
        if (!this.dataSource) {
            this.clearViewModel();
            return;
        }

        const lang = this.previewLang ?? this.routeLang ?? this.getLangFromDocumentDir();
        this.populate(this.dataSource, lang);
    }

    private getLangFromDocumentDir(): 'en' | 'ar' {
        return document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
    }

    private clearViewModel(): void {
        const lang = this.previewLang ?? this.routeLang ?? this.getLangFromDocumentDir();
        this.populate(
            {
                isActive: true,
                introDescriptionEn: '',
                introDescriptionAr: '',
                phone: '',
                email: '',
                address: '',
                locationUrl: '',
                heroImageUrl: null,
                facebookUrl: null,
                linkedInUrl: null,
                twitterUrl: null,
                instagramUrl: null,
                tiktokUrl: null,
                youtubeUrl: null,
                whatsappUrl: null
            },
            lang
        );
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

    onContactSubmit(event: Event): void {
        event.preventDefault();
        if (this.isPreviewMode) {
            event.stopPropagation();
        }
    }
}
