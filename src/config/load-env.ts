import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let envLoaded = false;

export function loadEnvFile(): void {
  if (envLoaded) {
    return;
  }

  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) {
    envLoaded = true;
    return;
  }

  const fileContent = readFileSync(envPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/);

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }

  envLoaded = true;
}
