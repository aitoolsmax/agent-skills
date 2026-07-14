export function platformStatuses(config, skillName) {
  const repo = `${config.catalog.owner}/${config.catalog.repository}`;
  const entries = {
    github: {
      state: 'source-required',
      automated: true,
      url: `https://github.com/${repo}`,
      next: 'Create and push the public canonical repository.'
    },
    skillsSh: {
      state: 'awaiting-public-source',
      automated: 'verify',
      priority: 0,
      url: `https://skills.sh/${repo}/${skillName}`,
      next: `After GitHub is public, perform one legitimate install: npx skills add ${repo} --skill ${skillName} --yes`
    },
    apifyAwesomeSkills: {
      state: 'artifact-ready-after-build',
      automated: 'patch-only',
      url: 'https://github.com/apify/awesome-skills',
      next: `Submit dist/apify-awesome-skills/${skillName} as one skill per PR.`
    },
    agentSkillSh: {
      state: 'manual-bootstrap',
      automated: 'sync-after-claim',
      url: 'https://agentskill.sh',
      next: 'Import and claim the GitHub repository once, then enable its push webhook.'
    },
    skillsMp: {
      state: 'passive-index',
      automated: 'verification-only',
      url: 'https://skillsmp.com',
      next: 'Wait for public GitHub indexing, then verify discovery.'
    },
    awesomeSkill: {
      state: 'passive-or-manual-index',
      automated: false,
      url: 'https://awesomeskill.ai',
      next: 'Verify public GitHub discovery; no documented publisher API is available.'
    },
    wellKnown: {
      state: 'generated-not-deployed',
      automated: 'build-only',
      url: null,
      next: 'Choose Cloudflare Pages or GitHub Pages plus a subdomain before deployment.'
    },
    clawhub: {
      state: 'disabled',
      automated: false,
      url: 'https://clawhub.ai',
      next: 'Requires a future explicit MIT-0 opt-in.'
    },
    mcpServers: {
      state: 'not-applicable',
      automated: false,
      url: 'https://mcpservers.org/agent-skills',
      next: 'This directory is for MCP servers, not standalone Agent Skills.'
    }
  };
  return entries;
}

export function selectPlatforms(config, requested = 'all') {
  const names = requested === 'all' ? Object.keys(config.platforms) : requested.split(',');
  for (const name of names) {
    if (!config.platforms[name]) throw new Error(`Unknown platform: ${name}`);
  }
  return names;
}
