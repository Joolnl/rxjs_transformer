import { Dependency, createImportDeclaration, importDeclarationIdentifiers, addSendToBackPageDependency, addWrapPipeableOperatorDependency, substraction, addIfNotPresent } from './importer';

const wrapperLocation = 'rxjs-transformer/dist/rxjs_wrapper';

test('createImportStatement should turn Dependancy into ImportDeclaration, importDeclarationIdentifiers reverse', () => {
    const input: Dependency = { identifier: 'wrapPipe', location: wrapperLocation };
    const importDecl = createImportDeclaration(input);
    const moduleSpecifier = importDeclarationIdentifiers(importDecl);
    expect(input).toEqual(moduleSpecifier.pop());
});

test('sendToBackPageDependancy should add sendToBackPage to dependancy if required', () => {
    const emptyDependancies: Dependency[] = [];
    expect(addSendToBackPageDependency(emptyDependancies)).toEqual([]);

    const mockDependancy: Dependency = { identifier: 'test', location: 'test' };
    const nonEmptyDependancies: Dependency[] = [mockDependancy];
    const output: Dependency[] = [{ identifier: 'sendToBackpage', location: wrapperLocation }, mockDependancy];
    expect(addSendToBackPageDependency(nonEmptyDependancies)).toEqual(output);
});

test('wrapPipeableOperatorDependancy should add wrapPipeableOperator dependancy if required', () => {
    const emptyDependancies: Dependency[] = [];
    expect(addWrapPipeableOperatorDependency(emptyDependancies)).toEqual([]);

    const testDependancy: Dependency = { identifier: 'test', location: 'test' };
    let input: Dependency[] = [testDependancy];
    let output: Dependency[] = [testDependancy];
    expect(addWrapPipeableOperatorDependency(input)).toEqual(output);

    const wrapPipeDependancy: Dependency = { identifier: 'wrapPipe', location: wrapperLocation };
    input = [testDependancy, wrapPipeDependancy];
    const wrapPipeableOperator: Dependency = { identifier: 'wrapPipeableOperator', location: wrapperLocation };
    output = [wrapPipeableOperator, testDependancy, wrapPipeDependancy];
    expect(addWrapPipeableOperatorDependency(input)).toEqual(output);
});

test('substraction should return arr1 substracted with arr2', () => {
    const arr1: Dependency[] = [
        { identifier: 'alfa', location: 'test' },
        { identifier: 'beta', location: 'test' },
        { identifier: 'gamma', location: 'test' },
        { identifier: 'delta', location: 'test' }
    ];
    const arr2: Dependency[] = [
        { identifier: 'gamma', location: 'test' },
        { identifier: 'delta', location: 'test' },
        { identifier: 'epsilon', location: 'test'}
    ];
    const result: Dependency[] = [
        { identifier: 'alfa', location: 'test' },
        { identifier: 'beta', location: 'test' }
    ];

    expect(substraction(arr2)(arr1)).toEqual(result);
});

test('addIfNotPresent should only add Dependency if not already present', () => {
    const dep1: Dependency = {identifier: 'alfa', location: 'test'};
    const dep2: Dependency = {identifier: 'beta', location: 'test'};
    expect(addIfNotPresent([dep1], dep1)).toEqual([dep1]);
    expect(addIfNotPresent([dep1], dep2)).toEqual([dep1, dep2]);
});