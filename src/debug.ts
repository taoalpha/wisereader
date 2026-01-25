import fs from 'fs';
import path from 'path';

const logFile = path.resolve('debug.log');
const isDebugEnabled = process.env.DEBUG === '1';

export const log = (message: string) => {
  if (!isDebugEnabled) {
    return;
  }

  fs.appendFileSync(logFile, new Date().toISOString() + ': ' + message + '\n');
};
