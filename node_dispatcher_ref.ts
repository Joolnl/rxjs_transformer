import * as ts from 'typescript';
import { rxjsCreationOperators, rxjsJoinCreationOperators, rxjsObjectKinds, rxjsSubjectKinds } from './rxjs_operators';
import { wrapRxJSNode } from './operator_wrapper_ref';

// Make node touchable by casting it to Touched.
export type Touched<T extends ts.Node> = T & {
    touched?: boolean;
};


type Classifier = (node: ts.Node) => boolean;

// Wrapper function to check shared node classification aspects, curryable with classifier fn.
const classifierTemplate = <T extends ts.Node>(classifier: (node: Touched<T>) => boolean) => (node: Touched<T>): boolean => {
    if (node.getSourceFile() !== undefined && !node.touched) {
        if (classifier(node)) {
            return true;
        }
    }
    return false;
};

export const isRxJSCreationOperator: Classifier = classifierTemplate((node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        if (rxjsCreationOperators.some(operator => operator === node.expression.getText())) {
            return true;
        }
    }
    return false;
});

export const isRxJSJoinCreationOperator: Classifier = classifierTemplate((node) => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        if (rxjsJoinCreationOperators.some(operator => operator === node.expression.getText())) {
            return true;
        }
    }
    return false;
});

export const isObjectOrSubjectConstructor: Classifier = classifierTemplate((node) => {
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
        if ([...rxjsObjectKinds, ...rxjsSubjectKinds].some(operator => operator === node.expression.getText())) {
            return true;
        }
    }
    return false;
});

// Classify node by set of classifiers, if classified return true.
export const classify = (node: Touched<ts.Node>): boolean => {
    const classifiers = [
        isRxJSCreationOperator,
        isRxJSJoinCreationOperator,
        isObjectOrSubjectConstructor
    ];

    const isRxJSNode = classifiers
        .filter(fn => fn(node))
        .map(_ => true)
        .pop();
    
    return isRxJSNode ? true : false;
};

// Classify node, dispatch to appropriate wrapper function.
export const dispatch = (node: Touched<ts.Node>): ts.Node => {
    const isRxJSNode = classify(node);
    return isRxJSNode ? wrapRxJSNode(node as ts.CallExpression) : node;
};