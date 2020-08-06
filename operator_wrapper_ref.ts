import * as ts from 'typescript';
import { Touched } from './node_dispatcher_ref';
import { createMetadataObject, RxJSPart } from './metadata_ref';

// Mark node as touched so it won't be mutated again.
export const touch = <T extends ts.Node>(node: ts.Node): Touched<T> => {
    const touched = node as Touched<T>;
    touched.touched = true;
    return touched;
};

// Template function to wrapp call expression nodes. Returns wrapped node in curried style.
const wrapCallExpressionNode = (call: string) => (node: ts.CallExpression | ts.NewExpression): ts.CallExpression => {
    const metadata = createMetadataObject(node, RxJSPart.Observable);
    return ts.createCall(ts.createCall(ts.createIdentifier(call), undefined, [metadata, ts.createIdentifier('sendToBackpage')]), undefined, [touch(node)]);
};

// export const wrapRxJSNode = wrapCallExpressionNode(wrapObservableStatement.name);
export const wrapRxJSNode = wrapCallExpressionNode('wrapObservableStatement');


export const wrapSubscribeExpression = (node: ts.CallExpression): ts.CallExpression => {
    const metadata = createMetadataObject(node, RxJSPart.Subscriber);
    const wrappedArgs = ts.createCall(ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, node.arguments), undefined, [metadata, ts.createIdentifier('sendToBackpage')]);
    return touch(ts.updateCall(node, node.expression, undefined, [wrappedArgs]));
};