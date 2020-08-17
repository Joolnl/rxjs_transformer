import { touch, wrapRxJSNode, wrapSubscribeExpression } from "./operator_wrapper_ref";
import { createNode, printNode } from './compiler_helper';
import * as ts from 'typescript';

test('touch should make a node touched.', () => {
    const [node] = createNode<ts.CallExpression>(`of(100);`, ts.SyntaxKind.CallExpression);
    const result = touch(node);
    expect(node.getText()).toEqual(result.getText());
    expect(result.touched).toBe(true);
});

test('wrapRxJSCreationOperator should create wrapped node from RxJS creation node.', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`of({a: true, b: 'nope', c: 7});`, ts.SyntaxKind.CallExpression);
    const result = wrapRxJSNode(node);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toMatch(/wrapObservableStatement\(.+\)\(of\({ a: true, b: \'nope\', c: 7 }\)\)/);
});

test('wrapRxJSCreationOperator should create wrapped node from RxJS constructor node.', () => {
    const [node, sourceFile] = createNode<ts.NewExpression>(`new Observable<number>();`, ts.SyntaxKind.NewExpression);
    const result = wrapRxJSNode(node);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toMatch(/wrapObservableStatement\(.+\)\(.+\)/);
});

test('wrapSubscribeExpressions should create wrapped subscribe node containing one function.', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`of(100).subscribe(x => console.log(x))`, ts.SyntaxKind.CallExpression);
    const result = wrapSubscribeExpression(node);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toMatch(/of\(100\)\.subscribe\(wrapSubscribe\(x => console.log\(x\)\)\({.+}, sendToBackpage\)\)/);
});