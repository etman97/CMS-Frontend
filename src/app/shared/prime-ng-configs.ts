import { DynamicDialogConfig } from 'primeng/dynamicdialog';

export const PRIME_NG_CONFIGS: { dynamicDialog: Partial<DynamicDialogConfig> } = {
    dynamicDialog: {
        width: '50vw',
        breakpoints: { '960px': '75vw', '640px': '90vw' },
        modal: true,
        closable: true,
        draggable: false,
        resizable: false,
        closeOnEscape: true,
    }
};
