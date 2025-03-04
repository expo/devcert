import { execFileSync, ExecFileSyncOptions } from 'child_process';
import { randomBytes } from 'crypto';
import fs from 'fs';
import os from 'os';
import createDebug from 'debug';
import path from 'path';
import sudoPrompt from '@expo/sudo-prompt';

import { configPath } from './constants';

const debug = createDebug('devcert:util');

export function openssl(args: string[]) {
  return run('openssl', args, {
    stdio: 'pipe',
    env: Object.assign({
      RANDFILE: path.join(configPath('.rnd'))
    }, process.env)
  });
}

export function run(cmd: string, args: string[], options: ExecFileSyncOptions = {}) {
  debug(`execFileSync: \`${ cmd } ${args.join(' ')}\``);
  return execFileSync(cmd, args, options);
}

export function sudoAppend(file: string, input: ExecFileSyncOptions["input"]) {
  run('sudo', ['tee', '-a', file], {
    input
  });
}

export function waitForUser() {
  return new Promise((resolve) => {
    process.stdin.resume();
    process.stdin.on('data', resolve);
  });
}

export function reportableError(message: string) {
  return new Error(`${message} | This is a bug in devcert, please report the issue at https://github.com/davewasmer/devcert/issues`);
}

export function mktmp() {
  const random = randomBytes(6).toString('hex');
  const tmppath = path.join(os.tmpdir(), `tmp-${process.pid}${random}`);
  fs.closeSync(fs.openSync(tmppath, 'w'));
  return tmppath;
}

export function sudo(cmd: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    sudoPrompt.exec(cmd, { name: 'devcert' }, (err: Error | null, stdout: string | null, stderr: string | null) => {
      let error = err || (typeof stderr === 'string' && stderr.trim().length > 0 && new Error(stderr)) ;
      error ? reject(error) : resolve(stdout);
    });
  });
}
