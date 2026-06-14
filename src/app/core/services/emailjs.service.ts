import { Injectable } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

export interface ContactFormData {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    message: string;
}

@Injectable({ providedIn: 'root' })
export class EmailjsService {
    private readonly serviceId = environment.emailjs.serviceId;
    private readonly templateId = environment.emailjs.templateId;
    private readonly publicKey = environment.emailjs.publicKey;

    send(form: ContactFormData): Promise<void> {
        const params = {
            first_name: form.firstName,
            last_name: form.lastName,
            phone: form.phone,
            from_email: form.email,
            message: form.message
        };

        return emailjs
            .send(this.serviceId, this.templateId, params, { publicKey: this.publicKey })
            .then(() => undefined);
    }
}
