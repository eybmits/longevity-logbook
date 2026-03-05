import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createDefaultProgram } from '../data/program.ts';
import type { LegacyLogbookFile, LogbookFile, ProgramDefinition, SessionRecord } from '../types.ts';

const STORAGE_PATH = fileURLToPath(new URL('../../data/logbook.json', import.meta.url));
const STORAGE_DIR = fileURLToPath(new URL('../../data/', import.meta.url));

export function getStoragePath(): string {
  return STORAGE_PATH;
}

export async function loadLogbook(): Promise<{ sessions: SessionRecord[]; program: ProgramDefinition }> {
  try {
    const raw = await readFile(STORAGE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as Partial<LogbookFile | LegacyLogbookFile>;

    if (parsed.version === 1 && Array.isArray(parsed.sessions)) {
      return {
        sessions: parsed.sessions as SessionRecord[],
        program: createDefaultProgram(),
      };
    }

    if (parsed.version === 2 && Array.isArray(parsed.sessions) && parsed.program) {
      return {
        sessions: parsed.sessions as SessionRecord[],
        program: parsed.program as ProgramDefinition,
      };
    }

    throw new Error(`Unsupported data shape in ${STORAGE_PATH}`);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === 'ENOENT') {
      return {
        sessions: [],
        program: createDefaultProgram(),
      };
    }

    if (error instanceof SyntaxError) {
      throw new Error(`Could not parse JSON in ${STORAGE_PATH}`);
    }

    throw error;
  }
}

export async function saveLogbook(sessions: SessionRecord[], program: ProgramDefinition): Promise<void> {
  await mkdir(STORAGE_DIR, { recursive: true });

  const payload: LogbookFile = {
    version: 2,
    sessions,
    program,
  };

  await writeFile(STORAGE_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}
