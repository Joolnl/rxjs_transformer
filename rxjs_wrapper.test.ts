import { wrapObservableStatement, wrapSubscribe, Subscriber, instanceOfSubscriber, wrapPipeOperator } from "./rxjs_wrapper_ref";
import { of, merge, Subject, Observable } from 'rxjs';
import { bufferCount, map, filter } from 'rxjs/operators';
import { SendMessage } from './message';

const mockSend: SendMessage = (): void => null;

test('wrapObservableStatement should return observable when passed RxJS creation call.', () => {
    const result$ = wrapObservableStatement<number, Observable<number>>(null, mockSend)(of(100));
    result$.subscribe(result => expect(result).toBe(100));
});

test('wrapObservableStatement should return observable when passed RxJS join creation call.', () => {
    const result$ = wrapObservableStatement<string, Observable<string>>(null, mockSend)(merge(of('alfa'), of('beta')));
    result$
        .pipe(bufferCount(2))
        .subscribe(result => expect(result).toEqual(['alfa', 'beta']));
});

test('wrapObservableStatement should return Subject when passed Subject construction.', () => {
    const result$ = wrapObservableStatement<string, Subject<string>>(null, mockSend)(new Subject<string>());
    result$.subscribe(result => expect(result).toBe('Hallelujah'));
    result$.next('Hallelujah');
});

test('isInstanceOfSubscriber should tell if instance is Subscriber instance.', () => {
    const sub: Subscriber = { next: 1 };
    const sub2: Subscriber = { error: 3 };
    const sub3: Subscriber = { complete: true };
    const obj = { a: true };

    expect(instanceOfSubscriber(sub)).toBe(true);
    expect(instanceOfSubscriber(sub2)).toBe(true);
    expect(instanceOfSubscriber(sub3)).toBe(true);
    expect(instanceOfSubscriber(obj)).toBe(false);
    expect(instanceOfSubscriber(undefined)).toBe(false);
});

test('wrapSubscribe should return Subscriber object.', () => {
    const result = wrapSubscribe()(null, mockSend);
    expect(result).toBe(undefined);

    const result2 = wrapSubscribe((x: any) => console.log(x))(null, mockSend);
    expect(result2.next).toEqual(expect.any(Function));

    const result3 = wrapSubscribe(
        (x: any) => console.log(x),
        (e: any) => console.error(e)
    )(null, mockSend);
    expect(result3.next).toEqual(expect.any(Function));
    expect(result3.error).toEqual(expect.any(Function));

    const result4 = wrapSubscribe(
        (x: any) => console.log(x),
        (e: any) => console.error(e),
        () => console.log('completed')
    )(null, mockSend);
    expect(result4.next).toEqual(expect.any(Function));
    expect(result4.error).toEqual(expect.any(Function));
    expect(result4.complete).toEqual(expect.any(Function));

    const subscriber: Subscriber = {
        next: (x: any) => console.log(x),
        error: (e: any) => console.log(e),
        complete: () => console.log('completed')
    };

    const result5 = wrapSubscribe(subscriber)(null, mockSend);
    expect(result5.next).toEqual(expect.any(Function));
    expect(result5.error).toEqual(expect.any(Function));
    expect(result5.complete).toEqual(expect.any(Function));
});

test('wrapSubscribe wrapped subscriber object methods should be called each emit.', () => {
    const spyNext = jest.fn((x: any) => console.log(x));
    const result = wrapSubscribe(spyNext)(null, mockSend);
    result.next(1);
    result.next(2);
    result.next(3);
    expect(spyNext).toBeCalledTimes(3);
});


test('wrapSubscribe wrapped subscriber error fn should be called on error.', () => {
    const spyError = jest.fn((x: any) => console.log(x));
    const result = wrapSubscribe(null, spyError)(null, mockSend);
    result.error('error');
    expect(spyError).toBeCalledTimes(1);
});

test('wrapSubscribe wrapped subscriber should not impact behavior.', () => {
    const result = wrapSubscribe((x: number) => {
        expect(x).toBe(777);
    })(null, mockSend);
    result.next(777);
});

test('wrapPipeOperator should send metadata and return source$.', () => {
    const spy = jest.fn(mockSend);
    const source$ = of(100)
        .pipe(
            wrapPipeOperator<number, number>(null, spy)(map((x: number) => 200)),
            wrapPipeOperator<number, number>(null, spy)(filter(x => x > 100)),
            wrapPipeOperator<number, string>(null, spy)(map(_ => 'whoop'))
        );
    source$.subscribe(x => expect(x).toBe('whoop'));
    expect(spy).toBeCalledTimes(3);
});