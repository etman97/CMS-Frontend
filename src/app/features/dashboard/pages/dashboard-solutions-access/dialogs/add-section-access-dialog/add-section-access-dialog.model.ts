export interface AddSectionAccessDialogData {
    lang: 'en' | 'ar';
    requiredImageMode?: SectionImageMode | null;
    initial?: {
        titleEn: string;
        titleAr: string;
        paragraphEn: string;
        paragraphAr: string;
        imageUrls: string[];
    };
}

export type SectionImageMode = 'one' | 'two';

export interface AddSectionAccessDialogResult {
    titleEn: string;
    titleAr: string;
    paragraphEn: string;
    paragraphAr: string;
    imageMode: SectionImageMode;
    firstImageFile: File | null;
    secondImageFile: File | null;
}
