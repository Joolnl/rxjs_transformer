import { touch, wrapRxJSCreationOperator, wrapRxJSJoinCreationOperator } from "./operator_wrapper_ref";
import { createNode, printNode } from './compiler_helper';
import * as ts from 'typescript';

test('touch should make a node touched.', () => {
    const [node] = createNode<ts.CallExpression>(`of(100);`, ts.SyntaxKind.CallExpression);
    const result = touch(node);
    expect(node.getText()).toEqual(result.getText());
    expect(result.touched).toBe(true);
});

test('wrapRxJSCreationOperator should create wrapped node from RxJS Creation node.', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`of(100);`, ts.SyntaxKind.CallExpression);
    const result = wrapRxJSCreationOperator(node);
    const stringResult = printNode(result, sourceFile);
    expect(ts.isCallExpression(result)).toBe(true);
    expect(ts.isCallExpression(result.expression)).toBe(true);
    expect(stringResult).toMatch(/wrapCreationOperator\(of,.+\)\(100\)/);   //Matches wrapCreationOperator with any metadata object.
});

test('wrapRxJSJoinCreationOperator should create wrapped node from RxJS Join Creation node.', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`merge(interval(100), of('asdf'));`, ts.SyntaxKind.CallExpression);
    const result = wrapRxJSJoinCreationOperator(node);
    const stringResult = printNode(result, sourceFile);
    expect(ts.isCallExpression(result)).toBe(true);
    expect(ts.isCallExpression(result.expression)).toBe(true);
    expect(stringResult).toMatch(/wrapJoinOperator\(merge,.+\)\(interval\(100\), of\(\'asdf\'\)\)/);   //Matches wrapJoinOperator with any metadata object.
    console.log(stringResult);
});