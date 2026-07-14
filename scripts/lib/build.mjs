import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { copyDirectory, fromRoot, resetDirectory, writeText } from './files.mjs';

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function yamlString(value) {
  return JSON.stringify(value);
}

export async function buildCatalog(config, selectedSkills) {
  await resetDirectory('dist');
  const catalogSkills = [];

  for (const [name, skill] of selectedSkills) {
    await copyDirectory(skill.canonicalPath, `dist/skills-sh/${name}`);
    await copyDirectory(skill.canonicalPath, `dist/apify-awesome-skills/${name}`);

    const upstreamRoot = fromRoot('dist', 'apify-awesome-skills', name);
    const upstreamFiles = await collectMarkdown(upstreamRoot);
    for (const file of upstreamFiles) {
      const content = await readFile(file, 'utf8');
      let transformed = content.replaceAll(skill.userAgents.canonical, skill.userAgents.apifyAwesomeSkills);
      if (path.basename(file) === 'SKILL.md') transformed = transformApifyCommunitySkill(transformed, skill);
      await writeText(path.relative(fromRoot(), file), transformed);
    }

    await writeText(`${skill.canonicalPath}/agents/openai.yaml`, [
      'interface:',
      `  display_name: ${yamlString(skill.title)}`,
      '  short_description: "Research Kick creators and live channels"',
      `  default_prompt: ${yamlString(`Use $${name} to research Kick.com creators, categories, and live channels for my question.`)}`,
      'policy:',
      '  allow_implicit_invocation: true'
    ].join('\n'));

    catalogSkills.push({
      name,
      title: skill.title,
      description: skill.description,
      version: skill.version,
      path: skill.canonicalPath,
      repository: `https://github.com/${config.catalog.owner}/${config.catalog.repository}`,
      install: `npx skills add ${config.catalog.owner}/${config.catalog.repository} --skill ${name} --yes`
    });
  }

  const allSkills = Object.entries(config.skills).map(([name, skill]) => ({ name, ...skill }));
  await writeText('AGENTS.md', renderAgents(config, allSkills));
  await writeText('.claude-plugin/marketplace.json', json(renderClaudeMarketplace(config, allSkills)));
  await writeText('gemini-extension.json', json(renderGeminiExtension(config)));
  await writeText('.well-known/agent-skills/index.json', json({
    schema_version: '1.0',
    generated_from: `https://github.com/${config.catalog.owner}/${config.catalog.repository}`,
    deployment: 'disabled',
    skills: catalogSkills
  }));
  await writeText('dist/build-manifest.json', json({
    generatedAt: 'deterministic',
    canonicalLicense: config.catalog.license,
    platforms: {
      skillsSh: 'generated',
      apifyAwesomeSkills: 'generated',
      wellKnown: 'generated-not-deployed',
      clawhub: 'disabled'
    },
    skills: catalogSkills.map(({ name, version }) => ({ name, version }))
  }));
  return catalogSkills;
}

function transformApifyCommunitySkill(markdown, skill) {
  const userAgent = skill.userAgents.apifyAwesomeSkills;
  return markdown
    .replace(`Set a stable telemetry identity and Actor ID:\n\n\`\`\`bash\nACTOR_ID='${skill.actorId}'\nUSER_AGENT='${userAgent}'\n\`\`\``, `Set the fixed Actor ID:\n\n\`\`\`bash\nACTOR_ID='${skill.actorId}'\n\`\`\``)
    .replace(/Before preparing input, inspect the current input contract without saving a raw authenticated Actor record:\n\n```bash\n[\s\S]*?\n```\n\nTreat the live schema as authoritative if it differs from this skill\. Never run `apify actors info \.\.\. --json` unfiltered, because an owner-visible Actor record can contain private configuration or defaults\./, `Before preparing input, review the Actor's current public [Input tab](https://apify.com/${skill.actorId}/input-schema). Treat the live public schema as authoritative if it differs from this skill. Never save or display a raw authenticated Actor record.`)
    .replaceAll('--user-agent "$USER_AGENT"', `--user-agent ${userAgent}`);
}

async function collectMarkdown(directory) {
  const { readdir } = await import('node:fs/promises');
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectMarkdown(fullPath));
    else if (entry.name.endsWith('.md')) files.push(fullPath);
  }
  return files;
}

function renderAgents(config, skills) {
  const rows = skills.map((skill) => `| \`${skill.name}\` | ${skill.description} | [SKILL.md](${skill.canonicalPath}/SKILL.md) |`).join('\n');
  return `# AI Tools Max Agent Skills\n\nThis repository is generated from \`skills.config.json\`. Canonical skills live under \`skills/\`; do not hand-edit \`dist/\`.\n\n| Skill | Use when | Source |\n| --- | --- | --- |\n${rows}\n\n## Release policy\n\n- skills.sh is the first marketplace target.\n- ClawHub is deferred and disabled.\n- The canonical license is ${config.catalog.license}.\n- Live release tests are capped at USD $1 per skill per release.\n`;
}

function renderClaudeMarketplace(config, skills) {
  return {
    $schema: 'https://json.schemastore.org/claude-code-marketplace.json',
    name: 'aitoolsmax-agent-skills',
    version: '1.0.0',
    description: 'AI Tools Max Agent Skills backed by Apify Actors',
    owner: { name: 'AI Tools Max', email: config.catalog.supportEmail },
    plugins: [{
      name: 'aitoolsmax-agent-skills',
      description: 'Portable AI Tools Max skills for Apify-powered research workflows.',
      version: '1.0.0',
      author: { name: 'AI Tools Max', email: config.catalog.supportEmail },
      source: './',
      category: 'data',
      strict: false,
      skills: skills.map((skill) => `./${skill.canonicalPath}`),
      homepage: `https://github.com/${config.catalog.owner}/${config.catalog.repository}`
    }]
  };
}

function renderGeminiExtension(config) {
  return {
    name: 'aitoolsmax-agent-skills',
    version: '1.0.0',
    description: 'AI Tools Max skills for Apify Actors',
    contextFileName: 'AGENTS.md',
    repository: `https://github.com/${config.catalog.owner}/${config.catalog.repository}`
  };
}
