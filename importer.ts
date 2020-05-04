import * as ts from 'typescript';
import { differenceWith, compose, innerJoin } from 'ramda';
import { rxjsCreationOperators, rxjsJoinCreationOperators } from './rxjs_operators';

export type Dependency = { identifier: string | string[], location: string };
export const wrapperLocation = 'rxjs-transformer/dist/rxjs_wrapper';

const compare = (l: Dependency, r: Dependency): boolean => l.identifier === r.identifier && l.location === r.location;

// TODO: make array import possible.
// Create import decleration for given Dependency.
export const createImportDeclaration = (dependency: Dependency): ts.ImportDeclaration => {
    const specifier = ts.createImportSpecifier(undefined, ts.createIdentifier(dependency.identifier));
    const namedImport = ts.createNamedImports([specifier]);
    const importClause = ts.createImportClause(undefined, namedImport);
    return ts.createImportDeclaration(undefined, undefined, importClause, ts.createStringLiteral(dependency.location));
};

// Add sendToBackPage dependency if required.
export const addSendToBackPageDependency = (requirements: Dependency[]): Dependency[] => {
    return requirements.length
        ? [{ identifier: 'sendToBackpage', location: wrapperLocation }, ...requirements]
        : requirements;
};

// Add wrapPipeableOperator dependency if required.
export const addWrapPipeableOperatorDependency = (requirements: Dependency[]): Dependency[] => {
    return requirements.filter(requirement => requirement.identifier === 'wrapPipe').length
        ? [{ identifier: 'wrapPipeableOperator', location: wrapperLocation }, ...requirements]
        : requirements;
};

// Return substractions requirements substracted with imported.
export const substraction = (imported: Dependency[]) => (requirements: Dependency[]): Dependency[] => {
    const cmp = (l: Dependency, r: Dependency): boolean => l.identifier === r.identifier && l.location === r.location;
    return differenceWith(cmp, requirements, imported);
};

// Get Dependency array from import declerator statement.
export const importDeclarationIdentifiers = (importDecl: ts.ImportDeclaration): Dependency[] => {
    const result: ts.ImportSpecifier[] = [];
    const moduleSpecifier = importDecl.moduleSpecifier as ts.StringLiteral;
    importDecl.importClause.namedBindings.forEachChild(child => result.push(child as ts.ImportSpecifier));
    return result
        .filter(node => ts.isImportSpecifier(node))
        .map(dependency => dependency.name.text)
        .map(identifier => ({ identifier, location: moduleSpecifier.text }));
};

// Add given dependacies as import declaration statements to given sourcefile.
const addImportsToSourceFile = (source: ts.SourceFile, dependacies: Dependency[]): ts.SourceFile => {
    return ts.updateSourceFileNode(source, [...dependacies.map(createImportDeclaration), ...source.statements]);
};

export const addIfNotPresent = (array: Dependency[], dependency: Dependency): Dependency[] => {
    return array.filter(dep => compare(dep, dependency)).length
        ? array
        : [...array, dependency];
};

const rxjsCreationDependencies: Dependency[] = rxjsCreationOperators
    .map(operator => ({ identifier: operator, location: 'rxjs' }));

// Add wrapCreationOperator dependency if required.
export const addWrapCreationOperatorDependency = (reqs: Dependency[]): Dependency[] => {
    return innerJoin(compare, reqs, rxjsCreationDependencies).length
        ? [{ identifier: 'wrapCreationOperator', location: wrapperLocation }, ...reqs]
        : reqs;
};

const rxjsJoinCreationDependencies: Dependency[] = rxjsJoinCreationOperators
    .map(operator => ({ identifier: operator, location: 'rxjs' }));

// Add wrapJoinCreationOperator dependency if required.
export const addWrapJoinCreationOperatorDependency = (reqs: Dependency[]): Dependency[] => {
    return innerJoin(compare, reqs, rxjsJoinCreationDependencies).length
        ? [{ identifier: 'wrapJoinCreationOperator', location: wrapperLocation }, ...reqs]
        : reqs;
};

// TODO: ugly fix for now.
if (!Array.prototype.flatMap) {
    const concat = (x: any, y: any) => x.concat(y);
    const flatMap = (f, xs) => xs.map(f).reduce(concat, []);
    Array.prototype.flatMap = function (f) {
        return flatMap(f, this);
    }
}

// Import given requirements and dependencies for requirements to sourcefile.
export const importDependencies = (source: ts.SourceFile, dependencies: Dependency[]): ts.SourceFile => {
    const imported = source.statements
        .filter(statement => ts.isImportDeclaration(statement))
        .flatMap(importDeclaration => importDeclarationIdentifiers(importDeclaration as ts.ImportDeclaration));

    console.log(`imported ${source.fileName} ${imported}`);
    const transform = compose(
        substraction(imported),
        addSendToBackPageDependency,
        addWrapCreationOperatorDependency,
        addWrapJoinCreationOperatorDependency,
        addWrapPipeableOperatorDependency);

    return addImportsToSourceFile(source, transform(dependencies));
};