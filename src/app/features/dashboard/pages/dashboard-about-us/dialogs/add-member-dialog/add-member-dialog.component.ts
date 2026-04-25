import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { AddMemberDialogData, AddMemberDialogResult } from './add-member-dialog.model';

interface AddMemberLabels {
    name: string;
    enterName: string;
    jobTitle: string;
    enterJobTitle: string;
    brief: string;
    enterBrief: string;
    uploadImage: string;
    uploadHint: string;
    cancel: string;
    save: string;
}

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

    name = '';
    jobTitle = '';
    brief = '';
    imageFile: File | null = null;
    imagePreview: string | null = null;
    dir: 'ltr' | 'rtl' = 'ltr';
    lang = 'en';

    readonly labelMap: Record<string, AddMemberLabels> = {
        en: {
            name: 'Name',
            enterName: 'Enter name',
            jobTitle: 'Job Title',
            enterJobTitle: 'Enter job title',
            brief: 'Brief',
            enterBrief: 'Enter a brief description',
            uploadImage: 'Upload Image',
            uploadHint: 'Upload image, PNG and JPEG formats are accepted.',
            cancel: 'Cancel',
            save: 'Save'
        },
        ar: {
            name: 'الاسم',
            enterName: 'أدخل الاسم',
            jobTitle: 'المسمى الوظيفي',
            enterJobTitle: 'أدخل المسمى الوظيفي',
            brief: 'نبذة',
            enterBrief: 'أدخل نبذة مختصرة',
            uploadImage: 'رفع صورة',
            uploadHint: 'ارفع الصور، يتم قبول صيغ PNG و JPEG.',
            cancel: 'إلغاء',
            save: 'حفظ'
        }
    };

    get labels(): AddMemberLabels { return this.labelMap[this.lang]; }

    ngOnInit(): void {
        this.lang = this.config.data?.lang ?? 'en';
        this.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    }

    onFileChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0] ?? null;
        this.imageFile = file;
        this.imagePreview = file ? URL.createObjectURL(file) : null;
    }

    save(): void {
        const result: AddMemberDialogResult = {
            name: this.name,
            jobTitle: this.jobTitle,
            brief: this.brief,
            imageFile: this.imageFile
        };
        this.ref.close(result);
    }

    cancel(): void {
        this.ref.close();
    }
}
