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
    awesomeSkillsDev: {
      state: 'submission-ready',
      automated: true,
      url: 'https://www.awesomeskills.dev/en/submit',
      next: 'Submit the canonical GitHub skill path through the JSON-backed submission workflow.'
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
  const overrides = config.releases?.[skillName]?.platforms ?? {};
  return Object.fromEntries(
    Object.entries(entries).map(([name, status]) => [name, { ...status, ...overrides[name] }])
  );
}

export function selectPlatforms(config, requested = 'all') {
  const names = requested === 'all'
    ? Object.entries(config.platforms)
      .filter(([, platform]) => platform.enabled)
      .sort(([leftName, left], [rightName, right]) => {
        const priorityDelta = (left.priority ?? Number.MAX_SAFE_INTEGER) - (right.priority ?? Number.MAX_SAFE_INTEGER);
        return priorityDelta || leftName.localeCompare(rightName);
      })
      .map(([name]) => name)
    : requested.split(',');
  for (const name of names) {
    if (!config.platforms[name]) throw new Error(`Unknown platform: ${name}`);
  }
  return names;
}

export function publicationRequest(config, skillName, platformName) {
  const skill = config.skills[skillName];
  const platform = config.platforms[platformName];
  if (!skill) throw new Error(`Unknown skill: ${skillName}`);
  if (!platform) throw new Error(`Unknown platform: ${platformName}`);
  if (!platform.enabled) return null;
  if (platformName !== 'awesomeSkillsDev') return null;

  const sourceUrl = `https://github.com/${config.catalog.owner}/${config.catalog.repository}/tree/${config.catalog.defaultBranch}/${skill.canonicalPath}`;
  return {
    url: platform.endpoint,
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sourceUrl })
    },
    listingBase: platform.listingBase
  };
}

export async function publishSkillToPlatform(config, skillName, platformName, { force = false } = {}) {
  const status = platformStatuses(config, skillName)[platformName];
  if (!force && status?.state === 'live') {
    return { state: 'already-live', executed: false, url: status.url };
  }

  const request = publicationRequest(config, skillName, platformName);
  if (!request) {
    return { state: 'no-programmatic-publisher', executed: false, url: status?.url ?? null, next: status?.next };
  }

  const response = await fetch(request.url, request.init);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${platformName} publication failed (${response.status}): ${payload.error ?? 'unexpected response'}`);
  return {
    state: payload.status ?? 'submitted',
    executed: true,
    url: payload.slug ? `${request.listingBase}/${payload.slug}` : null,
    response: payload
  };
}
