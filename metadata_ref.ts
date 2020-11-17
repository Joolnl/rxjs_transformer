import * as ts from 'typescript';
import { v5 } from 'uuid';

export enum RxJSPart {
    Observable = 'observable',
    JoinObservable = 'joinObservable',
    Subject = 'subject',
    Subscriber = 'subscriber',
    TemplateSubscriber = 'templateSubscriber',
    Pipe = 'pipe',
    Operator = 'operator',
    Event = 'event',
    Subscription = 'subscription'
}

export interface Metadata {
    uuid: string;
    part?: RxJSPart;
    observable?: string | string[];
    identifier?: string;
    pipe?: string | string[];
    fn?: string;
    event?: unknown;
    file: string;
    character: number
    line: number;
    pos: number;
}

// Generate UUID for given filename, line number and position combination.
const generateUUID = (file: string, line: number, pos: number, end: number): string => {
    //return `${file} - ${line} - ${pos} : ${end}`;
    return v5(`${file}${line}${pos}${end}`, 'e01462c8-517f-11ea-8d77-2e728ce88125');
};

// Extract location of node in source file, return [file, line, pos].
const extractLocation = (node: ts.Node): { file: string, line: number, character: number, pos: number, end: number } => {
    const sourceFile = node.getSourceFile();
    const file = sourceFile.fileName;
    const {line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const { pos, end } = node;
    return { file, line, character, pos, end };
};

// Fetch identifier for given node in AST if existing.
export const fetchIdentifier = (node: ts.Node): string | null => {
    if (!ts.isPropertyDeclaration(node) && !ts.isVariableDeclaration(node) && !ts.isExpressionStatement(node)) {
        return fetchIdentifier(node.parent);
    } else if (ts.isPropertyDeclaration(node) || ts.isVariableDeclaration(node)) {
        return node.name.getText();
    } else {
        return null;
    }
};

// Extract the shared node metadata aspects.
const extractGeneralExprMetadata = (node: ts.Node): Metadata => {
    const { file, line, character, pos, end } = extractLocation(node);
    const uuid = generateUUID(file, line, pos, end);
    const identifier = fetchIdentifier(node);
    const fn = node.getText();

    return {
        uuid,
        identifier,
        fn,
        file,
        line,
        character,
        pos
    };
};

// Extract metadata from call expression node.
export const extractCallExprMetadata = (node: ts.CallExpression): Metadata => {
    return extractGeneralExprMetadata(node);
};

// Extract metadata from new expression node.
export const extractNewExprMetadata = (node: ts.NewExpression): Metadata => {
    return extractGeneralExprMetadata(node);
};

// Extract metadata from property access expression node.
export const extractPropertyAccessExprMetadata = (node: ts.PropertyAccessExpression): Metadata => {
    return extractGeneralExprMetadata(node);
};

// Export metadata from given node.
export const extractMetadata = (node: ts.Node): Metadata => {
    switch (node.kind) {
        case ts.SyntaxKind.CallExpression:
            return extractCallExprMetadata(node as ts.CallExpression);
        case ts.SyntaxKind.NewExpression:
            return extractNewExprMetadata(node as ts.NewExpression);
        case ts.SyntaxKind.PropertyAccessExpression:
            return extractPropertyAccessExprMetadata(node as ts.PropertyAccessExpression);
        default:
            throw new Error(`Node of type ${node.kind} not supported!`);
    };
};

// Returns defined value or empty string;
const defined = (value: any) => (value !== undefined && value !== null) ? value : '';

// Create TypeScript property with given name and value, primitive literal values only.
const createPrimitiveProperty = (name: string, value: any) => ts.createPropertyAssignment(name, ts.createLiteral(defined(value)));

// Turn metadata object into TypeScript ObjectLiteralExpression.
const createMetadataObjectLiteral = (metadata: Metadata): ts.ObjectLiteralExpression => {
    return ts.createObjectLiteral([
        createPrimitiveProperty('uuid', metadata.uuid),
        createPrimitiveProperty('part', metadata.part),
        createPrimitiveProperty('observable', metadata.observable),
        createPrimitiveProperty('identifier', metadata.identifier),
        createPrimitiveProperty('pipe', metadata.pipe),
        createPrimitiveProperty('fn', metadata.fn),
        createPrimitiveProperty('file', metadata.file),
        createPrimitiveProperty('line', metadata.line),
        createPrimitiveProperty('character', metadata.character),
        createPrimitiveProperty('pos', metadata.pos)
    ]);
};

// Create metadata object for given TypeScript node.
export const createMetadataObject = (node: ts.Node, part: RxJSPart): ts.ObjectLiteralExpression => {
    const metadata = extractMetadata(node);
    metadata.part = part;
    return createMetadataObjectLiteral(metadata);
};

