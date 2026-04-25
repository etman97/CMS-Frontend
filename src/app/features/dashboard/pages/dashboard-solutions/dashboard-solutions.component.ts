import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';
import { DashboardPageHeaderComponent } from '../../components/dashboard-page-header/dashboard-page-header.component';

type SolutionsLang = 'en' | 'ar';

interface SolutionCard {
    id: number;
    title: string;
    content: string;
    imageUrl: string | null;
}

@Component({
    selector: 'app-dashboard-solutions',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel, DashboardPageHeaderComponent],
    templateUrl: './dashboard-solutions.component.html',
    styleUrl: './dashboard-solutions.component.scss'
})
export class DashboardSolutionsComponent {
    activeTab: SolutionsLang = 'en';
    isActive = true;
    topImageUrl: string | null = null;

    private idCounter = 6;

    readonly solutionsByLang: Record<SolutionsLang, SolutionCard[]> = {
        en: [
            {
                id: 1,
                title: 'IT Solutions 1',
                content: 'Enter content, for ex: At WES, we empower businesses to navigate the complexities of the digital age',
                imageUrl: null
            },
            {
                id: 2,
                title: 'IT Solutions 2',
                content: 'Enter content, for ex: At WES, we empower businesses to navigate the complexities of the digital age',
                imageUrl: null
            },
            {
                id: 3,
                title: 'IT Solutions 3',
                content: 'Enter content, for ex: At WES, we empower businesses to navigate the complexities of the digital age',
                imageUrl: null
            }
        ],
        ar: [
            {
                id: 4,
                title: 'حلول تقنية 1',
                content: 'ادخل المحتوى، مثال: في WES نساعد الشركات على التعامل مع تحديات العصر الرقمي',
                imageUrl: null
            },
            {
                id: 5,
                title: 'حلول تقنية 2',
                content: 'ادخل المحتوى، مثال: في WES نساعد الشركات على التعامل مع تحديات العصر الرقمي',
                imageUrl: null
            },
            {
                id: 6,
                title: 'حلول تقنية 3',
                content: 'ادخل المحتوى، مثال: في WES نساعد الشركات على التعامل مع تحديات العصر الرقمي',
                imageUrl: null
            }
        ]
    };

    readonly introByLang: Record<SolutionsLang, { title: string; placeholder: string }> = {
        en: {
            title: 'Solutions',
            placeholder: 'Enter content, for ex: At WES, we empower businesses to navigate the complexities of the digital age'
        },
        ar: {
            title: 'الحلول',
            placeholder: 'ادخل المحتوى، مثال: في WES نساعد الشركات على التعامل مع تحديات العصر الرقمي'
        }
    };

    readonly introContentByLang: Record<SolutionsLang, string> = {
        en: 'Enter content, for ex: At WES, we empower businesses to navigate the complexities of the digital age',
        ar: 'ادخل المحتوى، مثال: في WES نساعد الشركات على التعامل مع تحديات العصر الرقمي'
    };

    onTopImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.topImageUrl = URL.createObjectURL(file);
        }
    }

    onCardImageSelected(event: Event, lang: SolutionsLang, cardId: number): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        const targetCard = this.solutionsByLang[lang].find((card) => card.id === cardId);
        if (file && targetCard) {
            targetCard.imageUrl = URL.createObjectURL(file);
        }
    }

    addSolutionsGroup(lang: SolutionsLang): void {
        const nextNumber = this.solutionsByLang[lang].length + 1;
        this.idCounter += 1;

        this.solutionsByLang[lang].push({
            id: this.idCounter,
            title: lang === 'ar' ? `حلول تقنية ${nextNumber}` : `IT Solutions ${nextNumber}`,
            content: this.introByLang[lang].placeholder,
            imageUrl: null
        });
    }
}
