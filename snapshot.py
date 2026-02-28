#!/usr/bin/env python3
"""
Snapshot skills.sh trending data + GitHub metadata.
Usage: python snapshot.py
Output: snapshots/YYYY-MM-DD.json
"""

import json
import os
import re
import subprocess
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path


def fetch_trending_page() -> str:
    """Fetch skills.sh/trending HTML via curl."""
    result = subprocess.run(
        ["curl", "-s", "https://skills.sh/trending"],
        capture_output=True,
        text=True,
    )
    return result.stdout


def parse_skills_from_html(html: str) -> list[dict]:
    """
    Parse skill data from embedded JSON in the HTML.
    Returns list of {name, owner, repo, installs}.
    """
    skills = []

    # Unescape the JSON quotes
    unescaped = html.replace('\\"', '"')

    # Pattern: {"source":"owner/repo","skillId":"...","name":"...","installs":123}
    # Extract each skill entry
    pattern = re.compile(
        r'"source":"([^"]+)"[^}]*"name":"([^"]+)"[^}]*"installs":(\d+)',
        re.DOTALL
    )

    seen = set()
    for match in pattern.finditer(unescaped):
        source = match.group(1)
        name = match.group(2)
        installs = int(match.group(3))

        # Dedupe by source + name
        key = f"{source}/{name}"
        if key in seen:
            continue
        seen.add(key)

        # Parse owner/repo from source
        parts = source.split('/')
        if len(parts) >= 2:
            owner = parts[0]
            repo = parts[1]
        else:
            owner = source
            repo = "unknown"

        skills.append({
            "name": name,
            "owner": owner,
            "repo": repo,
            "source": source,
            "installs": installs,
        })

    return skills


def get_github_metadata(owner: str, repo: str) -> dict:
    """Fetch GitHub repo metadata via gh CLI, falling back to REST API."""
    # Try gh CLI first
    try:
        result = subprocess.run(
            [
                "gh", "api", f"/repos/{owner}/{repo}",
                "--jq", """{
                    stars: .stargazers_count,
                    forks: .forks_count,
                    open_issues: .open_issues_count,
                    created_at: .created_at,
                    updated_at: .updated_at,
                    pushed_at: .pushed_at,
                    language: .language,
                    license: .license.spdx_id,
                    description: .description,
                    topics: .topics
                }"""
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode == 0:
            return json.loads(result.stdout)
    except (subprocess.TimeoutExpired, json.JSONDecodeError, FileNotFoundError):
        pass

    # Fallback: use GitHub REST API directly
    try:
        url = f"https://api.github.com/repos/{owner}/{repo}"
        req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json"})
        token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
        if token:
            req.add_header("Authorization", f"Bearer {token}")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())
        return {
            "stars": data.get("stargazers_count"),
            "forks": data.get("forks_count"),
            "open_issues": data.get("open_issues_count"),
            "created_at": data.get("created_at"),
            "updated_at": data.get("updated_at"),
            "pushed_at": data.get("pushed_at"),
            "language": data.get("language"),
            "license": (data.get("license") or {}).get("spdx_id"),
            "description": data.get("description"),
            "topics": data.get("topics"),
        }
    except (urllib.error.URLError, json.JSONDecodeError, OSError):
        pass

    return {}


def print_summary(skills: list[dict]):
    """Print a summary report of the snapshot."""
    total_installs = sum(s['installs'] for s in skills)

    # Group by owner
    by_owner = {}
    for s in skills:
        owner = s['owner']
        if owner not in by_owner:
            by_owner[owner] = {'count': 0, 'installs': 0}
        by_owner[owner]['count'] += 1
        by_owner[owner]['installs'] += s['installs']

    # Group by repo
    by_repo = {}
    for s in skills:
        repo_key = s['source']
        if repo_key not in by_repo:
            by_repo[repo_key] = {'count': 0, 'installs': 0, 'stars': 0}
        by_repo[repo_key]['count'] += 1
        by_repo[repo_key]['installs'] += s['installs']
        if 'github' in s and s['github'].get('stars'):
            by_repo[repo_key]['stars'] = s['github']['stars']

    print("\n" + "=" * 60)
    print("SNAPSHOT SUMMARY")
    print("=" * 60)

    print(f"\nTotal skills: {len(skills)}")
    print(f"Total installs: {total_installs:,}")
    print(f"Unique repos: {len(by_repo)}")
    print(f"Unique owners: {len(by_owner)}")

    print("\n--- Top 10 Skills by Installs ---")
    for s in sorted(skills, key=lambda x: x['installs'], reverse=True)[:10]:
        stars = s.get('github', {}).get('stars', 0) or 0
        print(f"  {s['installs']:>6,}  {s['source']}/{s['name']:<30}  ⭐{stars:,}")

    print("\n--- Top 10 Repos by Total Installs ---")
    sorted_repos = sorted(by_repo.items(), key=lambda x: x[1]['installs'], reverse=True)[:10]
    for repo, data in sorted_repos:
        print(f"  {data['installs']:>6,}  {repo:<40}  ({data['count']} skills, ⭐{data['stars']:,})")

    print("\n--- Top 5 Owners by Total Installs ---")
    sorted_owners = sorted(by_owner.items(), key=lambda x: x[1]['installs'], reverse=True)[:5]
    for owner, data in sorted_owners:
        print(f"  {data['installs']:>6,}  {owner:<30}  ({data['count']} skills)")

    # Languages breakdown
    languages = {}
    for s in skills:
        lang = s.get('github', {}).get('language') or 'Unknown'
        if lang not in languages:
            languages[lang] = 0
        languages[lang] += 1

    print("\n--- Languages ---")
    for lang, count in sorted(languages.items(), key=lambda x: -x[1])[:5]:
        print(f"  {count:>4}  {lang}")

    print("\n" + "=" * 60)


def main():
    print("Fetching skills.sh/trending...")
    html = fetch_trending_page()

    print("Parsing skills...")
    skills = parse_skills_from_html(html)

    if not skills:
        print("No skills found. HTML might have changed structure.")
        print("First 2000 chars of HTML:")
        print(html[:2000])
        return

    print(f"Found {len(skills)} skills")

    # Enrich with GitHub metadata
    print("Fetching GitHub metadata...")
    repos_seen = set()
    for skill in skills:
        repo_key = f"{skill['owner']}/{skill['repo']}"
        if repo_key not in repos_seen:
            repos_seen.add(repo_key)
            print(f"  {repo_key}")
            metadata = get_github_metadata(skill['owner'], skill['repo'])
            skill['github'] = metadata
        else:
            # Reference previous
            for prev in skills:
                if f"{prev['owner']}/{prev['repo']}" == repo_key and 'github' in prev:
                    skill['github'] = prev['github']
                    break

    # Save snapshot
    snapshot_dir = Path("snapshots")
    snapshot_dir.mkdir(exist_ok=True)

    today = datetime.now().strftime("%Y-%m-%d")
    output = {
        "date": today,
        "timestamp": datetime.now().isoformat(),
        "source": "https://skills.sh/trending",
        "total_skills": len(skills),
        "skills": skills,
    }

    output_path = snapshot_dir / f"{today}.json"
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved to {output_path}")
    print(f"Total skills: {len(skills)}")

    # Generate summary
    print_summary(skills)


if __name__ == "__main__":
    main()
