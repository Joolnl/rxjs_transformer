import * as ts from 'typescript';
import { Touched } from './node_dispatcher_ref';

// Mark node as touched so it won't be mutated again.
export const touch = <T extends ts.Node>(node: ts.Node): Touched<T> => {
    const touched = node as Touched<T>;
    touched.touched = true;
    return touched;
};

// Template function to wrapp call expression nodes. Returns wrapped node in curried style.
const wrapCallExpressionNode = (call: string) => (node: ts.CallExpression, ...args: any[]) => {
    const metadata = ts.createNull();
    const identifier = node.expression as ts.Identifier;
    const callArgs = node.arguments;
    return ts.createCall(ts.createCall(ts.createIdentifier(call), undefined, [touch(identifier), metadata]), undefined, callArgs);
};

// Wrap RxJS Creation Operator.
export const wrapRxJSCreationOperator = wrapCallExpressionNode('wrapCreationOperator');

// Wrap RxJS Joing Creation Operator.
export const wrapRxJSJoinCreationOperator = wrapCallExpressionNode('wrapJoinOperator');