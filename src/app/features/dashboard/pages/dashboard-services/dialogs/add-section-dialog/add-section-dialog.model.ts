export interface AddSectionDialogData {
    lang: 'en' | 'ar';
    initial?: {
        groupNameEn: string;
        groupNameAr: string;
        briefEn: string;
        briefAr: string;
        imageUrl: string | null;
    };
}

export interface AddSectionDialogResult {
    groupNameEn: string;
    groupNameAr: string;
    briefEn: string;
    briefAr: string;
    imageFile: File | null;
}
