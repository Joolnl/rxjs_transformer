import { wrapObservableStatement, wrapSubscribe, Subscriber, instanceOfSubscriber } from "./rxjs_wrapper_ref";
import { of, merge, Subject, Observable } from 'rxjs';
import { bufferCount } from 'rxjs/operators';

test('wrapObservableStatement should return observable when passed RxJS creation call.', () => {
    const result$ = wrapObservableStatement<number, Observable<number>>(null)(of(100));
    result$.subscribe(result => expect(result).toBe(100));
});

test('wrapObservableStatement should return observable when passed RxJS join creation call.', () => {
    const result$ = wrapObservableStatement<string, Observable<string>>(null)(merge(of('alfa'), of('beta')));
    result$
        .pipe(bufferCount(2))
        .subscribe(result => expect(result).toEqual(['alfa', 'beta']));
});

test('wrapObservableStatement should return Subject when passed Subject construction.', () => {
    const result$ = wrapObservableStatement<string, Subject<string>>(null)(new Subject<string>());
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
    const result = wrapSubscribe()(null);
    expect(result).toBe(undefined);

    const result2 = wrapSubscribe((x: any) => console.log(x))(null);
    expect(result2.next).toEqual(expect.any(Function));

    const result3 = wrapSubscribe(
        (x: any) => console.log(x),
        (e: any) => console.error(e)
    )(null);
    expect(result3.next).toEqual(expect.any(Function));
    expect(result3.error).toEqual(expect.any(Function));

    const result4 = wrapSubscribe(
        (x: any) => console.log(x),
        (e: any) => console.error(e),
        () => console.log('completed')
    )(null);
    expect(result4.next).toEqual(expect.any(Function));
    expect(result4.error).toEqual(expect.any(Function));
    expect(result4.complete).toEqual(expect.any(Function));

    const subscriber: Subscriber = {
        next: (x: any) => console.log(x),
        error: (e: any) => console.log(e),
        complete: () => console.log('completed')
    };

    const result5 = wrapSubscribe(subscriber)(null);
    expect(result5.next).toEqual(expect.any(Function));
    expect(result5.error).toEqual(expect.any(Function));
    expect(result5.complete).toEqual(expect.any(Function));
});