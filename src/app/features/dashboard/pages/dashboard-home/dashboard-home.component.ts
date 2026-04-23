import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from 'primeng/tabs';

@Component({
    selector: 'app-dashboard-home',
    standalone: true,
    imports: [FormsModule, Tabs, TabList, Tab, TabPanels, TabPanel],
    templateUrl: './dashboard-home.component.html',
    styleUrl: './dashboard-home.component.scss'
})
export class DashboardHomeComponent {
    activeTab = 'en';
    isActive = false;

    heroTitle = '';
    heroContent = '';
    primaryButtonText = '';
    secondaryButtonText = '';

    onActiveToggle(input: HTMLInputElement): void {
        input.blur();
    }
}
