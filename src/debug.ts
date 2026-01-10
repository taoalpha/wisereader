import fs from 'fs';
import path from 'path';

const logFile = path.resolve('debug.log');

export const log = (message: string) => {
  fs.appendFileSync(logFile, new Date().toISOString() + ': ' + message + '\n');
};
