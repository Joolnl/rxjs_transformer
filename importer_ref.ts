import * as ts from 'typescript';

const createImportDeclaration = (identifier: string, location: string): ts.ImportDeclaration => {
    const specifier = ts.createImportSpecifier(undefined, ts.createIdentifier(identifier));
    const namedImport = ts.createNamedImports([specifier]);
    const importClause = ts.createImportClause(undefined, namedImport);
    return ts.createImportDeclaration(undefined, undefined, importClause, ts.createStringLiteral(location));
};

const addImportToSourceFile = (source: ts.SourceFile, importDecl: ts.ImportDeclaration): ts.SourceFile => {
    return ts.updateSourceFileNode(source, [importDecl, ...source.statements]);
};

export const addDefaultImports = (node: ts.SourceFile): ts.SourceFile => {
    const importDecl = createImportDeclaration('wrapObservableStatement', 'rxjs-transformer/dist/rxjs_wrapper_ref');
    const importDecl2 = createImportDeclaration('wrapSubscribe', 'rxjs-transformer/dist/rxjs_wrapper_ref');
    const importDecl3 = createImportDeclaration('sendToBackpage', 'rxjs-transformer/dist/message');
    const importDecl4 = createImportDeclaration('wrapPipeOperator', 'rxjs-transformer/dist/rxjs_wrapper_ref');
    return addImportToSourceFile(addImportToSourceFile(addImportToSourceFile(addImportToSourceFile(node, importDecl), importDecl2), importDecl3), importDecl4);
};