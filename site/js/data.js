/**
 * data.js — Core data module for skills-sh dashboard.
 * Loads snapshot, computes health scores, freshness badges, risk flags.
 */

let _cache = null;
let _tsCache = null;

export async function loadTimeseries() {
  if (_tsCache) return _tsCache;

  const paths = ['data/timeseries.json', '../site/data/timeseries.json'];

  for (const path of paths) {
    try {
      const resp = await fetch(path);
      if (resp.ok) {
        _tsCache = await resp.json();
        return _tsCache;
      }
    } catch {}
  }

  throw new Error('Could not load timeseries data from any known path.');
}

export async function loadLatestSnapshot() {
  if (_cache) return _cache;

  // Try production path first (GitHub Pages), then local dev fallback
  const paths = ['data/latest.json', '../snapshots/latest.json'];

  // Also try today's date and a few recent days for local dev
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    paths.push(`../snapshots/${dateStr}.json`);
  }

  for (const path of paths) {
    try {
      const resp = await fetch(path);
      if (resp.ok) {
        _cache = await resp.json();
        return _cache;
      }
    } catch {}
  }

  throw new Error('Could not load snapshot data from any known path.');
}

export function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function normalize(val, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

/**
 * Compute health score (0-100) for a skill.
 * recency 40%, community 30%, documentation 30%
 */
export function computeHealthScore(skill, globalStats) {
  const gh = skill.github || {};

  // Recency (40%)
  const pushDays = daysSince(gh.pushed_at);
  let recency;
  if (pushDays < 7) recency = 100;
  else if (pushDays < 30) recency = 70;
  else if (pushDays < 90) recency = 40;
  else recency = 10;

  // Community (30%)
  const stars = gh.stars || 0;
  const forks = gh.forks || 0;
  const hasLicense = gh.license && gh.license !== 'NOASSERTION';

  const logStars = Math.log(stars + 1);
  const logForks = Math.log(forks + 1);
  const maxLogStars = Math.log((globalStats.maxStars || 1) + 1);
  const maxLogForks = Math.log((globalStats.maxForks || 1) + 1);

  const community =
    normalize(logStars, 0, maxLogStars) * 50 +
    normalize(logForks, 0, maxLogForks) * 30 +
    (hasLicense ? 20 : 0);

  // Documentation (30%)
  const desc = gh.description || '';
  const topics = gh.topics || [];
  const installs = skill.installs || 0;
  const logInstalls = Math.log(installs + 1);
  const maxLogInstalls = Math.log((globalStats.maxInstalls || 1) + 1);

  const documentation =
    (desc.length > 20 ? 40 : 0) +
    (topics.length > 0 ? 30 : 0) +
    normalize(logInstalls, 0, maxLogInstalls) * 30;

  return Math.round(recency * 0.4 + community * 0.3 + documentation * 0.3);
}

export function getFreshnessBadge(skill) {
  const days = daysSince((skill.github || {}).pushed_at);
  if (days < 7) return { label: 'Active', cls: 'badge-active' };
  if (days < 30) return { label: 'Recent', cls: 'badge-recent' };
  return { label: 'Stale', cls: 'badge-stale' };
}

export function getRiskFlags(skill) {
  const gh = skill.github || {};
  const flags = [];

  if (!gh.license || gh.license === 'NOASSERTION') {
    flags.push({ label: 'No License', cls: 'risk-warn' });
  }

  if (daysSince(gh.pushed_at) > 30) {
    flags.push({ label: 'Stale', cls: 'risk-danger' });
  }

  const issues = gh.open_issues || 0;
  const stars = gh.stars || 0;
  if (stars > 0 && issues / stars > 0.1) {
    flags.push({ label: 'High Issues', cls: 'risk-warn' });
  }

  return flags;
}

/**
 * Compute global stats needed for normalization.
 */
export function computeGlobalStats(skills) {
  let maxStars = 0, maxForks = 0, maxInstalls = 0;
  for (const s of skills) {
    const gh = s.github || {};
    if ((gh.stars || 0) > maxStars) maxStars = gh.stars;
    if ((gh.forks || 0) > maxForks) maxForks = gh.forks;
    if ((s.installs || 0) > maxInstalls) maxInstalls = s.installs;
  }
  return { maxStars, maxForks, maxInstalls };
}

/**
 * Minimum number of skills from a single repo to flag as a cluster.
 */
export const CLUSTER_THRESHOLD = 5;

/**
 * Detect repo clusters — repos publishing many skills with similar install counts.
 * Returns a Set of `source` strings (owner/repo) that are clusters.
 */
export function detectRepoClusters(skills) {
  const bySource = {};
  for (const s of skills) {
    if (!bySource[s.source]) bySource[s.source] = [];
    bySource[s.source].push(s);
  }

  const clusters = new Set();
  for (const [source, group] of Object.entries(bySource)) {
    if (group.length >= CLUSTER_THRESHOLD) {
      clusters.add(source);
    }
  }
  return clusters;
}

/**
 * Get summary stats about clusters in the current snapshot.
 */
export function getClusterStats(skills) {
  const clusters = detectRepoClusters(skills);
  const clusterSkills = skills.filter(s => clusters.has(s.source));
  const organicSkills = skills.filter(s => !clusters.has(s.source));

  // Group cluster skills by source for detail
  const clusterRepos = {};
  for (const s of clusterSkills) {
    if (!clusterRepos[s.source]) clusterRepos[s.source] = { count: 0, installs: 0 };
    clusterRepos[s.source].count++;
    clusterRepos[s.source].installs += s.installs || 0;
  }

  return {
    clusterSources: clusters,
    clusterCount: clusterSkills.length,
    clusterInstalls: clusterSkills.reduce((sum, s) => sum + (s.installs || 0), 0),
    organicCount: organicSkills.length,
    organicInstalls: organicSkills.reduce((sum, s) => sum + (s.installs || 0), 0),
    repos: clusterRepos,
  };
}

/**
 * Enrich skills array with computed fields. Mutates in place.
 */
export function enrichSkills(snapshot) {
  const skills = snapshot.skills;
  const stats = computeGlobalStats(skills);
  const clusters = detectRepoClusters(skills);
  for (const s of skills) {
    s._healthScore = computeHealthScore(s, stats);
    s._freshness = getFreshnessBadge(s);
    s._riskFlags = getRiskFlags(s);
    s._pushDays = daysSince((s.github || {}).pushed_at);
    s._ageDays = daysSince((s.github || {}).created_at);
    s._isCluster = clusters.has(s.source);
  }
  return skills;
}

/**
 * Get unique languages from skills array.
 */
export function getUniqueLanguages(skills) {
  const langs = new Set();
  for (const s of skills) {
    const lang = (s.github || {}).language;
    if (lang) langs.add(lang);
  }
  return [...langs].sort();
}

/**
 * Get unique publishers (owners) with aggregate stats.
 */
export function getPublisherStats(skills) {
  const map = {};
  for (const s of skills) {
    if (!map[s.owner]) {
      map[s.owner] = { owner: s.owner, skillCount: 0, totalInstalls: 0, totalStars: 0 };
    }
    map[s.owner].skillCount++;
    map[s.owner].totalInstalls += s.installs || 0;
    map[s.owner].totalStars += (s.github || {}).stars || 0;
  }
  return Object.values(map);
}
