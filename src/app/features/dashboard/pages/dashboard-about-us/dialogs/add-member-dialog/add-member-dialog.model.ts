export interface AddMemberDialogData {
    lang: 'en' | 'ar';
}

export interface AddMemberDialogResult {
    name: string;
    jobTitle: string;
    brief: string;
    imageFile: File | null;
}
