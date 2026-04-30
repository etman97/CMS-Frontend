import { Component, ChangeDetectorRef, inject, OnDestroy, OnInit } from '@angular/core';
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
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';
import { AboutComponent, AboutDialogData } from '../../../about/about.component';

type AboutTextFieldKey =
    | 'aboutUsContentEn'
    | 'subContentEn'
    | 'whyUsContentEn'
    | 'numbersSubtitleEn'
    | 'missionContentEn'
    | 'visionContentEn'
    | 'leadershipContentEn'
    | 'aboutUsContentAr'
    | 'subContentAr'
    | 'whyUsContentAr'
    | 'numbersSubtitleAr'
    | 'missionContentAr'
    | 'visionContentAr'
    | 'leadershipContentAr';

type AboutNumberFieldKey = 'numberOfEmployees' | 'numberOfProducts' | 'numberOfClients' | 'numberOfPartners';
type AboutFieldKey = AboutTextFieldKey | AboutNumberFieldKey;

@Component({
    selector: 'app-dashboard-about-us',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DynamicDialogModule, DashboardPageHeaderComponent],
    providers: [DialogService],
    templateUrl: './dashboard-about-us.component.html',
    styleUrl: './dashboard-about-us.component.scss'
})
export class DashboardAboutUsComponent implements OnInit, OnDestroy {
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
    attemptedSave = false;
    touchedFields: Partial<Record<AboutFieldKey, boolean>> = {};

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
    subContentAr = '';
    whyUsContentAr = '';
    numbersSubtitleAr = '';
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
    private persistedHeroImageUrl: string | null = null;
    private persistedSectionImages: Record<AboutSection, string | null> = {
        mission: null,
        vision: null,
        leadership: null
    };
    private localHeroPreviewUrl: string | null = null;
    private localSectionPreviewUrls: Record<AboutSection, string | null> = {
        mission: null,
        vision: null,
        leadership: null
    };

    teamMembers: TeamMemberDto[] = [];
    openTeamMenuIndex: number | null = null;
    private readonly englishPattern = /^[A-Za-z0-9\s.,!?'"():;&%+\-_/–—‘’“”]+$/;
    private readonly arabicPattern = /^[A-Za-z\u0600-\u06FF\u0660-\u06690-9\s.,!?'"():;&%+\-_/،؛؟٪ـ–—‘’“”]+$/;

    get canSave(): boolean {
        return this.areRequiredFieldsValid() && this.areRequiredImagesValid();
    }

    ngOnInit(): void {
        this.aboutPageService.get({ forceRefresh: true }).subscribe({
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

    ngOnDestroy(): void {
        this.revokeLocalHeroPreviewUrl();
        this.revokeAllLocalSectionPreviewUrls();
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
        this.subContentAr = data.subContentAr;
        this.whyUsContentAr = data.whyUsContentAr;
        this.numbersSubtitleAr = data.numbersSubtitleAr;
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
        this.persistedHeroImageUrl = data.heroImageUrl;
        this.persistedSectionImages.mission = data.missionImageUrl;
        this.persistedSectionImages.vision = data.visionImageUrl;
        this.persistedSectionImages.leadership = data.leadershipImageUrl;
        this.teamMembers = [...data.teamMembers];
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const previousImageUrl = this.heroImageUrl;
        const previousPersistedImageUrl = this.persistedHeroImageUrl;

        this.isUploadingHero = true;
        this.revokeLocalHeroPreviewUrl();
        this.localHeroPreviewUrl = URL.createObjectURL(file);
        this.heroImageUrl = this.localHeroPreviewUrl;
        this.cdr.detectChanges();

        this.mediaService.upload(file, 'cms/about').subscribe({
            next: (res) => {
                this.persistedHeroImageUrl = res.url;
                this.isUploadingHero = false;
                input.value = '';
                this.swapHeroToRemoteImageWhenReady(res.url);
                this.cdr.detectChanges();
                this.messageService.add({
                    severity: 'success',
                    summary: this.activeTab === 'ar' ? 'تم' : 'Uploaded',
                    detail: this.activeTab === 'ar' ? 'تم رفع صورة الغلاف بنجاح.' : 'Hero image uploaded successfully.'
                });
            },
            error: () => {
                this.revokeLocalHeroPreviewUrl();
                this.heroImageUrl = previousImageUrl;
                this.persistedHeroImageUrl = previousPersistedImageUrl;
                this.isUploadingHero = false;
                input.value = '';
                this.cdr.detectChanges();
                this.messageService.add({
                    severity: 'error',
                    summary: this.activeTab === 'ar' ? 'خطأ' : 'Error',
                    detail: this.activeTab === 'ar' ? 'فشل رفع صورة الغلاف.' : 'Hero image upload failed.'
                });
            }
        });
    }

    onSectionImageSelected(event: Event, section: AboutSection): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const previousImageUrl = this.sectionImages[section];
        const previousPersistedImageUrl = this.persistedSectionImages[section];

        this.uploadingSectionImage = section;
        this.revokeLocalSectionPreviewUrl(section);
        this.localSectionPreviewUrls[section] = URL.createObjectURL(file);
        this.sectionImages[section] = this.localSectionPreviewUrls[section];
        this.cdr.detectChanges();

        this.mediaService.upload(file, 'cms/about').subscribe({
            next: (res) => {
                this.persistedSectionImages[section] = res.url;
                this.uploadingSectionImage = null;
                input.value = '';
                this.swapSectionToRemoteImageWhenReady(section, res.url);
                this.cdr.detectChanges();
                this.messageService.add({
                    severity: 'success',
                    summary: this.activeTab === 'ar' ? 'تم' : 'Uploaded',
                    detail: this.activeTab === 'ar'
                        ? `تم رفع صورة ${this.getSectionLabel(section, 'ar')} بنجاح.`
                        : `${this.getSectionLabel(section, 'en')} image uploaded successfully.`
                });
            },
            error: () => {
                this.revokeLocalSectionPreviewUrl(section);
                this.sectionImages[section] = previousImageUrl;
                this.persistedSectionImages[section] = previousPersistedImageUrl;
                this.uploadingSectionImage = null;
                input.value = '';
                this.cdr.detectChanges();
                this.messageService.add({
                    severity: 'error',
                    summary: this.activeTab === 'ar' ? 'خطأ' : 'Error',
                    detail: this.activeTab === 'ar'
                        ? `فشل رفع صورة ${this.getSectionLabel(section, 'ar')}.`
                        : `${this.getSectionLabel(section, 'en')} image upload failed.`
                });
            }
        });
    }

    private getSectionLabel(section: AboutSection, lang: SectionLang): string {
        const labels: Record<SectionLang, Record<AboutSection, string>> = {
            en: {
                mission: 'Mission',
                vision: 'Vision',
                leadership: 'Leadership'
            },
            ar: {
                mission: 'المهمة',
                vision: 'الرؤية',
                leadership: 'القيادة'
            }
        };

        return labels[lang][section];
    }

    private swapHeroToRemoteImageWhenReady(url: string): void {
        const img = new Image();
        img.onload = () => {
            this.heroImageUrl = url;
            this.revokeLocalHeroPreviewUrl();
            this.cdr.detectChanges();
        };
        img.src = url;
    }

    private swapSectionToRemoteImageWhenReady(section: AboutSection, url: string): void {
        const img = new Image();
        img.onload = () => {
            this.sectionImages[section] = url;
            this.revokeLocalSectionPreviewUrl(section);
            this.cdr.detectChanges();
        };
        img.src = url;
    }

    private revokeLocalHeroPreviewUrl(): void {
        if (this.localHeroPreviewUrl) {
            URL.revokeObjectURL(this.localHeroPreviewUrl);
            this.localHeroPreviewUrl = null;
        }
    }

    private revokeLocalSectionPreviewUrl(section: AboutSection): void {
        const previewUrl = this.localSectionPreviewUrls[section];
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            this.localSectionPreviewUrls[section] = null;
        }
    }

    private revokeAllLocalSectionPreviewUrls(): void {
        this.revokeLocalSectionPreviewUrl('mission');
        this.revokeLocalSectionPreviewUrl('vision');
        this.revokeLocalSectionPreviewUrl('leadership');
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

        const header = lang === 'ar' ? 'طھط¹ط¯ظٹظ„ ط¹ط¶ظˆ ظپط±ظٹظ‚' : 'Edit Team Member';
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
                this.persistedSectionImages[section] = result.imageUrl;
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

    markFieldTouched(field: AboutFieldKey): void {
        this.touchedFields[field] = true;
    }

    showRequiredError(field: AboutFieldKey): boolean {
        return (this.attemptedSave || !!this.touchedFields[field]) && !this.hasRequiredFieldValue(field);
    }

    showPatternError(field: AboutTextFieldKey): boolean {
        const value = this.getTextFieldValue(field).trim();
        return (this.attemptedSave || !!this.touchedFields[field]) && !!value && !this.isTextFieldPatternValid(field);
    }

    requiredMessage(lang: SectionLang): string {
        return lang === 'ar' ? '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.' : 'This field is required.';
    }

    patternMessage(lang: SectionLang): string {
        return lang === 'ar' ? '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0646\u0635 \u0639\u0631\u0628\u064a \u0623\u0648 \u0625\u0646\u062c\u0644\u064a\u0632\u064a \u0641\u0642\u0637.' : 'Please enter English text only.';
    }

    private areRequiredFieldsValid(): boolean {
        const textFields: AboutTextFieldKey[] = [
            'aboutUsContentEn',
            'subContentEn',
            'whyUsContentEn',
            'numbersSubtitleEn',
            'missionContentEn',
            'visionContentEn',
            'leadershipContentEn',
            'aboutUsContentAr',
            'subContentAr',
            'whyUsContentAr',
            'numbersSubtitleAr',
            'missionContentAr',
            'visionContentAr',
            'leadershipContentAr'
        ];

        const numberFields: AboutNumberFieldKey[] = ['numberOfEmployees', 'numberOfProducts', 'numberOfClients', 'numberOfPartners'];

        return textFields.every((field) => this.getTextFieldValue(field).trim() && this.isTextFieldPatternValid(field))
            && numberFields.every((field) => this.isNumberFieldValid(field));
    }

    private areRequiredImagesValid(): boolean {
        return !!this.persistedHeroImageUrl
            && !!this.persistedSectionImages.mission
            && !!this.persistedSectionImages.vision
            && !!this.persistedSectionImages.leadership
            && this.teamMembers.length > 0
            && this.teamMembers.every((member) => !!member.imageUrl);
    }

    private hasRequiredFieldValue(field: AboutFieldKey): boolean {
        if (this.isNumberField(field)) {
            return this.isNumberFieldValid(field);
        }

        return !!this.getTextFieldValue(field).trim();
    }

    private getTextFieldValue(field: AboutTextFieldKey): string {
        const fieldMap: Record<AboutTextFieldKey, string> = {
            aboutUsContentEn: this.aboutUsContentEn,
            subContentEn: this.subContentEn,
            whyUsContentEn: this.whyUsContentEn,
            numbersSubtitleEn: this.numbersSubtitleEn,
            missionContentEn: this.missionContentEn,
            visionContentEn: this.visionContentEn,
            leadershipContentEn: this.leadershipContentEn,
            aboutUsContentAr: this.aboutUsContentAr,
            subContentAr: this.subContentAr,
            whyUsContentAr: this.whyUsContentAr,
            numbersSubtitleAr: this.numbersSubtitleAr,
            missionContentAr: this.missionContentAr,
            visionContentAr: this.visionContentAr,
            leadershipContentAr: this.leadershipContentAr
        };

        return fieldMap[field] ?? '';
    }

    private isTextFieldPatternValid(field: AboutTextFieldKey): boolean {
        const value = this.getTextFieldValue(field).trim();
        if (!value) {
            return false;
        }

        return field.endsWith('Ar')
            ? this.arabicPattern.test(value)
            : this.englishPattern.test(value);
    }

    private isNumberField(field: AboutFieldKey): field is AboutNumberFieldKey {
        return field === 'numberOfEmployees' || field === 'numberOfProducts' || field === 'numberOfClients' || field === 'numberOfPartners';
    }

    private isNumberFieldValid(field: AboutNumberFieldKey): boolean {
        const value = this[field];
        return value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0;
    }

    onPreview(): void {
        this.attemptedSave = true;

        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

        const payload: AboutPageDto = {
            isActive: this.isActive,
            aboutUsContentEn: this.aboutUsContentEn,
            subContentEn: this.subContentEn,
            whyUsContentEn: this.whyUsContentEn,
            numbersSubtitleEn: this.numbersSubtitleEn,
            missionContentEn: this.missionContentEn,
            visionContentEn: this.visionContentEn,
            leadershipContentEn: this.leadershipContentEn,
            aboutUsContentAr: this.aboutUsContentAr,
            subContentAr: this.subContentAr,
            whyUsContentAr: this.whyUsContentAr,
            numbersSubtitleAr: this.numbersSubtitleAr,
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

        const previewLang: 'en' | 'ar' = this.activeTab === 'ar' ? 'ar' : 'en';
        const previewHeader = previewLang === 'ar' ? 'معاينة من نحن' : 'About Us Preview';

        const dialogData: AboutDialogData = {
            source: 'preview',
            data: payload,
            previewLang
        };

        this.dialogService.open(AboutComponent, {
            ...PRIME_NG_CONFIGS.dynamicDialog,
            header: previewHeader,
            data: dialogData,
            width: '95vw',
            height: '95vh',
            style: { direction: previewLang === 'ar' ? 'rtl' : 'ltr' },
            contentStyle: { padding: '0' },
            maximizable: false,
            closable: true
        });
    }

    save(): void {
        this.attemptedSave = true;

        if (this.isSaving || this.isUploadingHero || this.uploadingSectionImage) return;
        if (!this.canSave) {
            this.showValidationWarning();
            this.cdr.detectChanges();
            return;
        }

        const dto: AboutPageDto = {
            isActive: this.isActive,
            aboutUsContentEn: this.aboutUsContentEn,
            subContentEn: this.subContentEn,
            whyUsContentEn: this.whyUsContentEn,
            numbersSubtitleEn: this.numbersSubtitleEn,
            missionContentEn: this.missionContentEn,
            visionContentEn: this.visionContentEn,
            leadershipContentEn: this.leadershipContentEn,
            aboutUsContentAr: this.aboutUsContentAr,
            subContentAr: this.subContentAr,
            whyUsContentAr: this.whyUsContentAr,
            numbersSubtitleAr: this.numbersSubtitleAr,
            missionContentAr: this.missionContentAr,
            visionContentAr: this.visionContentAr,
            leadershipContentAr: this.leadershipContentAr,
            numberOfEmployees: this.numberOfEmployees,
            numberOfProducts: this.numberOfProducts,
            numberOfClients: this.numberOfClients,
            numberOfPartners: this.numberOfPartners,
            heroImageUrl: this.persistedHeroImageUrl,
            missionImageUrl: this.persistedSectionImages.mission,
            visionImageUrl: this.persistedSectionImages.vision,
            leadershipImageUrl: this.persistedSectionImages.leadership,
            teamMembers: this.teamMembers.map((m, i) => ({ ...m, displayOrder: i }))
        };

        this.isSaving = true;
        this.aboutPageService.save(dto).subscribe({
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

    private showValidationWarning(): void {
        const isArabic = this.activeTab === 'ar';
        this.messageService.add({
            severity: 'warn',
            summary: isArabic ? '\u062a\u0646\u0628\u064a\u0647' : 'Validation',
            detail: isArabic ? '\u064a\u0631\u062c\u0649 \u0645\u0644\u0621 \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0644 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629.' : 'Please fill all required fields.'
        });
    }
}
