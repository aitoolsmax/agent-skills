import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ROOT } from './config.mjs';

export function fromRoot(...parts) {
  return path.join(ROOT, ...parts);
}

export async function readText(relativePath) {
  return readFile(fromRoot(relativePath), 'utf8');
}

export async function writeText(relativePath, content) {
  const destination = fromRoot(relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  const normalized = content.endsWith('\n') ? content : `${content}\n`;
  await writeFile(destination, normalized, 'utf8');
}

export async function resetDirectory(relativePath) {
  const destination = fromRoot(relativePath);
  if (!destination.startsWith(`${ROOT}${path.sep}`)) throw new Error('Refusing to reset path outside repository');
  await rm(destination, { recursive: true, force: true });
  await mkdir(destination, { recursive: true });
}

export async function copyDirectory(sourceRelative, destinationRelative) {
  await mkdir(path.dirname(fromRoot(destinationRelative)), { recursive: true });
  await cp(fromRoot(sourceRelative), fromRoot(destinationRelative), { recursive: true });
}
