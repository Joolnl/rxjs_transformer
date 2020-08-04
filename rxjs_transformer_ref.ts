import ts from 'typescript';
import { dispatch } from './node_dispatcher_ref';
import { log } from './logger_ref';
import { addDefaultImports } from './importer_ref';

const excludedFiles: RegExp[] = [
    /.+\/rxjs_wrapper.ts/,
    /.+\/node_modules.+/
];

const visitSourceFile = (sourceFile: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile => {
    let transformed = false;

    const visitNodes = (node: ts.Node): ts.Node => {
        const dispatchedNode = dispatch(node);
        if(dispatchedNode.transformed) {
            transformed = true;
        }

        return ts.visitEachChild(dispatchedNode, visitNodes, context);
    };

    const root = visitNodes(sourceFile) as ts.SourceFile;
    if (transformed) {
        console.log(`adding default imports to ${root.fileName}`);
        return addDefaultImports(root);
    }
    return root;
};

// Transform all RxJS nodes to extract metadata without chaning behavior.
export const RxJSTransformer = (context: ts.TransformationContext) => {
    return (rootNode: ts.SourceFile) => {
        if (excludedFiles.some(match => match.test(rootNode.fileName))) {
            return rootNode;
        } else if (!rootNode.fileName.includes('app.component')) {
            return rootNode;
        }

        console.log(`transforming  ${rootNode.fileName}`);
        const transformedSourceFile = visitSourceFile(rootNode, context);
        log(transformedSourceFile);
        return transformedSourceFile;
    };
};