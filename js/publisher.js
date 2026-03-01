import { loadLatestSnapshot, enrichSkills, getPublisherStats, daysSince, detectRepoClusters, CLUSTER_THRESHOLD } from './data.js';

const CHART_COLORS = {
  accent: '#b45309',
  blue: '#1d4ed8',
  green: '#15803d',
  red: '#dc2626',
  purple: '#7c3aed',
  teal: '#0d9488',
  pink: '#db2777',
  orange: '#ea580c',
  gray: '#a8a29e',
};

const CHART_DEFAULTS = {
  color: '#57534e',
  borderColor: '#e2ded6',
  backgroundColor: 'transparent',
};

function fmt(n) {
  return n == null ? '—' : n.toLocaleString();
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/**
 * Spearman rank correlation (good for non-normal distributions).
 */
function spearmanCorr(xs, ys) {
  const n = xs.length;
  if (n < 3) return 0;

  function rank(arr) {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(n);
    for (let i = 0; i < n;) {
      let j = i;
      while (j < n && sorted[j].v === sorted[i].v) j++;
      const avgRank = (i + j - 1) / 2 + 1;
      for (let k = i; k < j; k++) ranks[sorted[k].i] = avgRank;
      i = j;
    }
    return ranks;
  }

  const rx = rank(xs);
  const ry = rank(ys);

  let sumD2 = 0;
  for (let i = 0; i < n; i++) {
    const d = rx[i] - ry[i];
    sumD2 += d * d;
  }

  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

function buildInstallHistogram(skills) {
  // Log-scale buckets
  const buckets = [0, 1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 10000];
  const labels = [];
  const counts = [];

  for (let i = 0; i < buckets.length; i++) {
    const lo = buckets[i];
    const hi = i < buckets.length - 1 ? buckets[i + 1] - 1 : Infinity;
    labels.push(hi === Infinity ? `${lo}+` : `${lo}–${hi}`);
    counts.push(skills.filter(s => s.installs >= lo && s.installs <= hi).length);
  }

  new Chart(document.getElementById('chart-installs'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: CHART_COLORS.accent + 'cc',
        borderColor: CHART_COLORS.accent,
        borderWidth: 1,
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw} skills`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: CHART_DEFAULTS.color, font: { size: 10 } },
          grid: { color: CHART_DEFAULTS.borderColor },
          title: { display: true, text: 'Install Range', color: CHART_DEFAULTS.color }
        },
        y: {
          ticks: { color: CHART_DEFAULTS.color },
          grid: { color: CHART_DEFAULTS.borderColor },
          title: { display: true, text: 'Number of Skills', color: CHART_DEFAULTS.color }
        }
      }
    }
  });
}

function buildLanguageChart(skills) {
  const langMap = {};
  for (const s of skills) {
    const lang = (s.github || {}).language || 'Unknown';
    langMap[lang] = (langMap[lang] || 0) + 1;
  }

  const sorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 10);
  const otherCount = sorted.slice(10).reduce((s, e) => s + e[1], 0);
  if (otherCount > 0) top.push(['Other', otherCount]);

  const palette = [
    CHART_COLORS.accent, CHART_COLORS.blue, CHART_COLORS.green,
    CHART_COLORS.purple, CHART_COLORS.red, CHART_COLORS.teal,
    CHART_COLORS.pink, CHART_COLORS.orange, '#6366f1', '#84cc16',
    CHART_COLORS.gray,
  ];

  new Chart(document.getElementById('chart-languages'), {
    type: 'doughnut',
    data: {
      labels: top.map(e => e[0]),
      datasets: [{
        data: top.map(e => e[1]),
        backgroundColor: palette.slice(0, top.length).map(c => c + 'cc'),
        borderColor: '#ffffff',
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: CHART_DEFAULTS.color, padding: 12, font: { size: 11 } }
        }
      }
    }
  });
}

function buildStarsVsInstalls(skills) {
  const data = skills
    .filter(s => (s.github || {}).stars != null)
    .map(s => ({
      x: (s.github || {}).stars || 0,
      y: s.installs || 0,
      label: s.name,
    }));

  new Chart(document.getElementById('chart-stars-installs'), {
    type: 'scatter',
    data: {
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.blue + '88',
        borderColor: CHART_COLORS.blue,
        borderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.label}: ${ctx.raw.x} stars, ${ctx.raw.y} installs`
          }
        }
      },
      scales: {
        x: {
          type: 'logarithmic',
          ticks: { color: CHART_DEFAULTS.color },
          grid: { color: CHART_DEFAULTS.borderColor },
          title: { display: true, text: 'Stars (log)', color: CHART_DEFAULTS.color }
        },
        y: {
          type: 'logarithmic',
          ticks: { color: CHART_DEFAULTS.color },
          grid: { color: CHART_DEFAULTS.borderColor },
          title: { display: true, text: 'Installs (log)', color: CHART_DEFAULTS.color }
        }
      }
    }
  });
}

function buildAgeVsInstalls(skills) {
  const data = skills
    .filter(s => (s.github || {}).created_at)
    .map(s => ({
      x: daysSince((s.github || {}).created_at),
      y: s.installs || 0,
      label: s.name,
    }));

  new Chart(document.getElementById('chart-age-installs'), {
    type: 'scatter',
    data: {
      datasets: [{
        data,
        backgroundColor: CHART_COLORS.green + '88',
        borderColor: CHART_COLORS.green,
        borderWidth: 1,
        pointRadius: 3,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.label}: ${ctx.raw.x}d old, ${ctx.raw.y} installs`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: CHART_DEFAULTS.color },
          grid: { color: CHART_DEFAULTS.borderColor },
          title: { display: true, text: 'Repo Age (days)', color: CHART_DEFAULTS.color }
        },
        y: {
          type: 'logarithmic',
          ticks: { color: CHART_DEFAULTS.color },
          grid: { color: CHART_DEFAULTS.borderColor },
          title: { display: true, text: 'Installs (log)', color: CHART_DEFAULTS.color }
        }
      }
    }
  });
}

function buildCorrelations(skills) {
  const installs = skills.map(s => s.installs || 0);
  const traits = [
    { name: 'Stars', values: skills.map(s => (s.github||{}).stars || 0) },
    { name: 'Forks', values: skills.map(s => (s.github||{}).forks || 0) },
    { name: 'Open Issues', values: skills.map(s => (s.github||{}).open_issues || 0) },
    { name: 'Repo Age (days)', values: skills.map(s => s._ageDays || 0) },
    { name: 'Push Recency (days, lower=fresher)', values: skills.map(s => s._pushDays || 999) },
    { name: 'Description Length', values: skills.map(s => ((s.github||{}).description||'').length) },
    { name: 'Topic Count', values: skills.map(s => ((s.github||{}).topics||[]).length) },
  ];

  // Count skills per source repo
  const repoSkillCount = {};
  for (const s of skills) {
    repoSkillCount[s.source] = (repoSkillCount[s.source] || 0) + 1;
  }
  traits.push({
    name: 'Skills per Repo',
    values: skills.map(s => repoSkillCount[s.source] || 1),
  });

  const rows = traits.map(t => {
    const r = spearmanCorr(t.values, installs);
    return { name: t.name, corr: r };
  }).sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));

  const tbody = document.getElementById('corr-body');
  tbody.innerHTML = rows.map(r => {
    const cls = r.corr > 0.1 ? 'corr-positive' : r.corr < -0.1 ? 'corr-negative' : 'corr-neutral';
    const dir = r.corr > 0.1 ? 'Positive' : r.corr < -0.1 ? 'Negative' : 'Weak';
    return `<tr>
      <td>${esc(r.name)}</td>
      <td class="num ${cls}">${r.corr.toFixed(3)}</td>
      <td class="${cls}">${dir}</td>
    </tr>`;
  }).join('');
}

function buildPublisherLeaderboard(skills) {
  const clusters = detectRepoClusters(skills);

  // Count cluster skills per owner
  const ownerClusterCount = {};
  for (const s of skills) {
    if (clusters.has(s.source)) {
      ownerClusterCount[s.owner] = (ownerClusterCount[s.owner] || 0) + 1;
    }
  }

  const pubs = getPublisherStats(skills)
    .sort((a, b) => b.totalInstalls - a.totalInstalls)
    .slice(0, 30);

  const tbody = document.getElementById('pub-body');
  tbody.innerHTML = pubs.map((p, i) => {
    const clusterN = ownerClusterCount[p.owner] || 0;
    const flag = clusterN > 0
      ? ` <span class="badge badge-cluster" title="${clusterN} skills from repo clusters (${CLUSTER_THRESHOLD}+ skills per repo)">${clusterN} cluster</span>`
      : '';
    return `<tr${clusterN > 0 ? ' class="cluster-row"' : ''}>
    <td class="num">${i + 1}</td>
    <td><a href="https://github.com/${esc(p.owner)}" target="_blank" rel="noopener">${esc(p.owner)}</a>${flag}</td>
    <td class="num">${p.skillCount}</td>
    <td class="num">${fmt(p.totalInstalls)}</td>
    <td class="num">${fmt(p.totalStars)}</td>
  </tr>`;
  }).join('');
}

async function init() {
  try {
    const snapshot = await loadLatestSnapshot();
    const skills = enrichSkills(snapshot);

    document.getElementById('data-date').textContent = `snapshot: ${snapshot.date}`;

    buildInstallHistogram(skills);
    buildLanguageChart(skills);
    buildStarsVsInstalls(skills);
    buildAgeVsInstalls(skills);
    buildCorrelations(skills);
    buildPublisherLeaderboard(skills);

    document.getElementById('loading').style.display = 'none';
  } catch (err) {
    document.getElementById('loading').textContent = `Error: ${err.message}`;
  }
}

init();
