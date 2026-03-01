# Semantic Analysis of Skills — Design

## Overview

Classify all 600+ skills in the skills.sh ecosystem into semantic categories using Gemini Flash. Produces a categorized dataset for Phase 3 regression models and a new dashboard page.

## Decisions

- **Single primary category** per skill (no multi-label)
- **LLM batch classification** via Gemini 2.0 Flash
- **Fixed taxonomy** of 12 categories (versioned for reproducibility)

## Taxonomy (v1)

| Category | Examples |
|----------|----------|
| Frontend & UI | frontend-design, web-design-guidelines, tailwind-design-system |
| Backend & API | typespec-api-operations, fastapi, graphql |
| Cloud & Infrastructure | azure-deploy, terraform, vercel-deploy |
| AI & ML | ai-image-generation, ai-video-generation, gemini-computer-use |
| Testing & QA | tdd, vitest, webapp-testing |
| DevOps & CI/CD | changelog-automation, workflow-orchestration-patterns |
| Browser & Automation | agent-browser, playwright-automation, twitter-automation |
| Mobile | sleek-design-mobile-apps, react-native, upgrading-expo |
| Security & Auth | two-factor-authentication, better-auth-best-practices |
| Documentation & Writing | technical-writing, user-guide-writing, readme |
| Developer Workflow | using-git-worktrees, plan-harder, task-planning, vibe-kanban |
| Platform SDK | javascript-sdk, python-sdk, microsoft-foundry |

## Pipeline

1. `classify_skills.py` — reads latest snapshot, sends batches of 50 to Gemini Flash, outputs `analysis/categories.json`
2. Deterministic cache — `{skill_name+description → category}` so re-runs only classify new skills
3. `generate_timeseries.py` update — merge category labels into timeseries data
4. `categories.html` — new dashboard page

## Output: `analysis/categories.json`

```json
{
  "date": "2026-03-01",
  "model": "gemini-2.0-flash",
  "taxonomy_version": 1,
  "categories": [
    {"name": "sleek-design-mobile-apps", "source": "sleekdotdesign/agent-skills", "category": "Mobile"},
    ...
  ]
}
```

## Dashboard: `categories.html`

- Horizontal bar chart: installs per category
- Expandable category table: category → skills within it, sorted by installs
- Line chart: install growth per category over time (timeseries + categories merge)

## Dependencies

- `google-generativeai` or raw `requests` to Gemini REST API
- Gemini API key in `.env` (git-ignored)
