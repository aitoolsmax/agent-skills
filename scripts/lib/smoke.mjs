import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']);

function actorApiId(actorId) {
  return actorId.replace('/', '~');
}

function safeErrorMessage(payload, fallback) {
  const message = payload?.error?.message ?? payload?.message;
  return typeof message === 'string' ? message.slice(0, 500) : fallback;
}

export async function runSmokeTest(name, skill, { execute = false, token = process.env.APIFY_TOKEN } = {}) {
  const validation = skill.releaseValidation;
  if (!validation.liveActorSmokeTest) throw new Error(`${name} live smoke testing is disabled`);
  if (validation.maxItems !== 1 || validation.smokeInput?.maxItems !== 1) {
    throw new Error(`${name} smoke input is not capped at one result`);
  }
  if (validation.budgetUsdPerSkill > 1) throw new Error(`${name} exceeds the authorized USD $1 ceiling`);

  const plan = {
    skill: name,
    actorId: skill.actorId,
    input: validation.smokeInput,
    maxTotalChargeUsd: validation.budgetUsdPerSkill,
    timeoutSeconds: validation.timeoutSeconds,
    execute
  };
  if (!execute) return { state: 'dry-run', ...plan };

  const request = token ? tokenRequest(token, skill.userAgents.canonical) : cliRequest(skill.userAgents.canonical);
  const payload = await request('POST', `acts/${actorApiId(skill.actorId)}/runs`, {
    body: validation.smokeInput,
    params: {
      maxTotalChargeUsd: validation.budgetUsdPerSkill
    }
  });
  let run = payload.data ?? payload;
  if (!run.id) throw new Error('Apify smoke run did not return a run ID');
  const deadline = Date.now() + validation.timeoutSeconds * 1000;
  while (!TERMINAL_STATUSES.has(run.status) && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const statusPayload = await request('GET', `actor-runs/${run.id}`);
    run = statusPayload.data ?? statusPayload;
  }
  if (run.status !== 'SUCCEEDED') throw new Error(`Apify smoke run ended with status ${run.status ?? 'unknown'} (run ${run.id})`);
  if (!run.defaultDatasetId) throw new Error('Apify smoke run did not return a dataset ID');

  const items = await request('GET', `datasets/${run.defaultDatasetId}/items`, { params: { limit: 1, clean: true } });
  return {
    state: 'succeeded',
    skill: name,
    runId: run.id,
    datasetId: run.defaultDatasetId,
    itemCount: Array.isArray(items) ? items.length : 0,
    maxTotalChargeUsd: validation.budgetUsdPerSkill
  };
}

function tokenRequest(token, userAgent) {
  return async (method, endpoint, { body, params = {} } = {}) => {
    const query = new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]));
    const response = await fetch(`https://api.apify.com/v2/${endpoint}${query.size ? `?${query}` : ''}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': userAgent
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Apify API failed (${response.status}): ${safeErrorMessage(payload, 'unknown error')}`);
    return payload;
  };
}

function cliRequest(userAgent) {
  return async (method, endpoint, { body, params = {} } = {}) => {
    const args = ['api', method, endpoint, '--params', JSON.stringify(params), '--user-agent', userAgent];
    if (body !== undefined) args.push('--body', JSON.stringify(body));
    let stdout;
    try {
      ({ stdout } = await execFileAsync('apify', args, {
        env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
        maxBuffer: 2 * 1024 * 1024,
        timeout: 30_000
      }));
    } catch (error) {
      throw new Error(`Authenticated Apify CLI request failed: ${String(error.stderr || error.message).trim().slice(0, 500)}`);
    }
    try {
      return JSON.parse(stdout);
    } catch {
      throw new Error('Authenticated Apify CLI returned non-JSON output');
    }
  };
}
