import { touch, wrapObservableStatement, wrapSubscribeExpression, wrapPipeOperatorExpression, getOperatorPosition, OperatorPosition, getSource } from "./operator_wrapper_ref";
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
    const result = wrapObservableStatement(node);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toMatch(/wrapObservableStatement\(.+\)\(of\({ a: true, b: \'nope\', c: 7 }\)\)/);
});

test('wrapRxJSCreationOperator should create wrapped node from RxJS constructor node.', () => {
    const [node, sourceFile] = createNode<ts.NewExpression>(`new Observable<number>();`, ts.SyntaxKind.NewExpression);
    const result = wrapObservableStatement(node);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toMatch(/wrapObservableStatement\(.+\)\(.+\)/);
});

test('wrapSubscribeExpressions should create wrapped subscribe node containing one function.', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`of(100).subscribe(x => console.log(x))`, ts.SyntaxKind.CallExpression);
    const result = wrapSubscribeExpression(node);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toMatch(/of\(100\)\.subscribe\(wrapSubscribe\(x => console.log\(x\)\)\({.+}, sendToBackpage\)\)/);
});

test('wrapPipeOperatorExpression should create wrapped pipeable operator.', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`source$.pipe(filter(x => x >= 5));`, ts.SyntaxKind.CallExpression);
    const operator = node.arguments[0] as ts.CallExpression;
    const result = wrapPipeOperatorExpression(operator);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toMatch(/wrapPipeOperator\({.+}, sendToBackpage, \"ONLY\"\)\(filter\(x => x >= 5\)\)/);
});

test('setOperatorPosition should set the position of only pipeable operator correct.', () => {
    const [node] = createNode<ts.CallExpression>(`source$.pipe(map(x => 7));`, ts.SyntaxKind.CallExpression);
    const only = node.arguments[0] as ts.CallExpression;
    const result = getOperatorPosition(only);
    expect(result).toBe(OperatorPosition.only);
});

test('setOperatorPosition should set the position of first pipeable operator correct.', () => {
    const [node] = createNode<ts.CallExpression>(`source$.pipe(map(x => 7), filter(x => x > 5));`, ts.SyntaxKind.CallExpression);
    const first = node.arguments[0] as ts.CallExpression;
    const result = getOperatorPosition(first);
    expect(result).toBe(OperatorPosition.first);
});

test('setOperatorPosition should set the position of last pipeable operator correct.', () => {
    const [node] = createNode<ts.CallExpression>(`source$.pipe(map(x => 7), filter(x => x > 5));`, ts.SyntaxKind.CallExpression);
    const last = node.arguments[1] as ts.CallExpression;
    const result = getOperatorPosition(last);
    expect(result).toBe(OperatorPosition.last);
});

test('setOperatorPosition should set the position of middle pipeable operator correct.', () => {
    const [node] = createNode<ts.CallExpression>(`source$.pipe(map(x => 7), filter(x => x > 5), map(x => 'asdf'));`, ts.SyntaxKind.CallExpression);
    const middle = node.arguments[1] as ts.CallExpression;
    const result = getOperatorPosition(middle);
    expect(result).toBe(OperatorPosition.middle);
});

test('getSource should return the source of a pipeoperator.', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`source$.pipe(map(x => 7), map(x => x += 30));`, ts.SyntaxKind.CallExpression);
    const pipeOperator = node.arguments[1] as ts.CallExpression;
    const result = getSource(pipeOperator);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toBe('source$');
});

test('getSource should return the source of pipeoperator with multiple pipe statements.', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`source$.pipe(map(x => 7)).pipe(map(x => x += 30));`, ts.SyntaxKind.CallExpression);
    const pipeOperator = node.arguments[0] as ts.CallExpression;
    const result = getSource(pipeOperator);
    const stringResult = printNode(result, sourceFile);
    expect(stringResult).toBe('source$');
});