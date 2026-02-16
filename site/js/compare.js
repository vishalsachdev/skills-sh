import { loadLatestSnapshot, enrichSkills, computeGlobalStats, normalize, daysSince } from './data.js';

let allSkills = [];
let selected = []; // skill objects
let radarChart = null;

const COLORS = ['#e4a31b', '#5b9ef5', '#3dcc6e', '#a07de8'];

function fmt(n) {
  return n == null ? '—' : n.toLocaleString();
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function renderSelectedTags() {
  const container = document.getElementById('selected-skills');
  container.innerHTML = selected.map((s, i) => `
    <span class="selected-skill-tag" style="border-left: 3px solid ${COLORS[i]}">
      ${esc(s.name)} <span style="color:var(--text-muted);font-size:.75rem">${esc(s.source)}</span>
      <button data-idx="${i}">&times;</button>
    </span>
  `).join('');

  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      selected.splice(Number(btn.dataset.idx), 1);
      renderSelectedTags();
      renderComparison();
    });
  });
}

function renderComparison() {
  const content = document.getElementById('compare-content');
  const empty = document.getElementById('empty-state');

  if (selected.length < 2) {
    content.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  content.style.display = 'block';
  empty.style.display = 'none';

  renderCompareTable();
  renderRadar();
}

function renderCompareTable() {
  const thead = document.getElementById('compare-head');
  const tbody = document.getElementById('compare-body');

  thead.innerHTML = `<tr>
    <th>Metric</th>
    ${selected.map((s, i) => `<th style="border-bottom-color:${COLORS[i]}">${esc(s.name)}</th>`).join('')}
  </tr>`;

  const rows = [
    { label: 'Owner / Repo', fn: s => `<a href="https://github.com/${esc(s.source)}" target="_blank">${esc(s.source)}</a>` },
    { label: 'Installs', fn: s => fmt(s.installs), cls: 'num' },
    { label: 'Stars', fn: s => fmt((s.github||{}).stars), cls: 'num' },
    { label: 'Forks', fn: s => fmt((s.github||{}).forks), cls: 'num' },
    { label: 'Open Issues', fn: s => fmt((s.github||{}).open_issues), cls: 'num' },
    { label: 'Language', fn: s => esc((s.github||{}).language || '—') },
    { label: 'License', fn: s => esc((s.github||{}).license || 'None') },
    { label: 'Created', fn: s => (s.github||{}).created_at ? new Date((s.github||{}).created_at).toLocaleDateString() : '—' },
    { label: 'Last Push', fn: s => (s.github||{}).pushed_at ? new Date((s.github||{}).pushed_at).toLocaleDateString() : '—' },
    { label: 'Repo Age', fn: s => s._ageDays != null ? `${s._ageDays}d` : '—' },
    { label: 'Health Score', fn: s => {
      const cls = s._healthScore >= 60 ? 'health-high' : s._healthScore >= 35 ? 'health-mid' : 'health-low';
      return `<span class="health-score ${cls}">${s._healthScore}</span>`;
    }},
    { label: 'Freshness', fn: s => `<span class="badge ${s._freshness.cls}">${s._freshness.label}</span>` },
    { label: 'Topics', fn: s => ((s.github||{}).topics||[]).map(t => `<span class="badge badge-recent">${esc(t)}</span>`).join(' ') || '—' },
    { label: 'Risk Flags', fn: s => {
      if (!s._riskFlags.length) return '<span style="color:var(--green)">None</span>';
      return s._riskFlags.map(f => `<span class="badge ${f.cls}">${f.label}</span>`).join(' ');
    }},
  ];

  tbody.innerHTML = rows.map(r => `<tr>
    <td style="font-weight:600;color:var(--text-secondary)">${r.label}</td>
    ${selected.map(s => `<td${r.cls ? ' class="'+r.cls+'"' : ''}>${r.fn(s)}</td>`).join('')}
  </tr>`).join('');
}

function renderRadar() {
  const stats = computeGlobalStats(allSkills);
  const canvas = document.getElementById('radar-chart');

  if (radarChart) radarChart.destroy();

  const labels = ['Installs', 'Stars', 'Forks', 'Health', 'Freshness'];

  const maxInstalls = stats.maxInstalls || 1;
  const maxStars = stats.maxStars || 1;
  const maxForks = stats.maxForks || 1;

  const datasets = selected.map((s, i) => {
    const gh = s.github || {};
    return {
      label: s.name,
      data: [
        normalize(s.installs || 0, 0, maxInstalls) * 100,
        normalize(gh.stars || 0, 0, maxStars) * 100,
        normalize(gh.forks || 0, 0, maxForks) * 100,
        s._healthScore,
        s._pushDays < 7 ? 100 : s._pushDays < 30 ? 70 : s._pushDays < 90 ? 40 : 10,
      ],
      borderColor: COLORS[i],
      backgroundColor: COLORS[i] + '22',
      borderWidth: 2,
      pointBackgroundColor: COLORS[i],
      pointRadius: 4,
    };
  });

  radarChart = new Chart(canvas, {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#555568', backdropColor: 'transparent', stepSize: 25 },
          grid: { color: '#222230' },
          angleLines: { color: '#222230' },
          pointLabels: { color: '#8888a0', font: { size: 12 } },
        }
      },
      plugins: {
        legend: {
          labels: { color: '#8888a0', padding: 16 }
        }
      }
    }
  });
}

function showSuggestions(query) {
  const box = document.getElementById('suggestions');
  if (!query) {
    box.style.display = 'none';
    return;
  }

  const q = query.toLowerCase();
  const selectedKeys = new Set(selected.map(s => `${s.source}/${s.name}`));
  const matches = allSkills
    .filter(s => {
      const key = `${s.source}/${s.name}`;
      if (selectedKeys.has(key)) return false;
      const hay = `${s.name} ${s.owner} ${s.source} ${(s.github||{}).description||''}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 8);

  if (!matches.length) {
    box.style.display = 'none';
    return;
  }

  box.style.display = 'block';
  box.innerHTML = matches.map((s, i) => `
    <div data-idx="${i}">
      <span class="sg-name">${esc(s.name)}</span>
      <span class="sg-meta">${esc(s.source)} · ${fmt(s.installs)} installs</span>
    </div>
  `).join('');

  box.querySelectorAll('div').forEach((el, i) => {
    el.addEventListener('click', () => {
      if (selected.length >= 4) return;
      selected.push(matches[i]);
      renderSelectedTags();
      renderComparison();
      document.getElementById('skill-search').value = '';
      box.style.display = 'none';
    });
  });
}

async function init() {
  try {
    const snapshot = await loadLatestSnapshot();
    allSkills = enrichSkills(snapshot);

    document.getElementById('data-date').textContent = `snapshot: ${snapshot.date}`;
    document.getElementById('loading').style.display = 'none';

    const searchInput = document.getElementById('skill-search');
    searchInput.addEventListener('input', () => showSuggestions(searchInput.value));

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        document.getElementById('suggestions').style.display = 'none';
      }
    });

  } catch (err) {
    document.getElementById('loading').textContent = `Error: ${err.message}`;
  }
}

init();
