import * as ts from 'typescript';
import { Touched } from './node_dispatcher_ref';
import { createMetadataObject, RxJSPart } from './metadata_ref';
import { wrapObservableStatement } from './rxjs_wrapper_ref';

// Mark node as touched so it won't be mutated again.
export const touch = <T extends ts.Node>(node: ts.Node): Touched<T> => {
    const touched = node as Touched<T>;
    touched.touched = true;
    return touched;
};

// Template function to wrapp call expression nodes. Returns wrapped node in curried style.
const wrapCallExpressionNode = (call: string) => (node: ts.CallExpression | ts.NewExpression): ts.CallExpression => {
    const metadata = createMetadataObject(node, RxJSPart.Observable);
    return ts.createCall(ts.createCall(ts.createIdentifier(call), undefined, [metadata]), undefined, [touch(node)]);
};

// export const wrapRxJSNode = wrapCallExpressionNode(wrapObservableStatement.name);
export const wrapRxJSNode = wrapCallExpressionNode('wrapObservableStatement');
