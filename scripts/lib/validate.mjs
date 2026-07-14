import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';
import { fromRoot } from './files.mjs';

const SECRET_PATTERNS = [
  /apify_api_[A-Za-z0-9_-]{20,}/i,
  /(?:api[_-]?key|token|password)\s*[:=]\s*["'][^"'\n]{12,}["']/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

export async function validateSkill(name, skill) {
  const directory = fromRoot(skill.canonicalPath);
  const skillFile = path.join(directory, 'SKILL.md');
  const markdown = await readFile(skillFile, 'utf8');
  const { data } = parseFrontmatter(markdown, `${skill.canonicalPath}/SKILL.md`);
  const keys = Object.keys(data).sort();
  if (keys.join(',') !== 'description,name') throw new Error(`${name} frontmatter must contain only name and description`);
  if (data.name !== name) throw new Error(`${name} frontmatter name does not match its directory`);
  if (data.description.length < 80 || data.description.length > 1024) {
    throw new Error(`${name} description must be 80-1024 characters`);
  }
  if (!markdown.includes(skill.actorId)) throw new Error(`${name} does not reference configured Actor ${skill.actorId}`);
  if (!markdown.includes(skill.userAgents.canonical)) throw new Error(`${name} does not use its canonical telemetry identity`);
  if (!markdown.includes('2>/dev/null')) throw new Error(`${name} must separate diagnostics when parsing output`);

  const files = await walk(directory);
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) throw new Error(`Potential secret in ${path.relative(fromRoot(), file)}`);
    }
  }
  return { name, files: files.length, status: 'valid' };
}

export async function scanRepositoryForSecrets() {
  const roots = ['skills', 'scripts', 'schemas', 'skills.config.json', '.github'];
  const files = [];
  for (const relative of roots) {
    const absolute = fromRoot(relative);
    try {
      const statFiles = relative.includes('.') && !relative.startsWith('.')
        ? [absolute]
        : await walk(absolute);
      files.push(...statFiles);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  for (const file of files) {
    const content = await readFile(file, 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(content)) throw new Error(`Potential secret in ${path.relative(fromRoot(), file)}`);
    }
  }
  return files.length;
}
