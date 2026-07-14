# AI Tools Max Agent Skills

Portable Agent Skills backed by [AI Tools Max Actors on Apify](https://apify.com/aitooolsmax). The first skill is `apify-kick-scraper`, for broad Kick.com creator discovery, market research, category mapping, and live-channel research.

## Install the Kick skill

After the public repository is released:

```bash
npx skills add aitoolsmax/agent-skills --skill apify-kick-scraper --yes
```

The canonical skill is at [`skills/apify-kick-scraper`](skills/apify-kick-scraper/SKILL.md). It always routes Kick requests to [`aitooolsmax/kick-data-scraper`](https://apify.com/aitooolsmax/kick-data-scraper).

## Catalog commands

The project requires Node.js 20+ and has no runtime dependencies.

```bash
npm run validate
npm run build
npm test

npm run skill -- status apify-kick-scraper --platform all
npm run skill -- publish apify-kick-scraper --platform all --dry-run
npm run skill -- smoke apify-kick-scraper
```

`build` creates deterministic platform editions under `dist/`, generates Claude/Gemini/OpenAI metadata, and generates an undeployed `.well-known/agent-skills` catalog. It never publishes externally.

The live smoke test is dry-run by default. `--execute` uses an existing `apify login` session or a local `APIFY_TOKEN`, runs one result, and passes `maxTotalChargeUsd=1` to Apify's API. Never put tokens in command arguments or committed files.

## Add another Actor skill

```bash
npm run skill -- create apify-example-scraper \
  --actor-id aitooolsmax/example-scraper \
  --title "Apify Example Scraper" \
  --description "A precise description of what the skill does, the user requests that trigger it, and the Actor-backed workflows it supports."
```

The command creates the canonical folder and config entry with live testing disabled. Complete its Actor contract, examples, safety guidance, and smoke input before enabling release validation.

## Distribution policy

| Platform | Initial workflow |
| --- | --- |
| skills.sh | First priority. Public GitHub source plus one legitimate CLI installation, followed by listing verification. |
| Apify Awesome Skills | Generate a one-skill upstream edition and submit one PR. |
| agentskill.sh | One-time GitHub import/claim, then repository sync/webhook. |
| SkillsMP and AwesomeSkill | Passive public-GitHub indexing and verification. |
| `.well-known/agent-skills` | Generate only. Future deployment may use Cloudflare Pages or GitHub Pages on a subdomain. |
| ClawHub | Deferred and disabled pending a future explicit MIT-0 opt-in. |
| mcpservers.org | Not applicable to standalone Agent Skills. |

Run `status` or `publish --dry-run` for machine-readable states and next actions. The project never represents a manual or passive index as a successful programmatic publication.

## Release order

1. Validate, test, and security-scan the canonical catalog.
2. Create and push `aitoolsmax/agent-skills` publicly.
3. Install `apify-kick-scraper` once through the supported skills CLI and verify its skills.sh page.
4. Only after skills.sh is healthy, continue to secondary directories.

The full rationale, platform research, and acceptance criteria are in [PLAN.md](PLAN.md).

## License

Apache-2.0. Actor execution is a separate paid Apify service governed by its current Store pricing and the user's Apify plan.
