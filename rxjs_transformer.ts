import * as ts from 'typescript';
import { dispatchNode } from './node_dispatcher';

// Add import to given SourceFile.
// format: import importname as alias from file
const addNamedImportToSourceFile = (rootNode: ts.SourceFile, importName: string): ts.SourceFile => {
  const specifier = ts.createImportSpecifier(undefined, ts.createIdentifier(importName));
  const namedImport = ts.createNamedImports([specifier]);
  const importClause = ts.createImportClause(undefined, namedImport);
  const importDeclaration = ts.createImportDeclaration(undefined, undefined, importClause, ts.createStringLiteral('rxjs-transformer/dist/rxjs_wrapper'));
  return ts.updateSourceFileNode(rootNode, [importDeclaration, ...rootNode.statements]);
};

// Add array of wrapper functions to given source file node.
const addWrapperFunctionImportArray = (rootNode: ts.SourceFile, operators: string[]): ts.SourceFile => {
  operators
    .filter(operator => operator !== null)
    .map(operator => rootNode = addNamedImportToSourceFile(rootNode, operator));
  return rootNode;
};

// TODO: for testing purpose only
const importOf = (rootNode: ts.SourceFile): ts.SourceFile => {
  const specifier = ts.createImportSpecifier(undefined, ts.createIdentifier('of'));
  const namedImport = ts.createNamedImports([specifier]);
  const importClause = ts.createImportClause(undefined, namedImport);
  const importDeclaration = ts.createImportDeclaration(undefined, undefined, importClause, ts.createStringLiteral('rxjs'));
  return ts.updateSourceFileNode(rootNode, [importDeclaration, ...rootNode.statements]);
}


// Loops over all nodes, when node matches teststring, replaces the string literal.
export const rxjsTransformer = (context: ts.TransformationContext) => {
  return (rootNode: ts.SourceFile) => {
    if (rootNode.fileName.includes('/rxjs_wrapper.ts') && rootNode.fileName.includes('/node_modules')) {
      return rootNode;
    }
    else if (!rootNode.fileName.includes('main-menu.component')) { //TODO: Remove this.
      return rootNode;
    }
    function visitSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
      const importStatements: Set<string> = new Set();

      const visitNodes = (node: ts.Node): ts.Node => {
        const [dispatchedNode, wrapperImport] = dispatchNode(node);
        if (wrapperImport) {
          importStatements.add(wrapperImport);
        }

        return ts.visitEachChild(dispatchedNode, visitNodes, context);
      };

      const root = visitNodes(sourceFile) as ts.SourceFile;

      if (importStatements.size) { // Required by all wrapper functions.
        importStatements.add('sendEventToBackpage');
      }

      if (importStatements.has('wrapPipe')) { // Required in wrapped pipe.
        importStatements.add('wrapPipeableOperator');
      }


      return importOf(addWrapperFunctionImportArray(root, Array.from(importStatements)));
    }

    try {
      return ts.visitNode(rootNode, visitSourceFile);
    } catch (e) {
      console.error(`\nFailed transforming ${rootNode.fileName}`);
      console.log(e);
      return rootNode;
    }

  };
};
