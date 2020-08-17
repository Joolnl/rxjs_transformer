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
    return object !== undefined && object !== null
        && ('next' in object
            || 'error' in object
            || 'complete' in object);
};

// Wrap all subscriber methods.
export const wrapSubscriberObject = (metadata: Metadata, send: SendMessage) => (sub: Subscriber): Subscriber => {
    const wrap = (fn: any) => {
        send(metadata);
        return fn;
    };

    const wrappedNext = wrap(sub.next);
    const wrappedError = wrap(sub.error);
    const wrappedComplete = wrap(sub.complete);

    return {
        ...sub.next && { 'next': () => wrappedNext() },
        ...sub.error && { 'error': () => wrappedError() },
        ...sub.complete && { 'complete': () => wrappedComplete() }
    };
};

// Function Overloading wrapSubscribe in 3 fashions.
export function wrapSubscribe(): (metadata: Metadata, send: SendMessage) => void;
export function wrapSubscribe(sub: Subscriber): (metadata: Metadata, send: SendMessage) => Subscriber;
export function wrapSubscribe(next: next, error?: error, complete?: complete): (metadata: Metadata, send: SendMessage) => Subscriber;

// Simply returns passed arguments in Subscriber form after sending metadata.
export function wrapSubscribe(subOrNext?: Subscriber | next, error?: error, complete?: complete): (metadata: Metadata, send: SendMessage) => Subscriber {
    return function (metadata, send) {
        const wrap = wrapSubscriberObject(metadata, send);
        send(metadata);
        if (instanceOfSubscriber(subOrNext)) {
            return wrap(subOrNext) as Subscriber;
        } else if (subOrNext || error || complete) {
            return wrap({
                ...subOrNext && { next: subOrNext },
                ...error && { error },
                ...complete && { complete }
            });
        }
    }
};
