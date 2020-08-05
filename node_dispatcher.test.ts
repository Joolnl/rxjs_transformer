import { isRxJSCreationOperator, Touched, isRxJSJoinCreationOperator, isObjectOrSubjectConstructor, classify, RxJSPart, isSubscribe } from './node_dispatcher_ref';
import { createNode } from './compiler_helper';
import * as ts from 'typescript';


test('isRxJSCreationOperator should identify RxJS creation nodes.', () => {
    const [node] = createNode<ts.CallExpression>(`of(1);`, ts.SyntaxKind.CallExpression);
    const touched = Object.create(node) as Touched<ts.CallExpression>;
    touched.touched = true;
    expect(isRxJSCreationOperator(node)).toBe(true);
    expect(isRxJSCreationOperator(touched)).toBe(false);

    const [node2] = createNode<ts.CallExpression>(`test();`, ts.SyntaxKind.CallExpression);
    expect(isRxJSCreationOperator(node2)).toBe(false);
});

test('isRxjsJoinCreationOperator should identify RxJS join creation nodes.', () => {
    const [node] = createNode<ts.CallExpression>(`merge(of(1), of(2));`, ts.SyntaxKind.CallExpression);
    expect(isRxJSJoinCreationOperator(node)).toBe(true);

    const [node2] = createNode<ts.CallExpression>(`notMergeFunction(arg1, arg2);`, ts.SyntaxKind.CallExpression);
    expect(isRxJSJoinCreationOperator(node2)).toBe(false);
});

test('isObjectOrSubjectConstructor should identifiy RxJS Subject or Object contructor nodes.', () => {
    const [node] = createNode<ts.NewExpression>(`new Observable();`, ts.SyntaxKind.NewExpression);
    const [node2] = createNode<ts.NewExpression>(`new Observable<number>();`, ts.SyntaxKind.NewExpression);
    const [node3] = createNode<ts.NewExpression>(`new BehaviorSubject<string>();`, ts.SyntaxKind.NewExpression);
    const [node4] = createNode<ts.NewExpression>(`new NoRxJSSubject<string>();`, ts.SyntaxKind.NewExpression);

    expect(isObjectOrSubjectConstructor(node)).toBe(true);
    expect(isObjectOrSubjectConstructor(node2)).toBe(true);
    expect(isObjectOrSubjectConstructor(node3)).toBe(true);
    expect(isObjectOrSubjectConstructor(node4)).toBe(false);
});

test('isSubscribe should identify RxJS subscribe call.', () => {
    const [node] = createNode<ts.CallExpression>(`of(100).subscribe(x => console.log(x))`, ts.SyntaxKind.CallExpression);
    const [node2] = createNode<ts.CallExpression>(`a.subscribe(x => console.log(x))`, ts.SyntaxKind.CallExpression);
    const [node3] = createNode<ts.CallExpression>(`of.print(x => console.log(x))`, ts.SyntaxKind.CallExpression);

    expect(isSubscribe(node)).toBe(true);
    expect(isSubscribe(node2)).toBe(true);    
    expect(isSubscribe(node3)).toBe(false);    
});

test('classify should classify RxJS nodes correctly.', () => {
    const [node] = createNode<ts.CallExpression>(`of(100);`, ts.SyntaxKind.CallExpression);
    const result = classify(node);
    expect(result).toBe(RxJSPart.observable);

    const [node2] = createNode<ts.CallExpression>(`console.log(100);`, ts.SyntaxKind.CallExpression);
    const result2 = classify(node2);
    expect(result2).toBe(RxJSPart.unclassified);
});