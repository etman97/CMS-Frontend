import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AddSectionDialogData, AddSectionDialogResult } from './add-section-dialog.model';

interface AddSectionLabels {
    groupNameEn: string;
    enterGroupNameEn: string;
    groupNameAr: string;
    enterGroupNameAr: string;
    briefEn: string;
    enterBriefEn: string;
    briefAr: string;
    enterBriefAr: string;
    uploadImage: string;
    uploadHint: string;
    cancel: string;
    save: string;
}

@Component({
    selector: 'app-add-section-dialog',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './add-section-dialog.component.html',
    styleUrl: './add-section-dialog.component.scss'
})
export class AddSectionDialogComponent implements OnInit {
    private readonly ref = inject(DynamicDialogRef);
    private readonly config = inject(DynamicDialogConfig<AddSectionDialogData>);

    groupNameEn = '';
    groupNameAr = '';
    briefEn = '';
    briefAr = '';
    imageFile: File | null = null;
    imagePreview: string | null = null;
    dir: 'ltr' | 'rtl' = 'ltr';
    lang: 'en' | 'ar' = 'en';

    readonly labelMap: Record<'en' | 'ar', AddSectionLabels> = {
        en: {
            groupNameEn: 'Group Name EN',
            enterGroupNameEn: 'Enter English group name',
            groupNameAr: 'Group Name AR',
            enterGroupNameAr: 'Enter Arabic group name',
            briefEn: 'Brief EN',
            enterBriefEn: 'Enter English brief',
            briefAr: 'Brief AR',
            enterBriefAr: 'Enter Arabic brief',
            uploadImage: 'Upload Image',
            uploadHint: 'Upload image, PNG and JPEG formats are accepted.',
            cancel: 'Cancel',
            save: 'Save'
        },
        ar: {
            groupNameEn: 'اسم المجموعة (إنجليزي)',
            enterGroupNameEn: 'أدخل اسم المجموعة بالإنجليزية',
            groupNameAr: 'اسم المجموعة (عربي)',
            enterGroupNameAr: 'أدخل اسم المجموعة بالعربية',
            briefEn: 'نبذة (إنجليزي)',
            enterBriefEn: 'أدخل النبذة بالإنجليزية',
            briefAr: 'نبذة (عربي)',
            enterBriefAr: 'أدخل النبذة بالعربية',
            uploadImage: 'رفع صورة',
            uploadHint: 'ارفع صورة، صيغ PNG و JPEG مدعومة.',
            cancel: 'إلغاء',
            save: 'حفظ'
        }
    };

    get labels(): AddSectionLabels {
        return this.labelMap[this.lang];
    }

    ngOnInit(): void {
        this.lang = this.config.data?.lang ?? 'en';
        this.dir = this.lang === 'ar' ? 'rtl' : 'ltr';

        const initial = this.config.data?.initial;
        if (initial) {
            this.groupNameEn = initial.groupNameEn;
            this.groupNameAr = initial.groupNameAr;
            this.briefEn = initial.briefEn;
            this.briefAr = initial.briefAr;
            this.imagePreview = initial.imageUrl;
        }
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.imageFile = file;
        this.imagePreview = file ? URL.createObjectURL(file) : null;
    }

    save(): void {
        const result: AddSectionDialogResult = {
            groupNameEn: this.groupNameEn,
            groupNameAr: this.groupNameAr,
            briefEn: this.briefEn,
            briefAr: this.briefAr,
            imageFile: this.imageFile
        };
        this.ref.close(result);
    }

    cancel(): void {
        this.ref.close();
    }
}
