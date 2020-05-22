import * as ts from 'typescript';
// import * as v5 from 'uuid/v5';
import { v5 } from 'uuid';

export interface ObservableMetadata {
    uuid: string;
    type?: string;
    identifier: string;
    file: string;
    line: number;
    pos?: number;
    propertyDeclaration: string;
}

export interface JoinObservableMetadata {
    uuid: string;
    type?: string;
    observables: Array<string>;
    identifier: string;
    file: string;
    line: number;
    pos?: number;
    propertyDeclaration: string;
}

export interface PipeMetadata {
    uuid: string;
    observable: string;
    identifier?: string;
    file: string;
    line: number;
}

export interface PipeableOperatorMetadata {
    type: string;
    uuid: string;
    function: string;
    observable: string;
    pipe: string;
    file: string;
    line: number;
}

export interface SubscriberMetadata {
    uuid: string;
    observable: string;
    pipes: Array<string>;
    func: string;
    file: string;
    line: number;
}

export interface TemplateSubscriberMetadata {
    observable: string;
}

export interface PropertyDeclarationMetadata {
    uuid: string;
    identifier: string;
    observable: string;
    kind: string;
    typeArgument: string[];
    file: string;
    line: number;
}

export interface ObservableSubjectConstructorMetadata {
    uuid: string;
    type?: string;
    file: string;
    line: number;
    propertyDeclaration: string;
    typeArgument: string[];
}

interface PipeObservablePair {
    pipe: string;
    observable: ts.Identifier;
}

const namedObservables = new Map<string, ts.Identifier>();
const namedPipes = new Map<string, PipeObservablePair>();

// Generate unique id from seed: filename, line and pos.
const generateId = (filename: string, line: number, pos: number): string => {
    const uuid = v5(`${filename}${line}${pos}`, 'e01462c8-517f-11ea-8d77-2e728ce88125');
    // const uuid = `${filename}${line}${pos}`;
    return uuid;
};

// Extract metadata from given call expression.
export const extractMetadata = (node: ts.Expression | ts.PropertyDeclaration): { file: string, line: number, pos: number } => {
    const file = node.getSourceFile().fileName;
    const line = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line;
    const pos = node.pos;
    return { file, line, pos };
};

const createProperty = (name: string, value: any) => ts.createPropertyAssignment(name, ts.createLiteral(value || ''));

// Create metadata object literal expression from expression and operator.
export const createObservableMetadataExpression = (node: ts.Identifier, variableName: string, propertyDeclaration: string): ts.ObjectLiteralExpression => {
    const { file, line, pos } = extractMetadata(node);
    const uuid = generateId(file, line, pos);

    if (variableName !== 'anonymous') {
        namedObservables.set(variableName, node);
    }

    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('type', node.getText()),
        createProperty('identifier', variableName),
        createProperty('file', file),
        createProperty('line', line),
        createProperty('propertyDeclaration', propertyDeclaration)
    ]);
};

interface BaseObservable {
    uuid: string;
    identifier?: string;
    type: string;
}

// Get the base observables from join observable.
const getBaseObservables = (node: ts.CallExpression): Array<BaseObservable> => {
    if (node.arguments === undefined) {
        return [];
    }

    // Recursively get observable names.
    const getBaseObservable = (argNode: ts.Expression): BaseObservable | undefined => {
        if (ts.isPropertyAccessExpression(argNode) || ts.isCallExpression(argNode)) {
            return getBaseObservable(argNode.expression);
        } else if (ts.isIdentifier(argNode)) {
            if (ts.isCallExpression(argNode.parent)) {  // Anonymous observable.
                const { file, line, pos } = extractMetadata(argNode);
                const uuid = generateId(file, line, pos);
                const type = argNode.getText();
                return { uuid, type };
            } else {
                const { file, line, pos } = extractMetadata(namedObservables.get(argNode.getText()));
                const uuid = generateId(file, line, pos);
                const name = argNode.getText();
                return { uuid, identifier: name, type: 'of' };
            }
        }
    };

    const observables = node.arguments
        .map(arg => getBaseObservable(arg))
        .filter(arg => arg);

    return observables;
};

// Create array literal containing object literals from BaseObservable array.
const createBaseObservableArrayLiteral = (baseObservables: Array<BaseObservable>): ts.ArrayLiteralExpression => {
    const createBaseObservableObjectLiteral = (observable: BaseObservable): ts.ObjectLiteralExpression => {
        return ts.createObjectLiteral([
            createProperty('uuid', observable.uuid),
            createProperty('identifier', observable.identifier),
            createProperty('type', observable.type)
        ]);
    };

    return ts.createArrayLiteral(
        baseObservables
            .map(observable => createBaseObservableObjectLiteral(observable))
    );
};

// Create metadata object literal from join observable.
export const createJoinObservableMetadataExpression = (
    node: ts.Identifier,
    call: ts.CallExpression,
    variableName: string,
    propertyDeclaration: string
): ts.ObjectLiteralExpression => {
    const { file, line, pos } = extractMetadata(node);
    const uuid = generateId(file, line, pos);
    // const baseObservables = getBaseObservables(call)
    //     .map(observable => ts.createStringLiteral(observable));
    const baseObservables = createBaseObservableArrayLiteral(getBaseObservables(call));

    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('type', node.getText()),
        // ts.createPropertyAssignment('observables', ts.createArrayLiteral(baseObservables)),
        ts.createPropertyAssignment('observables', baseObservables),
        createProperty('identifier', variableName),
        createProperty('file', file),
        createProperty('line', line),
        createProperty('propertyDeclaration', propertyDeclaration)
    ]);
};

// Traverse tree until observable is found.
const getObservable = (node: ts.Expression): ts.Identifier => {
    if (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) {
        return getObservable(node.expression);
    } else if (ts.isIdentifier(node)) {
        if (ts.isPropertyAccessExpression(node.parent)) {
            if (namedPipes.has(node.getText())) {
                return namedPipes.get(node.getText()).observable;   // It's a pipe.
            } else if (namedObservables.has(node.getText())) {
                return namedObservables.get(node.getText());        // It's an observable.
            } 
        }

        return node;    // Return anonymous observable.
    } else if (node.kind === 99 && ts.isPropertyAccessExpression(node.parent)) {   // Property Access Expression.
        if (namedObservables.has(node.parent.name.getText())) {
            return namedObservables.get(node.parent.name.getText());
        } else {
            throw new Error('Property access expression node not registered!');
        }
    } else {
        throw new Error('No Observable found invalid node type!');
    }
};

// Create pipe metadata object literal.
export const createPipeMetadataExpression = (
    node: ts.CallExpression,
    identifier: ts.Identifier,
    variableName: string
): [ts.ObjectLiteralExpression, string, string] => {
    try {
        const { file, line, pos } = extractMetadata(identifier);
        const uuid = generateId(file, line, pos);
        const observable = getObservable(node);
        const observableMetadata = extractMetadata(observable);
        const observableUUID = generateId(observableMetadata.file, observableMetadata.line, observableMetadata.pos);

        if (variableName !== 'anonymous') {
            namedPipes.set(variableName, { pipe: uuid, observable: observable });
        }

        const objectLiteral = ts.createObjectLiteral([
            createProperty('uuid', uuid),
            createProperty('observable', observableUUID),
            createProperty('identifier', variableName),
            createProperty('file', file),
            createProperty('line', line)
        ]);

        return [objectLiteral, uuid, observableUUID];
    } catch (e) {
        throw e;
    }


};

// Create operator metadata object literal.
export const createPipeableOperatorMetadataExpression = (
    node: ts.CallExpression,
    operatorUUID: string,
    pipeUUID: string,
    observableUUID: string
): ts.ObjectLiteralExpression => {
    const operator = node.expression.getText();
    const functionBody = node.arguments.map(arg => arg.getText()).join('');
    const { file, line } = extractMetadata(node);

    return ts.createObjectLiteral([
        createProperty('type', operator),
        createProperty('uuid', operatorUUID),
        createProperty('function', functionBody),
        createProperty('observable', observableUUID),
        createProperty('pipe', pipeUUID),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};

interface Pipe {
    node: ts.Identifier;
    anonymous: boolean;
}

// Recursively get all pipes a subscribe belongs to. 0...n
const getPipeArray = (node: ts.Expression, pipes?: Array<Pipe>): Array<Pipe> => {
    const result: Array<Pipe> = pipes ? pipes : [];
    if (ts.isPropertyAccessExpression(node) || ts.isCallExpression(node)) {
        if (ts.isPropertyAccessExpression(node) && node.name.getText() === 'pipe') {
            result.push({ node: node.name as ts.Identifier, anonymous: true });
        } else if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.name.getText() === 'subscribe') {
            result.push({ node: node.expression, anonymous: false });
        }

        return getPipeArray(node.expression, result);
    }
    return result;
};

// Create Array Literal Property from given pipes with given attribute name.
const createArrayLiteralProperty = (name: string, pipes: Array<Pipe>): ts.PropertyAssignment => {
    // Generate UUID for anonymous pipes.
    const anonymousPipes = pipes
        .filter(pipe => pipe.anonymous)
        .map(pipe => pipe.node)
        .map(pipeNode => extractMetadata(pipeNode))
        .map(metadata => generateId(metadata.file, metadata.line, metadata.pos));

    // Fetch already generated UUID's for non-anonymous pipes.
    const nonAnonymousPipes: string[] = pipes
        .filter(pipe => !pipe.anonymous)
        .map(pipe => pipe.node)
        .map(pipeNode => pipeNode.getText())
        .map(pipeName => namedPipes.get(pipeName)?.pipe)
        .filter(pipe => pipe)

    // Join arrays and filter null-type values.
    const pipeLiterals = anonymousPipes.concat(nonAnonymousPipes)
        .filter(pipe => pipe)
        .map(pipe => ts.createStringLiteral(pipe));

    return ts.createPropertyAssignment(name, ts.createArrayLiteral(pipeLiterals));
};

// Create subscribe metadata object literal.
export const createSubscriberMetadataExpression = (node: ts.CallExpression): ts.ObjectLiteralExpression => {
    try {
        const { file, line, pos } = extractMetadata(node);
        const uuid = generateId(file, line, pos);
        const observableMetadata = extractMetadata(getObservable(node));
        const observableUUID = generateId(observableMetadata.file, observableMetadata.line, observableMetadata.pos);
        const pipes = createArrayLiteralProperty('pipes', getPipeArray(node));
        console.log('in subscribe', observableMetadata.file, observableMetadata.line, observableMetadata.pos, getObservable(node).getText())

        return ts.createObjectLiteral([
            createProperty('uuid', uuid),
            createProperty('observable', observableUUID),
            pipes,
            createProperty('function', 'testFn'),
            createProperty('file', file),
            createProperty('line', line)
        ]);
    } catch (e) {
        throw e;
    }
};

// Extract type and typearguments from node.
const extractTypeMetadata = (node: ts.PropertyDeclaration): [string, string[]] => {
    if (ts.isTypeReferenceNode(node.type)) {
        const type = node.type.typeName.getText();
        const typeArguments = node.type.typeArguments.map(arg => arg.getText());
        return [type, typeArguments];
    }
    return [undefined, undefined];
};

// Create metadata object literal for PropertyDecl node.
export const createPropertyDeclarationMetadataExpression = (node: ts.PropertyDeclaration, observable: string): ts.ObjectLiteralExpression => {
    const { file, line, pos } = extractMetadata(node.name as ts.Identifier);
    const [type, typeArguments] = extractTypeMetadata(node);
    const identifier = node.name.getText();
    const uuid = generateId(file, line, pos);
    namedObservables.set(identifier, node.name as ts.Identifier);


    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('identifier', identifier),
        createProperty('observable', observable),
        createProperty('kind', type),
        ts.createPropertyAssignment('typeArguments', ts.createArrayLiteral(typeArguments.map(type => ts.createStringLiteral(type)))),
        createProperty('file', file),
        createProperty('line', line)
    ]);
};

export const getNodeUUID = (node: ts.Expression): string => {
    const { file, line, pos } = extractMetadata(node);
    const uuid = generateId(file, line, pos);
    return uuid;
};

export const getObservableUUIDByName = (observable: string): string => {
    return getNodeUUID(namedObservables.get(observable));
}

// Create object literal expression containing metadata from Object and Subject constructor expression.
export const createObservableSubjectConstructorMetadataExpression = (node: ts.NewExpression, variableName: string, propertyDecl: string): ts.ObjectLiteralExpression => {
    const { file, line, pos } = extractMetadata(node.expression);
    const uuid = generateId(file, line, pos);
    const type = node.expression.getText();
    const typeArgs = node.typeArguments.map(arg => arg.getText());
    const propertyDeclUUID = propertyDecl ? getObservableUUIDByName(propertyDecl) : undefined;

    if (variableName !== 'anonymous') {
        namedObservables.set(variableName, node.expression as ts.Identifier);
    }

    return ts.createObjectLiteral([
        createProperty('uuid', uuid),
        createProperty('identifier', node.expression.getText()),
        createProperty('type', type),
        createProperty('file', file),
        createProperty('line', line),
        createProperty('propertyDeclaration', propertyDeclUUID),
        ts.createPropertyAssignment('typeArguments', ts.createArrayLiteral(typeArgs.map(type => ts.createStringLiteral(type)))),
    ]);
};