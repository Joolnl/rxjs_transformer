import { Observable, OperatorFunction } from 'rxjs';
import { Metadata, RxJSPart } from './metadata_ref';
import { SendMessage } from './message';
import { OperatorPosition } from './operator_wrapper_ref';
import { tap } from 'rxjs/operators';

export interface Subscriber {
    next?: any,
    error?: any,
    complete?: any
}

type next = (...args: any) => void;
type error = (...args: any) => void;
type complete = () => void;

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
    const wrap = (fn: next | error | complete) => (...args: any[]): void => {
        if (metadata) {
            metadata = {
                ...metadata,
                part: RxJSPart.Event,
                event: args
            }
        }
        send(metadata);
        fn(...args);
    };

    const wrappedNext = wrap(sub.next);
    const wrappedError = wrap(sub.error);
    const wrappedComplete = wrap(sub.complete);

    return {
        ...sub.next && { 'next': (...args: any) => wrappedNext(...args) },
        ...sub.error && { 'error': (...args: any) => wrappedError(...args) },
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

type AggregatedEvent<T> = {
    event: T;
    id: number;
}

export const aggregateEvent = (() => {
    let counter = 0;
    return <T>(event: T, position: OperatorPosition): AggregatedEvent<T> => {
        if (position === OperatorPosition.first || position === OperatorPosition.only) {
            counter++;
        }

        return {
            event,
            id: counter
        };
    };
})();

// Plase tap with send after every pipe operator.
export const wrapPipeOperator = <T, R>(metadata: Metadata, send: SendMessage, position: OperatorPosition) => (operator: OperatorFunction<T,R>) => (source$: Observable<T>) => {
    return source$.pipe(
        operator,
        tap(event => send({...metadata, event: aggregateEvent(event, position)}))
    );
};