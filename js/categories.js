import { loadCategories } from './data.js';

const COLORS = [
  '#b45309', '#1d4ed8', '#15803d', '#dc2626', '#7c3aed',
  '#0d9488', '#db2777', '#ea580c', '#4338ca', '#0369a1',
  '#a16207', '#6d28d9'
];

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
 * Group skills by category and compute aggregate stats.
 * Returns sorted array: [{ category, count, installs, skills[] }]
 */
function groupByCategory(data) {
  const map = {};
  for (const item of data.categories) {
    const cat = item.category;
    if (!map[cat]) {
      map[cat] = { category: cat, count: 0, installs: 0, skills: [] };
    }
    map[cat].count++;
    map[cat].installs += item.installs || 0;
    map[cat].skills.push(item);
  }

  // Sort skills within each category by installs descending
  for (const group of Object.values(map)) {
    group.skills.sort((a, b) => (b.installs || 0) - (a.installs || 0));
  }

  // Sort categories by total installs descending
  return Object.values(map).sort((a, b) => b.installs - a.installs);
}

function renderHeroStats(data, sorted) {
  document.getElementById('stat-categories').textContent = sorted.length;
  document.getElementById('stat-largest').textContent = sorted[0] ? sorted[0].category : '—';
  document.getElementById('stat-classified').textContent = fmt(data.total_classified);
}

function renderBarChart(sorted) {
  const labels = sorted.map(g => g.category);
  const values = sorted.map(g => g.installs);
  const bgColors = sorted.map((_, i) => COLORS[i % COLORS.length]);

  new Chart(document.getElementById('chart-category-dist'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total Installs',
        data: values,
        backgroundColor: bgColors,
        borderColor: bgColors,
        borderWidth: 1,
      }]
    },
    options: {
      indexAxis: 'y',
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
          ticks: { color: CHART_DEFAULTS.color, callback: v => fmt(v) },
          grid: { color: CHART_DEFAULTS.borderColor },
        },
        y: {
          ticks: { color: CHART_DEFAULTS.color, font: { size: 11 } },
          grid: { display: false },
        }
      }
    }
  });
}

function renderTable(sorted) {
  const tbody = document.getElementById('cat-body');
  tbody.innerHTML = sorted.map(g => {
    const top3 = g.skills.slice(0, 3).map(s => esc(s.name)).join(', ');
    return `<tr>
      <td><strong>${esc(g.category)}</strong></td>
      <td class="num">${fmt(g.count)}</td>
      <td class="num">${fmt(g.installs)}</td>
      <td>${top3}</td>
    </tr>`;
  }).join('');
}

async function init() {
  try {
    const data = await loadCategories();

    if (data.date) {
      document.getElementById('data-date').textContent = `classified: ${data.date}`;
    }

    const sorted = groupByCategory(data);

    renderHeroStats(data, sorted);
    renderBarChart(sorted);
    renderTable(sorted);

    document.getElementById('loading').style.display = 'none';
  } catch (err) {
    document.getElementById('loading').textContent = `Error: ${err.message}`;
  }
}

init();
