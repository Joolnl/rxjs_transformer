import { isRxJSCreationOperator, Touched, isRxJSJoinCreationOperator, classify, dispatch } from './node_dispatcher_ref';
import { createNode } from './compiler_helper';
import * as ts from 'typescript';


test('isRxJSCreationOperator should identify RxJS creation nodes.', () => {
    const node = createNode<ts.CallExpression>(`of(1);`, ts.SyntaxKind.CallExpression);
    const touched = Object.create(node) as Touched;
    touched.touched = true;
    expect(isRxJSCreationOperator(node)).toBe(true);
    expect(isRxJSCreationOperator(touched)).toBe(false);

    const node2 = createNode<ts.CallExpression>(`test();`, ts.SyntaxKind.CallExpression);
    expect(isRxJSCreationOperator(node2)).toBe(false);
});

test('isRxjsJoinCreationOperator should identify RxJS join creation nodes.', () => {
    const node = createNode<ts.CallExpression>(`merge(of(1), of(2));`, ts.SyntaxKind.CallExpression);
    expect(isRxJSJoinCreationOperator(node)).toBe(true);

    const node2 = createNode<ts.CallExpression>(`notMergeFunction(arg1, arg2);`, ts.SyntaxKind.CallExpression);
    expect(isRxJSJoinCreationOperator(node2)).toBe(false);
});

test('classify should return the appropriate NodeType for given node.', () => {
    const node = createNode<ts.CallExpression>(`interval(1000);`, ts.SyntaxKind.CallExpression);
    const type = classify(node);
    expect(type).toEqual('RXJS_CREATION_OPERATOR');

    const node2 = createNode<ts.CallExpression>(`combineLatest(of('asdf'), interval(600));`, ts.SyntaxKind.CallExpression);
    const type2 = classify(node2);
    expect(type2).toEqual('RXJS_JOIN_CREATION_OPERATOR');

    const node3 = createNode<ts.NewExpression>(`new Apple<string>();`, ts.SyntaxKind.NewExpression);
    const type3 = classify(node3);
    expect(type3).toEqual('UNCLASSIFIED');
});

test('dispatch node should return unaltered unlcassified nodes.', () => {
    const node = createNode<ts.NewExpression>(`new Banana<Apple>('grape');`, ts.SyntaxKind.NewExpression);
    const result = dispatch(node);
    expect(result).toEqual(node);

    const node2 = createNode<ts.CallExpression>(`of(500);`, ts.SyntaxKind.CallExpression) as Touched;
    node2.touched = true;
    const result2 = dispatch(node2);
    expect(node2).toEqual(result2);
})