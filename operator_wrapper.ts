import * as ts from 'typescript';
import {
  createPipeableOperatorMetadataExpression, createObservableMetadataExpression,
  createSubscriberMetadataExpression, createPipeMetadataExpression, createJoinObservableMetadataExpression, createPropertyDeclarationMetadataExpression, getNodeUUID, getObservableUUIDByName, createObservableSubjectConstructorMetadataExpression
} from './metadata';
// import * as uuid from 'uuid/v4';
import { v4 as uuid } from 'uuid';

type WrappedCallExpressionFn = (a: string, b: string, c?: ts.Expression[]) => ts.CallExpression;

// Returns an expression with given wrapperName wrapping given expression as argument.
const createWrappedCallExpression: WrappedCallExpressionFn = (wrapperName: string, innerName: string, args: ts.Expression[]) => {
  const wrapIdentifier = ts.createIdentifier(wrapperName);
  const innerIdentifier = ts.createIdentifier(innerName);
  const call = ts.createCall(wrapIdentifier, undefined, [innerIdentifier, ...args]);
  return call;
};

// Get Property Decleration for given node if existing.
const getPropertyDeclaration = (node: ts.CallExpression): string => {
  if (ts.isBinaryExpression(node.parent) && ts.isPropertyAccessExpression(node.parent.left)) {
    const propertDeclaration = node.parent.left;
    return getObservableUUIDByName(propertDeclaration.name.getText());
  }

  return undefined;
};

// Create wrapped RxJS creation operator expression.
export const createWrapCreationExpression = (node: ts.CallExpression): ts.CallExpression => {
  const propertyDeclaration = getPropertyDeclaration(node);
  console.log(`found property declaration ${propertyDeclaration}`);
  const identifier: ts.Identifier = node.expression as ts.Identifier;
  const variableName = ts.isVariableDeclaration(node.parent)
    ? node.parent.name.getText()
    : 'anonymous';
  const metaDataExpression = createObservableMetadataExpression(identifier, variableName, propertyDeclaration);
  // const curriedCall = createWrappedCallExpression('wrapCreationOperator', identifier.getText(), [metaDataExpression]);
  const curriedCall = createWrappedCallExpression('wrapCreationOperator', 'wrapOperator', [metaDataExpression]);
  const completeCall = ts.createCall(curriedCall, undefined, [ts.createStringLiteral(identifier.getText()), ...node.arguments]);
  return completeCall;
};

// Create wrapped RxJS join creation operator expression.
export const createWrapJoinCreationExpression = (node: ts.CallExpression): ts.CallExpression => {
  const propertyDeclaration = getPropertyDeclaration(node);
  const identifier: ts.Identifier = node.expression as ts.Identifier;
  const variableName = ts.isVariableDeclaration(node.parent)
    ? node.parent.name.getText()
    : 'anonymous';
  const metaDataExpression = createJoinObservableMetadataExpression(identifier, node, variableName, propertyDeclaration);
  // const curriedCall = createWrappedCallExpression('wrapJoinCreationOperator', identifier.getText(), [metaDataExpression]);
  const curriedCall = createWrappedCallExpression('wrapJoinCreationOperator', 'wrapOperator', [metaDataExpression]);
  const completeCall = ts.createCall(curriedCall, undefined, [ts.createStringLiteral(identifier.getText()), ...node.arguments]);
  return completeCall;
};

// Wrap array of pipeable operators.
const wrapPipeableOperatorArray = (
  args: ts.NodeArray<ts.Expression>,
  pipeUUID: string,
  observableUUID: string
): ts.NodeArray<ts.Expression> => {
  if (!args.every(operator => ts.isCallExpression(operator))) {
    throw new Error('Can not wrap pipe operators, invalid NodeArray!');
  }

  const createWrapper = (pipeOperator: ts.CallExpression, last: boolean) => {
    const metadata = createPipeableOperatorMetadataExpression(pipeOperator, uuid(), pipeUUID, observableUUID);
    return ts.createCall(ts.createIdentifier('wrapPipeableOperator'), undefined, [pipeOperator, ts.createLiteral(last), metadata]);
  };

  const isLast = (index: number) => args.length - 1 === index;

  const wrappedOperators = args.map((operator, index) => createWrapper(operator as ts.CallExpression, isLast(index)));

  return ts.createNodeArray(wrappedOperators);
};

// Wrap pipe and all its operators.
export const wrapPipeStatement = (node: ts.CallExpression): ts.CallExpression => {
  try {
    const propertyAccessExpr: ts.PropertyAccessExpression = node.expression as ts.PropertyAccessExpression;
    const source$: ts.Identifier = propertyAccessExpr.expression as ts.Identifier;
    const identifier: ts.Identifier = propertyAccessExpr.name as ts.Identifier;

    const variableName = ts.isVariableDeclaration(node.parent)  // TODO: duplicate code extract to function.
      ? node.parent.name.getText()
      : 'anonymous';
    const [metadataExpression, pipeUUID, observableUUID] = createPipeMetadataExpression(node, identifier, variableName);
    const args = wrapPipeableOperatorArray(node.arguments, pipeUUID, observableUUID).map(arg => arg);
    return ts.createCall(ts.createIdentifier('wrapPipe'), undefined, [source$, metadataExpression, ...args]);
  } catch (e) {
    throw e;
  }
};

// Wrapp subscribe method and return expression.
export const wrapSubscribeMethod = (node: ts.CallExpression): ts.CallExpression => {
  try {
    const args = node.arguments.map(arg => arg);  // ts.NodeArray => array.
    const propertyAccessExpr = node.expression as ts.PropertyAccessExpression;
    const source$: ts.Identifier = propertyAccessExpr.expression as ts.Identifier;
    const metadata = createSubscriberMetadataExpression(node);

    return ts.createCall(ts.createIdentifier('wrapSubscribe'), undefined, [source$, metadata, ...args]);
  } catch (e) {
    throw e;
  }
};

// Wrap TypeReference like Observable and Subject nodes.
export const wrapPropertyDeclaration = (node: ts.PropertyDeclaration): ts.PropertyDeclaration => {
  try {
    const initializer: ts.Expression[] = node.initializer ? [node.initializer] : [];
    // TODO: possible it is uninitialized 
    const observableUUID = initializer.length ? getNodeUUID(initializer[0]) : undefined;
    const metadata = createPropertyDeclarationMetadataExpression(node, observableUUID);
    const call = ts.createCall(ts.createCall(ts.createIdentifier('wrapPropertyDeclaration'), undefined, [metadata]), undefined, initializer);
    const updated = ts.updateProperty(node, node.decorators, node.modifiers, node.name, node.questionToken, node.type, call);
    return updated;
  } catch (e) {
    throw e;
  }
};

// Wrap Object or Subject constructor.
export const wrapObservableSubjectConstructor = (node: ts.NewExpression): ts.CallExpression => {
  const propertyDecl = ts.isPropertyDeclaration(node.parent) && ts.isIdentifier(node.parent.name)
    ? node.parent.name.getText()
    : undefined;
  const variableName = ts.isVariableDeclaration(node.parent)
    ? node.parent.name.getText()
    : 'anonymous';
  const metadata = createObservableSubjectConstructorMetadataExpression(node, variableName, propertyDecl);
  return ts.createCall(ts.createIdentifier('wrapObservableSubjectConstructor'), undefined, [metadata, node.expression]);
};