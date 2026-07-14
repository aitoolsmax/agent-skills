import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_PATH, ROOT, validateConfig } from './config.mjs';

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function replaceTemplate(template, replacements) {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) output = output.replaceAll(`{{${key}}}`, value);
  return output;
}

export async function createSkill(config, name, flags) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw new Error('Skill name must use lowercase kebab-case');
  if (config.skills[name]) throw new Error(`Skill already exists: ${name}`);
  const actorId = flags['actor-id'];
  const title = flags.title;
  const description = flags.description;
  if (!actorId || !/^[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+$/.test(actorId)) throw new Error('--actor-id owner/name is required');
  if (!title) throw new Error('--title is required');
  if (!description || description.length < 80) throw new Error('--description of at least 80 characters is required');

  const directory = path.join(ROOT, 'skills', name);
  if (await exists(directory)) throw new Error(`Directory already exists: skills/${name}`);
  const template = await readFile(path.join(ROOT, 'templates', 'apify-actor-skill', 'SKILL.md.template'), 'utf8');
  await mkdir(path.join(directory, 'references'), { recursive: true });
  await writeFile(path.join(directory, 'SKILL.md'), replaceTemplate(template, {
    NAME: name,
    TITLE: title,
    DESCRIPTION: description,
    ACTOR_ID: actorId,
    USER_AGENT: `${config.catalog.owner}-agent-skills/${name}`
  }), 'utf8');
  await writeFile(path.join(directory, 'references', 'actor-contract.md'), '# Actor contract\n\nDocument the current public input schema, output fields, cost model, and limitations before enabling release.\n', 'utf8');

  config.skills[name] = {
    title,
    description,
    actorId,
    canonicalPath: `skills/${name}`,
    version: '0.1.0',
    tags: ['apify'],
    releaseValidation: {
      liveActorSmokeTest: false,
      maxItems: 1,
      budgetUsdPerSkill: 1,
      timeoutSeconds: 120,
      smokeInput: { maxItems: 1 }
    },
    userAgents: {
      canonical: `${config.catalog.owner}-agent-skills/${name}`,
      apifyAwesomeSkills: `apify-awesome-skills/${name}`
    }
  };
  validateConfig(config);
  await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  return { name, path: `skills/${name}`, actorId, liveSmokeTest: 'disabled-until-configured' };
}
