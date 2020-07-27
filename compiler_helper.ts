import * as ts from 'typescript';

// Find the desired node in compiled sourcefile.
const fetchNodeFromSourceFile = (node: ts.SourceFile | ts.Node): ts.Node => {
    if (ts.isSourceFile(node) || node.kind === 312 || ts.isExpressionStatement(node)) {
        return fetchNodeFromSourceFile(node.getChildren().shift());
    } else {
        return node;
    }
};

// Create ts.Node from given typescript code.
export const createNode = <T extends ts.Node>(code: string, type: number): T => {
    const sourcefile = ts.createSourceFile('test.ts', code, ts.ScriptTarget.ES2015, true);
    const node = fetchNodeFromSourceFile(sourcefile);
    if (node.kind !== type) {
        throw new Error(`TypeScript node created from given code doesn't match expected type, expected: ${type} but compiled: ${node.kind}!`);
    }

    return node as T;
};