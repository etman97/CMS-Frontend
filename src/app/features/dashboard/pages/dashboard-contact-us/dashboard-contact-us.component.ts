import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

type ContactLang = 'en' | 'ar';

interface ContactSectionContent {
    introTitle: string;
    introDescription: string;
    contactTitle: string;
    visitTitle: string;
}

interface SharedContactFields {
    phone: string;
    email: string;
    address: string;
    locationUrl: string;
}

@Component({
    selector: 'app-dashboard-contact-us',
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel],
    standalone: true,
    templateUrl: './dashboard-contact-us.component.html',
    styleUrl: './dashboard-contact-us.component.scss'
})
export class DashboardContactUsComponent {
    activeTab: ContactLang = 'en';
    isActive = true;

    sharedTopImageUrl: string | null = null;

    contentByLang: Record<ContactLang, ContactSectionContent> = {
        en: {
            introTitle: 'Contact Us',
            introDescription: '',
            contactTitle: 'Contact Us',
            visitTitle: 'Visit Us'
        },
        ar: {
            introTitle: 'تواصل معنا',
            introDescription: '',
            contactTitle: 'تواصل معنا',
            visitTitle: 'زورونا'
        }
    };

    sharedContactFields: SharedContactFields = {
        phone: '',
        email: '',
        address: '',
        locationUrl: ''
    };

    onActiveToggle(input: HTMLInputElement): void {
        input.blur();
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.sharedTopImageUrl = URL.createObjectURL(file);
        }
    }
}
