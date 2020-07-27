import * as ts from 'typescript';
import { rxjsCreationOperators, rxjsJoinCreationOperators } from './rxjs_operators';

type NodeType = 'UNCLASSIFIED' | 'RXJS_CREATION_OPERATOR' | 'RXJS_JOIN_CREATION_OPERATOR' | 'RXJS_PIPE' | 'RXJS_SUBSCRIBE' | 'OBSERVABLE' | 'SUBJECT'
    | 'RXJS_OBJECT_SUBJECT_CONSTRUCTOR';

// Make node touchable by casting it to Touched.
export interface Touched extends ts.Node {
    touched?: boolean;
}

type Classifier = (node: ts.Node) => boolean;

// Wrapper function to check shared node classification aspects.
const classifierTemplate = (classifier: (node: Touched) => boolean) => (node: Touched): boolean => {
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
});

// type ClassifierNodeTypeSet
export const classify = (node: Touched): NodeType => {
    const classifierMap: [Classifier, NodeType][] = [
        [isRxJSCreationOperator, 'RXJS_CREATION_OPERATOR'],
        [isRxJSJoinCreationOperator, 'RXJS_JOIN_CREATION_OPERATOR'],
    ];

    const classifications =  classifierMap
        .filter(tuple => tuple[0](node))
        .map(tuple => tuple[1]);
    
    return classifications.length ? classifications.pop() : 'UNCLASSIFIED';
};