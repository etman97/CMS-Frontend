import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

type PartnersLang = 'en' | 'ar';

interface PartnerCard {
    id: number;
    imageUrl: string | null;
}

interface IntroContent {
    title: string;
    description: string;
}

@Component({
    selector: 'app-dashboard-partners',
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel],
    standalone: true,
    templateUrl: './dashboard-partners.component.html',
    styleUrl: './dashboard-partners.component.scss'
})
export class DashboardPartnersComponent {
    activeTab: PartnersLang = 'en';
    isActive = true;

    topImageUrl: string | null = null;

    introByLang: Record<PartnersLang, IntroContent> = {
        en: {
            title: 'Our Partners',
            description: ''
        },
        ar: {
            title: 'شركاؤنا',
            description: ''
        }
    };

    partnerCards: PartnerCard[] = [];

    private nextPartnerId = 1;

    onActiveToggle(input: HTMLInputElement): void {
        input.blur();
    }

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.topImageUrl = URL.createObjectURL(file);
        }
    }

    onPartnerLogoSelected(event: Event, partnerId: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        const target = this.partnerCards.find((card) => card.id === partnerId);
        if (target) {
            target.imageUrl = URL.createObjectURL(file);
        }
    }

    onAddPartnerSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) {
            return;
        }

        this.partnerCards.push({
            id: this.nextPartnerId++,
            imageUrl: URL.createObjectURL(file)
        });
    }

    removePartner(partnerId: number): void {
        this.partnerCards = this.partnerCards.filter((card) => card.id !== partnerId);
    }
}
