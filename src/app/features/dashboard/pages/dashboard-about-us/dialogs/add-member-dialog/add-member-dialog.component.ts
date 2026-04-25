import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { TranslateModule } from '@ngx-translate/core';
import { AddMemberDialogData, AddMemberDialogResult } from './add-member-dialog.model';

@Component({
    selector: 'app-add-member-dialog',
    standalone: true,
    imports: [FormsModule, TranslateModule],
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

    ngOnInit(): void {
        const lang = this.config.data?.lang ?? 'en';
        this.dir = lang === 'ar' ? 'rtl' : 'ltr';
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
