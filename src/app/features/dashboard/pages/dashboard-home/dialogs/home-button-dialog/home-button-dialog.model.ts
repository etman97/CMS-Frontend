import { HomeButtonLinkType } from '../../../../../../core/services/home-page.service';

export interface HomeButtonDialogData {
    lang: 'en' | 'ar';
    label: string;
    linkType: HomeButtonLinkType;
    linkValue: string;
}

export interface HomeButtonDialogResult {
    label: string;
    linkType: HomeButtonLinkType;
    linkValue: string;
}
