#!/usr/bin/env python3
"""
Analyze skill trends across daily snapshots.

Identifies major movers by absolute and relative install growth,
categorizes skills, and produces a comprehensive trend report.
"""

import json
from pathlib import Path
from datetime import datetime


def load_snapshots():
    """Load all snapshot files, sorted by date."""
    snapshot_dir = Path("snapshots")
    files = sorted(snapshot_dir.glob("*.json"))
    snapshots = []
    for f in files:
        stem = f.stem
        try:
            datetime.strptime(stem, "%Y-%m-%d")
        except ValueError:
            continue
        with open(f) as fh:
            snapshots.append(json.load(fh))
    return snapshots


def build_skill_timeseries(snapshots):
    """Build per-skill timeseries keyed by source/name."""
    dates = [s["date"] for s in snapshots]
    skills = {}  # key -> {meta + installs: [], stars: [], forks: []}

    for i, snap in enumerate(snapshots):
        seen = set()
        for sk in snap.get("skills", []):
            key = f"{sk['source']}/{sk['name']}"
            seen.add(key)
            gh = sk.get("github", {})
            if key not in skills:
                skills[key] = {
                    "name": sk["name"],
                    "owner": sk["owner"],
                    "repo": sk["repo"],
                    "source": sk["source"],
                    "description": gh.get("description", ""),
                    "language": gh.get("language", "Unknown"),
                    "license": gh.get("license"),
                    "stars_latest": gh.get("stars", 0),
                    "forks_latest": gh.get("forks", 0),
                    "created_at": gh.get("created_at", ""),
                    "topics": gh.get("topics", []),
                    "installs": [None] * i,
                    "stars": [None] * i,
                }
            skills[key]["installs"].append(sk.get("installs", 0))
            skills[key]["stars"].append(gh.get("stars", 0))
            # Update description/language with latest non-empty
            if gh.get("description"):
                skills[key]["description"] = gh["description"]
            if gh.get("language"):
                skills[key]["language"] = gh["language"]
            if gh.get("stars", 0):
                skills[key]["stars_latest"] = gh["stars"]
            if gh.get("forks", 0):
                skills[key]["forks_latest"] = gh["forks"]

        for key in skills:
            if key not in seen:
                skills[key]["installs"].append(None)
                skills[key]["stars"].append(None)

    return dates, skills


def compute_growth(installs_series):
    """Compute absolute and relative growth from first to last non-null value."""
    vals = [(i, v) for i, v in enumerate(installs_series) if v is not None]
    if len(vals) < 2:
        return 0, 0.0, None, None
    first_i, first_v = vals[0]
    last_i, last_v = vals[-1]
    abs_growth = last_v - first_v
    rel_growth = (abs_growth / first_v * 100) if first_v > 0 else 0.0
    return abs_growth, rel_growth, first_v, last_v


def compute_daily_velocity(installs_series):
    """Average daily install change across non-null consecutive pairs."""
    pairs = []
    prev = None
    for v in installs_series:
        if v is not None:
            if prev is not None:
                pairs.append(v - prev)
            prev = v
    return sum(pairs) / len(pairs) if pairs else 0


def main():
    snapshots = load_snapshots()
    dates, skills = build_skill_timeseries(snapshots)

    print("=" * 80)
    print(f"SKILLS.SH TREND ANALYSIS — {dates[0]} to {dates[-1]} ({len(dates)} snapshots)")
    print("=" * 80)

    # Aggregate stats
    first_snap = snapshots[0]
    last_snap = snapshots[-1]
    first_total = sum(s.get("installs", 0) for s in first_snap["skills"])
    last_total = sum(s.get("installs", 0) for s in last_snap["skills"])
    print(f"\nTotal skills tracked: {len(skills)}")
    print(f"Total installs: {first_total:,} → {last_total:,} (+{last_total - first_total:,}, +{(last_total-first_total)/first_total*100:.1f}%)")
    print(f"Dates: {', '.join(dates)}")

    # Compute growth metrics for each skill
    growth_data = []
    for key, data in skills.items():
        abs_g, rel_g, first_v, last_v = compute_growth(data["installs"])
        velocity = compute_daily_velocity(data["installs"])
        growth_data.append({
            "key": key,
            "name": data["name"],
            "owner": data["owner"],
            "source": data["source"],
            "description": data["description"],
            "language": data["language"],
            "license": data["license"],
            "stars": data["stars_latest"],
            "forks": data["forks_latest"],
            "created_at": data["created_at"],
            "topics": data["topics"],
            "first_installs": first_v,
            "last_installs": last_v,
            "abs_growth": abs_g,
            "rel_growth": rel_g,
            "daily_velocity": velocity,
            "installs_series": data["installs"],
        })

    # === TOP 30 BY ABSOLUTE GROWTH ===
    print("\n" + "=" * 80)
    print("TOP 30 SKILLS BY ABSOLUTE INSTALL GROWTH")
    print("=" * 80)
    by_abs = sorted(growth_data, key=lambda x: x["abs_growth"], reverse=True)[:30]
    print(f"{'#':<4} {'Skill':<45} {'First':>7} {'Last':>7} {'Growth':>7} {'%':>7} {'Vel/d':>7} {'Lang':<12} {'Stars':>6}")
    print("-" * 110)
    for i, s in enumerate(by_abs, 1):
        f = s["first_installs"] or 0
        l = s["last_installs"] or 0
        print(f"{i:<4} {s['key'][:44]:<45} {f:>7,} {l:>7,} {s['abs_growth']:>+7,} {s['rel_growth']:>6.1f}% {s['daily_velocity']:>7.1f} {(s['language'] or '?')[:11]:<12} {s['stars']:>6,}")

    # === TOP 30 BY RELATIVE GROWTH (min 20 installs at start) ===
    print("\n" + "=" * 80)
    print("TOP 30 SKILLS BY RELATIVE GROWTH (min 20 installs at start)")
    print("=" * 80)
    qualified = [s for s in growth_data if s["first_installs"] and s["first_installs"] >= 20]
    by_rel = sorted(qualified, key=lambda x: x["rel_growth"], reverse=True)[:30]
    print(f"{'#':<4} {'Skill':<45} {'First':>7} {'Last':>7} {'Growth':>7} {'%':>7} {'Lang':<12} {'Stars':>6}")
    print("-" * 100)
    for i, s in enumerate(by_rel, 1):
        f = s["first_installs"] or 0
        l = s["last_installs"] or 0
        print(f"{i:<4} {s['key'][:44]:<45} {f:>7,} {l:>7,} {s['abs_growth']:>+7,} {s['rel_growth']:>6.1f}% {(s['language'] or '?')[:11]:<12} {s['stars']:>6,}")

    # === TOP 20 BY CURRENT INSTALLS (market leaders) ===
    print("\n" + "=" * 80)
    print("TOP 20 SKILLS BY CURRENT INSTALLS (market leaders)")
    print("=" * 80)
    by_current = sorted(growth_data, key=lambda x: x["last_installs"] or 0, reverse=True)[:20]
    print(f"{'#':<4} {'Skill':<45} {'Installs':>8} {'Growth':>7} {'%':>7} {'Lang':<12} {'Stars':>6}")
    print("-" * 95)
    for i, s in enumerate(by_current, 1):
        l = s["last_installs"] or 0
        print(f"{i:<4} {s['key'][:44]:<45} {l:>8,} {s['abs_growth']:>+7,} {s['rel_growth']:>6.1f}% {(s['language'] or '?')[:11]:<12} {s['stars']:>6,}")

    # === DETAILED PROFILES OF TOP 15 MOVERS ===
    print("\n" + "=" * 80)
    print("DETAILED PROFILES — TOP 15 ABSOLUTE MOVERS")
    print("=" * 80)
    for i, s in enumerate(by_abs[:15], 1):
        print(f"\n--- #{i}: {s['key']} ---")
        print(f"  Description: {s['description'] or '(none)'}")
        print(f"  Language: {s['language'] or 'Unknown'} | License: {s['license'] or 'None'}")
        print(f"  Stars: {s['stars']:,} | Forks: {s['forks']:,}")
        print(f"  Created: {s['created_at'][:10] if s['created_at'] else 'Unknown'}")
        print(f"  Topics: {', '.join(s['topics']) if s['topics'] else '(none)'}")
        print(f"  Installs: {' → '.join(str(v) if v is not None else '—' for v in s['installs_series'])}")
        print(f"  Growth: +{s['abs_growth']:,} ({s['rel_growth']:.1f}%) | Velocity: {s['daily_velocity']:.1f}/day")

    # === NEW SKILLS (appeared after first snapshot) ===
    print("\n" + "=" * 80)
    print("NEW SKILLS (first appeared after the initial snapshot)")
    print("=" * 80)
    new_skills = [s for s in growth_data if s["installs_series"][0] is None and s["last_installs"] is not None]
    new_skills.sort(key=lambda x: x["last_installs"] or 0, reverse=True)
    if new_skills:
        print(f"{'#':<4} {'Skill':<45} {'Installs':>8} {'First Seen':<12} {'Description':<50}")
        print("-" * 120)
        for i, s in enumerate(new_skills[:20], 1):
            first_seen_idx = next((j for j, v in enumerate(s["installs_series"]) if v is not None), 0)
            first_seen = dates[first_seen_idx] if first_seen_idx < len(dates) else "?"
            print(f"{i:<4} {s['key'][:44]:<45} {(s['last_installs'] or 0):>8,} {first_seen:<12} {(s['description'] or '')[:50]}")
    else:
        print("  No new skills detected in this period.")

    # === DECLINING SKILLS ===
    print("\n" + "=" * 80)
    print("DECLINING/STAGNANT SKILLS (negative or zero growth, min 50 installs)")
    print("=" * 80)
    declining = [s for s in growth_data if s["abs_growth"] <= 0 and (s["first_installs"] or 0) >= 50]
    declining.sort(key=lambda x: x["abs_growth"])
    if declining:
        print(f"{'#':<4} {'Skill':<45} {'First':>7} {'Last':>7} {'Growth':>7} {'Lang':<12}")
        print("-" * 90)
        for i, s in enumerate(declining[:15], 1):
            f = s["first_installs"] or 0
            l = s["last_installs"] or 0
            print(f"{i:<4} {s['key'][:44]:<45} {f:>7,} {l:>7,} {s['abs_growth']:>+7,} {(s['language'] or '?')[:11]:<12}")
    else:
        print("  No declining skills found.")

    # === CATEGORY ANALYSIS (by owner) ===
    print("\n" + "=" * 80)
    print("TOP PUBLISHERS BY TOTAL INSTALL GROWTH")
    print("=" * 80)
    owner_growth = {}
    for s in growth_data:
        o = s["owner"]
        if o not in owner_growth:
            owner_growth[o] = {"total_growth": 0, "skill_count": 0, "total_installs": 0}
        owner_growth[o]["total_growth"] += s["abs_growth"]
        owner_growth[o]["skill_count"] += 1
        owner_growth[o]["total_installs"] += (s["last_installs"] or 0)
    by_owner = sorted(owner_growth.items(), key=lambda x: x[1]["total_growth"], reverse=True)[:20]
    print(f"{'#':<4} {'Owner':<30} {'Skills':>6} {'Total Inst':>10} {'Growth':>8}")
    print("-" * 65)
    for i, (owner, data) in enumerate(by_owner, 1):
        print(f"{i:<4} {owner[:29]:<30} {data['skill_count']:>6} {data['total_installs']:>10,} {data['total_growth']:>+8,}")

    # === LANGUAGE BREAKDOWN OF MOVERS ===
    print("\n" + "=" * 80)
    print("LANGUAGE BREAKDOWN OF TOP 50 MOVERS")
    print("=" * 80)
    lang_counts = {}
    for s in by_abs[:50]:
        lang = s["language"] or "Unknown"
        if lang not in lang_counts:
            lang_counts[lang] = {"count": 0, "total_growth": 0}
        lang_counts[lang]["count"] += 1
        lang_counts[lang]["total_growth"] += s["abs_growth"]
    for lang, data in sorted(lang_counts.items(), key=lambda x: x[1]["total_growth"], reverse=True):
        print(f"  {lang:<15} {data['count']:>3} skills, +{data['total_growth']:>6,} installs")

    # === CONSISTENCY ANALYSIS ===
    print("\n" + "=" * 80)
    print("MOST CONSISTENT GROWERS (positive growth every day, min 3 days data)")
    print("=" * 80)
    consistent = []
    for s in growth_data:
        series = [v for v in s["installs_series"] if v is not None]
        if len(series) >= 3:
            daily_changes = [series[i+1] - series[i] for i in range(len(series)-1)]
            if all(c > 0 for c in daily_changes):
                consistent.append({
                    **s,
                    "min_daily": min(daily_changes),
                    "max_daily": max(daily_changes),
                })
    consistent.sort(key=lambda x: x["abs_growth"], reverse=True)
    print(f"{'#':<4} {'Skill':<45} {'Growth':>7} {'Min/d':>7} {'Max/d':>7} {'Installs':>8}")
    print("-" * 85)
    for i, s in enumerate(consistent[:20], 1):
        print(f"{i:<4} {s['key'][:44]:<45} {s['abs_growth']:>+7,} {s['min_daily']:>7,} {s['max_daily']:>7,} {(s['last_installs'] or 0):>8,}")

    print("\n" + "=" * 80)
    print("END OF ANALYSIS")
    print("=" * 80)


if __name__ == "__main__":
    main()
