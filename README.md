# skills-sh

Longitudinal analysis of the [skills.sh](https://skills.sh) ecosystem — daily snapshots of 600+ skills with GitHub metadata, served through a six-page static dashboard.

**Live dashboard:** https://vishalsachdev.github.io/skills-sh/

---

## Dashboard Pages

### [Scout Dashboard](https://vishalsachdev.github.io/skills-sh/) — Find quality skills fast

Sortable leaderboard of all skills with a composite **Health Score** (0–100), freshness badges (Active/Recent/Stale), and filters for language, minimum installs, and free-text search.

**Health Score** = recency (40%) + community signals (30%) + documentation proxy (30%)

### [Publisher Insights](https://vishalsachdev.github.io/skills-sh/publisher.html) — Understand what drives adoption

Ecosystem-level charts — install distribution (power-law), language breakdown, stars-vs-installs scatter, and repo-age-vs-installs. A Spearman rank correlation table answers "what predicts high installs?" directly. Publisher leaderboard ranks owners by total installs.

### [Evaluator Compare](https://vishalsachdev.github.io/skills-sh/compare.html) — Side-by-side skill comparison

Select 2–4 skills and see a radar chart plus a detailed comparison table covering installs, stars, forks, issues, language, license, dates, health score, freshness, topics, and risk flags.

### [Trends](https://vishalsachdev.github.io/skills-sh/trends.html) — Track growth over time

Install growth chart, top movers table with period toggle (total/last day), and a skill trend lookup with sparklines. Built on a pre-aggregated timeseries from all daily snapshots.

### [Categories](https://vishalsachdev.github.io/skills-sh/categories.html) — Semantic skill taxonomy

All 600+ skills classified into 12 categories (AI & ML, Developer Workflow, Frontend & UI, etc.) using Gemini Flash. Horizontal bar chart of installs per category and an expandable category table with top skills.

---

## Data Pipeline

A daily automated job:

1. Scrapes [skills.sh/trending](https://skills.sh/trending) for skill names, owners, and install counts
2. Enriches each unique repo with GitHub metadata (stars, forks, issues, language, license, topics, dates)
3. Saves a timestamped JSON snapshot to `snapshots/`
4. Generates timeseries aggregation and daily trend reports
5. Classifies skills into semantic categories via Gemini Flash (cached — only new skills hit the API)
6. Deploys data and site to GitHub Pages

## Research Questions

1. **Creation:** What kinds of skills are published, by whom, and at what rate?
2. **Adoption:** Which skills are installed over time, and how quickly do they grow?
3. **Diffusion:** Which skill/repo traits are associated with faster adoption?
4. **Longevity:** Which skills sustain usage versus spike and decay?

## Local Development

```bash
# Generate a fresh snapshot (requires gh CLI authenticated)
python snapshot.py

# Classify skills (requires GEMINI_API_KEY in .env)
python classify_skills.py

# Generate timeseries
python generate_timeseries.py

# Serve the dashboard locally
cp snapshots/$(ls -t snapshots/ | head -1) site/data/latest.json
cp analysis/categories.json site/data/categories.json
cd site && python3 -m http.server 8765
# Open http://localhost:8765
```

## Tech Stack

- **Data:** Python + GitHub CLI for snapshot collection
- **Classification:** Gemini Flash via REST API (cached, ~$0.01/run)
- **Dashboard:** Vanilla HTML/CSS/JS (no build step)
- **Charts:** [Chart.js](https://www.chartjs.org/) via CDN
- **Analytics:** [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) (privacy-friendly, no cookies)
- **Hosting:** GitHub Pages (gh-pages branch)

## Contributing

Found a bug, have a feature idea, or want to improve the dashboard? [Open an issue](https://github.com/vishalsachdev/skills-sh/issues) — all feedback welcome.
