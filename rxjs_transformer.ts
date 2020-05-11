import * as ts from 'typescript';
import { dispatchNode } from './node_dispatcher';
import { Dependency, importDependencies, addIfNotPresent } from './importer';
import * as fs from 'fs';
import * as path from 'path';

const logFile = (data: string, filename: string): void => {
  // const data: string = importDependencies(root, dependencies).text;
  const fileName: string = path.join(__dirname, 'transformed_files', `${filename.split('/').pop()}`);
  fs.open(fileName, 'w', (err, file) => {
    if (err) {
      throw err;
    }
    fs.writeFile(file, data, (err) => {
      if (err) {
        throw err;
      }
    });
  });
}

// Loops over all nodes, when node matches teststring, replaces the string literal.
export const rxjsTransformer = (context: ts.TransformationContext) => {
  return (rootNode: ts.SourceFile) => {
    if (rootNode.fileName.includes('/rxjs_wrapper.ts') && rootNode.fileName.includes('/node_modules')) {
      return rootNode;
    }
    else if (!rootNode.fileName.includes('main-menu.component.ts')) { //TODO: Remove this.
      return rootNode;
    }
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
      const transformedSourceFile = ts.visitNode(rootNode, visitSourceFile);
      console.log(`Transformed ${transformedSourceFile.fileName}`);
      // if (transformedSourceFile.fileName.includes('app.component.ts')) {
      //   const printer: ts.Printer = ts.createPrinter();
      //   const transformed = printer.printFile(transformedSourceFile)
      //   const transpiled = ts.transpileModule(transformed, {}).outputText;

      //   logFile(transformed, transformedSourceFile.fileName + '.transformed');
      //   logFile(transpiled, transformedSourceFile.fileName + '.transpiled_tsconfig');
      // }
      return transformedSourceFile
    } catch (e) {
      console.error(`\nFailed transforming ${rootNode.fileName}`);
      // console.log(e);
      return rootNode;
    }

  };
};
