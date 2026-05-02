import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

export interface TwoImagesSection {
    title: string;
    images: { src: string; alt: string }[];
    paragraphs: string[];
    reverse?: boolean;
}

export interface TwoImagesDialogData {
    source: 'preview';
    sections: TwoImagesSection[];
    previewLang: 'en' | 'ar';
}

@Component({
  selector: 'app-two-images',
  imports: [RouterLink],
  templateUrl: './two-images.html',
  styleUrl: './two-images.scss',
})
export class TwoImages implements OnInit {
    private readonly dialogConfig = inject(DynamicDialogConfig<TwoImagesDialogData>, { optional: true });

    isPreviewMode = false;
    isRtl = false;

    sections: TwoImagesSection[] = [
        {
            title: 'Intelligent Backup',
            images: [
                { src: 'https://www.figma.com/api/mcp/asset/6cd42718-f4a7-4475-950c-b378c9b85d42', alt: 'Cloud backup technology portal' },
                { src: 'https://www.figma.com/api/mcp/asset/4013923e-d7fa-42df-bb91-8719fe3dd841', alt: 'Cloud data backup on a laptop' },
            ],
            paragraphs: [
                'We provide advanced backup solutions that intelligently leverage AI and automation for highly efficient, reliable, and secure data protection. These solutions are engineered to ensure rapid and complete recovery from any data loss incidents.',
                'WES delivers intelligent backup solutions that transcend traditional methodologies. We offer automated, policy-driven data protection combined with rapid recovery capabilities, significantly reducing potential downtime and mitigating data loss risks for our clients. This ensures business continuity even in the face of unforeseen events.',
            ],
        },
        {
            title: 'SaaS Backup',
            reverse: true,
            images: [
                { src: 'https://www.figma.com/api/mcp/asset/796717a3-e087-47bc-baec-c42db75d5491', alt: 'SaaS application backup concept' },
                { src: 'https://www.figma.com/api/mcp/asset/2d640bc8-df92-44ce-8b56-1e283670a86f', alt: 'Cloud service data visualization' },
            ],
            paragraphs: [
                'We offer specialized backup services specifically designed for Software as a Service (SaaS) applications, meticulously protecting critical data residing within these cloud-based platforms.',
                'WES fills a crucial and often overlooked gap by comprehensively securing SaaS application data. Our robust solutions provide essential protection against accidental deletion, malicious attacks, and compliance issues, ensuring uninterrupted business continuity even for your most critical cloud-native applications, giving you peace of mind.',
            ],
        },
        {
            title: 'Data Resilience',
            images: [
                { src: 'https://www.figma.com/api/mcp/asset/9954c24c-97e6-425d-bac9-1599c4a6bba5', alt: 'Resilient data network visualization' },
                { src: 'https://www.figma.com/api/mcp/asset/fc9f213d-c2d8-490f-ac2d-6e8b5c6d6126', alt: 'Data monitoring operations screen' },
            ],
            paragraphs: [
                'We develop and implement sophisticated strategies and technologies to ensure paramount data availability and absolute integrity. This empowers businesses to withstand disruptions of any kind and maintain continuous, uninterrupted operations.',
                'WES constructs robust data resilience frameworks that are designed to minimize the impact of outages, sophisticated cyberattacks, or natural disasters. This ensures continuous, unfettered access to critical data and applications, which is absolutely vital for uninterrupted business operations and maintaining competitive advantage.',
            ],
        },
        {
            title: 'Storage',
            reverse: true,
            images: [
                { src: 'https://www.figma.com/api/mcp/asset/8e405bea-5f8d-432f-8150-55344f58af06', alt: 'Enterprise data storage racks' },
                { src: 'https://www.figma.com/api/mcp/asset/1c646814-72b7-46cf-b449-de86e946e1f5', alt: 'Storage interface controlled from a tablet' },
            ],
            paragraphs: [
                'We offer state-of-the-art solutions for scalable, secure, and high-performance data storage, meticulously tailored to meet the diverse and evolving needs of any organization, from on-premises infrastructure to advanced cloud-based storage.',
                'WES meticulously designs and implements optimized storage solutions that dramatically improve data access speeds, significantly enhance security protocols, and scale efficiently with your business growth. This leads to substantial reductions in infrastructure costs and a marked improvement in overall system performance and responsiveness.',
            ],
        },
        {
            title: 'Embedded HA and DR',
            images: [
                { src: 'https://www.figma.com/api/mcp/asset/78ffeaba-2c4b-4d33-ab59-c4adc41185ae', alt: 'High availability and disaster recovery security shield' },
                { src: 'https://www.figma.com/api/mcp/asset/1d30acb8-72c2-4136-acfa-c02aa043049e', alt: 'Business continuity verification interface' },
            ],
            paragraphs: [
                'We specialize in implementing embedded High Availability (HA) and Disaster Recovery (DR) mechanisms directly within your systems and applications. This minimizes downtime and ensures seamless business continuity, even in the event of major disruptions.',
                "WES integrates advanced HA and DR capabilities directly into our clients' mission-critical systems. This provides seamless failover and rapid recovery from any disruption, ensuring that your most vital applications remain fully operational and accessible at all times, safeguarding your revenue and reputation.",
            ],
        },
    ];

    ngOnInit(): void {
        const dialogData = this.dialogConfig?.data;
        if (dialogData?.source === 'preview') {
            this.isPreviewMode = true;
            this.isRtl = dialogData.previewLang === 'ar';
            this.sections = dialogData.sections;
        }
    }
}
