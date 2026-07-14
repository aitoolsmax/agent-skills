import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { buildCatalog } from '../scripts/lib/build.mjs';
import { loadConfig, selectSkills } from '../scripts/lib/config.mjs';
import { fromRoot } from '../scripts/lib/files.mjs';
import { platformStatuses } from '../scripts/lib/platforms.mjs';
import { runSmokeTest } from '../scripts/lib/smoke.mjs';
import { scanRepositoryForSecrets, validateSkill } from '../scripts/lib/validate.mjs';

test('canonical Kick skill validates and contains no secret patterns', async () => {
  const config = await loadConfig();
  const skill = config.skills['apify-kick-scraper'];
  const result = await validateSkill('apify-kick-scraper', skill);
  assert.equal(result.status, 'valid');
  assert.ok(await scanRepositoryForSecrets() > 0);
});

test('build is deterministic and keeps ClawHub disabled', async () => {
  const config = await loadConfig();
  await buildCatalog(config, selectSkills(config));
  const manifest = JSON.parse(await readFile(fromRoot('dist/build-manifest.json'), 'utf8'));
  assert.equal(manifest.generatedAt, 'deterministic');
  assert.equal(manifest.platforms.clawhub, 'disabled');
  const upstream = await readFile(fromRoot('dist/apify-awesome-skills/apify-kick-scraper/SKILL.md'), 'utf8');
  assert.match(upstream, /apify-awesome-skills\/apify-kick-scraper/);
  assert.doesNotMatch(upstream, /aitoolsmax-agent-skills\/apify-kick-scraper/);
  assert.doesNotMatch(upstream, /\$USER_AGENT/);
  assert.doesNotMatch(upstream, /apify actors info/);
  const wellKnown = JSON.parse(await readFile(fromRoot('.well-known/agent-skills/index.json'), 'utf8'));
  assert.equal(wellKnown.deployment, 'disabled');
  const openai = await readFile(fromRoot('skills/apify-kick-scraper/agents/openai.yaml'), 'utf8');
  assert.match(openai, /^interface:/);
  assert.match(openai, /\$apify-kick-scraper/);
  assert.match(openai, /allow_implicit_invocation: true/);
  const claude = JSON.parse(await readFile(fromRoot('.claude-plugin/marketplace.json'), 'utf8'));
  assert.equal(claude.plugins[0].strict, false);
  assert.deepEqual(claude.plugins[0].skills, ['./skills/apify-kick-scraper']);
});

test('skills.sh is first and ClawHub cannot publish', async () => {
  const config = await loadConfig();
  const statuses = platformStatuses(config, 'apify-kick-scraper');
  assert.equal(statuses.skillsSh.priority, 0);
  assert.equal(statuses.clawhub.state, 'disabled');
  assert.equal(config.platforms.clawhub.enabled, false);
});

test('smoke command is dry-run and enforces the one-dollar ceiling', async () => {
  const config = await loadConfig();
  const result = await runSmokeTest('apify-kick-scraper', config.skills['apify-kick-scraper']);
  assert.equal(result.state, 'dry-run');
  assert.equal(result.input.maxItems, 1);
  assert.equal(result.maxTotalChargeUsd, 1);
});
