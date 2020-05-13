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

// TODO: fix error handling.
// Get Dependency array from import declerator statement.
export const importDeclarationIdentifiers = (importDecl: ts.ImportDeclaration): Dependency[] => {
    try {
        const result: ts.ImportSpecifier[] = [];
        const moduleSpecifier = importDecl.moduleSpecifier as ts.StringLiteral;
        const lists: ts.SyntaxList[] = [];

        importDecl.importClause.namedBindings.forEachChild(child => result.push(child as ts.ImportSpecifier));
        importDecl.importClause.namedBindings.getChildren()
            .filter(c => c.kind === 298)    // is SyntaxList
            .map(c => lists.push(c as ts.SyntaxList));

        const children: ts.Node[] = [];
        lists.map(l => l.getChildren().forEach(c => children.push(c)))

        return children
            .filter(child => ts.isImportSpecifier(child))
            .map(identifier => ({ identifier: identifier.getText(), location: moduleSpecifier.text }));
    } catch (e) {
        return null;
    }
};

// Add given dependacies as import declaration statements to given sourcefile.
const addImportsToSourceFile = (source: ts.SourceFile, dependencies: Dependency[]): ts.SourceFile => {
    // return source;
    // const importStatement = createImportDeclaration({ identifier: 'wrapCreationOperator', location: wrapperLocation });
    const importStatements = dependencies.map(d => createImportDeclaration(d));
    const test = source;
    return ts.updateSourceFileNode(test, [...importStatements, ...source.statements]);
    return test;
    // console.log(`transforming ${source.fileName}`);
    // const test = Array.from(source.statements.values());
    // // return ts.updateSourceFileNode(source, test);
    // return ts.createSourceFile(source.fileName, source.getText(), source.languageVersion);

    // // return source;

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

// // TODO: ugly fix for now.
// if (!Array.prototype.flatMap) {
//     const concat = (x: any, y: any) => x.concat(y);
//     const flatMap = (f, xs) => xs.map(f).reduce(concat, []);
//     Array.prototype.flatMap = function (f) {
//         return flatMap(f, this);
//     }
// }

// return ts.updateSourceFileNode(source, [...dependacies.map(createImportDeclaration), ...source.statements]);
// TODO: quick hack for checking.
const testAddOf = (source: ts.SourceFile, dependencies: Dependency[]): ts.SourceFile => {
    if (dependencies.some(dep => dep.identifier === 'of' && dep.location === 'rxjs')) {
        const index = source.statements.findIndex(node => !ts.isImportDeclaration(node));
        const updated: ts.Statement[] = Array.from(source.statements);
        const expr = ts.createStatement(ts.createIdentifier('of'));
        updated.splice(index, 0, expr)
        return ts.updateSourceFileNode(source, updated);
    }
    return source
};


// Import given requirements and dependencies for requirements to sourcefile.
export const importDependencies = (source: ts.SourceFile, dependencies: Dependency[]): ts.SourceFile => {
    // const test: Dependency[] = [];
    // const imported = source.statements
    //     .filter(statement => ts.isImportDeclaration(statement))
    //     .map(importDeclaration => importDeclarationIdentifiers(importDeclaration as ts.ImportDeclaration))
    //     .filter(arr => arr)
    //     .map(arr => arr.forEach(d => test.push(d)))
    // .flatMap(importDeclaration => importDeclarationIdentifiers(importDeclaration as ts.ImportDeclaration));

    // const transform = compose(
    //     // substraction(test),
    //     addSendToBackPageDependency,
    //     addWrapCreationOperatorDependency,
    //     addWrapJoinCreationOperatorDependency,
    //     addWrapPipeableOperatorDependency);

    // console.log(`imported length ${imported.length} ${source.fileName}`);
    // test.map(i => console.log(`imported ${i.identifier} ${i.location}`));
    // transform(dependencies).map(t => console.log(`transformed dependencies ${t.identifier} ${t.location}`));
    const hardCodedDependencies: Dependency[] = [
        { identifier: 'sendToBackpage', location: wrapperLocation },
        { identifier: 'wrapPipeableOperator', location: wrapperLocation },
        { identifier: 'wrapCreationOperator', location: wrapperLocation },
        { identifier: 'wrapJoinCreationOperator', location: wrapperLocation },
        { identifier: 'wrapSubscribe', location: wrapperLocation },
        { identifier: 'wrapPipe', location: wrapperLocation },
        { identifier: 'wrapOperator', location: wrapperLocation },
        { identifier: 'wrapPropertyDeclaration', location: wrapperLocation }
    ];
    return addImportsToSourceFile(source, hardCodedDependencies);
    // return addImportsToSourceFile(source, transform(dependencies));
    // return source;
};