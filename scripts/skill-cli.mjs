#!/usr/bin/env node
import { buildCatalog } from './lib/build.mjs';
import { loadConfig, selectSkills } from './lib/config.mjs';
import { createSkill } from './lib/create.mjs';
import { platformStatuses, selectPlatforms } from './lib/platforms.mjs';
import { runSmokeTest } from './lib/smoke.mjs';
import { scanRepositoryForSecrets, validateSkill } from './lib/validate.mjs';

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) positional.push(arg);
    else {
      const [rawKey, inline] = arg.slice(2).split('=', 2);
      if (inline !== undefined) flags[rawKey] = inline;
      else if (argv[index + 1] && !argv[index + 1].startsWith('--')) flags[rawKey] = argv[++index];
      else flags[rawKey] = true;
    }
  }
  return { positional, flags };
}

function print(value, jsonMode = false) {
  if (jsonMode || typeof value !== 'string') process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  else process.stdout.write(`${value}\n`);
}

function usage() {
  return `Usage:
  npm run skill -- validate [skill|all] [--json]
  npm run skill -- build [skill|all] [--json]
  npm run skill -- publish [skill|all] --platform <name|all> --dry-run
  npm run skill -- status [skill|all] --platform <name|all> [--json]
  npm run skill -- smoke <skill> [--execute] [--json]
  npm run skill -- create <skill> --actor-id <owner/name> --title <title> --description <description>

External publishing is never implied by build. ClawHub is disabled.`;
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [command, selector = 'all'] = positional;
  if (!command || flags.help) return print(usage());
  const config = await loadConfig();
  if (command === 'create') {
    if (selector === 'all') throw new Error('create requires one explicit skill name');
    return print(await createSkill(config, selector, flags), Boolean(flags.json));
  }
  const skills = selectSkills(config, selector);

  if (command === 'validate') {
    const results = [];
    for (const [name, skill] of skills) results.push(await validateSkill(name, skill));
    const scannedFiles = await scanRepositoryForSecrets();
    return print({ status: 'valid', skills: results, scannedFiles }, Boolean(flags.json));
  }

  if (command === 'build') {
    for (const [name, skill] of skills) await validateSkill(name, skill);
    const built = await buildCatalog(config, skills);
    return print({ status: 'built', skills: built, clawhub: 'disabled', wellKnown: 'generated-not-deployed' }, Boolean(flags.json));
  }

  if (command === 'status' || command === 'publish') {
    if (command === 'publish' && !flags['dry-run']) {
      throw new Error('Publication requires an explicit platform-specific release approval. Re-run with --dry-run to inspect the workflow.');
    }
    const platformNames = selectPlatforms(config, flags.platform ?? 'all');
    const result = {};
    for (const [name] of skills) {
      const statuses = platformStatuses(config, name);
      result[name] = Object.fromEntries(platformNames.map((platform) => [platform, statuses[platform]]));
    }
    return print({ command, dryRun: command === 'publish', skills: result }, Boolean(flags.json));
  }

  if (command === 'smoke') {
    if (selector === 'all') throw new Error('smoke requires one explicit skill name');
    const [[name, skill]] = skills;
    const result = await runSmokeTest(name, skill, { execute: Boolean(flags.execute) });
    return print(result, Boolean(flags.json));
  }

  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

main().catch((error) => {
  process.stderr.write(`Error: ${error.message}\n`);
  process.exitCode = 1;
});
