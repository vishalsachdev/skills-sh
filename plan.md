# skills.sh Research Plan

## Objective
Build a reproducible, longitudinal dataset from `skills.sh` to analyze skill ecosystem dynamics and generate practical install guidance for vibe coders.

## Primary Audience
- Researchers studying skill ecosystem evolution
- Vibe coders choosing which skills to install

## Research Questions
1. Creation: What kinds of skills are published, by whom, and at what rate?
2. Adoption: Which skills are installed over time, and how quickly do they grow?
3. Diffusion: Which skill/repo traits are associated with faster adoption?
4. Longevity: Which skills sustain usage versus spike and decay?

## What Is Answerable With Public Data

### Answerable now (with repeated snapshots + GitHub metadata)
- Creation trends: new skills per period, maintainer mix (org vs individual), topic diversity
- Adoption trends: rank/install trajectory from leaderboard snapshots
- Diffusion correlates: association between adoption rate and observable traits
- Longevity patterns: sustained leaders vs short-lived spikes

### Not answerable from public telemetry alone
- User segments/personas (team type, industry, seniority)
- True causal effects without quasi-experimental design

## Data Collection Strategy

### Cadence
- Daily snapshot of `skills.sh/trending`
- Note: Page embeds all views (all-time, trending 24h, hot) in a single HTML response with JSON data

### Current collector
- Script: `snapshot.py`
- Output: `snapshots/YYYY-MM-DD.json`
- Automation: GitHub Actions scheduled workflow (`.github/workflows/snapshot.yml`, runs 7:15 UTC)

### Technical notes

- Data is embedded as escaped JSON in Next.js HTML (not traditional HTML tables)
- Pattern: `"source":"owner/repo"..."name":"skill-name"..."installs":123`
- Deduplication by `source/name` key required (same skill appears in multiple view tabs)

### Data sources
- `skills.sh` leaderboard pages (install/rank signals)
- GitHub repository metadata via `gh api` (`stars`, `forks`, `issues`, `created_at`, `pushed_at`, `topics`, `license`, `language`, `description`)

## Data Model (Core Tables)

### `snapshot_runs`
- `snapshot_date`
- `captured_at`
- `source`
- `total_skills`

### `skill_observations`
- `snapshot_date`
- `skill_name`
- `owner`
- `repo`
- `installs`
- `rank` (derived)

### `repo_metadata_daily`
- `snapshot_date`
- `owner`
- `repo`
- `stars`
- `forks`
- `open_issues`
- `created_at`
- `updated_at`
- `pushed_at`
- `language`
- `license`
- `topics`
- `description`

## Metrics

### Creation
- New skills per week/month
- Maintainer concentration (Gini or HHI)
- Category/topic diversity over time

### Adoption
- Install velocity and acceleration
- Rank persistence and churn
- Time-to-top-N rank

### Diffusion
- Correlation/regression of growth vs traits:
  - Maintainer type
  - Repo maturity/activity
  - Docs/quality proxies (later enrichment)

### Longevity
- Lifecycle archetypes:
  - Sustained growth
  - Plateau
  - Spike-and-decay
  - Recurrent/seasonal

## Analysis Approach

### Quantitative
- Descriptive time-series analysis
- Survival analysis for time-to-adoption milestones
- Count/survival models for adoption and retention outcomes

### Qualitative (optional but valuable)
- Thematic coding of READMEs/changelogs for top skills
- Maintainer interviews/surveys on motivations and maintenance constraints

## Bias, Validity, and Ethics
- Trending leaderboards are popularity-biased and time-window-sensitive
- Install telemetry is aggregate and may be incomplete
- Control for external attention effects (e.g., GitHub audience size)
- Respect platform terms, robots, and API rate limits
- Avoid de-anonymization; report only aggregate findings

## Practical Outputs for Vibe Coders
- Install shortlist by objective criteria (momentum + durability)
- "Avoid hype traps" list (spike-without-retention patterns)
- Heuristics such as:
  - Prefer skills with sustained trend consistency
  - Prefer recently maintained repos
  - Favor clear metadata and active issue resolution

## Implementation Roadmap

### Phase 1: Data Reliability (Week 1)
- Validate daily workflow success rate
- Harden parsing and add schema checks
- Document data dictionary/codebook

### Phase 2: Baseline Analytics (Weeks 2-3)
- Build time-series notebook/dashboard
- Produce creation/adoption/longevity baseline charts

### Phase 3: Diffusion Modeling (Weeks 4-5)
- Engineer trait features
- Run first-pass regression/survival analyses
- Summarize actionable correlates for installers

### Phase 4: Publication Assets (Week 6)
- Methods appendix
- Reproducible analysis package
- Draft paper/report and practitioner summary

## Exit Criteria

- At least 30 consecutive daily snapshots collected
- Reproducible pipeline from raw snapshots to analysis outputs
- Documented findings for all four research questions (including limits)
- Installer-focused recommendations grounded in observed data

---

## Baseline Snapshot (2026-02-15)

| Metric | Value |
|--------|-------|
| Total skills | 600 |
| Total installs | 87,310 |
| Unique repos | 164 |
| Unique owners | 150 |

### Top 5 repos by total installs

| Repo | Skills | Installs | Stars |
|------|--------|----------|-------|
| wshobson/agents | 146 | 7,947 | 28,665 |
| inference-sh-0/skills | 11 | 7,856 | 23 |
| anthropics/skills | 17 | 7,056 | 70,232 |
| vercel-labs/agent-skills | 4 | 6,992 | 20,439 |
| coreyhaines31/marketingskills | 25 | 6,820 | 7,853 |

### Language distribution

| Language | Count |
|----------|-------|
| Python | 275 |
| Shell | 118 |
| Unknown | 93 |
| TypeScript | 72 |
| JavaScript | 22 |

### Data quality notes

- **Aggregator repos**: `wshobson/agents` contains 146 skills—likely a collection/aggregator, not original work
- **Star-install disconnect**: `anthropics/skills` has 70K stars but only 7K installs (stars ≠ adoption)
- **Parsing artifacts**: `api/git` appeared in early parsing—filtered now but watch for path leakage
