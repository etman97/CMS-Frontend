export interface AddMemberDialogData {
    lang: 'en' | 'ar';
}

export interface AddMemberDialogResult {
    nameEn: string;
    jobTitleEn: string;
    briefEn: string;
    nameAr: string;
    jobTitleAr: string;
    briefAr: string;
    imageUrl: string | null;
}
