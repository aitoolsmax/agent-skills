import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..', '..');
export const CONFIG_PATH = path.join(ROOT, 'skills.config.json');

export async function loadConfig() {
  const raw = await readFile(CONFIG_PATH, 'utf8');
  const config = JSON.parse(raw);
  validateConfig(config);
  return config;
}

export function selectSkills(config, selector = 'all') {
  if (selector === 'all') return Object.entries(config.skills);
  const skill = config.skills[selector];
  if (!skill) throw new Error(`Unknown skill: ${selector}`);
  return [[selector, skill]];
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${label} must be a non-empty string`);
  }
}

export function validateConfig(config) {
  if (!config || typeof config !== 'object') throw new Error('Config must be an object');
  if (!config.catalog || !config.platforms || !config.skills) {
    throw new Error('Config requires catalog, platforms, and skills');
  }
  requireString(config.catalog.owner, 'catalog.owner');
  requireString(config.catalog.repository, 'catalog.repository');
  if (config.catalog.license !== 'Apache-2.0') throw new Error('Canonical license must be Apache-2.0');

  for (const [name, release] of Object.entries(config.releases ?? {})) {
    const skill = config.skills[name];
    if (!skill) throw new Error(`Release state references unknown skill: ${name}`);
    if (release.version !== skill.version) {
      throw new Error(`${name} release version must match its skill version`);
    }
    for (const platform of Object.keys(release.platforms ?? {})) {
      if (!config.platforms[platform]) {
        throw new Error(`${name} release state references unknown platform: ${platform}`);
      }
    }
  }

  for (const [name, skill] of Object.entries(config.skills)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error(`Invalid skill name: ${name}`);
    requireString(skill.actorId, `${name}.actorId`);
    if (skill.canonicalPath !== `skills/${name}`) {
      throw new Error(`${name}.canonicalPath must be skills/${name}`);
    }
    if (skill.releaseValidation.maxItems !== 1 || skill.releaseValidation.smokeInput?.maxItems !== 1) {
      throw new Error(`${name} smoke validation must be capped at one result`);
    }
    const budget = skill.releaseValidation.budgetUsdPerSkill;
    if (typeof budget !== 'number' || budget <= 0 || budget > 1) {
      throw new Error(`${name} budgetUsdPerSkill must be greater than 0 and at most 1`);
    }
  }
}
