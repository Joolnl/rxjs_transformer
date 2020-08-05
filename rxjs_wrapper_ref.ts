import { Observable } from 'rxjs';
import { Metadata } from './metadata_ref';

export interface Subscriber {
    next?: any,
    error?: any,
    complete?: any
}

type next = any;
type error = any;
type complete = any;

export const wrapObservableStatement = <T, O extends Observable<T>>(metadata: Metadata) => (source$: O): O => {
    console.log(metadata);
    return source$;
};

export const instanceOfSubscriber = (object: any): object is Subscriber => {
    return object !== undefined
        && ('next' in object
            || 'error' in object
            || 'complete' in object);
};

// Function Overloading wrapSubscribe in 3 fashions.
export function wrapSubscribe(): (metadata: Metadata) => void;
export function wrapSubscribe(sub: Subscriber): (metadata: Metadata) => Subscriber;
export function wrapSubscribe(next: next, error?: error, complete?: complete): (metadata: Metadata) => Subscriber;

// Simply returns passed arguments in Subscriber form after sending metadata.
export function wrapSubscribe(subOrNext?: Subscriber | next, error?: error, complete?: complete): (metadata: Metadata) => Subscriber {
    return function (metadata) {
        console.log(metadata);
        if (instanceOfSubscriber(subOrNext)) {
            return subOrNext as Subscriber;
        } else if (subOrNext) {
            return {
                next: subOrNext,
                ...error && { error },
                ...complete && { complete }
            }
        }
    }
}