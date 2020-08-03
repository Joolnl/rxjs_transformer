import {  wrapObservableStatement } from "./rxjs_wrapper_ref";
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