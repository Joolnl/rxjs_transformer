import * as ts from 'typescript';
import { printSourceFile } from './compiler_helper';
import { open, writeFile } from 'fs';
import { join as pathJoin } from 'path';

const createFileName = (sourceFile: ts.SourceFile): string => {
    const filename = sourceFile.fileName.split("/").pop().split('.').shift();
    console.log(`filename: ${filename}`);
    return pathJoin(__dirname, 'logs', filename + '.ts');
};

const saveFile = (filename: string, content: string): void => {
    open(filename, 'w+', (err, file) => {
        if (!err) {
            writeFile(file, content, (err) => {
                if (err) throw err;
            })
        } else throw err;
    });
};

export const log = (sourceFile: ts.SourceFile): void => {
    const fileName = createFileName(sourceFile);
    const file = printSourceFile(sourceFile);
    saveFile(fileName, file);
};