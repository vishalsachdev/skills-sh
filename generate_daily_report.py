#!/usr/bin/env python3
"""
Generate a daily trend report with social media posts.

Compares the two most recent snapshots and produces:
  - analysis/daily/YYYY-MM-DD.md  (full report + tweet + LinkedIn post)

Usage: python generate_daily_report.py
"""

import json
from datetime import datetime
from pathlib import Path


def load_two_most_recent():
    """Load the two most recent snapshot files."""
    snapshot_dir = Path("snapshots")
    files = sorted(snapshot_dir.glob("*.json"))
    # Filter to date-named files only
    dated = []
    for f in files:
        try:
            datetime.strptime(f.stem, "%Y-%m-%d")
            dated.append(f)
        except ValueError:
            continue

    if len(dated) < 2:
        print("Need at least 2 snapshots for daily comparison.")
        return None, None
    with open(dated[-2]) as fh:
        prev = json.load(fh)
    with open(dated[-1]) as fh:
        curr = json.load(fh)
    return prev, curr


def load_all_snapshots():
    """Load all snapshots for multi-day context."""
    snapshot_dir = Path("snapshots")
    files = sorted(snapshot_dir.glob("*.json"))
    snapshots = []
    for f in files:
        try:
            datetime.strptime(f.stem, "%Y-%m-%d")
        except ValueError:
            continue
        with open(f) as fh:
            snapshots.append(json.load(fh))
    return snapshots


def build_install_map(snapshot):
    """Build key -> installs mapping from a snapshot."""
    m = {}
    for sk in snapshot.get("skills", []):
        key = f"{sk['source']}/{sk['name']}"
        m[key] = {
            "installs": sk.get("installs", 0),
            "name": sk["name"],
            "owner": sk["owner"],
            "source": sk["source"],
            "description": sk.get("github", {}).get("description", ""),
            "language": sk.get("github", {}).get("language", "Unknown"),
            "stars": sk.get("github", {}).get("stars", 0),
        }
    return m


def compute_day_over_day(prev_map, curr_map):
    """Compute daily changes between two snapshots."""
    changes = []
    for key, curr in curr_map.items():
        prev = prev_map.get(key)
        if prev:
            delta = curr["installs"] - prev["installs"]
        else:
            delta = curr["installs"]  # new skill
        changes.append({
            "key": key,
            "is_new": key not in prev_map,
            "delta": delta,
            "prev_installs": prev["installs"] if prev else 0,
            "curr_installs": curr["installs"],
            **curr,
        })
    # Include skills that dropped out of the snapshot
    for key, prev in prev_map.items():
        if key not in curr_map:
            changes.append({
                "key": key,
                "is_new": False,
                "delta": -prev["installs"],
                "prev_installs": prev["installs"],
                "curr_installs": 0,
                **prev,
                "installs": 0,
            })
    return changes


def categorize_skill(skill):
    """Assign a short category label based on name/description heuristics."""
    name = skill["name"].lower()
    desc = (skill.get("description") or "").lower()
    owner = skill.get("owner", "").lower()

    if "find-skills" in name or "skill-creator" in name:
        return "Platform"
    if "browser" in name and ("automat" in desc or "agent" in desc):
        return "Browser Automation"
    if any(x in name for x in ["react", "next", "angular", "remotion", "vue",
                                 "svelte", "nuxt", "astro", "expo"]):
        return "Framework Patterns"
    if any(x in name for x in ["design", "ui-ux", "web-design", "frontend",
                                 "css", "tailwind", "component"]):
        return "Design/Frontend"
    if any(x in name for x in ["seo", "marketing", "copywriting", "cold-email",
                                 "email", "growth", "cro", "landing-page"]):
        return "Marketing"
    if any(x in name for x in ["test", "tdd", "doctor", "audit", "lint",
                                 "a11y", "accessibility"]):
        return "Quality/Testing"
    if any(x in name for x in ["brainstorm", "plan", "code-review", "review",
                                 "workflow", "superpower"]):
        return "Dev Workflow"
    if any(x in name for x in ["twitter", "video", "image", "avatar", "voice",
                                 "social", "content", "media", "storyboard",
                                 "photography", "og-image"]):
        return "Content/Media"
    if any(x in name for x in ["postgres", "mysql", "supabase", "database",
                                 "sql", "prisma", "mongo", "redis", "vitess"]):
        return "Database"
    if any(x in name for x in ["auth", "clerk", "oauth", "jwt"]):
        return "Auth"
    if any(x in name for x in ["typescript", "python", "zod", "vitest",
                                 "trpc", "type", "sdk"]):
        return "Language/Library"
    if any(x in name for x in ["scrape", "crawl", "firecrawl", "search"]):
        return "Scraping/Search"
    if "agent" in name or "tool" in name or "mcp" in name:
        return "Agent Infra"
    if "inference-sh" in owner:
        return "API Wrapper"
    if any(x in name for x in ["best-practice", "pattern", "composition",
                                 "guideline"]):
        return "Framework Patterns"
    if any(x in name for x in ["pdf", "pptx", "doc", "file", "art"]):
        return "File/Creative"
    if "api" in name or "webhook" in name or "deploy" in name:
        return "Infra/DevOps"
    return "Other"


def generate_tweet(date, total_growth, total_installs, top3, new_count):
    """Generate a tweet (<=280 chars)."""
    top_lines = []
    for s in top3:
        top_lines.append(f"{s['name']} +{s['delta']:,}")

    movers = " | ".join(top_lines)

    tweet = (
        f"skills.sh daily ({date}): +{total_growth:,} installs "
        f"({total_installs:,} total)\n\n"
        f"Top movers: {movers}\n\n"
    )
    if new_count > 0:
        tweet += f"{new_count} new skills entered the rankings.\n\n"
    tweet += "#skillssh #agentskills #claudecode"

    # Trim if over 280
    if len(tweet) > 280:
        tweet = tweet[:277] + "..."
    return tweet


def generate_linkedin(date, total_growth, total_installs, total_skills,
                      top5, new_skills, categories):
    """Generate a LinkedIn post."""
    lines = [
        f"Skills.sh Daily Trend Report - {date}",
        "",
        f"The agent skills ecosystem added +{total_growth:,} installs overnight, "
        f"reaching {total_installs:,} total across {total_skills} skills.",
        "",
        "Top movers today:",
    ]
    for i, s in enumerate(top5, 1):
        cat = categorize_skill(s)
        lines.append(
            f"  {i}. {s['name']} ({s['owner']}) - "
            f"+{s['delta']:,} installs [{cat}]"
        )

    if new_skills:
        lines.append("")
        lines.append(f"{len(new_skills)} new skills entered the rankings today:")
        for s in new_skills[:3]:
            lines.append(f"  - {s['name']} ({s['owner']}) - {s['curr_installs']:,} installs")

    # Category summary
    if categories:
        lines.append("")
        lines.append("Growth by category:")
        for cat, total in sorted(categories.items(), key=lambda x: -x[1])[:5]:
            lines.append(f"  {cat}: +{total:,}")

    lines.extend([
        "",
        "What patterns are you seeing in the agent skills space?",
        "",
        "#AgentSkills #SkillsSh #ClaudeCode #AI #DevTools",
    ])

    return "\n".join(lines)


def main():
    prev, curr = load_two_most_recent()
    if not prev or not curr:
        return

    date = curr["date"]
    prev_date = prev["date"]
    output_dir = Path("analysis/daily")
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{date}.md"

    prev_map = build_install_map(prev)
    curr_map = build_install_map(curr)
    changes = compute_day_over_day(prev_map, curr_map)

    # Aggregates
    prev_total = sum(s.get("installs", 0) for s in prev["skills"])
    curr_total = sum(s.get("installs", 0) for s in curr["skills"])
    total_growth = curr_total - prev_total
    total_skills = len(curr["skills"])

    # Sort by delta
    gainers = sorted(changes, key=lambda x: x["delta"], reverse=True)
    decliners = sorted(changes, key=lambda x: x["delta"])
    new_skills = [c for c in changes if c["is_new"]]
    new_skills.sort(key=lambda x: x["curr_installs"], reverse=True)

    # Category breakdown
    categories = {}
    for c in changes:
        cat = categorize_skill(c)
        categories[cat] = categories.get(cat, 0) + c["delta"]

    # --- Build report ---
    report = []
    report.append(f"# Daily Trend Report: {date}")
    report.append(f"")
    report.append(f"**Compared to:** {prev_date}")
    report.append(f"**Total installs:** {prev_total:,} -> {curr_total:,} "
                  f"(+{total_growth:,}, +{total_growth/prev_total*100:.1f}%)")
    report.append(f"**Skills in snapshot:** {total_skills}")
    report.append(f"**New skills today:** {len(new_skills)}")
    report.append("")

    # Top 15 gainers
    report.append("## Top 15 Gainers")
    report.append("")
    report.append("| # | Skill | Owner | Installs | Change | Category |")
    report.append("|---|-------|-------|----------|--------|----------|")
    for i, s in enumerate(gainers[:15], 1):
        cat = categorize_skill(s)
        report.append(
            f"| {i} | {s['name']} | {s['owner']} | "
            f"{s['curr_installs']:,} | +{s['delta']:,} | {cat} |"
        )

    # Decliners
    notable_decliners = [d for d in decliners if d["delta"] < 0][:10]
    if notable_decliners:
        report.append("")
        report.append("## Notable Decliners")
        report.append("")
        report.append("| # | Skill | Owner | Installs | Change |")
        report.append("|---|-------|-------|----------|--------|")
        for i, s in enumerate(notable_decliners, 1):
            report.append(
                f"| {i} | {s['name']} | {s['owner']} | "
                f"{s['curr_installs']:,} | {s['delta']:,} |"
            )

    # New skills
    if new_skills:
        report.append("")
        report.append("## New Entrants")
        report.append("")
        report.append("| # | Skill | Owner | Installs | Description |")
        report.append("|---|-------|-------|----------|-------------|")
        for i, s in enumerate(new_skills[:10], 1):
            desc = (s.get("description") or "")[:60]
            report.append(
                f"| {i} | {s['name']} | {s['owner']} | "
                f"{s['curr_installs']:,} | {desc} |"
            )

    # Category summary
    report.append("")
    report.append("## Growth by Category")
    report.append("")
    report.append("| Category | Install Growth |")
    report.append("|----------|---------------|")
    for cat, total in sorted(categories.items(), key=lambda x: -x[1]):
        if total != 0:
            sign = "+" if total > 0 else ""
            report.append(f"| {cat} | {sign}{total:,} |")

    # --- Social posts ---
    tweet = generate_tweet(date, total_growth, curr_total, gainers[:3], len(new_skills))
    linkedin = generate_linkedin(date, total_growth, curr_total, total_skills,
                                 gainers[:5], new_skills, categories)

    report.append("")
    report.append("---")
    report.append("")
    report.append("## Tweet")
    report.append("")
    report.append("```")
    report.append(tweet)
    report.append("```")
    report.append("")
    report.append(f"*({len(tweet)} chars)*")
    report.append("")
    report.append("## LinkedIn Post")
    report.append("")
    report.append("```")
    report.append(linkedin)
    report.append("```")

    # Write report
    output_path.write_text("\n".join(report) + "\n")
    print(f"Generated {output_path}")
    print(f"  Day-over-day: +{total_growth:,} installs")
    print(f"  Top mover: {gainers[0]['name']} (+{gainers[0]['delta']:,})")
    print(f"  New skills: {len(new_skills)}")
    print()
    print("=== TWEET ===")
    print(tweet)
    print()
    print("=== LINKEDIN ===")
    print(linkedin)


if __name__ == "__main__":
    main()
