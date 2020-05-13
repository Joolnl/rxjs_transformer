import * as ts from 'typescript';
import { wrapPropertyDeclaration } from './operator_wrapper';

test('wrapPropertyDeclaration should make a wrapper version of node', () => {
    const printer = ts.createPrinter();
    const input = 'public test$: Observable<string>';
    const output = 'public test$: Observable<string> = wrapPropertyDeclaration()';
    const sourcefile = ts.createSourceFile('test.ts', input, ts.ScriptTarget.ES2015, true, ts.ScriptKind.TS);
    const node = sourcefile.getChildren().shift();
    const wrappedNode = wrapPropertyDeclaration(node as ts.PropertyDeclaration);
    const result = printer.printNode(ts.EmitHint.Unspecified, node, sourcefile);
    console.log(`result ${result}`);

    // console.log(node.getChildren().length);
    // node.getChildren().map(c => console.log(c.getText()))
    // console.log(node.getChildren().shift().getText());
});