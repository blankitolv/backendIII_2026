import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { asyncHandler } from '../utils/asyncHandler.js';
import { invalidValues } from '../utils/errorFactory.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const logsDir = path.resolve(currentDir, '../../logs');

const DEFAULT_LINES = 50;
const MAX_LINES = 500;

function parseLines(query) {
  const raw = query?.lines ?? DEFAULT_LINES;
  const total = Number(raw);
  if (!Number.isInteger(total) || total < 1 || total > MAX_LINES) {
    throw invalidValues(['query.lines']);
  }
  return total;
}

async function tailFile(fileName, total) {
  try {
    const content = await readFile(path.join(logsDir, fileName), 'utf8');
    const lines = content.split('\n').filter((line) => line.length > 0);
    return lines.slice(-total);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export const getRecentLogs = asyncHandler(async (req, res) => {
  const total = parseLines(req.query);
  const lines = await tailFile('combined.log', total);
  res.json({ status: 'success', data: { file: 'combined.log', lines } });
});

export const getErrorLogs = asyncHandler(async (req, res) => {
  const total = parseLines(req.query);
  const lines = await tailFile('error.log', total);
  res.json({ status: 'success', data: { file: 'error.log', lines } });
});

export const postLoggerTest = asyncHandler(async (req, res) => {
  const log = req.logger;
  log.debug('Entrada de prueba debug.');
  log.http('Entrada de prueba http.');
  log.info('Entrada de prueba info.');
  log.warn('Entrada de prueba warn.');
  log.error('Entrada de prueba error.');
  res.status(201).json({ status: 'success', data: { written: true } });
});
