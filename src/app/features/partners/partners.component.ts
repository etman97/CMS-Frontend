import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { PartnersPageService, PartnersPageDto, PartnerDto } from '../../core/services/partners-page.service';

@Component({
    selector: 'app-partners',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './partners.component.html',
    styleUrl: './partners.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartnersComponent implements OnInit {
    private readonly partnersPageService = inject(PartnersPageService);
    private readonly translateService = inject(TranslateService);
    private readonly dialogConfig = inject(DynamicDialogConfig, { optional: true });
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly destroyRef = inject(DestroyRef);

    readonly isPreview = !!this.dialogConfig?.data;

    isLoading = false;
    isError = false;

    heroImageUrl: string | null = null;
    introTitle = '';
    introDescription = '';
    partners: PartnerDto[] = [];

    private dto: PartnersPageDto | null = null;

    ngOnInit(): void {
        const previewDto = this.dialogConfig?.data as PartnersPageDto | undefined;

        if (previewDto) {
            this.dto = previewDto;
            this.populate(previewDto, this.currentLang);
            this.watchLang();
            return;
        }

        this.isLoading = true;
        this.partnersPageService.get()
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

    private populate(dto: PartnersPageDto, lang: 'en' | 'ar'): void {
        this.heroImageUrl = dto.heroImageUrl;
        this.partners = dto.partners;
        if (lang === 'ar') {
            this.introTitle = dto.introTitleAr;
            this.introDescription = dto.introDescriptionAr;
        } else {
            this.introTitle = dto.introTitleEn;
            this.introDescription = dto.introDescriptionEn;
        }
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
