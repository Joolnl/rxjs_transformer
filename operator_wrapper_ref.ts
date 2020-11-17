import * as ts from 'typescript';
import { Touched } from './node_dispatcher_ref';
import { createMetadataObject, RxJSPart } from './metadata_ref';

export enum OperatorPosition {
    last = 'LAST',
    first = 'FIRST',
    middle = 'MIDDLE',
    only = 'ONLY'
}

// Mark node as touched so it won't be mutated again.
export const touch = <T extends ts.Node>(node: ts.Node): Touched<T> => {
    const touched = node as Touched<T>;
    touched.touched = true;
    return touched;
};

// Set relative position of operator in pipe.
export const getOperatorPosition = (node: ts.CallExpression): OperatorPosition => {
    if (ts.isCallExpression(node.parent)) {
        const index = node.parent.arguments
            .map(arg => arg.getText())
            .indexOf(node.getText());

        let relativePosition: OperatorPosition;

        if (node.parent.arguments.length === 1) {
            relativePosition = OperatorPosition.only;
        } else if (index === node.parent.arguments.length - 1) {
            relativePosition = OperatorPosition.last;
        } else if (index === 0) {
            relativePosition = OperatorPosition.first;
        } else {
            relativePosition = OperatorPosition.middle;
        }

        return relativePosition;
    }
    throw new Error('Parent not a pipe statement, can\'t set operator position!');
};

// Recursively get source observable from any pipe operator.
export const getSource = (node: ts.CallExpression): ts.Identifier => {
    const expressionWalker = (node: ts.CallExpression | ts.PropertyAccessExpression): ts.Identifier => {
        if (ts.isIdentifier(node.expression)) {
            return node.expression;
        } else if (ts.isCallExpression(node.expression) || ts.isPropertyAccessExpression(node.expression)) {
            return expressionWalker(node.expression);
        }
        throw new Error(`Couldn't fetch source from pipe operator!`);
    }

    if (ts.isCallExpression(node.parent)) {
        return expressionWalker(node.parent);
    }
    throw new Error('Couldn\'t fetch source from pipe operator!');
};

// Template function to wrap call expression nodes. Returns wrapped node in curried style.
const wrapCallExpressionNode = (call: string) => (node: ts.CallExpression | ts.NewExpression): ts.CallExpression => {
    const metadata = createMetadataObject(node, RxJSPart.Observable);
    return ts.createCall(ts.createCall(ts.createIdentifier(call), undefined, [metadata, ts.createIdentifier('sendToBackpage')]), undefined, [touch(node)]);
};

// export const wrapRxJSNode = wrapCallExpressionNode(wrapObservableStatement.name);
export const wrapObservableStatement = wrapCallExpressionNode('wrapObservableStatement');
// export const wrapPipeOperatorExpression = wrapCallExpressionNode('wrapPipeOperator')

export const wrapPipeOperatorExpression = (node: ts.CallExpression): ts.CallExpression => {
    const metadata = createMetadataObject(node, RxJSPart.Operator);
    const relativePosition = ts.createStringLiteral(getOperatorPosition(node));
    return ts.createCall(ts.createCall(ts.createIdentifier('wrapPipeOperator'), undefined, [metadata, ts.createIdentifier('sendToBackpage'), relativePosition]), undefined, [touch(node)]);
};

export const wrapSubscribeExpression = (node: ts.CallExpression): ts.CallExpression => {
    const metadata = createMetadataObject(node, RxJSPart.Subscriber);
    const wrappedArgs = ts.createCall(ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, node.arguments), undefined, [metadata, ts.createIdentifier('sendToBackpage')]);
    return touch(ts.updateCall(node, node.expression, undefined, [wrappedArgs]));
};
