import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonDirection } from '../../../../../../core/services/home-page.service';
import { PageStatusService, PublicPageKey, PublicPageStatusMap } from '../../../../../../core/services/page-status.service';
import { HomeButtonDialogData, HomeButtonDialogResult } from './home-button-dialog.model';

interface InternalPageOption {
    key: PublicPageKey;
    label: string;
    value: string;
}

interface HomeButtonDialogLabels {
    buttonName: string;
    buttonNamePlaceholder: string;
    buttonNameRequired: string;
    buttonNamePattern: string;
    linkType: string;
    internal: string;
    external: string;
    selectPage: string;
    loadingPages: string;
    noActivePages: string;
    internalPageRequired: string;
    externalUrl: string;
    externalUrlRequired: string;
    externalUrlInvalid: string;
    cancel: string;
    save: string;
}

@Component({
    selector: 'app-home-button-dialog',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './home-button-dialog.component.html',
    styleUrl: './home-button-dialog.component.scss'
})
export class HomeButtonDialogComponent implements OnInit {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<HomeButtonDialogData>);
    private readonly pageStatusService = inject(PageStatusService);
    private readonly cdr = inject(ChangeDetectorRef);

    lang: 'en' | 'ar' = 'en';
    dir: 'ltr' | 'rtl' = 'ltr';
    label = '';
    direction: ButtonDirection = 'Internal';
    linkValue = '/';
    isLoadingPages = false;
    internalPages: InternalPageOption[] = [];
    attemptedSave = false;
    labelTouched = false;
    linkValueTouched = false;

    private readonly externalUrlPattern = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?$/i;
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly arabicPattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

    private readonly allInternalPages: InternalPageOption[] = [
        { key: 'about', label: 'About', value: '/about' },
        { key: 'solutions', label: 'Solutions', value: '/solutions' },
        { key: 'services', label: 'Services', value: '/services' },
        { key: 'partners', label: 'Partners', value: '/partners' },
        { key: 'contact', label: 'Contact', value: '/contact' }
    ];

    private readonly arabicPageLabels: Record<PublicPageKey, string> = {
        home: 'الرئيسية',
        about: 'من نحن',
        solutions: 'الحلول',
        services: 'الخدمات',
        partners: 'الشركاء',
        contact: 'اتصل بنا'
    };

    private readonly labelsByLang: Record<'en' | 'ar', Partial<HomeButtonDialogLabels>> = {
        en: {
            buttonName: 'Button name',
            buttonNamePlaceholder: 'Enter button name',
            buttonNameRequired: 'Button name is required.',
            buttonNamePattern: 'Please enter English text only.',
            linkType: 'Link type',
            internal: 'Internal',
            external: 'External',
            selectPage: 'Select page',
            loadingPages: 'Loading active pages...',
            noActivePages: 'No active pages are available. Please activate at least one page first.',
            internalPageRequired: 'Please select a page.',
            externalUrl: 'External URL',
            externalUrlRequired: 'External URL is required.',
            externalUrlInvalid: 'Enter a valid URL, for example https://example.com.',
            cancel: 'Cancel',
            save: 'Save'
        },
        ar: {
            buttonName: 'اسم الزر',
            buttonNamePlaceholder: 'ادخل اسم الزر',
            linkType: 'نوع الرابط',
            internal: 'داخلي',
            external: 'خارجي',
            selectPage: 'اختر الصفحة',
            loadingPages: 'جاري تحميل الصفحات المفعلة...',
            noActivePages: 'لا توجد صفحات مفعلة. يرجى تفعيل صفحة واحدة على الأقل أولا.',
            externalUrl: 'الرابط الخارجي',
            cancel: 'إلغاء',
            save: 'حفظ'
        }
    };

    get isArabic(): boolean {
        return this.lang === 'ar';
    }

    get labels(): HomeButtonDialogLabels {
        const validationLabels: Partial<HomeButtonDialogLabels> = this.isArabic
            ? {
                buttonNameRequired: '\u0627\u0633\u0645 \u0627\u0644\u0632\u0631 \u0645\u0637\u0644\u0648\u0628.',
                buttonNamePattern: '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0646\u0635 \u0639\u0631\u0628\u064a \u0623\u0648 \u0625\u0646\u062c\u0644\u064a\u0632\u064a \u0641\u0642\u0637.',
                internalPageRequired: '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0635\u0641\u062d\u0629.',
                externalUrlRequired: '\u0627\u0644\u0631\u0627\u0628\u0637 \u0627\u0644\u062e\u0627\u0631\u062c\u064a \u0645\u0637\u0644\u0648\u0628.',
                externalUrlInvalid: '\u0623\u062f\u062e\u0644 \u0631\u0627\u0628\u0637\u0627 \u0635\u062d\u064a\u062d\u0627\u060c \u0645\u062b\u0644 https://example.com.'
            }
            : {};

        return {
            ...this.labelsByLang.en,
            ...validationLabels,
            ...this.labelsByLang[this.lang]
        } as HomeButtonDialogLabels;
    }

    get hasActiveInternalPages(): boolean {
        return this.internalPages.length > 0;
    }

    get showButtonNameRequired(): boolean {
        return (this.attemptedSave || this.labelTouched) && !this.label.trim();
    }

    get showButtonNamePattern(): boolean {
        const value = this.label.trim();
        return (this.attemptedSave || this.labelTouched) && !!value && !this.isButtonNamePatternValid();
    }

    get showInternalPageRequired(): boolean {
        return (this.attemptedSave || this.linkValueTouched) && this.direction === 'Internal' && this.hasActiveInternalPages && !this.linkValue.trim();
    }

    get showExternalUrlRequired(): boolean {
        return (this.attemptedSave || this.linkValueTouched) && this.direction === 'External' && !this.linkValue.trim();
    }

    get showExternalUrlInvalid(): boolean {
        const value = this.linkValue.trim();
        return (this.attemptedSave || this.linkValueTouched) && this.direction === 'External' && !!value && !this.externalUrlPattern.test(value);
    }

    get canSave(): boolean {
        if (!this.label.trim() || !this.isButtonNamePatternValid()) {
            return false;
        }

        if (this.direction === 'Internal') {
            return !this.isLoadingPages && this.hasActiveInternalPages && !!this.linkValue.trim();
        }

        const externalUrl = this.linkValue.trim();
        return !!externalUrl && this.externalUrlPattern.test(externalUrl);
    }

    ngOnInit(): void {
        const data = this.config.data;
        this.lang = data?.lang ?? 'en';
        this.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
        this.label = data?.label ?? '';
        this.direction = data?.direction ?? 'Internal';
        this.linkValue = data?.linkValue ?? '';
        this.loadInternalPages();
    }

    onDirectionChange(direction: ButtonDirection): void {
        this.direction = direction;
        this.linkValue = '';
        this.linkValueTouched = false;
    }

    markLabelTouched(): void {
        this.labelTouched = true;
    }

    markLinkValueTouched(): void {
        this.linkValueTouched = true;
    }

    private isButtonNamePatternValid(): boolean {
        const value = this.label.trim();
        if (!value) {
            return false;
        }

        return this.isArabic
            ? this.arabicPattern.test(value)
            : this.englishPattern.test(value);
    }

    save(): void {
        this.attemptedSave = true;

        if (!this.canSave) {
            this.cdr.detectChanges();
            return;
        }

        const result: HomeButtonDialogResult = {
            label: this.label.trim(),
            direction: this.direction,
            linkValue: this.linkValue.trim()
        };

        this.ref.close(result);
    }

    cancel(): void {
        this.ref.close();
    }

    private loadInternalPages(): void {
        this.isLoadingPages = true;
        this.cdr.detectChanges();

        this.pageStatusService.getStatuses(true).subscribe({
            next: (statuses) => {
                this.internalPages = this.buildActiveInternalPages(statuses);
                this.linkValue = this.resolveInternalLinkValue(this.linkValue);
                this.isLoadingPages = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.internalPages = [];
                this.linkValue = '';
                this.isLoadingPages = false;
                this.cdr.detectChanges();
            }
        });
    }

    private buildActiveInternalPages(statuses: PublicPageStatusMap): InternalPageOption[] {
        return this.allInternalPages
            .filter((page) => statuses[page.key])
            .map((page) => ({
                ...page,
                label: this.isArabic ? this.arabicPageLabels[page.key] : page.label
            }));
    }

    private resolveInternalLinkValue(currentValue: string): string {
        if (this.direction !== 'Internal') {
            return currentValue;
        }

        if (!this.hasActiveInternalPages) {
            return '';
        }

        const isCurrentPageActive = this.internalPages.some((page) => page.value === currentValue);
        return isCurrentPageActive ? currentValue : '';
    }
}
