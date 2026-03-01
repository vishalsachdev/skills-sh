# Semantic Analysis Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Classify all 600+ skills into semantic categories using Gemini Flash, producing a reusable dataset and a new dashboard page.

**Architecture:** Python script sends skills in batches to Gemini 2.0 Flash with a fixed 12-category taxonomy. Results cached by skill signature to avoid re-classifying known skills. Output feeds both `analysis/categories.json` (for Phase 3 models) and a new `categories.html` dashboard page.

**Tech Stack:** Python 3 + `requests` (Gemini REST API, no SDK), vanilla JS + Chart.js for dashboard.

---

### Task 1: Set up Gemini API key

**Files:**
- Create: `.env`
- Modify: `.gitignore`

**Step 1: Create .env with Gemini key**

```bash
echo 'GEMINI_API_KEY=<paste-key-here>' > .env
```

**Step 2: Ensure .env is git-ignored**

Check `.gitignore` for `.env`. If missing, add it:

```bash
grep -q '\.env' .gitignore || echo '.env' >> .gitignore
```

**Step 3: Verify**

```bash
source .env && echo "Key length: ${#GEMINI_API_KEY}"
```

Expected: `Key length: 39` (or similar non-zero)

**Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: ensure .env is gitignored"
```

---

### Task 2: Build classify_skills.py — core classification script

**Files:**
- Create: `classify_skills.py`
- Read: `snapshots/2026-03-01.json` (reference for data structure)

**Step 1: Write the classification script**

Create `classify_skills.py` with:

1. **Load latest snapshot** — find most recent `snapshots/*.json` by filename sort
2. **Load cache** — read `analysis/category_cache.json` if it exists (maps `skill_name|description` → category)
3. **Filter uncached** — only send skills not already in cache to Gemini
4. **Batch classify** — send batches of 50 skills to Gemini 2.0 Flash via REST API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`)
5. **Parse response** — expect JSON array of `{"name": "...", "category": "..."}`
6. **Update cache** — merge new classifications into cache, write back
7. **Write output** — produce `analysis/categories.json` with full results

**Taxonomy constant (v1):**

```python
TAXONOMY = [
    "Frontend & UI",
    "Backend & API",
    "Cloud & Infrastructure",
    "AI & ML",
    "Testing & QA",
    "DevOps & CI/CD",
    "Browser & Automation",
    "Mobile",
    "Security & Auth",
    "Documentation & Writing",
    "Developer Workflow",
    "Platform SDK",
]
```

**Gemini prompt template (per batch):**

```
Classify each skill into exactly one category. Use ONLY these categories:
{taxonomy_list}

Return a JSON array: [{"name": "skill-name", "category": "Category Name"}, ...]
No explanation, just JSON.

Skills to classify:
{batch_as_json}
```

Where each skill in the batch is: `{"name": "...", "description": "...", "topics": [...], "owner": "...", "repo": "..."}`

**Cache key:** `f"{skill['name']}|{skill.get('github', {}).get('description', '')}"`
This means if a skill's description changes, it gets re-classified.

**Output format (`analysis/categories.json`):**

```json
{
  "date": "2026-03-01",
  "model": "gemini-2.0-flash",
  "taxonomy_version": 1,
  "taxonomy": ["Frontend & UI", ...],
  "total_classified": 600,
  "categories": [
    {"name": "sleek-design-mobile-apps", "source": "sleekdotdesign/agent-skills", "category": "Mobile", "installs": 13219},
    ...
  ]
}
```

**Error handling:**
- If Gemini returns unparseable JSON, retry that batch once with a stricter prompt
- If a skill can't be classified after retry, assign `"Uncategorized"`
- Print progress: `Classifying batch 1/12 (50 skills)...`

**Step 2: Run the script**

```bash
source .env && python3 classify_skills.py
```

Expected output:
```
Loading snapshot: snapshots/2026-03-01.json (600 skills)
Cache: 0 cached, 600 to classify
Classifying batch 1/12 (50 skills)...
...
Classifying batch 12/12 (50 skills)...
Saved: analysis/categories.json (600 skills classified)
Cache updated: analysis/category_cache.json (600 entries)
```

**Step 3: Spot-check results**

```bash
python3 -c "
import json
with open('analysis/categories.json') as f:
    data = json.load(f)
from collections import Counter
counts = Counter(c['category'] for c in data['categories'])
for cat, n in counts.most_common():
    print(f'  {n:>4} {cat}')
print(f'\nUncategorized: {counts.get(\"Uncategorized\", 0)}')
"
```

Expected: 12 categories with reasonable distribution, 0 or near-0 uncategorized.

**Step 4: Commit**

```bash
git add classify_skills.py analysis/categories.json analysis/category_cache.json
git commit -m "feat: add Gemini-based skill classification (12 categories)"
```

---

### Task 3: Add categories loader to data.js

**Files:**
- Modify: `site/js/data.js`

**Step 1: Add loadCategories function to data.js**

Add after the existing `loadTimeseries` function:

```javascript
let _catCache = null;

export async function loadCategories() {
  if (_catCache) return _catCache;

  const paths = ['data/categories.json', '../analysis/categories.json'];

  for (const path of paths) {
    try {
      const resp = await fetch(path);
      if (resp.ok) {
        _catCache = await resp.json();
        return _catCache;
      }
    } catch {}
  }

  throw new Error('Could not load categories data from any known path.');
}
```

**Step 2: Verify no syntax errors**

Open `site/index.html` in browser, check console for import errors. (The new export won't break existing pages since they don't import it.)

**Step 3: Commit**

```bash
git add site/js/data.js
git commit -m "feat: add categories data loader to data.js"
```

---

### Task 4: Build categories.html dashboard page

**Files:**
- Create: `site/categories.html`
- Create: `site/js/categories.js`
- Modify: `site/index.html` (nav link)
- Modify: `site/publisher.html` (nav link)
- Modify: `site/compare.html` (nav link)
- Modify: `site/trends.html` (nav link)
- Modify: `site/about.html` (nav link)

**Step 1: Create categories.html**

Follow the pattern from existing pages (same nav, footer, Cloudflare beacon). Include:

- Hero stats: total categories used, largest category, smallest category
- Horizontal bar chart (`<canvas id="chart-category-dist">`) — installs per category
- Category table with expandable rows: category name, skill count, total installs, top 3 skills

Structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>skills.sh — Categories</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
</head>
<body>
  <nav class="topnav">
    <!-- same nav as other pages, with Categories link active -->
  </nav>

  <div class="container">
    <div class="page-header">
      <div class="page-header-text">
        <h1>Skill Categories</h1>
        <p class="page-subtitle">600+ skills classified into semantic categories using Gemini Flash.</p>
      </div>
    </div>

    <div class="hero-stats" id="hero-stats">
      <div class="stat-card"><div class="stat-value" id="stat-categories">—</div><div class="stat-label">Categories</div></div>
      <div class="stat-card"><div class="stat-value" id="stat-largest">—</div><div class="stat-label">Largest Category</div></div>
      <div class="stat-card"><div class="stat-value" id="stat-skills">—</div><div class="stat-label">Skills Classified</div></div>
    </div>

    <h2 class="section-title">Installs by Category</h2>
    <div class="chart-card" style="margin-bottom: 32px">
      <canvas id="chart-category-dist"></canvas>
    </div>

    <h2 class="section-title">All Categories <span>— click to expand</span></h2>
    <div class="table-wrap">
      <table id="cat-table">
        <thead>
          <tr>
            <th>Category</th>
            <th class="num">Skills</th>
            <th class="num">Total Installs</th>
            <th>Top Skills</th>
          </tr>
        </thead>
        <tbody id="cat-body"></tbody>
      </table>
    </div>

    <div class="loading" id="loading">Loading categories data…</div>
  </div>

  <footer class="site-footer">
    Data from <a href="https://skills.sh/trending">skills.sh/trending</a> · Updated daily via GitHub Actions
  </footer>

  <script type="module" src="js/categories.js"></script>
  <!-- Cloudflare Web Analytics -->
  <script defer src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{"token": "f6e8d77284b0466eb2ca753f03d64ec0"}'></script>
</body>
</html>
```

**Step 2: Create categories.js**

```javascript
import { loadCategories } from './data.js';

// Chart colors — one per category
const COLORS = [
  '#b45309', '#1d4ed8', '#15803d', '#dc2626', '#7c3aed',
  '#0d9488', '#db2777', '#ea580c', '#4338ca', '#0369a1',
  '#a16207', '#6d28d9'
];

async function init() {
  const data = await loadCategories();
  document.getElementById('loading').style.display = 'none';

  // Group by category
  const groups = {};
  for (const s of data.categories) {
    if (!groups[s.category]) groups[s.category] = { skills: [], installs: 0 };
    groups[s.category].skills.push(s);
    groups[s.category].installs += s.installs || 0;
  }

  // Sort categories by total installs descending
  const sorted = Object.entries(groups).sort((a, b) => b[1].installs - a[1].installs);

  // Hero stats
  document.getElementById('stat-categories').textContent = sorted.length;
  document.getElementById('stat-largest').textContent = sorted[0][0];
  document.getElementById('stat-skills').textContent = data.total_classified;

  // Horizontal bar chart
  renderBarChart(sorted);

  // Category table
  renderTable(sorted);
}

function renderBarChart(sorted) { /* Chart.js horizontal bar */ }
function renderTable(sorted) { /* Populate #cat-body with rows, top 3 skills per category */ }

init();
```

Implement `renderBarChart` as a Chart.js horizontal bar chart (type: 'bar', indexAxis: 'y'). Labels = category names, data = total installs. Use COLORS array.

Implement `renderTable`: for each category, one `<tr>` with category name, skill count, total installs formatted with `toLocaleString()`, and top 3 skills by installs as comma-separated links.

**Step 3: Add "Categories" link to nav in all 6 pages**

In each of the 5 existing HTML files + the new categories.html, add between Trends and About:

```html
<a href="categories.html">Categories</a>
```

**Step 4: Test locally**

Open `site/categories.html` in browser. Verify:
- Bar chart renders with 12 categories
- Table shows all categories with correct skill counts
- Nav link works from all pages

**Step 5: Commit**

```bash
git add site/categories.html site/js/categories.js site/index.html site/publisher.html site/compare.html site/trends.html site/about.html
git commit -m "feat: add Categories dashboard page with bar chart and table"
```

---

### Task 5: Integrate into deploy pipeline

**Files:**
- Modify: `scripts/daily-snapshot.sh`

**Step 1: Add classify step to daily-snapshot.sh**

After `python3 generate_timeseries.py`, add:

```bash
# Classify skills into categories (uses Gemini API, cached)
if [ -f ".env" ]; then
    source .env
    python3 classify_skills.py
fi
```

**Step 2: Add categories.json to gh-pages deploy**

In the gh-pages deploy section, after the timeseries copy, add:

```bash
cp analysis/categories.json data/categories.json 2>/dev/null || true
```

And update the git add:

```bash
git add data/
```

(Already uses `data/` so this is covered.)

**Step 3: Also add analysis/categories.json to the main commit**

Update the git add line:

```bash
git add snapshots/ analysis/
```

(Change from `analysis/daily/` to `analysis/` to include categories.json and cache.)

**Step 4: Commit**

```bash
git add scripts/daily-snapshot.sh
git commit -m "feat: integrate classification into daily deploy pipeline"
```

---

### Task 6: Deploy to gh-pages

**Step 1: Run classification locally**

```bash
source .env && python3 classify_skills.py
```

**Step 2: Deploy categories.json + new HTML to gh-pages**

```bash
git checkout gh-pages
# Copy new/updated files from main
git checkout main -- site/categories.html site/js/categories.js
git checkout main -- site/index.html site/publisher.html site/compare.html site/trends.html site/about.html
cp site/categories.html categories.html
cp site/js/categories.js js/categories.js
cp site/index.html index.html
cp site/publisher.html publisher.html
cp site/compare.html compare.html
cp site/trends.html trends.html
cp site/about.html about.html
rm -rf site/
cp analysis/categories.json data/categories.json
git add .
git commit -m "Add categories page and data"
git push origin gh-pages
git checkout main
```

**Step 3: Verify live site**

Visit `https://vishalsachdev.github.io/skills-sh/categories.html` and confirm:
- Bar chart loads
- Table populates
- Nav links work

**Step 4: Update CLAUDE.md**

Check off `Revisit semantic analysis of top skills` in Current Focus and Backlog.
