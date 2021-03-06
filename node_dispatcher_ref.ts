import * as ts from 'typescript';
import { rxjsCreationOperators, rxjsJoinCreationOperators, rxjsObjectKinds, rxjsSubjectKinds } from './rxjs_operators';
import { wrapObservableStatement, wrapSubscribeExpression, wrapPipeOperatorExpression } from './operator_wrapper_ref';

// Make node touchable by casting it to Touched.
export type Touched<T extends ts.Node> = T & {
    touched?: boolean;
};

type Transformed<T extends ts.Node> = T & {
    transformed?: boolean;
};

type Classifier = (node: ts.Node) => boolean;

export enum RxJSPart {
    observable = 'OBSERVABLE',
    subscriber = 'SUBSCRIBER',
    pipeOperator = 'PIPEOPERATOR',
    unclassified = 'UNCLASSIFIED'
};

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

export const isSubscribe: Classifier = classifierTemplate((node) => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        if (node.expression.name.getText() === 'subscribe') {
            return true;
        }
    }
    return false;
});

export const isPipeOperator: Classifier = classifierTemplate((node) => {
    if (ts.isCallExpression(node) && ts.isCallExpression(node.parent) && ts.isPropertyAccessExpression(node.parent.expression)) {
        if (ts.isIdentifier(node.parent.expression.name) && node.parent.expression.name.getText() === 'pipe') {
            return true;
        }
    }
    return false;
});

// Classify node by set of classifiers, if classified return true.
export const classify = (node: Touched<ts.Node>): RxJSPart => {
    const classifiers: [Classifier, RxJSPart][] = [
        [isRxJSCreationOperator, RxJSPart.observable],
        [isRxJSJoinCreationOperator, RxJSPart.observable],
        [isObjectOrSubjectConstructor, RxJSPart.observable],
        [isSubscribe, RxJSPart.subscriber],
        [isPipeOperator, RxJSPart.pipeOperator]
    ];

    const classification = classifiers
        .filter(tuple => tuple[0](node))
        .map(tuple => tuple[1])
        .pop();

    return classification ? classification : RxJSPart.unclassified;
};

// Marks a node as transformed.
const markAsTransformed = (node: ts.Node): Transformed<ts.Node> => {
    return { ...node, transformed: true };
}

// Classify node, dispatch to appropriate wrapper function.
export const dispatch = (node: Touched<ts.Node>): [Transformed<ts.Node>, RxJSPart] => {
    const classification = classify(node);

    switch (classification) {
        case RxJSPart.observable: {
            const transformed = markAsTransformed(wrapObservableStatement(node as ts.CallExpression));
            return [transformed, classification];
        }
        case RxJSPart.subscriber: {
            const transformed = markAsTransformed(wrapSubscribeExpression(node as ts.CallExpression));
            return [transformed, classification];
        }
        case RxJSPart.pipeOperator: {
            const transformed = markAsTransformed(wrapPipeOperatorExpression(node as ts.CallExpression));
            return [transformed, classification];
        }
        default:
            return [node, classification];
    };
};