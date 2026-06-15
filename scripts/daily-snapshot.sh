#!/bin/bash
# Daily skills.sh snapshot + deploy to GitHub Pages
# Runs via launchd — see com.vishal.skills-snapshot.plist

set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

REPO="/Users/vishal/code/skills-sh"
LOG="/tmp/skills-snapshot.log"

exec >> "$LOG" 2>&1
echo "=== $(date) ==="

cd "$REPO"

# Pull latest to avoid conflicts
git pull --ff-only || { echo "Pull failed — manual intervention needed"; exit 1; }

TODAY=$(date +%Y-%m-%d)

mark_success() {
    mkdir -p "$HOME/.cron-sentinels" && touch "$HOME/.cron-sentinels/skills-snapshot"
}

# Skip capture if today's snapshot already exists (still mark success for heartbeat)
if [ -f "snapshots/${TODAY}.json" ]; then
    echo "Snapshot for $TODAY already exists, skipping."
    mark_success
    exit 0
fi

# Capture snapshot
python3 snapshot.py

# Generate reports and timeseries
python3 generate_daily_report.py
python3 generate_timeseries.py

# Classify skills into categories (uses Gemini API, cached)
if [ -f ".env" ]; then
    source .env
    python3 classify_skills.py
fi

# Prepare site data
mkdir -p site/data
cp "snapshots/${TODAY}.json" site/data/latest.json

# Commit to main
git add snapshots/ analysis/
if ! git diff --staged --quiet; then
    git commit -m "chore: update skills snapshot"
    git push
fi

# Deploy to gh-pages
git checkout gh-pages
cp site/data/latest.json data/latest.json
cp site/data/timeseries.json data/timeseries.json
cp analysis/categories.json data/categories.json 2>/dev/null || true
git add data/
if ! git diff --staged --quiet; then
    git commit -m "Update data: ${TODAY}"
    git push origin gh-pages
fi
git checkout main

echo "Done: $TODAY"
mark_success
