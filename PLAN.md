# AI Tools Max agent-skill publishing blueprint

Build and release a portable `apify-kick-scraper` skill to skills.sh first, backed exclusively by `aitooolsmax/kick-data-scraper`, then make this repository a reusable catalog and release tool for future AI Tools Max Actors and secondary distribution channels.

Use one canonical skill source plus generated platform adapters; do not maintain hand-edited copies.

ClawHub is intentionally deferred and disabled because its mandatory MIT-0 publication license has not been accepted.

Status: research and planning complete; implementation and external publishing await the interview decisions below.

## 1. Decisions most likely to change

### 1.1 Primary release target: skills.sh

**Confirmed choice:** skills.sh is the first and highest-priority marketplace. The release workflow must optimize its naming, install command, listing copy, security audit, and verification before publishing to any secondary directory.

skills.sh does not expose a publisher API. Its supported source is a public GitHub repository, and the `skills` CLI reports legitimate public-repository installs through telemetry. Therefore, GitHub is a transport prerequisite for the skills.sh release—not a higher-priority marketplace.

The first release milestone is complete only when:

1. the canonical public repository is available;
2. `npx skills add <owner>/<repo> --skill apify-kick-scraper` installs successfully;
3. one legitimate smoke installation seeds/verifies discovery with telemetry enabled;
4. the skills.sh detail page/API exposes the expected skill and files;
5. the listing URL, install count baseline, and security-audit state are recorded.

**Alternative considered:** publish simultaneously to every directory.

**Cost of changing later:** simultaneous release would spread debugging and dilute the initial listing/measurement effort. Secondary adapters remain available after skills.sh is verified.

### 1.2 Canonical publisher identity

**Confirmed choice:** use the newly recreated public GitHub account and canonical repository `aitoolsmax/agent-skills`.

The Apify Actor remains under the separate existing Apify owner `aitooolsmax`; do not rewrite the Actor ID to match the GitHub account spelling.

GitHub must be the source of truth because skills.sh, SkillsMP, agentskill.sh, AwesomeSkill, and similar catalogs discover or import public GitHub `SKILL.md` files. The chosen GitHub owner also affects verified ownership, listing URLs, ClawHub namespace selection, badges, and analytics.

**Alternative:** publish from the currently authenticated personal account, `offminded`.

**Cost of changing later:** redirects and Git history are manageable, but marketplace ownership claims, install URLs, badges, analytics continuity, and ClawHub ownership transfers may need manual repair.

### 1.3 Canonical content versus generated platform editions

**Proposed choice:** keep `skills/apify-kick-scraper/` canonical and generate disposable editions under `dist/<platform>/apify-kick-scraper/`.

The canonical `SKILL.md` will use only `name` and `description` frontmatter for maximum compatibility. The Apify community adapter must rewrite Apify CLI telemetry attribution to the namespace required by upstream CI. A future ClawHub adapter may add `metadata.openclaw` requirements only after an explicit opt-in.

**Alternative:** publish the exact same folder everywhere.

**Cost of changing later:** a single untouched folder is simpler initially, but it cannot cleanly satisfy platform-specific metadata and `apify/awesome-skills` telemetry rules without weakening portability or duplicating manual edits.

### 1.4 Skill execution interface

**Proposed choice:** use the official Apify CLI v1.5+ directly. Fetch the Actor input schema dynamically, construct one explicit workflow input, run the Actor, and retrieve dataset items in JSON or CSV.

Every generated `apify` command must:

- include `--json`, or `--format json`/`--format csv` where applicable;
- include a channel-specific `--user-agent` value;
- append `2>/dev/null` when JSON is parsed;
- avoid printing or storing an unfiltered full `apify actors info` response.

**Alternative:** bundle a custom JavaScript API wrapper or use `mcpc` against Apify MCP.

**Cost of changing later:** a wrapper adds a runtime and maintenance surface; `mcpc` is the older reference pattern and makes the skill less direct. Both remain possible as future adapters if CLI compatibility becomes a problem.

### 1.5 ClawHub licensing

**Confirmed choice:** defer ClawHub and keep its adapter, artifact generation, authentication, and publisher disabled.

The canonical repository uses the confirmed Apache-2.0 license, matching Apify's reference repositories. Actor usage remains paid externally on Apify; the skill itself stays free.

**Re-enable condition:** the user explicitly accepts MIT-0 for the generated ClawHub edition in a future decision.

**Cost of changing later:** low technical cost, but delaying loses OpenClaw discovery and download history.

### 1.6 Release automation boundary

**Proposed choice:** one CLI entry point with idempotent adapters:

```bash
npm run skill -- validate apify-kick-scraper
npm run skill -- build apify-kick-scraper
npm run skill -- publish apify-kick-scraper --platform all --dry-run
npm run skill -- status apify-kick-scraper --platform all
```

`publish --platform all` will publish only to platforms with supported authenticated APIs/CLIs. It will report one-time/manual bootstrap steps and verify passive indexers without pretending a publish occurred.

**Alternative:** browser-automate every submission form.

### 1.7 Launch positioning

**Confirmed choice:** lead the skills.sh listing and examples with broad Kick research and creator discovery.

The first release must demonstrate all four Actor modes—channel lookup, keyword search, category discovery, and livestream discovery—while showing how the same skill supports creator research, market mapping, and live-content analysis. Narrower lead-generation and monitoring workflows remain secondary examples.

**Cost of changing later:** low. Listing copy and examples can be reweighted without changing the canonical execution contract.

**Cost of changing later:** browser automation is possible, but it is brittle, harder to secure, and likely to violate platform expectations when no publisher API exists.

## 2. Reference-skill semantics to preserve

The linked Apify skills establish these useful behaviors:

- Trigger from the user's outcome, then route to the correct Actor input.
- Fetch live Actor schemas rather than freezing a large API definition in `SKILL.md`.
- Use the official Apify CLI with stable JSON output and telemetry attribution.
- Skip preference questions for a simple lookup; ask about result count and file format for larger jobs.
- Use blocking runs for normal jobs and start/poll for long-running jobs.
- Return result count, important fields, file path when saved, dataset URL, and run URL.
- Estimate pay-per-event/pay-per-result cost before material runs and require confirmation above a configured threshold.
- Keep gotchas, workflows, and detailed field references outside the main `SKILL.md`.

Deliberate improvements for this project:

- Fix Actor selection to `aitooolsmax/kick-data-scraper`; do not fall back to competing Kick Actors.
- Use the current CLI pattern instead of the older `mcpc` plus `run_actor.js` pattern still visible in the linked market-research and lead-generation listings.
- Filter Actor metadata in-process. Never log the raw authenticated response; the planning audit demonstrated that it can include owner-only configuration and credential-like values.
- Add publishing adapters, reproducible builds, secret scanning, and listing verification—concerns not covered by the reference skills.

Reference license: `apify/agent-skills` and `apify/awesome-skills` are Apache-2.0. Reuse semantics and structure; do not copy incompatible or unnecessary prose.

## 3. `apify-kick-scraper` product contract

### Triggers and positioning

Trigger on requests involving Kick.com, Kick streamers, Kick channels, live Kick discovery, creator/influencer discovery, follower or viewer snapshots, channel social links, category benchmarking, live monitoring, market mapping, and Kick audience/content research.

The skill should clearly say what it does **not** do: the Actor returns channel snapshots. It does not scrape VODs or clips; it only returns their channel-page URLs for follow-up work.

### Actor routing

| User intent | Actor input |
|---|---|
| Known usernames or Kick channel URLs | `mode: channels`, `channelSlugs` |
| Find channels by a phrase or keyword | `mode: search`, `searchKeywords`, optional `maxItems` |
| Browse one or more Kick categories | `mode: category`, `categorySlugs`, optional sort/languages/limit |
| Find currently live channels | `mode: livestreams`, optional sort/languages/tags/limit |

Rules:

- `mode` is always explicit.
- `maxItems` applies only to discovery modes and is capped at 1,000.
- Live tags are exact single values without spaces; phrases such as `CS GO` use keyword search.
- Search can return fewer results than requested; `maxItems` is a cap, not a guarantee.
- Invalid filters may be ignored by the Actor with warnings, so the skill should validate obvious malformed values before spending money.

### Output promise

Present or export channel snapshots containing, when available:

- channel ID, slug, display name, bio, profile/banner images;
- verification, follower count, and live status;
- current livestream title, viewer count, start time, and category;
- public social links and channel/videos/clips page URLs;
- `sourceUrl`, conditional `sourceQuery`, and `scrapedAt` provenance.

Never promise emails, historical follower growth, VOD/clip records, guaranteed result counts, or stable viewer counts.

### Cost and safety behavior

- Treat pricing as dynamic and tier-dependent. The public Store currently advertises pricing “from $3.50 / 1,000 results”; do not hard-code that as every user's exact price.
- Include Actor-start and result-event charges when the live pricing response exposes both.
- Show an estimate before batch runs.
- Default proposal: warn above an estimated $5 and require explicit confirmation above $20; make thresholds configurable.
- Require confirmation for scheduled/recurring jobs because repeated low-cost runs can become material.
- Do not put `APIFY_TOKEN`, cookies, proxy credentials, or sample secrets in skill files, fixtures, logs, generated bundles, or GitHub Actions output.

## 4. Portable repository design

```text
.
├── PLAN.md
├── README.md
├── LICENSE
├── package.json
├── skills.config.json
├── skills.config.schema.json
├── skills/
│   └── apify-kick-scraper/
│       ├── SKILL.md
│       ├── agents/
│       │   └── openai.yaml
│       └── references/
│           ├── actor-contract.md
│           ├── cost-and-safety.md
│           └── workflows.md
├── agents/
│   └── AGENTS.md
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── gemini-extension.json
├── scripts/
│   ├── skill.mjs
│   ├── build.mjs
│   ├── validate.mjs
│   ├── status.mjs
│   └── adapters/
│       ├── canonical.mjs
│       ├── clawhub.mjs
│       ├── apify-awesome-skills.mjs
│       └── well-known.mjs
├── templates/
│   └── actor-skill/
├── tests/
│   ├── config.test.mjs
│   ├── generation.test.mjs
│   ├── telemetry.test.mjs
│   └── fixtures/
├── dist/                       # generated; never hand-edited
└── .github/workflows/
    ├── validate.yml
    └── publish.yml
```

### Configuration model

Use dependency-light JSON with a checked-in JSON Schema. One entry per skill:

```json
{
  "catalog": {
    "owner": "aitoolsmax",
    "repository": "agent-skills",
    "license": "Apache-2.0",
    "supportEmail": "support@aitoolsmax.com"
  },
  "skills": {
    "apify-kick-scraper": {
      "actorId": "aitooolsmax/kick-data-scraper",
      "canonicalPath": "skills/apify-kick-scraper",
      "version": "1.0.0",
      "releaseValidation": {
        "liveActorSmokeTest": true,
        "maxItems": 1,
        "budgetUsdPerSkill": 1
      },
      "platforms": {
        "github": true,
        "skillsSh": true,
        "skillsMp": true,
        "agentSkillSh": true,
        "clawhub": false,
        "apifyAwesomeSkills": true,
        "wellKnown": {
          "generate": true,
          "deploy": false
        }
      },
      "userAgents": {
        "canonical": "aitoolsmax-agent-skills/apify-kick-scraper",
        "clawhub": "aitoolsmax-clawhub/apify-kick-scraper",
        "apifyAwesomeSkills": "apify-awesome-skills/apify-kick-scraper"
      }
    }
  }
}
```

`clawhub` stays false until MIT-0 is accepted. The `.well-known` catalog is always generated and validated, while deployment stays false until an AI Tools Max hosting target is selected.

### Generated compatibility files

- `agents/AGENTS.md`: deterministic index generated from every canonical skill's frontmatter.
- `.claude-plugin/marketplace.json` and `plugin.json`: makes the repository a Claude Code marketplace; the same marketplace format is also usable by compatible clients such as GitHub Copilot CLI.
- `gemini-extension.json`: points Gemini CLI at the generated agent index.
- `skills/<name>/agents/openai.yaml`: OpenAI/Codex-facing UI metadata generated from the canonical skill.
- `.well-known/agent-skills/index.json` plus artifacts: optional branded direct distribution from `aitoolsmax.com` using the current Agent Skills discovery schema.

## 5. Platform workflow matrix

| Platform/channel | Actual workflow | Authentication | Automation plan | Priority |
|---|---|---|---|---|
| **skills.sh** | **Primary release target. No documented publisher API; public GitHub skills are learned through legitimate `skills` CLI install telemetry and then served from the catalog** | No marketplace signup for GitHub source | Publish its GitHub source, perform one real smoke install with telemetry enabled, poll the public catalog/API, and record listing/audit state before continuing | **P0 — first** |
| Public GitHub source | Push canonical repository and release tags required by skills.sh and passive indexers | Existing GitHub account/org permissions | `gh`/git; fully automatable after owner is chosen | P0 prerequisite |
| `apify/awesome-skills` | Fork, add one skill plus marketplace entry, run CI rules, open one-skill PR | GitHub | Generate upstream edition/patch; human review and merge remain external | P1 |
| agentskill.sh | First import from GitHub/direct `SKILL.md`; connect GitHub to claim; daily sync or push webhook | GitHub OAuth | One-time bootstrap/claim, then configure webhook and verify; no documented publish CLI | P1 |
| ClawHub | Deferred; adapter, artifact generation, login, and publishing disabled | Future GitHub sign-in, ClawHub token, and explicit MIT-0 approval | Do not include in `--platform all`; re-enable only by an explicit config and policy change | Deferred |
| SkillsMP | Indexes public GitHub; docs expose a read-only search API and no submission endpoint | None for passive indexing; API key optional for higher search quota | No fake publish step; poll search API and report indexed/not indexed | P1 |
| AwesomeSkill | Public GitHub aggregator; no documented submit API or creator workflow found | Not established | Passive verification only; contact/manual request if discovery does not occur | P2 |
| mcpservers.org Agent Skills | Agent-skill catalog exists, but its visible Submit form is for MCP servers, not skills | Not established | Do not submit a skill as an MCP server; monitor/contact for a real workflow | P2 |
| AI Tools Max `.well-known` | Host standard discovery index and skill artifacts on a controlled domain | Deployment credentials for `aitoolsmax.com` | Generate artifacts now; deploy only after target hosting is identified | P1 |

No secondary marketplace submission begins until the skills.sh listing is verified. After that, the Apify community channel and P1 targets proceed in order. Additional generic catalogs such as SkillsMD, SkillMD, OmniSkill, and Skill Marketplace should be evaluated later; add an adapter only when a documented, supportable import or publish contract exists.

## 6. Known unknowns and pivot signals

### GitHub namespace and repository

Default: AI Tools Max brand-owned public repository.

Pivot when: the brand namespace is unavailable or the current GitHub login lacks access.

### ClawHub license acceptance

Confirmed: deferred and disabled. Do not generate a ClawHub bundle, authenticate, or invoke its publisher in the initial implementation.

Pivot when: the user explicitly accepts MIT-0 for the generated ClawHub edition.

### Canonical license

Confirmed: Apache-2.0 to align with Apify reference repositories and provide an explicit patent grant.

Pivot when: legal/business preference requires MIT, MIT-0, or another permissive license.

### Live Actor smoke tests

Confirmed: release validation may run one live Actor smoke test per skill with `maxItems: 1` and a hard budget ceiling of USD $1 per skill per release.

The user's Apify account currently includes up to USD $85/month in free credits, which is expected to cover these tests. The test runner must enforce the USD $1 ceiling independently and must not assume credits, pricing, or account entitlements remain unchanged.

Pivot when: a skill needs a larger fixture, pricing changes, or the user changes the per-skill ceiling.

### AI Tools Max website deployment

Confirmed: generate and validate provider-neutral `.well-known` artifacts, but do not deploy them in the initial release.

Keep hosting configuration separate from artifact generation. A later deployment adapter must support a subdomain through either Cloudflare Pages or GitHub Pages without changing canonical skill content or URLs embedded in source files.

Pivot when: the user selects a hosting provider, repository, subdomain, and DNS path.

Pivot when: the hosting repository/provider and DNS path for `aitoolsmax.com` are supplied.

### Directory automation

Default: use official APIs/CLIs and webhooks only.

Pivot when: a platform documents a submission endpoint or explicitly permits browser automation.

## 7. Landmines

- **Credential leakage:** authenticated Actor metadata can expose owner-only source/configuration. Rotate the Webshare/proxy credentials exposed during this audit, mark secrets correctly in Apify, and prohibit raw metadata dumps in logs.
- **False “publish all” claims:** several listed sites are passive GitHub indexers, not registries. The CLI must distinguish `published`, `submitted`, `synced`, `indexed`, `pending`, `manual bootstrap`, and `unsupported`.
- **License divergence:** ClawHub's MIT-0 policy applies to published skill bundles even if the canonical repository is Apache-2.0.
- **Duplicate-content penalties:** keep a single GitHub source. Generate copies only for registries that require an uploaded bundle or upstream repository contribution.
- **Pricing drift:** “from” pricing varies by Apify plan tier and can include Actor-start plus result events. Never present a static amount as exact.
- **Actor-contract drift:** the Actor changed recently; dynamic schema checks and contract tests are mandatory.
- **Platform naming drift:** `apify-kick-scraper`, its parent directory, plugin entry, generated indexes, install commands, and listing slug must stay aligned.
- **Unsupported promises:** channel snapshots are not videos, clips, emails, or historical analytics.
- **Signup identity mismatch:** `support@aitoolsmax.com` cannot substitute for GitHub OAuth ownership. Platform claims should use a brand-controlled GitHub identity/org.

## 8. What good looks like

1. **Apify's current `apify-ultimate-scraper`:** concise core workflow, official CLI, dynamic schemas, progressive references, explicit result delivery, and cost/error gotchas.
2. **`apify/awesome-skills`:** highly relevant target audience, one-skill PR workflow, automated structure/telemetry validation, and native Apify discovery.
3. **ClawHub catalog workflow:** versioned registry release, dry-run support, security scanning, catalog-wide reusable GitHub Action, and machine-readable output.

Success is not “listed on the most sites.” Success is a measurable funnel:

```text
catalog impression -> skill install -> first Actor run -> repeat Actor user -> Actor revenue
```

Track, where available:

- listing URLs, index date, rank/category, installs/downloads, and repository traffic;
- user-agent-attributed Actor runs by distribution channel;
- new Actor users, monthly active users, results delivered, and net revenue;
- conversion from install growth to Actor usage, without manufacturing installs.

## 9. Mechanical implementation work

### Phase A — scaffold and canonical skill

1. Initialize `skills/apify-kick-scraper` with the official skill-creator scaffold.
2. Write the concise `SKILL.md` and three progressive-disclosure references.
3. Generate `agents/openai.yaml`.
4. Add Apache-2.0 repository licensing and public README/install examples.

### Phase B — catalog framework

1. Add `skills.config.json` plus schema.
2. Implement deterministic config loading, validation, build, publish, and status commands.
3. Generate repository-wide AGENTS, Claude marketplace, Gemini, and provider-neutral `.well-known` artifacts; keep `.well-known` deployment disabled.
4. Add a template and `create` command so future Actor skills require only config plus domain content.

### Phase C — adapters

1. Canonical/GitHub adapter.
2. skills.sh seed-and-verify adapter; never automate artificial install counts.
3. agentskill.sh bootstrap checklist, webhook setup helper, and verification.
4. Apify community upstream edition and PR patch generator.
5. Passive-index verification for SkillsMP and lower-priority aggregators.
6. Reserve a disabled ClawHub adapter boundary; do not generate artifacts or implement an active publish path.

### Phase D — verification

1. Validate skill frontmatter, name/path agreement, links, and referenced files.
2. Lint every Apify CLI snippet for JSON, stderr, and expected user-agent attribution.
3. Scan canonical and generated trees for secrets and forbidden credential patterns.
4. Snapshot-test deterministic adapters.
5. Install locally with `npx skills add <local-path> --skill apify-kick-scraper`.
6. Validate Claude/Gemini/OpenAI metadata and verify that ClawHub remains excluded from builds and `--platform all`.
7. Run one-result live Actor smoke tests with a hard USD $1 ceiling per skill and fail closed if the ceiling cannot be enforced.

### Phase E — skills.sh-first release and distribution

1. Create/push the brand-owned public GitHub repository.
2. Tag `v1.0.0` and verify the canonical install.
3. Seed and verify skills.sh with one legitimate CLI install.
4. Record the skills.sh listing URL, baseline installs, file tree, and security-audit status; resolve any listing issue before continuing.
5. Open the generated one-skill PR to `apify/awesome-skills`.
6. Submit/claim agentskill.sh and configure its GitHub push webhook.
7. Poll passive indexers and record listing URLs/statuses.
8. Establish a monthly status report connecting directory metrics to Apify Actor usage/revenue.

## 10. Acceptance criteria

- `apify-kick-scraper` activates for the intended Kick.com use cases and routes all work to `aitooolsmax/kick-data-scraper`.
- skills.sh is the first marketplace release, and secondary publication is blocked until its listing and canonical install are verified.
- It correctly handles all four Actor modes and states output/cost limitations.
- No secret or raw authenticated Actor dump appears in the repository, CI logs, bundles, or fixtures.
- A second Actor skill can be added from the template without editing publisher code.
- `validate`, `build`, `publish --dry-run`, and `status` are deterministic and non-interactive.
- Every platform result has an honest state and verification URL or actionable manual step.
- GitHub, skills.sh, Claude-compatible marketplace metadata, Gemini metadata, and OpenAI metadata validate.
- The Apify community edition is generated from canonical content and fails CI if it drifts; ClawHub is absent from generated artifacts and publish targets.
- Live Actor validation never exceeds one result or the authorized USD $1 budget per skill per release; account creation, external submission, webhook creation, repository creation, and publication still require their relevant authorization.

## 11. Questions an expert should ask

Interview these one at a time, in blast-radius order:

All architecture and launch-positioning questions are resolved for the initial implementation.

## 12. Rewritten implementation request

Create a brand-owned, public, multi-skill GitHub catalog whose first canonical skill is `apify-kick-scraper`, and release it to skills.sh before every secondary marketplace. The skill must exclusively use `aitooolsmax/kick-data-scraper`, support its four current channel-discovery modes, use the official Apify CLI with dynamic schema lookup and channel-attributed telemetry, describe channel-snapshot limitations, and enforce cost and credential-safety guardrails. Build deterministic Node CLI tooling that validates the catalog, proves the skills.sh install/listing/audit path first, generates compatible Claude/Gemini/OpenAI/well-known metadata, produces an `apify/awesome-skills` edition from the canonical source, publishes only through documented APIs/CLIs, reports manual/passive-index workflows honestly, and verifies listings and revenue-funnel metrics. Generate provider-neutral `.well-known` artifacts but defer deployment, preserving future Cloudflare Pages and GitHub Pages subdomain options. Permit one-result live validation with a hard USD $1 budget per skill per release. Keep ClawHub artifact generation and publishing disabled until a future explicit MIT-0 opt-in. Gate account/OAuth changes, webhooks, and external publication on explicit user decisions.

## Sources checked

- [Apify Agent Skills repository](https://github.com/apify/agent-skills)
- [Apify community contribution workflow](https://github.com/apify/awesome-skills/blob/main/CONTRIBUTING.md)
- [Kick Data Scraper Store contract](https://apify.com/aitooolsmax/kick-data-scraper)
- [Agent Skills specification](https://agentskills.io/specification)
- [skills.sh documentation](https://www.skills.sh/docs)
- [skills.sh CLI source](https://github.com/vercel-labs/skills)
- [agentskill.sh submission workflow](https://agentskill.sh/submit)
- [ClawHub publishing](https://docs.openclaw.ai/clawhub/publishing)
- [ClawHub skill format and licensing](https://docs.openclaw.ai/clawhub/skill-format)
- [SkillsMP documentation](https://skillsmp.com/docs)
- [SkillsMP API](https://skillsmp.com/docs/api)
- [AwesomeSkill](https://awesomeskill.ai/)
- [mcpservers.org Agent Skills](https://mcpservers.org/agent-skills)
