import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-one-image',
  imports: [RouterLink],
  templateUrl: './one-image.html',
  styleUrl: './one-image.scss',
})
export class OneImage {
  protected readonly sections = [
    {
      title: 'Digital Transformations',
      image: 'https://www.figma.com/api/mcp/asset/2981136d-a609-460e-868b-e9c8747ec9a0',
      imageAlt: 'Finger interacting with a digital transformation interface',
      paragraphs: [
        'We guide organizations through the intricate process of adopting digital technology to fundamentally improve and reimagine their operations, organizational culture, and overall customer experiences. This involves a holistic re-evaluation of processes, technology, and people.',
        'WES adds transformative value by providing a truly holistic approach to digital transformation. This encompasses everything from meticulous strategic planning and optimal technology selection to seamless implementation and effective change management. Our comprehensive methodology ensures a smooth transition, measurable improvements in operational efficiency, enhanced customer engagement, and a future-ready enterprise capable of adapting to market shifts.',
      ],
    },
    {
      title: 'Hybrid Multi-Cloud',
      image: 'https://www.figma.com/api/mcp/asset/c543617d-595b-4f24-93fe-f4a7ce9bba16',
      imageAlt: 'Cloud infrastructure network visualization',
      reverse: true,
      paragraphs: [
        'We develop and implement sophisticated strategies for managing and optimizing diverse workloads across a dynamic combination of on-premises infrastructure, private cloud environments, and multiple public cloud platforms. This ensures maximum flexibility and control.',
        'WES empowers clients to confidently navigate the inherent complexities of hybrid and multi-cloud environments. We specialize in optimizing resource allocation, rigorously ensuring data sovereignty and compliance, and significantly reducing operational costs, all while maximizing flexibility and scalability across diverse cloud platforms. This strategic approach provides unparalleled agility and resilience.',
      ],
    },
    {
      title: 'Containerization',
      image: 'https://www.figma.com/api/mcp/asset/e084809c-aace-4468-9409-e6daf8b8cf65',
      imageAlt: 'Containerization technology represented on a circuit board',
      paragraphs: [
        'We expertly implement cutting-edge container technologies, such as Docker and Kubernetes, to efficiently package applications and all their necessary dependencies. This ensures absolute consistency across various development, testing, and production environments, dramatically improving deployment efficiency and reliability.',
        'By implementing robust containerization strategies, WES enables significantly faster application deployment cycles, vastly improved scalability, and greater environmental consistency from development to production. This directly translates into reduced development cycles, more reliable software delivery, and ultimately, a more agile and responsive IT infrastructure for our clients.',
      ],
    },
    {
      title: 'ITSM and IOTM',
      image: 'https://www.figma.com/api/mcp/asset/8e218b30-8d63-406d-93e1-ae148225779c',
      imageAlt: 'IT service management dashboard interface',
      reverse: true,
      paragraphs: [
        'We provide advanced IT Service Management (ITSM) and IT Operations Management (IOTM) solutions designed to streamline IT service delivery, enhance support capabilities, and optimize operational efficiency. Our solutions leverage intelligent automation and insightful analytics to transform IT operations.',
        'WES fundamentally streamlines IT operations, drastically reduces manual effort, and significantly improves service quality through the deployment of advanced ITSM and IOTM solutions. This provides our clients with unprecedented control, real-time visibility, and enhanced responsiveness across their entire IT environment, leading to proactive problem resolution and superior service delivery.',
      ],
    },
    {
      title: 'IoT As-a-Service',
      image: 'https://www.figma.com/api/mcp/asset/3f91df06-6d67-475f-b489-982c4e5f0fe4',
      imageAlt: 'Robotic hand connected to IoT network points',
      paragraphs: [
        'We offer comprehensive Internet of Things (IoT) solutions delivered as a fully managed service. This spans the entire IoT life cycle, from seamless device connectivity and robust data collection to advanced analytics and intricate application integration.',
        'WES simplifies the complex adoption of IoT, allowing clients to effortlessly harness real-time data from connected devices. This enables enhanced, data-driven decision-making, predictive maintenance capabilities, and the creation of entirely new service offerings, all managed seamlessly and efficiently by our expert team, allowing clients to focus on core business innovation.',
      ],
    },
  ];
}
