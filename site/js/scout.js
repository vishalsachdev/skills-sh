import { loadLatestSnapshot, enrichSkills, getUniqueLanguages, getPublisherStats } from './data.js';

let allSkills = [];
let sortCol = 'installs';
let sortDir = 'desc';

function fmt(n) {
  return n == null ? '—' : n.toLocaleString();
}

function renderTable(skills) {
  const tbody = document.getElementById('skills-body');
  tbody.innerHTML = skills.map(s => {
    const gh = s.github || {};
    const hCls = s._healthScore >= 60 ? 'health-high' : s._healthScore >= 35 ? 'health-mid' : 'health-low';
    return `<tr>
      <td><strong>${esc(s.name)}</strong></td>
      <td><a href="https://github.com/${esc(s.source)}" target="_blank" rel="noopener">${esc(s.source)}</a></td>
      <td class="num">${fmt(s.installs)}</td>
      <td class="num">${fmt(gh.stars)}</td>
      <td>${esc(gh.language || '—')}</td>
      <td class="num"><span class="health-score ${hCls}">${s._healthScore}</span></td>
      <td><span class="badge ${s._freshness.cls}">${s._freshness.label}</span></td>
    </tr>`;
  }).join('');

  document.getElementById('result-count').textContent = `${skills.length} skills`;
}

function esc(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function getFiltered() {
  const q = document.getElementById('search').value.toLowerCase();
  const lang = document.getElementById('filter-lang').value;
  const fresh = document.getElementById('filter-freshness').value;
  const minInstalls = document.getElementById('filter-min-installs').checked;

  let filtered = allSkills.filter(s => {
    if (q) {
      const hay = `${s.name} ${s.owner} ${s.source} ${(s.github||{}).description||''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (lang && (s.github || {}).language !== lang) return false;
    if (fresh && s._freshness.label !== fresh) return false;
    if (minInstalls && s.installs < 10) return false;
    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    let va, vb;
    switch (sortCol) {
      case 'name': va = a.name.toLowerCase(); vb = b.name.toLowerCase(); break;
      case 'source': va = a.source.toLowerCase(); vb = b.source.toLowerCase(); break;
      case 'installs': va = a.installs || 0; vb = b.installs || 0; break;
      case 'stars': va = (a.github||{}).stars||0; vb = (b.github||{}).stars||0; break;
      case 'language': va = ((a.github||{}).language||'').toLowerCase(); vb = ((b.github||{}).language||'').toLowerCase(); break;
      case 'health': va = a._healthScore; vb = b._healthScore; break;
      case 'freshness': va = a._pushDays; vb = b._pushDays; break;
      default: va = 0; vb = 0;
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return filtered;
}

function updateSort(col) {
  if (sortCol === col) {
    sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    sortCol = col;
    sortDir = ['name', 'source', 'language'].includes(col) ? 'asc' : 'desc';
  }

  // Update header classes
  document.querySelectorAll('#skills-table thead th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.col === sortCol) {
      th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    }
  });

  renderTable(getFiltered());
}

async function init() {
  try {
    const snapshot = await loadLatestSnapshot();
    allSkills = enrichSkills(snapshot);

    // Hero stats
    const publishers = new Set(allSkills.map(s => s.owner));
    const active = allSkills.filter(s => s._freshness.label === 'Active').length;
    const totalInstalls = allSkills.reduce((sum, s) => sum + (s.installs || 0), 0);

    document.getElementById('stat-skills').textContent = fmt(allSkills.length);
    document.getElementById('stat-installs').textContent = fmt(totalInstalls);
    document.getElementById('stat-publishers').textContent = fmt(publishers.size);
    document.getElementById('stat-active').textContent = fmt(active);
    document.getElementById('data-date').textContent = `snapshot: ${snapshot.date}`;

    // Language filter
    const langSelect = document.getElementById('filter-lang');
    for (const lang of getUniqueLanguages(allSkills)) {
      const opt = document.createElement('option');
      opt.value = lang;
      opt.textContent = lang;
      langSelect.appendChild(opt);
    }

    // Initial sort indicator
    document.querySelector(`th[data-col="${sortCol}"]`).classList.add('sort-desc');

    // Render
    renderTable(getFiltered());
    document.getElementById('loading').style.display = 'none';

    // Event listeners
    document.getElementById('search').addEventListener('input', () => renderTable(getFiltered()));
    document.getElementById('filter-lang').addEventListener('change', () => renderTable(getFiltered()));
    document.getElementById('filter-freshness').addEventListener('change', () => renderTable(getFiltered()));
    document.getElementById('filter-min-installs').addEventListener('change', () => renderTable(getFiltered()));

    document.querySelectorAll('#skills-table thead th.sortable').forEach(th => {
      th.addEventListener('click', () => updateSort(th.dataset.col));
    });

  } catch (err) {
    document.getElementById('loading').textContent = `Error: ${err.message}`;
  }
}

init();
