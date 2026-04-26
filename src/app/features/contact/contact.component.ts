import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ContactPageService, ContactPageDto } from '../../core/services/contact-page.service';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './contact.component.html',
    styleUrl: './contact.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactComponent implements OnInit {
    private readonly contactPageService = inject(ContactPageService);
    private readonly translateService = inject(TranslateService);
    private readonly dialogConfig = inject(DynamicDialogConfig, { optional: true });
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);

    readonly isPreview = !!this.dialogConfig?.data;

    isLoading = false;
    isError = false;

    heroImageUrl: string | null = null;
    introDescription = '';
    phone = '';
    email = '';
    address = '';
    locationUrl = '';

    private dto: ContactPageDto | null = null;

    ngOnInit(): void {
        const previewDto = this.dialogConfig?.data as ContactPageDto | undefined;

        if (previewDto) {
            this.dto = previewDto;
            this.populate(previewDto, this.currentLang);
            this.watchLang();
            return;
        }

        this.isLoading = true;
        this.contactPageService.get()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (dto) => {
                    this.dto = dto;
                    if (dto) this.populate(dto, this.currentLang);
                    this.isLoading = false;
                    this.watchLang();
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.isLoading = false;
                    this.isError = true;
                    this.cdr.markForCheck();
                }
            });
    }

    private get currentLang(): 'en' | 'ar' {
        const urlLang = new URLSearchParams(window.location.search).get('lang');
        if (urlLang === 'en' || urlLang === 'ar') return urlLang;
        return document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
    }

    private populate(dto: ContactPageDto, lang: 'en' | 'ar'): void {
        this.heroImageUrl = dto.heroImageUrl;
        this.phone = dto.phone;
        this.email = dto.email;
        this.address = dto.address;
        this.locationUrl = dto.locationUrl;
        this.introDescription = lang === 'ar' ? dto.introDescriptionAr : dto.introDescriptionEn;
    }

    private watchLang(): void {
        this.translateService.onLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                if (this.dto) {
                    this.populate(this.dto, this.currentLang);
                    this.cdr.markForCheck();
                }
            });
    }
}
