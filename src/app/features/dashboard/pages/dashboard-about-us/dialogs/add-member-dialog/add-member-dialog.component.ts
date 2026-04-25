import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { AddMemberDialogData, AddMemberDialogResult } from './add-member-dialog.model';
import { MediaService } from '../../../../../../core/services/media.service';

@Component({
    selector: 'app-add-member-dialog',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './add-member-dialog.component.html',
    styleUrl: './add-member-dialog.component.scss'
})
export class AddMemberDialogComponent implements OnInit, OnDestroy {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<AddMemberDialogData>);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);
    private readonly cdr = inject(ChangeDetectorRef);

    nameEn = '';
    jobTitleEn = '';
    briefEn = '';

    nameAr = '';
    jobTitleAr = '';
    briefAr = '';

    imageUrl: string | null = null;
    imagePreview: string | null = null;
    isUploading = false;
    private localPreviewUrl: string | null = null;

    dir: 'ltr' | 'rtl' = 'ltr';

    ngOnInit(): void {
        const lang = this.config.data?.lang ?? 'en';
        this.dir = lang === 'ar' ? 'rtl' : 'ltr';

        const member = this.config.data?.member;
        if (member) {
            this.nameEn = member.nameEn;
            this.jobTitleEn = member.jobTitleEn;
            this.briefEn = member.briefEn;
            this.nameAr = member.nameAr;
            this.jobTitleAr = member.jobTitleAr;
            this.briefAr = member.briefAr;
            this.imageUrl = member.imageUrl;
            this.imagePreview = member.imageUrl;
        }
    }

    ngOnDestroy(): void {
        this.revokeLocalPreviewUrl();
    }

    onFileChange(event: Event): void {
        if (this.isUploading) return;

        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const previousImageUrl = this.imageUrl;
        const previousImagePreview = this.imagePreview;

        this.isUploading = true;
        this.revokeLocalPreviewUrl();
        this.localPreviewUrl = URL.createObjectURL(file);
        this.imagePreview = this.localPreviewUrl;
        this.cdr.detectChanges();

        this.mediaService
            .upload(file, 'cms/team')
            .pipe(
                finalize(() => {
                    this.isUploading = false;
                    input.value = '';
                    this.cdr.detectChanges();
                })
            )
            .subscribe({
                next: (res) => {
                    const uploadedUrl = res?.url;
                    if (!uploadedUrl) {
                        this.revokeLocalPreviewUrl();
                        this.imagePreview = previousImagePreview;
                        this.imageUrl = previousImageUrl;
                        this.messageService.add({
                            severity: 'error',
                            summary: this.dir === 'rtl' ? '\u062E\u0637\u0623' : 'Error',
                            detail: this.dir === 'rtl' ? '\u0641\u0634\u0644 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0627\u0644\u0639\u0636\u0648.' : 'Member image upload failed.'
                        });
                        return;
                    }

                    this.imageUrl = uploadedUrl;
                    this.swapPreviewToRemoteWhenReady(uploadedUrl);
                    this.messageService.add({
                        severity: 'success',
                        summary: this.dir === 'rtl' ? '\u062A\u0645' : 'Uploaded',
                        detail: this.dir === 'rtl' ? '\u062A\u0645 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0627\u0644\u0639\u0636\u0648 \u0628\u0646\u062C\u0627\u062D.' : 'Member image uploaded successfully.'
                    });
                },
                error: () => {
                    this.revokeLocalPreviewUrl();
                    this.imagePreview = previousImagePreview;
                    this.imageUrl = previousImageUrl;
                    this.messageService.add({
                        severity: 'error',
                        summary: this.dir === 'rtl' ? '\u062E\u0637\u0623' : 'Error',
                        detail: this.dir === 'rtl' ? '\u0641\u0634\u0644 \u0631\u0641\u0639 \u0635\u0648\u0631\u0629 \u0627\u0644\u0639\u0636\u0648.' : 'Member image upload failed.'
                    });
                }
            });
    }

    private swapPreviewToRemoteWhenReady(url: string): void {
        const img = new Image();
        img.onload = () => {
            this.imagePreview = url;
            this.revokeLocalPreviewUrl();
            this.cdr.detectChanges();
        };
        img.src = url;
    }

    private revokeLocalPreviewUrl(): void {
        if (this.localPreviewUrl) {
            URL.revokeObjectURL(this.localPreviewUrl);
            this.localPreviewUrl = null;
        }
    }

    save(): void {
        if (this.isUploading) return;

        const result: AddMemberDialogResult = {
            nameEn: this.nameEn,
            jobTitleEn: this.jobTitleEn,
            briefEn: this.briefEn,
            nameAr: this.nameAr,
            jobTitleAr: this.jobTitleAr,
            briefAr: this.briefAr,
            imageUrl: this.imageUrl
        };
        this.ref.close(result);
    }

    cancel(): void {
        if (this.isUploading) return;
        this.ref.close();
    }
}
