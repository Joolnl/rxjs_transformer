import * as ts from 'typescript';
import { createWrapCreationExpression, createWrapJoinCreationExpression, wrapSubscribeMethod, wrapPipeStatement, wrapPropertyDeclaration, wrapObservableSubjectConstructor } from './operator_wrapper';
import { extractMetadata } from './metadata';
import { Dependency, wrapperLocation } from './importer';
import { rxjsCreationOperators, rxjsJoinCreationOperators, rxjsSubjectKinds, rxjsObjectKinds } from './rxjs_operators';


type NodeType = 'UNCLASSIFIED' | 'RXJS_CREATION_OPERATOR' | 'RXJS_JOIN_CREATION_OPERATOR' | 'RXJS_PIPE' | 'RXJS_SUBSCRIBE' | 'OBSERVABLE' | 'SUBJECT'
    | 'RXJS_OBJECT_SUBJECT_CONSTRUCTOR';

    
type Classifier = (node: ts.Node) => [boolean, NodeType, Dependency];

const classifierTemplate = (classifier: (node: ts.Node) => boolean) => (node: ts.Node): boolean => {
    if (node.getSourceFile() !== undefined) {
        if (classifier(node)) {
            return true;
        }
    }
};

// TODO: we need the actual observable, with the name and such not the typereference...
// For classifying TypeReference nodes by given identifiers as type check.
const isPropertyDeclaration = (identifiers: string[], check: NodeType): Classifier => (node) => {
    if (node.getSourceFile() !== undefined && ts.isPropertyDeclaration(node) && node.type !== undefined) {
        if (ts.isTypeReferenceNode(node.type) && identifiers.includes(node.type.typeName.getText())) {
            return [true, check, null];
        }
    }
    return [false, null, null];
};

// For classifiying RxJS Creation operator nodes.
export const isRxJSCreationOperator: Classifier = (node) => {
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

// For classifying RxJS Object en Subject constructor nodes.
const isObjectOrSubjectConstructor: Classifier = (node) => {
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.getSourceFile !== undefined) {
        console.log(node.parent.getText())
        if ([...rxjsObjectKinds, ...rxjsSubjectKinds].includes(node.expression.getText())) {
            const dependency = { identifier: node.expression.getText(), location: 'rxjs' };
            return [true, 'RXJS_OBJECT_SUBJECT_CONSTRUCTOR', dependency];
        }
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
        isSubscribePropertyAccessExpr,
        isObjectOrSubjectConstructor,
        isPropertyDeclaration(rxjsObjectKinds, 'OBSERVABLE'),
        isPropertyDeclaration(rxjsSubjectKinds, 'SUBJECT')
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
            case 'RXJS_OBJECT_SUBJECT_CONSTRUCTOR':
                node = wrapObservableSubjectConstructor(node as ts.NewExpression);
                return [node, dependency];
            case 'OBSERVABLE':
            case 'SUBJECT':
                node = wrapPropertyDeclaration(node as ts.PropertyDeclaration);
                return [node, null];
            default:
                throw new Error('Invalid node classification!');
        }
    } catch (e) {
        const { file, line, pos } = extractMetadata(node);
        console.error(`Failed transforming node ${line}:${pos} in ${file}`);
        console.log(e);
        return [node, null];
    }

};
