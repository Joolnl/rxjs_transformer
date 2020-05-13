import { wrapTypeReference } from './rxjs_wrapper';
import { of } from 'rxjs';

// TODO: makes no sesne
test('wrapTypeReference should wrap Objects and Subjects without behavior change', done => {
    const t = wrapTypeReference(of(1), { uuid: '1', line: 4, file: 'test.ts' });

    t.subscribe({
        next: result => expect(result).toBe(1),
        complete: () => done()
    })
});