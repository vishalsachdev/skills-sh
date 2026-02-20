# skills-sh

Longitudinal analysis of the skills.sh ecosystem to generate practical install guidance for vibe coders.

**Research questions:**
1. Creation: What kinds of skills are published, by whom, and at what rate?
2. Adoption: Which skills are installed over time, and how quickly do they grow?
3. Diffusion: Which skill/repo traits are associated with faster adoption?
4. Longevity: Which skills sustain usage versus spike and decay?

## Current Focus

- [ ] Validate daily workflow success rate (timeseries generation + Pages deploy)
- [ ] Revisit semantic analysis of top skills after 2026-02-22 (need ~1 week of daily snapshots first)
- [ ] Harden parsing and add schema checks
- [ ] Document data dictionary/codebook

## Roadmap

### Phase 1: Data Reliability (Week 1) — In Progress
- [x] Push to GitHub and verify Actions workflow
- [ ] Harden parsing and add schema checks
- [ ] Document data dictionary/codebook

### Phase 1.5: Dashboard — Done
- [x] Scout dashboard (index.html) — sortable table, health scores, filters
- [x] Publisher insights (publisher.html) — 4 Chart.js charts, correlations, leaderboard
- [x] Evaluator compare (compare.html) — multi-select, radar chart, risk flags
- [x] GitHub Pages deploy workflow

### Phase 2: Baseline Analytics (Weeks 2-3) — In Progress
- [x] Build time-series dashboard (trends.html) — install growth chart, top movers table with period toggle, skill trend lookup with sparklines
- [x] Pre-aggregation pipeline (generate_timeseries.py) — runs in CI, produces compact timeseries.json
- [ ] Produce creation/adoption/longevity baseline charts (needs 7+ snapshots)

### Phase 3: Diffusion Modeling (Weeks 4-5)
- [ ] Engineer trait features
- [ ] Run first-pass regression/survival analyses
- [ ] Summarize actionable correlates for installers

### Phase 4: Publication Assets (Week 6)
- [ ] Methods appendix
- [ ] Reproducible analysis package
- [ ] Draft paper/report and practitioner summary

## Backlog

- Integrate hot/all-time views if they provide different signals
- Add README quality scoring (length, badges, examples)
- Track skill deletions/removals over time
- Semantic analysis of top skills — categorize by intent (dev tooling, workflow, AI wrappers, etc.) and surface patterns; wait for sufficient daily snapshots before choosing approach

## Session Log

### 2026-02-20
- Reviewed PR #1 (trend analysis scripts + daily report generator)
- Fixed: `compute_day_over_day` now tracks skills that drop out of snapshots (Codex P1)
- Fixed: Workflow race condition — consolidated two commit+push steps into one before Pages upload
- Merged PR #1; pulled — now have 6 snapshots (Feb 15-20)
- Next: Semantic analysis eligible after 2/22, validate workflow, Phase 1 remaining items

### 2026-02-19
- Completed: Trends dashboard page (trends.html + trends.js + generate_timeseries.py) — install growth chart, top movers with period toggle, skill trend lookup with sparklines
- Completed: CI pipeline update — workflow generates timeseries.json at deploy time
- Completed: Nav bar updated across all 5 pages
- Note: skills.sh/trending always returns 600 skills — removed flat Total Skills chart

### 2026-02-15
- Completed: Initial snapshot script, baseline capture (600 skills, 87K installs), GH Actions workflow, research plan
- Completed: Static dashboard site (3 pages: Scout, Publisher, Compare) with Chart.js, health scores, risk flags, GitHub Pages deploy
- Next: Push to GitHub, verify Actions workflow + Pages deploy
