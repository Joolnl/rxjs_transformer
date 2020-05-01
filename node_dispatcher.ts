import * as ts from 'typescript';
import { createWrapCreationExpression, createWrapJoinCreationExpression, wrapSubscribeMethod, wrapPipeStatement } from './operator_wrapper';
import { extractMetadata } from './metadata';
import { Dependency, wrapperLocation } from './importer';

export const rxjsCreationOperators = ['ajax', 'bindCallback', 'bindNodeCallback', 'defer', 'empty', 'from', 'fromEvent',
    'fromEventPattern', 'generate', 'interval', 'of', 'range', 'throwError', 'timer', 'iif'];

export const rxjsJoinCreationOperators = ['combineLatest', 'concat', 'forkJoin', 'merge', 'race', 'zip'];

type NodeType = 'UNCLASSIFIED' | 'RXJS_CREATION_OPERATOR' | 'RXJS_JOIN_CREATION_OPERATOR' | 'RXJS_PIPE' | 'RXJS_SUBSCRIBE';
type Classifier = (node: ts.Node) => [boolean, NodeType, Dependency];

// For classifiying RxJS Creation operator nodes.
const isRxJSCreationOperator: Classifier = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.getSourceFile() !== undefined) {
        const operator = node.expression.getText();
        const match = rxjsCreationOperators.some(rxjsOperator => rxjsOperator === operator);
        const dependency = { identifier: operator, location: 'rxjs' };
        return match ? [true, 'RXJS_CREATION_OPERATOR', dependency] : [false, null, null];
    }
    return [false, null, null];
};

// For classifying RxJS Join Creation operator nodes.
const isRxJSJoinCreationOperator: Classifier = (node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.getSourceFile() !== undefined) {
        const operator = node.expression.getText();
        const match = rxjsJoinCreationOperators.some(rxjsOperator => rxjsOperator === operator);
        const dependency = { identifier: operator, location: 'rxjs' };
        return match ? [true, 'RXJS_JOIN_CREATION_OPERATOR', dependency] : [false, null, null];
    }
    return [false, null, null];
};

// Check if node is pipe property access expression.
const isPipePropertyAccessExpr: Classifier = (node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const dependency = { identifier: 'wrapPipe', location: wrapperLocation };
        return node.expression.name.getText() === 'pipe'
            ? [true, 'RXJS_PIPE', dependency]
            : [false, null, null];
    }
    return [false, null, null];
};

// Check if node is subscribe property access expression.
const isSubscribePropertyAccessExpr: Classifier = (node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const dependency = { identifier: 'wrapSubscribe', location: wrapperLocation };
        return node.expression.name.getText() === 'subscribe'
            ? [true, 'RXJS_SUBSCRIBE', dependency]
            : [false, null, null];
    }
    return [false, null, null];
};

// Classify given node for list of classifiers.
const classify = (node: ts.Node): [NodeType, Dependency | null] => {
    const classifiers: Classifier[] = [
        isRxJSCreationOperator,
        isRxJSJoinCreationOperator,
        isPipePropertyAccessExpr,
        isSubscribePropertyAccessExpr
    ];

    for (let fn of classifiers) {
        const [match, type, operator] = fn(node);
        if (match) {
            return [type, operator];
        }
    }
    return ['UNCLASSIFIED', null];
};

// Transforms node if necassary, returns original or transformed node along possible function identifier.
export const dispatchNode = (node: ts.Node): [ts.Node, Dependency | null] => {
    // const nodeType = classifyDeprecated(node);
    const [nodeType, dependency] = classify(node);

    try {
        switch (nodeType) {
            case 'UNCLASSIFIED':
                return [node, null];
            case 'RXJS_CREATION_OPERATOR':
                node = createWrapCreationExpression(node as ts.CallExpression);
                return [node, dependency];
            case 'RXJS_JOIN_CREATION_OPERATOR':
                node = createWrapJoinCreationExpression(node as ts.CallExpression);
                return [node, dependency];
            case 'RXJS_PIPE':
                node = wrapPipeStatement(node as ts.CallExpression);
                return [node, dependency];
            case 'RXJS_SUBSCRIBE':
                node = wrapSubscribeMethod(node as ts.CallExpression);
                return [node, dependency];
            default:
                throw new Error('Invalid node classification!');
        }
    } catch (e) {
        const { file, line, pos } = extractMetadata(node);
        console.error(`Failed transforming node ${line}:${pos} in ${file}`);
        return [node, null];
    }

};
