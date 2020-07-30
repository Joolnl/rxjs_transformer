import { createNode } from "./compiler_helper";
import * as ts from 'typescript';
import { fetchIdentifier, extractCallExprMetadata } from './metadata_ref';

test('fetchIdentifier should fetch the right identifier for given node from AST.', () => {
    const [node] = createNode<ts.VariableStatement>(`const a = of(1);`, ts.SyntaxKind.VariableStatement);
    const varDeclr = node.declarationList.declarations[0];
    const callExpr = varDeclr.initializer as ts.CallExpression;
    const result = fetchIdentifier(callExpr);
    expect(result).toEqual('a');
});

test('exportCallExprMetadata should extract the right metadata from a node', () => {
    const [node] = createNode<ts.VariableStatement>(`const a = of(1);`, ts.SyntaxKind.VariableStatement);
    const varDeclr = node.declarationList.declarations[0];
    const callExpr = varDeclr.initializer as ts.CallExpression;
    const result = extractCallExprMetadata(callExpr);
    expect(typeof result.uuid).toBe('string');
    expect(result.identifier).toBe('a');
    expect(result.file).toBe('test.ts');
    expect(result.line).toBe(0);
    expect(result.pos).toBe(9);
});

test('create', () => {
    const [node, sourceFile] = createNode<ts.CallExpression>(`merge(interval(100), of('asdf'));`, ts.SyntaxKind.CallExpression);
    const result = extractCallExprMetadata(node);
    console.log(result);
    expect(1).toBe(1);
});