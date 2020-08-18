import { createNode } from "./compiler_helper";
import * as ts from 'typescript';
import { addImportsToSourceFile, createImportDeclaration } from './importer_ref';

test('addImportsToSourceFile should add all imports to given sourcefile', () => {
    const sourcefile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2015, true);
    const input = [
        createImportDeclaration('alfa', 'file'),
        createImportDeclaration('beta', 'gamma')
    ];
    const result = addImportsToSourceFile(sourcefile, input);
    expect(result.statements.filter(s => ts.isImportDeclaration(s)).length)
        .toBe(2);
});