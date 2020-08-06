import { Metadata } from './metadata_ref';

export type SendMessage = (metadata: Metadata) => void;

export const sendToBackpage: SendMessage = metadata => console.info(metadata);