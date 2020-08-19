import ts from 'typescript';
import { dispatch, RxJSPart } from './node_dispatcher_ref';
import { log } from './logger_ref';
import { addImports } from './importer_ref';

const excludedFiles: RegExp[] = [
    /.+\/rxjs_wrapper.ts/,
    /.+\/node_modules.+/
];

// Recursively visit every node in sourcefile.
const visitSourceFile = (sourceFile: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile => {
    // let transformed = false;
    const imports = new Set<RxJSPart>();

    const visitNodes = (node: ts.Node): ts.Node => {
        const [dispatchedNode, classification] = dispatch(node);
        imports.add(classification);
        
        // if(dispatchedNode.transformed) {
        //     transformed = true;
        // }

        return ts.visitEachChild(dispatchedNode, visitNodes, context);
    };

    const root = visitNodes(sourceFile) as ts.SourceFile;
    // if (transformed) {
    //     return addDefaultImports(root);
    // }
    return addImports(root, imports)
    // return root;
};

// Transform all RxJS nodes to extract metadata without chaning behavior.
export const RxJSTransformer = (context: ts.TransformationContext) => {
    return (rootNode: ts.SourceFile) => {
        if (excludedFiles.some(match => match.test(rootNode.fileName))) {
            return rootNode;
        } else if (!rootNode.fileName.includes('app.component')) {
            return rootNode;
        }

        const transformedSourceFile = visitSourceFile(rootNode, context);
        log(transformedSourceFile);
        return transformedSourceFile;
    };
};