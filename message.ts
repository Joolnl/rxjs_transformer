import { Message } from '@angular/compiler/src/i18n/i18n_ast';
import { Metadata } from './metadata_ref';

export type SendMessage = (metadata: Metadata) => void;

declare var chrome: any;
export const sendToBackpage: SendMessage = message => {
  console.log('sendToBackpage', JSON.stringify(message));

  chrome.runtime.sendMessage('coianclmpfipkjbojbjfmbjenollipek', { detail: message });
};
