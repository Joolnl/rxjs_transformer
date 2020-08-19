
import * as ts from 'typescript';
import { addImportsToSourceFile, createImportDeclaration, RxJSPartToImportDeclartion, addImports } from './importer_ref';
import { RxJSPart } from './node_dispatcher_ref';
import { printSourceFile } from './compiler_helper';

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

test('addImports should add 4 imports to sourcefile with observable, pipeOperator and subscriber input.', () => {
    const sourcefile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2015, true);
    const input = new Set([RxJSPart.observable, RxJSPart.pipeOperator, RxJSPart.subscriber, RxJSPart.unclassified]);
    const result = addImports(sourcefile, input);
    const stringResult = printSourceFile(result);
    expect(stringResult).toMatch(/(\s*import {.*} from \".*\";(\n|)){4}/);
    expect(stringResult).not.toMatch(/(\s*import {.*} from \".*\";(\n|)){5}/);
});

test('addImports should add 0 imports to sourcefile with empty set input.', () => {
    const sourcefile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2015, true);
    const input = new Set<RxJSPart>();
    const result = addImports(sourcefile, input);
    const stringResult = printSourceFile(result);
    expect(stringResult.length).toBe(0);
});

test('addImports should add 2 imports to sourcefile with observable input.', () => {
    const sourcefile = ts.createSourceFile('test.ts', '', ts.ScriptTarget.ES2015, true);
    const input = new Set([RxJSPart.observable]);
    const result = addImports(sourcefile, input);
    const stringResult = printSourceFile(result);
    expect(stringResult).toMatch(/(\s*import {.*} from \".*\";(\n|)){2}/);
    expect(stringResult).not.toMatch(/(\s*import {.*} from \".*\";(\n|)){3}/);

});