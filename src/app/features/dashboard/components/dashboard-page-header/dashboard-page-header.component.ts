import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-dashboard-page-header',
    standalone: true,
    templateUrl: './dashboard-page-header.component.html',
    styleUrl: './dashboard-page-header.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardPageHeaderComponent {
    @Input({ required: true }) title = '';
    @Input() active = true;
    @Input() activeLabel = 'Active';

    @Input() showSupportArabic = false;
    @Input() supportArabic = true;

    @Input() showPreview = true;
    @Input() showSave = true;

    @Input() saveLabel = 'Save';
    @Input() savingLabel = 'Saving...';
    @Input() isSaving = false;
    @Input() saveDisabled = false;

    @Output() activeChange = new EventEmitter<boolean>();
    @Output() supportArabicChange = new EventEmitter<boolean>();
    @Output() preview = new EventEmitter<void>();
    @Output() save = new EventEmitter<void>();

    onActiveChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.activeChange.emit(input.checked);
        input.blur();
    }

    onSupportArabicChange(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.supportArabicChange.emit(input.checked);
        input.blur();
    }

    onPreview(): void {
        this.preview.emit();
    }

    onSave(): void {
        this.save.emit();
    }
}
