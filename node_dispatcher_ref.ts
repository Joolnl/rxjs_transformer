import * as ts from 'typescript';
import { rxjsCreationOperators, rxjsJoinCreationOperators, rxjsObjectKinds, rxjsSubjectKinds } from './rxjs_operators';
import { wrapRxJSCreationOperator, wrapRxJSJoinCreationOperator, wrapObjectSubjectConstructor } from './operator_wrapper_ref';

type NodeType = 'UNCLASSIFIED' | 'RXJS_CREATION_OPERATOR' | 'RXJS_JOIN_CREATION_OPERATOR' | 'RXJS_PIPE' | 'RXJS_SUBSCRIBE' | 'OBSERVABLE' | 'SUBJECT'
    | 'RXJS_OBJECT_SUBJECT_CONSTRUCTOR';

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

// type ClassifierNodeTypeSet
export const classify = (node: Touched<ts.Node>): NodeType => {
    const classifierMap: [Classifier, NodeType][] = [
        [isRxJSCreationOperator, 'RXJS_CREATION_OPERATOR'],
        [isRxJSJoinCreationOperator, 'RXJS_JOIN_CREATION_OPERATOR'],
        [isObjectOrSubjectConstructor, 'RXJS_OBJECT_SUBJECT_CONSTRUCTOR']
    ];

    const classifications = classifierMap
        .filter(tuple => tuple[0](node))
        .map(tuple => tuple[1]);

    return classifications.length ? classifications.pop() : 'UNCLASSIFIED';
};

// Classify node, dispatch to appropriate wrapper function.
export const dispatch = (node: Touched<ts.Node>): ts.Node => {
    const classification = classify(node);

    switch (classification) {
        case 'UNCLASSIFIED':
            return node;
        case 'RXJS_CREATION_OPERATOR':
            return wrapRxJSCreationOperator(node as ts.CallExpression);
        case 'RXJS_JOIN_CREATION_OPERATOR':
            return wrapRxJSJoinCreationOperator(node as ts.CallExpression);
        case 'RXJS_OBJECT_SUBJECT_CONSTRUCTOR':
            return wrapObjectSubjectConstructor(node as ts.NewExpression);
        default:
            return node;
    }
};