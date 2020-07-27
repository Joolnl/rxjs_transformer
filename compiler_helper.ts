import * as ts from 'typescript';

const fetchNodeFromSourceFile = (node: ts.SourceFile | ts.Node): ts.Node => {
    if (ts.isSourceFile(node) || node.kind === 312 || ts.isExpressionStatement(node)) {
        return fetchNodeFromSourceFile(node.getChildren().shift());
    } else {
        return node;
    }
};

// Create ts.Node from given typescript code.
export const createNode = (code: string, type: number): ts.Node => {
    const sourcefile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.ES2015, true);
    const node = fetchNodeFromSourceFile(sourcefile);
    if (node.kind !== type) {
        throw new Error(`TypeScript node created from given code doesn't match expected type, expected: ${type} but compiled: ${node.kind}!`);
    }
    return node;
};