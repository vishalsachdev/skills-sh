# skills-sh

Longitudinal analysis of the [skills.sh](https://skills.sh) ecosystem — daily snapshots of 600+ skills with GitHub metadata, served through a static dashboard for three vibe coder personas.

**Live dashboard:** https://vishalsachdev.github.io/skills-sh/

---

## User Stories

### 1. Scout (Solo Indie Dev)

> "As a solo developer building side projects with Claude Code, I want to quickly find high-quality, well-maintained skills so I can avoid wasting time on abandoned or low-quality ones."

**Page:** [Scout Dashboard](https://vishalsachdev.github.io/skills-sh/) (`index.html`)

The Scout gets a sortable leaderboard of all skills with a composite health score (0-100), freshness badges (Active/Recent/Stale), and filters for language, minimum installs, and free-text search. Sort by any column to surface the best skills fast.

**Health Score** = recency (40%) + community signals (30%) + documentation proxy (30%)

### 2. Publisher (Skill Creator)

> "As a skill author, I want to understand what traits drive adoption so I can optimize my skill's metadata, documentation, and repo health to grow installs."

**Page:** [Publisher Insights](https://vishalsachdev.github.io/skills-sh/publisher.html) (`publisher.html`)

The Publisher gets ecosystem-level charts — install distribution (power-law shape), language breakdown, stars-vs-installs scatter (shows the disconnect), and repo-age-vs-installs. A Spearman rank correlation table answers "what predicts high installs?" directly. A publisher leaderboard ranks owners by total installs and skill count.

### 3. Evaluator (Team Lead)

> "As a team lead evaluating skills for my engineering team, I want to compare skills side-by-side on maintenance, popularity, and risk signals so I can make informed adoption decisions."

**Page:** [Evaluator Compare](https://vishalsachdev.github.io/skills-sh/compare.html) (`compare.html`)

The Evaluator searches and selects 2-4 skills, then sees a radar chart for visual comparison and a detailed side-by-side table covering installs, stars, forks, issues, language, license, dates, health score, freshness, topics, and risk flags (no license, stale repo, high issue ratio).

---

## Data Collection

A daily GitHub Actions workflow ([`.github/workflows/snapshot.yml`](.github/workflows/snapshot.yml)):

1. Scrapes [skills.sh/trending](https://skills.sh/trending) for skill names, owners, and install counts
2. Enriches each unique repo with GitHub metadata (stars, forks, issues, language, license, topics, dates)
3. Saves a timestamped JSON snapshot to `snapshots/`
4. Copies the latest snapshot to `site/data/latest.json` and deploys to GitHub Pages

## Research Questions

1. **Creation:** What kinds of skills are published, by whom, and at what rate?
2. **Adoption:** Which skills are installed over time, and how quickly do they grow?
3. **Diffusion:** Which skill/repo traits are associated with faster adoption?
4. **Longevity:** Which skills sustain usage versus spike and decay?

## Local Development

```bash
# Generate a fresh snapshot (requires gh CLI authenticated)
python snapshot.py

# Serve the dashboard locally
cp snapshots/$(ls -t snapshots/ | head -1) site/data/latest.json
cd site && python3 -m http.server 8765
# Open http://localhost:8765
```

## Tech Stack

- **Data:** Python + GitHub CLI for snapshot collection
- **Dashboard:** Vanilla HTML/CSS/JS (no build step)
- **Charts:** [Chart.js](https://www.chartjs.org/) via CDN
- **Hosting:** GitHub Pages deployed via GitHub Actions
