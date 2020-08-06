import { Observable } from 'rxjs';
import { Metadata } from './metadata_ref';
import { SendMessage } from './message';

export interface Subscriber {
    next?: any,
    error?: any,
    complete?: any
}

type next = any;
type error = any;
type complete = any;

export const wrapObservableStatement = <T, O extends Observable<T>>(metadata: Metadata, send: SendMessage) => (source$: O): O => {
    send(metadata);
    return source$;
};

export const instanceOfSubscriber = (object: any): object is Subscriber => {
    return object !== undefined
        && ('next' in object
            || 'error' in object
            || 'complete' in object);
};

// Wrap all subscriber methods.
export const wrapSubscriberObject = (sub: Subscriber, send: SendMessage): Subscriber => {
    const wrap = (fn: any) => {

    };

    return {
        ...sub.next && { 'next': () => sub.next },
        ...sub.error && { 'error': () => sub.error },
        ...sub.complete && { 'complete': () => sub.complete }
    };
};

// Function Overloading wrapSubscribe in 3 fashions.
export function wrapSubscribe(): (metadata: Metadata, send: SendMessage) => void;
export function wrapSubscribe(sub: Subscriber): (metadata: Metadata, send: SendMessage) => Subscriber;
export function wrapSubscribe(next: next, error?: error, complete?: complete): (metadata: Metadata, send: SendMessage) => Subscriber;

// Simply returns passed arguments in Subscriber form after sending metadata.
export function wrapSubscribe(subOrNext?: Subscriber | next, error?: error, complete?: complete): (metadata: Metadata, send: SendMessage) => Subscriber {
    return function (metadata, send) {
        send(metadata);
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
};
