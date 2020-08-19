import * as ts from 'typescript';
import { RxJSPart } from './node_dispatcher_ref';

export const createImportDeclaration = (identifier: string, location: string): ts.ImportDeclaration => {
    const specifier = ts.createImportSpecifier(undefined, ts.createIdentifier(identifier));
    const namedImport = ts.createNamedImports([specifier]);
    const importClause = ts.createImportClause(undefined, namedImport);
    return ts.createImportDeclaration(undefined, undefined, importClause, ts.createStringLiteral(location));
};

// Turn RxJSPart into import declaration.
export const RxJSPartToImportDeclartion = (() => {
    const wrapObservable = createImportDeclaration('wrapObservableStatement', 'rxjs-transformer/dist/rxjs_wrapper_ref');
    const wrapSubscribe = createImportDeclaration('wrapSubscribe', 'rxjs-transformer/dist/rxjs_wrapper_ref');
    const wrapOperator = createImportDeclaration('wrapPipeOperator', 'rxjs-transformer/dist/rxjs_wrapper_ref');

    return (part: RxJSPart): ts.ImportDeclaration => {
        switch (part) {
            case RxJSPart.observable:
                return wrapObservable;
            case RxJSPart.subscriber:
                return wrapSubscribe;
            case RxJSPart.pipeOperator:
                return wrapOperator;
            case RxJSPart.unclassified:
                return null;
            default:
                throw new Error('Unknown RxJSPart!');
        }
    };
})();

// Recursively add import declarations to sourcefile.
export const addImportsToSourceFile = (node: ts.SourceFile, imports: ts.ImportDeclaration[]): ts.SourceFile => {
    if (imports.length) {
        return addImportsToSourceFile(
            ts.updateSourceFileNode(node, [imports.pop(), ...node.statements]),
            imports
        );
    } else {
        return node;
    }
};

// Add required imports to sourcfile node for given RxJSPart set and sourcefile.
export const addImports = (node: ts.SourceFile, imports: Set<RxJSPart>): ts.SourceFile => {
    const importDecls = Array.from(imports)
        .map(part => RxJSPartToImportDeclartion(part))
        .filter(imp => imp !== null);
    if (importDecls.length) {
        importDecls.push(createImportDeclaration('sendToBackpage', 'rxjs-transformer/dist/message'));
    }
    return addImportsToSourceFile(node, importDecls);
};