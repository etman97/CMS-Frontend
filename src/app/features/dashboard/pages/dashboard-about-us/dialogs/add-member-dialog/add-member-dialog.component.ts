import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AddMemberDialogData, AddMemberDialogResult } from './add-member-dialog.model';
import { MediaService } from '../../../../../../core/services/media.service';

@Component({
    selector: 'app-add-member-dialog',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './add-member-dialog.component.html',
    styleUrl: './add-member-dialog.component.scss'
})
export class AddMemberDialogComponent implements OnInit {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<AddMemberDialogData>);
    private readonly mediaService = inject(MediaService);

    nameEn = '';
    jobTitleEn = '';
    briefEn = '';

    nameAr = '';
    jobTitleAr = '';
    briefAr = '';

    imageUrl: string | null = null;
    imagePreview: string | null = null;
    isUploading = false;

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

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.isUploading = true;
        this.imagePreview = URL.createObjectURL(file);

        this.mediaService.upload(file, 'cms/team').subscribe({
            next: (res) => {
                this.imageUrl = res.url;
                this.imagePreview = res.url;
                this.isUploading = false;
            },
            error: () => {
                this.imagePreview = null;
                this.imageUrl = null;
                this.isUploading = false;
            }
        });
    }

    save(): void {
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
        this.ref.close();
    }
}
