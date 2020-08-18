import * as ts from 'typescript';
import { RxJSPart } from './node_dispatcher_ref';

export const createImportDeclaration = (identifier: string, location: string): ts.ImportDeclaration => {
    const specifier = ts.createImportSpecifier(undefined, ts.createIdentifier(identifier));
    const namedImport = ts.createNamedImports([specifier]);
    const importClause = ts.createImportClause(undefined, namedImport);
    return ts.createImportDeclaration(undefined, undefined, importClause, ts.createStringLiteral(location));
};

const addImportToSourceFile = (source: ts.SourceFile, importDecl: ts.ImportDeclaration): ts.SourceFile => {
    return ts.updateSourceFileNode(source, [importDecl, ...source.statements]);
};

// export const addDefaultImports = (node: ts.SourceFile): ts.SourceFile => {
//     const importDecl = createImportDeclaration('wrapObservableStatement', 'rxjs-transformer/dist/rxjs_wrapper_ref');
//     const importDecl2 = createImportDeclaration('wrapSubscribe', 'rxjs-transformer/dist/rxjs_wrapper_ref');
//     const importDecl3 = createImportDeclaration('sendToBackpage', 'rxjs-transformer/dist/message');
//     const importDecl4 = createImportDeclaration('wrapPipeOperator', 'rxjs-transformer/dist/rxjs_wrapper_ref');
//     return addImportToSourceFile(addImportToSourceFile(addImportToSourceFile(addImportToSourceFile(node, importDecl), importDecl2), importDecl3), importDecl4);
// };

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
            default:
                throw new Error('Unknown RxJSPart!');
        }
    };
})();

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

// Add required imports to sourcfile node.
export const addImports = (node: ts.SourceFile, imports: Set<RxJSPart>): ts.SourceFile => {
    const importDecls = Array.from(imports).map(part => RxJSPartToImportDeclartion(part));
    if (importDecls.length) {
        importDecls.push(createImportDeclaration('sendToBackpage', 'rxjs-transformer/dist/message'));
    }

};