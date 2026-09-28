import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { expect } from 'chai';
import { config } from '../../src/config/config.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(currentDir, '../../src');

function listJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...listJsFiles(full));
    } else if (entry.endsWith('.js')) {
      out.push(full);
    }
  }
  return out;
}

describe('integration - config', () => {
  it('solo config.js lee process.env', async () => {
    const offenders = listJsFiles(srcDir).filter((file) => {
      if (file.endsWith(`${path.sep}config.js`)) {
        return false;
      }
      return readFileSync(file, 'utf8').includes('process.env');
    });
    expect(offenders, `archivos que tocan process.env: ${JSON.stringify(offenders)}`).to.deep.equal([]);
  });

  it('exporta puerto y valores con tipos correctos', async () => {
    expect(config.port).to.be.a('number');
    expect(config.jwtExpiresIn).to.equal('2h');
    expect(config.nodeEnv).to.equal('test');
    expect(config.internalToken).to.equal(null);
  });

  it('sin MONGODB_URI o JWT_SECRET el arranque falla nombrando la variable', async () => {
    const configUrl = pathToFileURL(path.resolve(srcDir, 'config/config.js')).href;
    const env = { ...process.env, PATH: process.env.PATH };
    delete env.MONGODB_URI;
    delete env.JWT_SECRET;
    let stdout = '';
    let stderr = '';
    try {
      stdout = execFileSync(
        process.execPath,
        ['--input-type=module', '-e', `import('${configUrl}').then(() => console.log('NO-THROW'))`],
        { env, cwd: os.tmpdir(), encoding: 'utf8', timeout: 30000 }
      );
    } catch (err) {
      stdout = err.stdout ?? '';
      stderr = err.stderr ?? '';
    }
    expect(stdout).to.not.include('NO-THROW');
    expect(stderr).to.include('MONGODB_URI');
  });

  it('.env.example existe y .env esta ignorado', async () => {
    const example = readFileSync(path.resolve(currentDir, '../../.env.example'), 'utf8');
    expect(example).to.be.a('string');
    const gitignore = readFileSync(path.resolve(currentDir, '../../.gitignore'), 'utf8');
    expect(gitignore).to.include('.env');
  });
});
