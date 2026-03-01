#!/usr/bin/env python3
"""Classify skills.sh skills into categories using Gemini 2.0 Flash."""

import json
import os
import time
import urllib.request
import urllib.error
from pathlib import Path

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

BATCH_SIZE = 50
GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_ENDPOINT = (
    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}"
    ":generateContent"
)

PROJECT_ROOT = Path(__file__).resolve().parent
ANALYSIS_DIR = PROJECT_ROOT / "analysis"
CACHE_PATH = ANALYSIS_DIR / "category_cache.json"
OUTPUT_PATH = ANALYSIS_DIR / "categories.json"
SNAPSHOTS_DIR = PROJECT_ROOT / "snapshots"
ENV_PATH = PROJECT_ROOT / ".env"


def load_api_key():
    """Load GEMINI_API_KEY from .env file or environment."""
    # Check environment first
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key

    # Parse .env file
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k == "GEMINI_API_KEY":
                    return v

    raise RuntimeError(
        "GEMINI_API_KEY not found in environment or .env file"
    )


def load_latest_snapshot():
    """Load the most recent snapshot by filename sort."""
    files = sorted(SNAPSHOTS_DIR.glob("*.json"))
    if not files:
        raise RuntimeError(f"No snapshot files found in {SNAPSHOTS_DIR}")
    latest = files[-1]
    print(f"Loading snapshot: {latest.name}")
    with open(latest) as f:
        return json.load(f)


def load_cache():
    """Load category cache if it exists."""
    if CACHE_PATH.exists():
        with open(CACHE_PATH) as f:
            cache = json.load(f)
        print(f"Loaded cache with {len(cache)} entries")
        return cache
    print("No existing cache found, starting fresh")
    return {}


def save_cache(cache):
    """Write cache to disk."""
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump(cache, f, indent=2)


def cache_key(skill):
    """Generate cache key for a skill."""
    desc = (skill.get("github") or {}).get("description") or ""
    return f"{skill['name']}|{desc}"


def build_prompt(batch):
    """Build the classification prompt for a batch of skills."""
    taxonomy_str = "\n".join(TAXONOMY)
    skills_for_prompt = []
    for s in batch:
        gh = s.get("github") or {}
        skills_for_prompt.append({
            "name": s["name"],
            "description": gh.get("description") or "",
            "topics": gh.get("topics") or [],
            "owner": s.get("owner", ""),
            "repo": s.get("repo", ""),
        })

    skills_json = json.dumps(skills_for_prompt, indent=2)

    return (
        f"Classify each skill into exactly one category. "
        f"Use ONLY these categories:\n{taxonomy_str}\n\n"
        f'Return a JSON array: [{{"name": "skill-name", "category": "Category Name"}}, ...]\n'
        f"No explanation, just valid JSON.\n\n"
        f"Skills to classify:\n{skills_json}"
    )


def call_gemini(prompt, api_key, max_retries=5):
    """Call Gemini API with exponential backoff and return parsed JSON."""
    url = f"{GEMINI_ENDPOINT}?key={api_key}"
    body = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json"},
    }).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            # Extract text from Gemini response
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
        except urllib.error.HTTPError as e:
            if e.code == 429:
                wait = min(2 ** attempt * 5, 60)  # 5, 10, 20, 40, 60
                print(f"    Rate limited (429), waiting {wait}s (attempt {attempt + 1}/{max_retries})...")
                time.sleep(wait)
            else:
                raise
        except urllib.error.URLError:
            if attempt < max_retries - 1:
                wait = 2 ** attempt * 2
                print(f"    Network error, retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise

    raise RuntimeError(f"Failed after {max_retries} retries (rate limited)")


def classify_batch(batch, api_key, batch_num, total_batches):
    """Classify a batch of skills, with retry on parse failure."""
    print(f"Classifying batch {batch_num}/{total_batches} ({len(batch)} skills)...")
    prompt = build_prompt(batch)

    for attempt in range(2):
        try:
            results = call_gemini(prompt, api_key)
            # Validate: should be a list of dicts with name and category
            if not isinstance(results, list):
                raise ValueError(f"Expected list, got {type(results).__name__}")
            # Build lookup by name
            classified = {}
            for item in results:
                name = item.get("name", "")
                category = item.get("category", "Uncategorized")
                # Validate category is in taxonomy
                if category not in TAXONOMY:
                    category = "Uncategorized"
                classified[name] = category
            return classified
        except RuntimeError:
            # Rate limit exhausted — bubble up
            raise
        except Exception as e:
            if attempt == 0:
                print(f"  Retry batch {batch_num} parse error: {e}")
                time.sleep(3)
            else:
                print(f"  Failed batch {batch_num} after retry: {e}")
                return {}

    return {}


def main():
    api_key = load_api_key()
    snapshot = load_latest_snapshot()
    skills = snapshot["skills"]
    snapshot_date = snapshot["date"]
    print(f"Snapshot date: {snapshot_date}, skills: {len(skills)}")

    cache = load_cache()

    # Split into cached and uncached
    uncached_skills = []
    for s in skills:
        ck = cache_key(s)
        if ck not in cache:
            uncached_skills.append(s)

    print(f"Cached: {len(skills) - len(uncached_skills)}, uncached: {len(uncached_skills)}")

    if uncached_skills:
        # Batch and classify
        batches = [
            uncached_skills[i : i + BATCH_SIZE]
            for i in range(0, len(uncached_skills), BATCH_SIZE)
        ]
        total_batches = len(batches)

        for i, batch in enumerate(batches, 1):
            classified = classify_batch(batch, api_key, i, total_batches)

            # Update cache with results
            for s in batch:
                ck = cache_key(s)
                name = s["name"]
                if name in classified:
                    cache[ck] = classified[name]
                else:
                    cache[ck] = "Uncategorized"

            # Save cache after each batch (incremental progress)
            save_cache(cache)

            if i < total_batches:
                time.sleep(4)

        print(f"Classification complete. Cache now has {len(cache)} entries.")
    else:
        print("All skills already cached, no API calls needed.")

    # Build output
    categories_list = []
    uncategorized_count = 0
    for s in skills:
        ck = cache_key(s)
        category = cache.get(ck, "Uncategorized")
        if category == "Uncategorized":
            uncategorized_count += 1
        categories_list.append({
            "name": s["name"],
            "source": s.get("source", ""),
            "category": category,
            "installs": s.get("installs", 0),
        })

    output = {
        "date": snapshot_date,
        "model": GEMINI_MODEL,
        "taxonomy_version": 1,
        "taxonomy": TAXONOMY,
        "total_classified": len(categories_list),
        "categories": categories_list,
    }

    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nWrote {OUTPUT_PATH}")
    print(f"Total: {len(categories_list)}, Uncategorized: {uncategorized_count}")


if __name__ == "__main__":
    main()
