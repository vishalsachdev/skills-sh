import { loadTimeseries } from './data.js';

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
 * Generate a Unicode sparkline from an array of numbers.
 * Nulls are rendered as a gap (space).
 */
function sparkline(values) {
  const bars = ' ▁▂▃▄▅▆▇█';
  const nums = values.filter(v => v != null);
  if (nums.length === 0) return '';
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1;
  return values.map(v => {
    if (v == null) return ' ';
    const idx = Math.round(((v - min) / range) * (bars.length - 2)) + 1;
    return bars[idx];
  }).join('');
}

/**
 * Compute change stats for a skill's install array.
 */
function computeChange(installs, period) {
  // Filter to non-null pairs
  const valid = installs.map((v, i) => ({ v, i })).filter(x => x.v != null);
  if (valid.length < 2) return { abs: 0, pct: 0, latest: valid.length ? valid[valid.length - 1].v : 0 };

  const latest = valid[valid.length - 1].v;

  if (period === 'day') {
    const prev = valid[valid.length - 2].v;
    const abs = latest - prev;
    const pct = prev > 0 ? (abs / prev) * 100 : 0;
    return { abs, pct, latest };
  }

  // total period
  const first = valid[0].v;
  const abs = latest - first;
  const pct = first > 0 ? (abs / first) * 100 : 0;
  return { abs, pct, latest };
}

let _data = null;
let _skillChart = null;

function renderHeroStats(data) {
  document.getElementById('stat-snapshots').textContent = data.snapshot_count;

  const first = data.dates[0];
  const last = data.dates[data.dates.length - 1];
  // Show compact date range
  const fmtDate = d => d.slice(5); // MM-DD
  document.getElementById('stat-date-range').textContent = `${fmtDate(first)} to ${fmtDate(last)}`;

  const firstInstalls = data.aggregate.total_installs[0];
  const lastInstalls = data.aggregate.total_installs[data.aggregate.total_installs.length - 1];
  const growth = lastInstalls - firstInstalls;
  const prefix = growth >= 0 ? '+' : '';
  document.getElementById('stat-install-growth').textContent = `${prefix}${fmt(growth)}`;

  document.getElementById('stat-unique-skills').textContent = fmt(Object.keys(data.skills).length);
}

function renderEarlyNotice(data) {
  const notice = document.getElementById('early-notice');
  if (data.snapshot_count >= 7) {
    notice.style.display = 'none';
  }
}

function buildEcosystemCharts(data) {
  const labels = data.dates.map(d => d.slice(5)); // MM-DD

  new Chart(document.getElementById('chart-installs'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Total Installs',
        data: data.aggregate.total_installs,
        borderColor: CHART_COLORS.accent,
        backgroundColor: CHART_COLORS.accent + '22',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${fmt(ctx.raw)} installs`,
          }
        }
      },
      scales: {
        x: {
          ticks: { color: CHART_DEFAULTS.color },
          grid: { color: CHART_DEFAULTS.borderColor },
        },
        y: {
          ticks: { color: CHART_DEFAULTS.color, callback: v => fmt(v) },
          grid: { color: CHART_DEFAULTS.borderColor },
        }
      }
    }
  });

}

function buildMoversTable(data, period) {
  const entries = Object.entries(data.skills).map(([key, skill]) => {
    const change = computeChange(skill.installs, period);
    return { key, ...skill, ...change };
  });

  // Sort by absolute change descending, show top 20 gainers then top 10 losers
  const gainers = entries.filter(e => e.abs > 0).sort((a, b) => b.abs - a.abs).slice(0, 20);
  const losers = entries.filter(e => e.abs < 0).sort((a, b) => a.abs - b.abs).slice(0, 10);
  const movers = [...gainers, ...losers];

  const tbody = document.getElementById('movers-body');
  tbody.innerHTML = movers.map((m, i) => {
    const changeClass = m.abs > 0 ? 'corr-positive' : m.abs < 0 ? 'corr-negative' : 'corr-neutral';
    const prefix = m.abs > 0 ? '+' : '';
    const spark = sparkline(m.installs);
    return `<tr>
      <td class="num">${i + 1}</td>
      <td><a href="https://github.com/${esc(m.owner)}/${esc(m.repo)}" target="_blank" rel="noopener">${esc(m.owner)}/${esc(m.name)}</a></td>
      <td class="num">${fmt(m.latest)}</td>
      <td class="num ${changeClass}">${prefix}${fmt(m.abs)}</td>
      <td class="num ${changeClass}">${prefix}${m.pct.toFixed(1)}%</td>
      <td class="sparkline">${spark}</td>
    </tr>`;
  }).join('');

  document.getElementById('movers-count').textContent = `${gainers.length} gainers, ${losers.length} losers`;
}

function setupPeriodToggle(data) {
  const toggle = document.getElementById('period-toggle');
  toggle.addEventListener('click', (e) => {
    const btn = e.target.closest('.period-btn');
    if (!btn) return;
    toggle.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    buildMoversTable(data, btn.dataset.period);
  });
}

function setupSkillSearch(data) {
  const input = document.getElementById('skill-search');
  const sugBox = document.getElementById('suggestions');
  const keys = Object.keys(data.skills);

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      sugBox.style.display = 'none';
      return;
    }

    const matches = keys.filter(k => k.toLowerCase().includes(q)).slice(0, 10);
    if (matches.length === 0) {
      sugBox.style.display = 'none';
      return;
    }

    sugBox.innerHTML = matches.map(k => {
      const s = data.skills[k];
      const valid = s.installs.filter(v => v != null);
      const latest = valid.length ? valid[valid.length - 1] : 0;
      return `<div data-key="${esc(k)}">
        <span class="sg-name">${esc(s.owner)}/${esc(s.name)}</span>
        <span class="sg-meta">${fmt(latest)} installs</span>
      </div>`;
    }).join('');
    sugBox.style.display = 'block';
  });

  sugBox.addEventListener('click', (e) => {
    const row = e.target.closest('[data-key]');
    if (!row) return;
    const key = row.dataset.key;
    input.value = data.skills[key].owner + '/' + data.skills[key].name;
    sugBox.style.display = 'none';
    showSkillDetail(data, key);
  });

  // Close suggestions on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
      sugBox.style.display = 'none';
    }
  });
}

function showSkillDetail(data, key) {
  const skill = data.skills[key];
  if (!skill) return;

  const container = document.getElementById('skill-detail');
  container.style.display = 'block';

  document.getElementById('skill-detail-title').textContent = `${skill.owner}/${skill.name} — Install History`;

  const labels = data.dates.map(d => d.slice(5));

  if (_skillChart) _skillChart.destroy();

  _skillChart = new Chart(document.getElementById('chart-skill-detail'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Installs',
        data: skill.installs,
        borderColor: CHART_COLORS.purple,
        backgroundColor: CHART_COLORS.purple + '22',
        fill: true,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        spanGaps: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.raw != null ? `${fmt(ctx.raw)} installs` : 'Not in snapshot',
          }
        }
      },
      scales: {
        x: {
          ticks: { color: CHART_DEFAULTS.color },
          grid: { color: CHART_DEFAULTS.borderColor },
        },
        y: {
          ticks: { color: CHART_DEFAULTS.color, callback: v => fmt(v) },
          grid: { color: CHART_DEFAULTS.borderColor },
          beginAtZero: false,
        }
      }
    }
  });
}

async function init() {
  try {
    _data = await loadTimeseries();

    const lastDate = _data.dates[_data.dates.length - 1];
    document.getElementById('data-date').textContent = `latest: ${lastDate}`;

    renderHeroStats(_data);
    renderEarlyNotice(_data);
    buildEcosystemCharts(_data);
    buildMoversTable(_data, 'total');
    setupPeriodToggle(_data);
    setupSkillSearch(_data);

    document.getElementById('loading').style.display = 'none';
  } catch (err) {
    document.getElementById('loading').textContent = `Error: ${err.message}`;
  }
}

init();
