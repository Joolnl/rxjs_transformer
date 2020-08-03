import { Observable } from 'rxjs';
import { Metadata } from './metadata_ref';

export const wrapObservableStatement = <T, O extends Observable<T>>(metadata: Metadata) => (source$: O): O => {
    console.info(metadata);
    return source$;
};