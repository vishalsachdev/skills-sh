# skills-sh

Longitudinal analysis of the skills.sh ecosystem to generate practical install guidance for vibe coders.

**Research questions:**
1. Creation: What kinds of skills are published, by whom, and at what rate?
2. Adoption: Which skills are installed over time, and how quickly do they grow?
3. Diffusion: Which skill/repo traits are associated with faster adoption?
4. Longevity: Which skills sustain usage versus spike and decay?

## Current Focus

- [ ] Validate daily workflow success rate (push to GitHub, confirm GH Actions runs)

## Roadmap

### Phase 1: Data Reliability (Week 1)
- [ ] Push to GitHub and verify Actions workflow
- [ ] Harden parsing and add schema checks
- [ ] Document data dictionary/codebook

### Phase 2: Baseline Analytics (Weeks 2-3)
- [ ] Build time-series notebook/dashboard
- [ ] Produce creation/adoption/longevity baseline charts

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

## Session Log

### 2026-02-15
- Completed: Initial snapshot script, baseline capture (600 skills, 87K installs), GH Actions workflow, research plan
- Next: Push to GitHub and validate daily workflow
