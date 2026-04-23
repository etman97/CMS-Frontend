import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslateService } from '@ngx-translate/core';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { EditSectionDialogComponent } from './dialogs/edit-section-dialog/edit-section-dialog.component';
import { AboutSection, EditSectionDialogData, SectionLang } from './dialogs/edit-section-dialog/edit-section-dialog.model';
import { AddMemberDialogComponent } from './dialogs/add-member-dialog/add-member-dialog.component';
import { AddMemberDialogData, AddMemberDialogResult } from './dialogs/add-member-dialog/add-member-dialog.model';

interface TeamMember {
    name: string;
    role: string;
    image: string;
}

@Component({
    selector: 'app-dashboard-about-us',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule],
    providers: [DialogService],
    templateUrl: './dashboard-about-us.component.html',
    styleUrl: './dashboard-about-us.component.scss'
})
export class DashboardAboutUsComponent {
    private readonly dialogService = inject(DialogService);
    private readonly translate = inject(TranslateService);

    activeTab = 'en';
    isActive = true;

    sectionContent: Record<SectionLang, Record<AboutSection, string>> = {
        en: { mission: '', vision: '', leadership: '' },
        ar: { mission: '', vision: '', leadership: '' }
    };

    teamMembers: TeamMember[] = [
        {
            name: 'Taha Mohamed',
            role: 'CEO',
            image: 'https://www.figma.com/api/mcp/asset/534bcc2c-0089-4358-8cec-d3b8394081fa'
        }
    ];

    onActiveToggle(input: HTMLInputElement): void {
        input.blur();
    }

    protected openAddMemberDialog(): void {
        const lang = this.activeTab as SectionLang;
        const isRtl = lang === 'ar';
        const header = lang === 'ar' ? 'إضافة عضو فريق' : 'Add Team Member';

        const dialogRef: DynamicDialogRef | null = this.dialogService.open(AddMemberDialogComponent, {
            header,
            data: { lang } as AddMemberDialogData,
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });

        dialogRef?.onClose.subscribe((result?: AddMemberDialogResult) => {
            if (result) {
                this.teamMembers.push({
                    name: result.name,
                    role: result.jobTitle,
                    image: result.imageFile ? URL.createObjectURL(result.imageFile) : ''
                });
            }
        });
    }

    protected openEditSectionDialog(section: AboutSection): void {
        const lang = this.activeTab as SectionLang;
        const isRtl = lang === 'ar';

        const headerMap: Record<SectionLang, Record<AboutSection, string>> = {
            en: { mission: 'Our Mission', vision: 'Our Vision', leadership: 'Leadership' },
            ar: { mission: 'مهمتنا', vision: 'رؤيتنا', leadership: 'القيادة' }
        };

        const dialogRef: DynamicDialogRef | null = this.dialogService.open(EditSectionDialogComponent, {
            header: headerMap[lang][section],
            data: { section, lang, content: this.sectionContent[lang][section] } as EditSectionDialogData,
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });

        dialogRef?.onClose.subscribe((result?: { content: string }) => {
            if (result) {
                this.sectionContent[lang][section] = result.content;
            }
        });
    }
}
