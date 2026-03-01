# skills-sh

Longitudinal analysis of the skills.sh ecosystem to generate practical install guidance for vibe coders.

**Research questions:**
1. Creation: What kinds of skills are published, by whom, and at what rate?
2. Adoption: Which skills are installed over time, and how quickly do they grow?
3. Diffusion: Which skill/repo traits are associated with faster adoption?
4. Longevity: Which skills sustain usage versus spike and decay?

## Manual Deploy (while Actions is disabled)

Automated via launchd (`com.vishal.skills-snapshot`) — runs daily at 8am local.
Script: `scripts/daily-snapshot.sh`. Logs: `/tmp/skills-snapshot.log`.
Pages serves from `gh-pages` branch (legacy mode, `.nojekyll`). Feb 27 is permanently missing.
Manual run: `launchctl start com.vishal.skills-snapshot` or `bash scripts/daily-snapshot.sh`
Disable: `launchctl unload ~/Library/LaunchAgents/com.vishal.skills-snapshot.plist`

## Current Focus

- [x] Revisit semantic analysis of top skills (14 snapshots collected, sufficient data now)
- [ ] Harden parsing and add schema checks
- [ ] Document data dictionary/codebook
- [ ] Re-enable GitHub Actions when budget allows

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
- ~~Semantic analysis of top skills~~ — Done (classify_skills.py + categories.html)

## Session Log

### 2026-03-01 (session 3)
- Completed: Semantic analysis — `classify_skills.py` classifies 600 skills into 12 categories via Gemini 2.5 Flash with caching
- Completed: New Categories dashboard page (`categories.html` + `categories.js`) — horizontal bar chart + category table
- Completed: Updated `data.js` with `loadCategories()`, nav updated on all 6 pages
- Completed: Integrated classification into `daily-snapshot.sh` pipeline
- Completed: Deployed to gh-pages — live at vishalsachdev.github.io/skills-sh/categories.html
- Note: Top categories — AI & ML (144), Developer Workflow (131), Documentation & Writing (72), Frontend & UI (53)
- Note: Design doc at `docs/plans/2026-03-01-semantic-analysis-design.md`
- Next: Harden parsing + schema checks, data dictionary, Phase 2 baseline charts, Phase 3 trait features

### 2026-03-01 (session 2)
- Completed: Added Cloudflare Web Analytics to all 5 dashboard pages (single beacon token for vishalsachdev.github.io)
- Completed: Deployed to gh-pages
- Completed: Updated global CLAUDE.md with GitHub Pages analytics reminder + token for cross-repo reuse
- Note: GitHub repo traffic (last 14 days): 19 views, 6 unique visitors — mostly from LinkedIn referrals
- Next: Semantic analysis of top skills, harden parsing, Phase 2 baseline charts

### 2026-03-01
- Completed: Caught up on snapshots — 14 of 15 days captured (Feb 15–Mar 1, only Feb 27 missing due to Actions budget)
- Completed: Switched Pages deploy from Actions to `gh-pages` branch (legacy + `.nojekyll`) — site live with Mar 1 data
- Completed: Set up launchd job (`com.vishal.skills-snapshot`) for daily local automation at 8am
- Note: Install growth 87K → 535K (6x in 2 weeks), 1,635 unique skills across snapshots
- Next: Re-enable Actions when budget allows, semantic analysis of top skills, Phase 2 baseline charts

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
