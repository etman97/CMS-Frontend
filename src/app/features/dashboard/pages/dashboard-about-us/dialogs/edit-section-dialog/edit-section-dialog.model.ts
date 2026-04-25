export type AboutSection = 'mission' | 'vision' | 'leadership';
export type SectionLang = 'en' | 'ar';

export interface EditSectionDialogData {
    section: AboutSection;
    lang: SectionLang;
    content: string;
    imageUrl: string | null;
}

export interface EditSectionDialogResult {
    content: string;
    imageUrl: string | null;
}
