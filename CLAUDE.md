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
- Completed: Updated README (6 pages, pipeline, tech stack) and about.html (Trends + Categories sections)
- Next: Harden parsing + schema checks, data dictionary, Phase 2 baseline charts, Phase 3 trait features

*Older entries archived to `docs/session-archive.md`*

