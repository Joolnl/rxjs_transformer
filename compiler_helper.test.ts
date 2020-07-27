import { createNode } from './compiler_helper';
import * as ts from 'typescript';

test('createNode should return a ts.node representing given TypeScript code.', () => {
    const node = createNode(`of(1)`, ts.SyntaxKind.CallExpression);
    expect(ts.isCallExpression(node)).toBe(true);
    expect(node.getText()).toEqual(`of(1)`);

    const node2 = createNode(`new Observable();`, ts.SyntaxKind.NewExpression);
    expect(ts.isNewExpression(node2)).toBe(true);
    expect(node2.getText()).toEqual(`new Observable()`);
});

test('createNode should throw an Error with invalid TypeScript input.', () => {
    expect(createNode('$%&^$!&^%$&*', ts.SyntaxKind.ThisType)).toThrow();
});