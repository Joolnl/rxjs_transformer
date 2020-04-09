import * as ts from 'typescript';
import { dispatchNode } from './node_dispatcher';

// Add import to given SourceFile.
// format: import importname as alias from file
const addNamedImportToSourceFile = (rootNode: ts.SourceFile, importName: string, alias: string, file: string): ts.SourceFile => {
  return ts.updateSourceFileNode(rootNode,
    [ts.createImportDeclaration(
        /*decorators*/undefined,
        /*modifiers*/ undefined,
      ts.createImportClause(
        undefined,
        ts.createNamedImports([ts.createImportSpecifier(ts.createIdentifier(`${importName}`), ts.createIdentifier(`${alias}`))])
      ),
      ts.createLiteral(`${file}`)
    ), ...rootNode.statements]);
};

// Add array of wrapper functions to given source file node.
const addWrapperFunctionImportArray = (rootNode: ts.SourceFile, operators: string[]): ts.SourceFile => {
  const file = 'src/rxjs_wrapper';
  operators
    .filter(operator => operator !== null)
    .map(operator => rootNode = addNamedImportToSourceFile(rootNode, operator, operator, file));
  return rootNode;
};


// Loops over all nodes, when node matches teststring, replaces the string literal.
export const rxjsTransformer = (context: ts.TransformationContext) => {
  return (rootNode: ts.SourceFile) => {
    if (rootNode.fileName.includes('/rxjs_wrapper.ts')) {
      return rootNode;
    }

    function visitSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
      console.log(`is sourcefile ${ts.isSourceFile(sourceFile)} ${typeof sourceFile}`);
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

      return addWrapperFunctionImportArray(root, Array.from(importStatements));
    }

    return ts.visitNode(rootNode, visitSourceFile);
  };
};
