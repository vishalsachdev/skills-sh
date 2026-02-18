#!/usr/bin/env python3
"""
Generate timeseries.json from daily snapshots.

Reads all snapshots/*.json and produces a compact site/data/timeseries.json
suitable for the Trends dashboard. Each skill gets an install array aligned
to the dates array, with null for days it wasn't present.

Usage: python generate_timeseries.py
"""

import json
from datetime import datetime
from pathlib import Path


def main():
    snapshot_dir = Path("snapshots")
    output_path = Path("site/data/timeseries.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Collect all snapshot files, sorted by date
    files = sorted(snapshot_dir.glob("*.json"))
    if not files:
        print("No snapshot files found in snapshots/")
        return

    dates = []
    total_skills_series = []
    total_installs_series = []

    # skill_key -> {name, owner, repo, installs: []}
    skills = {}

    for f in files:
        # Skip non-date files (e.g. latest.json)
        stem = f.stem
        try:
            datetime.strptime(stem, "%Y-%m-%d")
        except ValueError:
            continue

        with open(f) as fh:
            snapshot = json.load(fh)

        date = snapshot.get("date", stem)
        dates.append(date)

        snapshot_skills = snapshot.get("skills", [])
        total_skills_series.append(len(snapshot_skills))
        total_installs_series.append(sum(s.get("installs", 0) for s in snapshot_skills))

        # Track which skills appear in this snapshot
        seen_this_day = set()

        for s in snapshot_skills:
            key = f"{s['source']}/{s['name']}"
            seen_this_day.add(key)

            if key not in skills:
                skills[key] = {
                    "name": s["name"],
                    "owner": s["owner"],
                    "repo": s["repo"],
                    # Backfill nulls for previous dates
                    "installs": [None] * (len(dates) - 1),
                }

            skills[key]["installs"].append(s.get("installs", 0))

        # Fill null for skills not in this snapshot
        for key, data in skills.items():
            if key not in seen_this_day:
                data["installs"].append(None)

    output = {
        "generated": datetime.now().isoformat(),
        "snapshot_count": len(dates),
        "dates": dates,
        "aggregate": {
            "total_skills": total_skills_series,
            "total_installs": total_installs_series,
        },
        "skills": {k: v for k, v in sorted(skills.items())},
    }

    with open(output_path, "w") as fh:
        json.dump(output, fh, separators=(",", ":"))

    size_kb = output_path.stat().st_size / 1024
    print(f"Generated {output_path} ({size_kb:.1f} KB)")
    print(f"  {len(dates)} snapshots, {len(skills)} unique skills")


if __name__ == "__main__":
    main()
