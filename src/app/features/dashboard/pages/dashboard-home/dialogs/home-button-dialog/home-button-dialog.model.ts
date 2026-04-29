import { ButtonDirection } from '../../../../../../core/services/home-page.service';

export interface HomeButtonDialogData {
    lang: 'en' | 'ar';
    label: string;
    direction: ButtonDirection;
    linkValue: string;
}

export interface HomeButtonDialogResult {
    label: string;
    direction: ButtonDirection;
    linkValue: string;
}
