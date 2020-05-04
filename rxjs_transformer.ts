import * as ts from 'typescript';
import { dispatchNode } from './node_dispatcher';
import { Dependency, importDependencies, addIfNotPresent } from './importer';

// Loops over all nodes, when node matches teststring, replaces the string literal.
export const rxjsTransformer = (context: ts.TransformationContext) => {
  return (rootNode: ts.SourceFile) => {
    if (rootNode.fileName.includes('/rxjs_wrapper.ts') && rootNode.fileName.includes('/node_modules')) {
      return rootNode;
    }
    // else if (!rootNode.fileName.includes('main-menu.component')) { //TODO: Remove this.
    //   return rootNode;
    // }
    function visitSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
      let dependencies: Dependency[] = [];

      const visitNodes = (node: ts.Node): ts.Node => {
        const [dispatchedNode, dependency] = dispatchNode(node);
        if (dependency) {
          dependencies = addIfNotPresent(dependencies, dependency);
        }

        return ts.visitEachChild(dispatchedNode, visitNodes, context);
      };

      const root = visitNodes(sourceFile) as ts.SourceFile;
      return importDependencies(root, dependencies);
    }

    try {
      return ts.visitNode(rootNode, visitSourceFile);
    } catch (e) {
      console.error(`\nFailed transforming ${rootNode.fileName}`);
      // console.log(e);
      return rootNode;
    }

  };
};
