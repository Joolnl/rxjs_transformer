import * as ts from 'typescript';
import { Touched } from './node_dispatcher_ref';
import { createMetadataObject, RxJSPart } from './metadata_ref';
import { test, wrapCreationOperator } from './rxjs_wrapper_ref';

// Mark node as touched so it won't be mutated again.
export const touch = <T extends ts.Node>(node: ts.Node): Touched<T> => {
    const touched = node as Touched<T>;
    touched.touched = true;
    return touched;
};

// Template function to wrapp call expression nodes. Returns wrapped node in curried style.
const wrapCallExpressionNode = (call: string) => (node: ts.CallExpression | ts.NewExpression, ...args: any[]): ts.CallExpression => {
    const metadata = createMetadataObject(node, RxJSPart.Observable);
    const identifier = node.expression as ts.Identifier;
    const callArgs = node.arguments;
    return ts.createCall(ts.createCall(ts.createIdentifier(call), undefined, [touch(identifier), metadata]), undefined, callArgs);
};

// Template function to wrapp constructor nodes.
const wrapConstructorNode = (call: string) => (node: ts.NewExpression): ts.CallExpression => {
    const metadata = createMetadataObject(node, RxJSPart.Observable); // TODO: the part is not correct, could be both observable and subject.
    return ts.createCall(ts.createCall(ts.createIdentifier(call), undefined, [touch(node)]), undefined, [metadata]);
};

// Wrap RxJS Creation Operator. e.g. of(100)
export const wrapRxJSCreationOperator = wrapCallExpressionNode(wrapCreationOperator.name);

// Wrap RxJS Join Creation Operator. e.g. merge(of(100), interval(1000))
export const wrapRxJSJoinCreationOperator = wrapCallExpressionNode('wrapJoinOperator');

// Wrap RxJS constructor node. e.g. new BehaviorSubject<number>()
export const wrapObjectSubjectConstructor = wrapConstructorNode('wrapConstructor');

console.log(test.name);