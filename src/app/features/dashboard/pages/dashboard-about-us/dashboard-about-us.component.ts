import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DialogService, DynamicDialogModule, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';
import { PRIME_NG_CONFIGS } from '../../../../shared/prime-ng-configs';
import { EditSectionDialogComponent } from './dialogs/edit-section-dialog/edit-section-dialog.component';
import { AboutSection, EditSectionDialogData, EditSectionDialogResult, SectionLang } from './dialogs/edit-section-dialog/edit-section-dialog.model';
import { AddMemberDialogComponent } from './dialogs/add-member-dialog/add-member-dialog.component';
import { AddMemberDialogData, AddMemberDialogResult } from './dialogs/add-member-dialog/add-member-dialog.model';
import { AboutPageService, AboutPageDto, TeamMemberDto } from '../../../../core/services/about-page.service';
import { MediaService } from '../../../../core/services/media.service';
import { AboutComponent } from '../../../about/about.component';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';

@Component({
    selector: 'app-dashboard-about-us',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule, DashboardPageHeaderComponent],
    providers: [DialogService],
    templateUrl: './dashboard-about-us.component.html',
    styleUrl: './dashboard-about-us.component.scss'
})
export class DashboardAboutUsComponent implements OnInit {
    private readonly dialogService = inject(DialogService);
    private readonly cdr = inject(ChangeDetectorRef);
    private readonly aboutPageService = inject(AboutPageService);
    private readonly mediaService = inject(MediaService);
    private readonly messageService = inject(MessageService);

    activeTab = 'en';
    isLoading = true;
    isActive = true;
    isSaving = false;
    isUploadingHero = false;
    uploadingSectionImage: AboutSection | null = null;

    // EN fields
    aboutUsContentEn = '';
    subContentEn = '';
    whyUsContentEn = '';
    numbersSubtitleEn = '';
    missionContentEn = '';
    visionContentEn = '';
    leadershipContentEn = '';

    // AR fields
    aboutUsContentAr = '';
    whyUsContentAr = '';
    missionContentAr = '';
    visionContentAr = '';
    leadershipContentAr = '';

    // Numbers
    numberOfEmployees = 0;
    numberOfProducts = 0;
    numberOfClients = 0;
    numberOfPartners = 0;

    // Images
    heroImageUrl: string | null = null;
    sectionImages: Record<AboutSection, string | null> = {
        mission: null,
        vision: null,
        leadership: null
    };

    teamMembers: TeamMemberDto[] = [];
    openTeamMenuIndex: number | null = null;

    ngOnInit(): void {
        this.aboutPageService.get().subscribe({
            next: (data) => {
                if (data) {
                    this.populate(data);
                }
                this.isLoading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.markForCheck();
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load page data.' });
            }
        });
    }

    private populate(data: AboutPageDto): void {
        this.isActive = data.isActive;
        this.aboutUsContentEn = data.aboutUsContentEn;
        this.subContentEn = data.subContentEn;
        this.whyUsContentEn = data.whyUsContentEn;
        this.numbersSubtitleEn = data.numbersSubtitleEn;
        this.missionContentEn = data.missionContentEn;
        this.visionContentEn = data.visionContentEn;
        this.leadershipContentEn = data.leadershipContentEn;
        this.aboutUsContentAr = data.aboutUsContentAr;
        this.whyUsContentAr = data.whyUsContentAr;
        this.missionContentAr = data.missionContentAr;
        this.visionContentAr = data.visionContentAr;
        this.leadershipContentAr = data.leadershipContentAr;
        this.numberOfEmployees = data.numberOfEmployees;
        this.numberOfProducts = data.numberOfProducts;
        this.numberOfClients = data.numberOfClients;
        this.numberOfPartners = data.numberOfPartners;
        this.heroImageUrl = data.heroImageUrl;
        this.sectionImages.mission = data.missionImageUrl;
        this.sectionImages.vision = data.visionImageUrl;
        this.sectionImages.leadership = data.leadershipImageUrl;
        this.teamMembers = [...data.teamMembers];
    }

    private buildDto(): AboutPageDto {
        return {
            isActive: this.isActive,
            aboutUsContentEn: this.aboutUsContentEn,
            subContentEn: this.subContentEn,
            whyUsContentEn: this.whyUsContentEn,
            numbersSubtitleEn: this.numbersSubtitleEn,
            missionContentEn: this.missionContentEn,
            visionContentEn: this.visionContentEn,
            leadershipContentEn: this.leadershipContentEn,
            aboutUsContentAr: this.aboutUsContentAr,
            whyUsContentAr: this.whyUsContentAr,
            missionContentAr: this.missionContentAr,
            visionContentAr: this.visionContentAr,
            leadershipContentAr: this.leadershipContentAr,
            numberOfEmployees: this.numberOfEmployees,
            numberOfProducts: this.numberOfProducts,
            numberOfClients: this.numberOfClients,
            numberOfPartners: this.numberOfPartners,
            heroImageUrl: this.heroImageUrl,
            missionImageUrl: this.sectionImages.mission,
            visionImageUrl: this.sectionImages.vision,
            leadershipImageUrl: this.sectionImages.leadership,
            teamMembers: this.teamMembers.map((m, i) => ({ ...m, displayOrder: i }))
        };
    }

    openPreview(): void {
        this.dialogService.open(AboutComponent, {
            data: this.buildDto(),
            header: 'Preview — About Us',
            width: '100vw',
            height: '100vh',
            modal: true,
            closable: true,
            styleClass: 'preview-dialog',
            contentStyle: { padding: '0', overflow: 'auto' }
        });
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.isUploadingHero = true;
        this.heroImageUrl = URL.createObjectURL(file);

        this.mediaService.upload(file, 'cms/about').subscribe({
            next: (res) => {
                this.heroImageUrl = res.url;
                this.isUploadingHero = false;
            },
            error: () => {
                this.heroImageUrl = null;
                this.isUploadingHero = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Hero image upload failed.' });
            }
        });
    }

    onSectionImageSelected(event: Event, section: AboutSection): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        this.uploadingSectionImage = section;
        this.sectionImages[section] = URL.createObjectURL(file);

        this.mediaService.upload(file, 'cms/about').subscribe({
            next: (res) => {
                this.sectionImages[section] = res.url;
                this.uploadingSectionImage = null;
            },
            error: () => {
                this.sectionImages[section] = null;
                this.uploadingSectionImage = null;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: `${section} image upload failed.` });
            }
        });
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
                const member: TeamMemberDto = {
                    id: 0,
                    nameEn: result.nameEn,
                    jobTitleEn: result.jobTitleEn,
                    briefEn: result.briefEn,
                    nameAr: result.nameAr,
                    jobTitleAr: result.jobTitleAr,
                    briefAr: result.briefAr,
                    imageUrl: result.imageUrl,
                    displayOrder: this.teamMembers.length
                };
                this.teamMembers.push(member);
                this.cdr.detectChanges();
            }
        });
    }

    protected openEditMemberDialog(index: number): void {
        const lang = this.activeTab as SectionLang;
        const isRtl = lang === 'ar';
        const member = this.teamMembers[index];
        if (!member) return;

        const header = lang === 'ar' ? 'تعديل عضو فريق' : 'Edit Team Member';
        const dialogRef: DynamicDialogRef | null = this.dialogService.open(AddMemberDialogComponent, {
            header,
            data: {
                lang,
                member: {
                    nameEn: member.nameEn,
                    jobTitleEn: member.jobTitleEn,
                    briefEn: member.briefEn,
                    nameAr: member.nameAr,
                    jobTitleAr: member.jobTitleAr,
                    briefAr: member.briefAr,
                    imageUrl: member.imageUrl
                }
            } as AddMemberDialogData,
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });

        dialogRef?.onClose.subscribe((result?: AddMemberDialogResult) => {
            if (!result) return;

            this.teamMembers[index] = {
                ...member,
                nameEn: result.nameEn,
                jobTitleEn: result.jobTitleEn,
                briefEn: result.briefEn,
                nameAr: result.nameAr,
                jobTitleAr: result.jobTitleAr,
                briefAr: result.briefAr,
                imageUrl: result.imageUrl
            };
            this.closeTeamMenu();
            this.cdr.detectChanges();
        });
    }

    protected openEditSectionDialog(section: AboutSection): void {
        const lang = this.activeTab as SectionLang;
        const isRtl = lang === 'ar';

        const contentMap: Record<SectionLang, Record<AboutSection, string>> = {
            en: {
                mission: this.missionContentEn,
                vision: this.visionContentEn,
                leadership: this.leadershipContentEn
            },
            ar: {
                mission: this.missionContentAr,
                vision: this.visionContentAr,
                leadership: this.leadershipContentAr
            }
        };

        const headerMap: Record<SectionLang, Record<AboutSection, string>> = {
            en: { mission: 'Our Mission', vision: 'Our Vision', leadership: 'Leadership' },
            ar: { mission: 'مهمتنا', vision: 'رؤيتنا', leadership: 'القيادة' }
        };

        const dialogRef: DynamicDialogRef | null = this.dialogService.open(EditSectionDialogComponent, {
            header: headerMap[lang][section],
            data: {
                section,
                lang,
                content: contentMap[lang][section],
                imageUrl: this.sectionImages[section]
            } as EditSectionDialogData,
            style: { direction: isRtl ? 'rtl' : 'ltr' },
            ...PRIME_NG_CONFIGS.dynamicDialog
        });

        dialogRef?.onClose.subscribe((result?: EditSectionDialogResult) => {
            if (result) {
                if (lang === 'en') {
                    if (section === 'mission') this.missionContentEn = result.content;
                    else if (section === 'vision') this.visionContentEn = result.content;
                    else this.leadershipContentEn = result.content;
                } else {
                    if (section === 'mission') this.missionContentAr = result.content;
                    else if (section === 'vision') this.visionContentAr = result.content;
                    else this.leadershipContentAr = result.content;
                }
                this.sectionImages[section] = result.imageUrl;
            }
        });
    }

    removeMember(index: number): void {
        this.teamMembers.splice(index, 1);
        this.closeTeamMenu();
    }

    toggleTeamMenu(index: number, event: MouseEvent): void {
        event.stopPropagation();
        this.openTeamMenuIndex = this.openTeamMenuIndex === index ? null : index;
    }

    closeTeamMenu(): void {
        this.openTeamMenuIndex = null;
    }

    save(): void {
        if (this.isSaving || this.isUploadingHero || this.uploadingSectionImage) return;

        this.isSaving = true;
        this.aboutPageService.save(this.buildDto()).subscribe({
            next: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'About Us page saved successfully.' });
            },
            error: () => {
                this.isSaving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save About Us page.' });
            }
        });
    }
}
