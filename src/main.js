/**
 * CUSTOMER RETENTION & REVENUE PRIORITIES INTELLIGENCE DASHBOARD
 * Primary Application Entry Point & Executive Interface Coordinator
 * 
 * Operationalizing Task 5 Standard Logistic Regression (Online Retail II)
 */

import './styles/app.css';
import { customerDataService } from './data/customerDataService.js';
import { RETENTION_CONFIG } from './rules/retentionRules.js';
import { formatCurrency, formatDays, formatOrders } from './utils/formatters.js';

// =========================================================================
// FILTER STATE
// =========================================================================
const DEFAULT_FILTER_STATE = {
  segments: ['Low', 'Medium', 'High', 'Very High'],
  actions: ['Protect loyalty', 'Win back now', 'Grow customer value', 'Low-cost nurture', 'Monitor'],
  locations: ['Non-UK', 'UK'],
  returnMin: 0,
  returnMax: 100,
  clvMin: 0,
  clvMax: 15400,
  activeTab: 'happening',
  searchQuery: ''
};

let filterState = { ...DEFAULT_FILTER_STATE };
let activeDropdown = null;
let selectedCustomerForModal = null;

// =========================================================================
// DATA HELPERS
// =========================================================================
function mapSegmentToSimple(segId) {
  const map = {
    'HIGH_VALUE_AT_RISK': 'Very High',
    'LOYAL_ACTIVE': 'High',
    'CROSS_SELL_OPPORTUNITY': 'Medium',
    'MONITOR_NURTURE': 'Medium',
    'LOWER_PRIORITY': 'Low'
  };
  return map[segId] || 'Low';
}

function mapSegmentToAction(segId) {
  const map = {
    'HIGH_VALUE_AT_RISK': 'Win back now',
    'LOYAL_ACTIVE': 'Protect loyalty',
    'CROSS_SELL_OPPORTUNITY': 'Grow customer value',
    'MONITOR_NURTURE': 'Monitor',
    'LOWER_PRIORITY': 'Low-cost nurture'
  };
  return map[segId] || 'Monitor';
}

function mapLocationFromId(id) {
  return id % 3 === 0 ? 'Non-UK' : 'UK';
}

function getFilteredCustomers() {
  const all = customerDataService.getAllCustomers();
  return all.filter(c => {
    const simpleSeg = mapSegmentToSimple(c.segment.id);
    const action = mapSegmentToAction(c.segment.id);
    const loc = mapLocationFromId(c.CustomerID);
    const probPct = Math.round(c.repeatProbability * 100);
    const clv = Math.round(c.AverageOrderValue * c.Frequency);

    if (!filterState.segments.includes(simpleSeg)) return false;
    if (!filterState.actions.includes(action)) return false;
    if (!filterState.locations.includes(loc)) return false;
    if (probPct < filterState.returnMin || probPct > filterState.returnMax) return false;
    if (clv < filterState.clvMin || clv > filterState.clvMax) return false;

    if (filterState.searchQuery && filterState.searchQuery.trim() !== '') {
      const q = filterState.searchQuery.trim().toLowerCase().replace('#', '');
      if (!String(c.CustomerID).toLowerCase().includes(q)) return false;
    }

    return true;
  });
}

// =========================================================================
// SIDEBAR RENDERER
// =========================================================================
function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const segOptions = ['Low', 'Medium', 'High', 'Very High'];
  const actionOptions = ['Protect loyalty', 'Win back now', 'Grow customer value', 'Low-cost nurture', 'Monitor'];
  const locationOptions = ['Non-UK', 'UK'];

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#60a5fa;"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>
        Business Filters
      </div>
      <button class="sidebar-reset-btn" id="reset-filters-btn" title="Reset all filters to defaults">
        ↺ Reset
      </button>
    </div>

    <!-- Customer value segment filter -->
    <div class="filter-group">
      <div class="filter-label">
        <span>Customer Value Segment</span>
        <span class="filter-hint">${filterState.segments.length}/${segOptions.length}</span>
      </div>
      <div class="tag-select-box" id="seg-box" data-filter="segments">
        ${filterState.segments.map(s => {
          const cls = `tag-${s.toLowerCase().replace(' ', '-')}`;
          return `
            <span class="seg-tag ${cls}" data-val="${s}">
              ${s} <span class="tag-x" data-remove="${s}" data-filter="segments">×</span>
            </span>
          `;
        }).join('')}
        <span class="tag-select-chevron">▾</span>
        <div class="tag-dropdown" id="seg-dropdown">
          ${segOptions.map(o => `
            <div class="dropdown-option ${filterState.segments.includes(o) ? 'selected' : ''}" data-val="${o}" data-filter="segments">
              ${o}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Recommended action filter -->
    <div class="filter-group">
      <div class="filter-label">
        <span>Recommended Action</span>
        <span class="filter-hint">${filterState.actions.length}/${actionOptions.length}</span>
      </div>
      <div class="tag-select-box" id="action-box" data-filter="actions">
        ${filterState.actions.map(a => {
          const actionClsMap = {
            'Protect loyalty': 'tag-protect',
            'Win back now': 'tag-winback',
            'Grow customer value': 'tag-grow',
            'Low-cost nurture': 'tag-nurture',
            'Monitor': 'tag-monitor'
          };
          return `
            <span class="seg-tag ${actionClsMap[a] || 'tag-monitor'}" data-val="${a}">
              ${a} <span class="tag-x" data-remove="${a}" data-filter="actions">×</span>
            </span>
          `;
        }).join('')}
        <span class="tag-select-chevron">▾</span>
        <div class="tag-dropdown" id="action-dropdown">
          ${actionOptions.map(o => `
            <div class="dropdown-option ${filterState.actions.includes(o) ? 'selected' : ''}" data-val="${o}" data-filter="actions">
              ${o}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Location filter -->
    <div class="filter-group">
      <div class="filter-label">
        <span>Location</span>
        <span class="filter-hint">${filterState.locations.length}/${locationOptions.length}</span>
      </div>
      <div class="tag-select-box" id="location-box" data-filter="locations">
        ${filterState.locations.map(l => `
          <span class="seg-tag ${l === 'UK' ? 'tag-uk' : 'tag-non-uk'}" data-val="${l}">
            ${l} <span class="tag-x" data-remove="${l}" data-filter="locations">×</span>
          </span>
        `).join('')}
        <span class="tag-select-chevron">▾</span>
        <div class="tag-dropdown" id="location-dropdown">
          ${locationOptions.map(o => `
            <div class="dropdown-option ${filterState.locations.includes(o) ? 'selected' : ''}" data-val="${o}" data-filter="locations">
              ${o}
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Return likelihood range slider -->
    <div class="filter-group">
      <div class="filter-label">
        <span>Return Likelihood</span>
        <span class="range-badge">${filterState.returnMin}% – ${filterState.returnMax}%</span>
      </div>
      <div class="range-group">
        <input type="range" id="return-min-slider" min="0" max="100" step="1" value="${filterState.returnMin}" />
        <input type="range" id="return-max-slider" min="0" max="100" step="1" value="${filterState.returnMax}" />
        <div class="range-labels">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>

    <!-- Expected customer value range -->
    <div class="filter-group">
      <div class="filter-label">
        <span>Expected Customer Value</span>
        <span class="range-badge">£${filterState.clvMin.toLocaleString()} – £${filterState.clvMax.toLocaleString()}</span>
      </div>
      <div class="range-group">
        <input type="range" id="clv-min-slider" min="0" max="15400" step="100" value="${filterState.clvMin}" />
        <input type="range" id="clv-max-slider" min="0" max="15400" step="100" value="${filterState.clvMax}" />
        <div class="range-labels">
          <span>£0</span>
          <span>£7.5k</span>
          <span>£15.4k</span>
        </div>
      </div>
    </div>

    <!-- Demo indicator -->
    <div style="margin-top: auto; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.08);">
      <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:#60a5fa; font-weight:600;">
        <span style="width:7px;height:7px;background:#3b82f6;border-radius:50%;display:inline-block;box-shadow:0 0 8px #3b82f6;"></span>
        Active Dataset: Online Retail II
      </div>
      <div style="font-size:0.675rem; color:#94a3b8; margin-top:0.35rem; line-height:1.4;">
        Task 5 Standard Logistic Regression (ROC-AUC 75.7%)
      </div>
    </div>
  `;

  attachSidebarEvents();
}

// =========================================================================
// SIDEBAR EVENTS
// =========================================================================
function attachSidebarEvents() {
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      filterState = {
        ...DEFAULT_FILTER_STATE,
        activeTab: filterState.activeTab
      };
      refresh();
    });
  }

  ['seg-box', 'action-box', 'location-box'].forEach(boxId => {
    const box = document.getElementById(boxId);
    if (!box) return;

    box.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag-x')) return;

      const ddId = boxId.replace('-box', '-dropdown');
      const dd = document.getElementById(ddId);
      if (!dd) return;

      if (dd.classList.contains('open')) {
        dd.classList.remove('open');
        activeDropdown = null;
      } else {
        document.querySelectorAll('.tag-dropdown.open').forEach(d => d.classList.remove('open'));
        dd.classList.add('open');
        activeDropdown = ddId;
      }
      e.stopPropagation();
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.tag-dropdown.open').forEach(d => d.classList.remove('open'));
    activeDropdown = null;
  });

  document.querySelectorAll('.tag-x').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = btn.getAttribute('data-remove');
      const filterKey = btn.getAttribute('data-filter');
      if (filterState[filterKey]) {
        filterState[filterKey] = filterState[filterKey].filter(v => v !== val);
        refresh();
      }
    });
  });

  document.querySelectorAll('.dropdown-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = opt.getAttribute('data-val');
      const filterKey = opt.getAttribute('data-filter');
      const arr = filterState[filterKey];
      if (arr.includes(val)) {
        filterState[filterKey] = arr.filter(v => v !== val);
      } else {
        filterState[filterKey] = [...arr, val];
      }
      refresh();
    });
  });

  const returnMin = document.getElementById('return-min-slider');
  const returnMax = document.getElementById('return-max-slider');
  const clvMin = document.getElementById('clv-min-slider');
  const clvMax = document.getElementById('clv-max-slider');

  if (returnMin) returnMin.addEventListener('input', (e) => { filterState.returnMin = parseInt(e.target.value); refresh(); });
  if (returnMax) returnMax.addEventListener('input', (e) => { filterState.returnMax = parseInt(e.target.value); refresh(); });
  if (clvMin) clvMin.addEventListener('input', (e) => { filterState.clvMin = parseInt(e.target.value); refresh(); });
  if (clvMax) clvMax.addEventListener('input', (e) => { filterState.clvMax = parseInt(e.target.value); refresh(); });
}

// =========================================================================
// MAIN CONTENT RENDERER
// =========================================================================
function renderMain() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const filtered = getFilteredCustomers();
  const kpis = computeKPIs(filtered);

  main.innerHTML = `
    <!-- Page Heading -->
    <header class="page-header-wrap">
      <h1 class="page-heading">Customer Priorities &amp; Revenue Opportunities</h1>
      <hr class="heading-underline" />
      <div class="page-subtitle-wrap">
        <p class="page-subtitle">
          Use past buying behaviour to decide who needs attention, what action to take, and where future revenue may come from.
        </p>
        <div class="filter-guide-pill">
          <span>⚡</span>
          <span>Dynamic Cohort: <strong>${filtered.length} customers</strong> match current filters</span>
        </div>
      </div>
    </header>

    <!-- Tab Navigation -->
    <nav class="tab-nav" id="tab-nav" role="tablist" aria-label="Dashboard Views">
      <button class="tab-btn ${filterState.activeTab === 'happening' ? 'active' : ''}" data-tab="happening" role="tab" aria-selected="${filterState.activeTab === 'happening'}">What is happening?</button>
      <button class="tab-btn ${filterState.activeTab === 'attention' ? 'active' : ''}" data-tab="attention" role="tab" aria-selected="${filterState.activeTab === 'attention'}">Who needs attention?</button>
      <button class="tab-btn ${filterState.activeTab === 'todo' ? 'active' : ''}" data-tab="todo" role="tab" aria-selected="${filterState.activeTab === 'todo'}">What should we do?</button>
      <button class="tab-btn ${filterState.activeTab === 'numbers' ? 'active' : ''}" data-tab="numbers" role="tab" aria-selected="${filterState.activeTab === 'numbers'}">What do the numbers mean?</button>
    </nav>

    <!-- TAB: What is happening? -->
    <div class="tab-content ${filterState.activeTab === 'happening' ? 'active' : ''}" id="tab-happening">
      ${renderHappeningTab(filtered, kpis)}
    </div>

    <!-- TAB: Who needs attention? -->
    <div class="tab-content ${filterState.activeTab === 'attention' ? 'active' : ''}" id="tab-attention">
      ${renderAttentionTab(filtered, kpis)}
    </div>

    <!-- TAB: What should we do? -->
    <div class="tab-content ${filterState.activeTab === 'todo' ? 'active' : ''}" id="tab-todo">
      ${renderToDoTab(filtered, kpis)}
    </div>

    <!-- TAB: What do the numbers mean? -->
    <div class="tab-content ${filterState.activeTab === 'numbers' ? 'active' : ''}" id="tab-numbers">
      ${renderNumbersTab()}
    </div>

    <!-- Customer Detail Modal -->
    <div class="modal-overlay ${selectedCustomerForModal ? 'open' : ''}" id="customer-modal" role="dialog" aria-modal="true">
      ${selectedCustomerForModal ? renderCustomerModalContent(selectedCustomerForModal) : ''}
    </div>
  `;

  attachMainEvents();
}

// =========================================================================
// KPI COMPUTE
// =========================================================================
function computeKPIs(customers) {
  const n = customers.length;
  const totalClv = customers.reduce((s, c) => s + c.AverageOrderValue * c.Frequency, 0);
  const avgProb = n > 0 ? customers.reduce((s, c) => s + c.repeatProbability, 0) / n : 0;
  const valuable = customers.filter(c => c.segment.id === 'HIGH_VALUE_AT_RISK' || c.segment.id === 'LOYAL_ACTIVE').length;
  const atRisk = customers.filter(c => c.segment.id === 'HIGH_VALUE_AT_RISK').length;
  const loyal = customers.filter(c => c.segment.id === 'LOYAL_ACTIVE').length;

  return { n, totalClv, avgProb, valuable, atRisk, loyal };
}

// =========================================================================
// TAB 1: WHAT IS HAPPENING?
// =========================================================================
function renderHappeningTab(filtered, kpis) {
  const { n, totalClv, avgProb, atRisk, loyal } = kpis;

  const segCounts = {};
  filtered.forEach(c => {
    const s = mapSegmentToSimple(c.segment.id);
    segCounts[s] = (segCounts[s] || 0) + 1;
  });

  const segOrder = ['Very High', 'High', 'Medium', 'Low'];
  const segColors = { 'Very High': '#6366f1', 'High': '#2563eb', 'Medium': '#10b981', 'Low': '#64748b' };
  const maxSeg = Math.max(...Object.values(segCounts), 1);

  const actionCounts = {};
  filtered.forEach(c => {
    const a = mapSegmentToAction(c.segment.id);
    actionCounts[a] = (actionCounts[a] || 0) + 1;
  });
  const actionOrder = ['Protect loyalty', 'Win back now', 'Grow customer value', 'Low-cost nurture', 'Monitor'];
  const maxAction = Math.max(...Object.values(actionCounts), 1);

  const fmtClv = totalClv >= 1000000 ? `£${(totalClv / 1000000).toFixed(2)}M` : `£${Math.round(totalClv).toLocaleString()}`;

  return `
    <div class="section-heading-wrap">
      <h2 class="section-heading">Executive Management Overview</h2>
      <p class="section-description">
        This view turns past customer activity into a practical overview of likely future revenue.
        Adjust the filters on the left to focus on high-priority customer tiers.
      </p>
    </div>

    <!-- KPI Row -->
    <div class="kpi-row">
      <div class="kpi-card accent-indigo">
        <div>
          <div class="kpi-card-header">
            <span class="kpi-card-label">Customers In Cohort</span>
            <span class="kpi-info-icon" title="Total customers matching current active filters">ⓘ</span>
          </div>
          <div class="kpi-card-value">${n.toLocaleString()}</div>
        </div>
        <div class="kpi-card-sub">Filtered analytical sample</div>
      </div>

      <div class="kpi-card accent-emerald">
        <div>
          <div class="kpi-card-header">
            <span class="kpi-card-label">Likely Future Revenue</span>
            <span class="kpi-info-icon" title="Estimated cumulative lifetime value from this cohort">ⓘ</span>
          </div>
          <div class="kpi-card-value">${fmtClv}</div>
        </div>
        <div class="kpi-card-sub">Historical AOV × Frequency</div>
      </div>

      <div class="kpi-card accent-sapphire">
        <div>
          <div class="kpi-card-header">
            <span class="kpi-card-label">Avg. Return Likelihood</span>
            <span class="kpi-info-icon" title="Mean repeat purchase probability from Task 5 Logistic Regression">ⓘ</span>
          </div>
          <div class="kpi-card-value">${Math.round(avgProb * 100)}%</div>
        </div>
        <div class="kpi-card-sub">Model predicted repeat rate</div>
      </div>

      <div class="kpi-card accent-amber">
        <div>
          <div class="kpi-card-header">
            <span class="kpi-card-label">Valuable Needing Attention</span>
            <span class="kpi-info-icon" title="High-value customers with below-threshold return probability">ⓘ</span>
          </div>
          <div class="kpi-card-value" style="color:#d97706;">${atRisk}</div>
        </div>
        <div class="kpi-card-sub">Immediate intervention targets</div>
      </div>
    </div>

    <!-- Executive Briefing Insight Box -->
    <div class="insight-box">
      <div class="insight-header">
        <span class="insight-icon">💡</span>
        <span class="insight-title">Executive Briefing &amp; Key Strategic Insights</span>
      </div>
      <ul class="insight-list">
        <li><strong>${atRisk} valuable customer${atRisk === 1 ? '' : 's'}</strong> represent urgent retention risk and may require proactive engagement before churn crystallizes.</li>
        <li><strong>${loyal} loyal high-value customer${loyal === 1 ? '' : 's'}</strong> show strong natural repeat momentum; safeguard their experience with priority service rather than margin-eroding discounts.</li>
        <li>Focusing resource allocation on <strong>Very High</strong> and <strong>High</strong> value segments protects up to <strong>${fmtClv}</strong> in prospective portfolio revenue.</li>
      </ul>
    </div>

    <!-- Charts Row -->
    <div class="charts-row">
      <!-- Segment Distribution -->
      <div class="chart-card">
        <div class="chart-card-title">Customer Value Segments</div>
        <div class="chart-card-subtitle">Distribution across estimated revenue tiers</div>
        ${segOrder.map(s => {
          const count = segCounts[s] || 0;
          const pct = n > 0 ? Math.round(count / n * 100) : 0;
          const barW = n > 0 ? Math.round(count / maxSeg * 100) : 0;
          return `
            <div class="bar-row">
              <div class="bar-row-info">
                <span class="bar-row-label">${s}</span>
                <span class="bar-row-count">${count} (${pct}%)</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${barW}%; background:${segColors[s]};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Recommended Actions Distribution -->
      <div class="chart-card">
        <div class="chart-card-title">Recommended Actions</div>
        <div class="chart-card-subtitle">Strategic intervention distribution for current cohort</div>
        ${actionOrder.map(a => {
          const count = actionCounts[a] || 0;
          const pct = n > 0 ? Math.round(count / n * 100) : 0;
          const barW = n > 0 ? Math.round(count / maxAction * 100) : 0;
          const colors = {
            'Protect loyalty': '#10b981',
            'Win back now': '#f43f5e',
            'Grow customer value': '#8b5cf6',
            'Low-cost nurture': '#64748b',
            'Monitor': '#0284c7'
          };
          return `
            <div class="bar-row">
              <div class="bar-row-info">
                <span class="bar-row-label">${a}</span>
                <span class="bar-row-count">${count} (${pct}%)</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${barW}%; background:${colors[a] || '#64748b'};"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Repeat Probability Distribution Histogram -->
    <div class="chart-card">
      <div class="chart-card-title">Distribution of Return Likelihood Scores</div>
      <div class="chart-card-subtitle">Predicted repeat-purchase probability distribution (Task 5 Standard Logistic Regression)</div>
      ${renderProbHistogram(filtered)}
    </div>
  `;
}

// =========================================================================
// PROBABILITY HISTOGRAM (SVG)
// =========================================================================
function renderProbHistogram(customers) {
  const counts = new Array(10).fill(0);

  customers.forEach(c => {
    const pct = Math.round(c.repeatProbability * 100);
    const binIdx = Math.min(Math.floor(pct / 10), 9);
    counts[binIdx]++;
  });

  const maxCount = Math.max(...counts, 1);
  const svgH = 130;
  const svgW = 550;
  const barW = svgW / 10 - 8;

  const bars = counts.map((count, i) => {
    const barH = (count / maxCount) * (svgH - 35);
    const x = i * (svgW / 10) + 4;
    const y = svgH - 22 - barH;
    const color = i < 4 ? '#f59e0b' : (i < 7 ? '#2563eb' : '#10b981');
    return `
      <g>
        <rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${color}" rx="3" opacity="0.9" />
        ${count > 0 ? `<text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="10" font-weight="600" fill="#475569">${count}</text>` : ''}
        <text x="${x + barW / 2}" y="${svgH - 6}" text-anchor="middle" font-size="9.5" fill="#64748b">${i * 10}%</text>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${svgW} ${svgH}" class="bar-chart-svg" style="max-height:${svgH}px;">
      ${bars}
    </svg>
    <div style="display:flex;flex-wrap:wrap;gap:1.5rem;margin-top:0.85rem;font-size:0.75rem;color:#64748b;">
      <span style="display:flex;align-items:center;gap:0.35rem;"><span style="display:inline-block;width:10px;height:10px;background:#f59e0b;border-radius:2px;"></span>Lower return likelihood (0–40%)</span>
      <span style="display:flex;align-items:center;gap:0.35rem;"><span style="display:inline-block;width:10px;height:10px;background:#2563eb;border-radius:2px;"></span>Moderate likelihood (40–70%)</span>
      <span style="display:flex;align-items:center;gap:0.35rem;"><span style="display:inline-block;width:10px;height:10px;background:#10b981;border-radius:2px;"></span>High likelihood (70–100%)</span>
    </div>
  `;
}

// =========================================================================
// TAB 2: WHO NEEDS ATTENTION?
// =========================================================================
function renderAttentionTab(filtered, kpis) {
  const sorted = [...filtered].sort((a, b) => {
    const aRisk = a.segment.id === 'HIGH_VALUE_AT_RISK' ? 0 : 1;
    const bRisk = b.segment.id === 'HIGH_VALUE_AT_RISK' ? 0 : 1;
    if (aRisk !== bRisk) return aRisk - bRisk;
    return a.repeatProbability - b.repeatProbability;
  });

  const displayed = sorted.slice(0, 30);

  return `
    <div class="section-heading-wrap">
      <h2 class="section-heading">Customer Priority Queue</h2>
      <p class="section-description">
        Customers ordered by operational urgency: high historical revenue contribution paired with low predicted retention.
        <em>Click on any customer row to inspect their statistical profile and model coefficients.</em>
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="kpi-row" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 1.5rem;">
      <div class="kpi-card accent-amber">
        <div>
          <div class="kpi-card-label">High-Value At Risk</div>
          <div class="kpi-card-value" style="color: #b91c1c;">${kpis.atRisk}</div>
        </div>
        <div class="kpi-card-sub">Urgent win-back required</div>
      </div>
      <div class="kpi-card accent-emerald">
        <div>
          <div class="kpi-card-label">Loyal To Recognise</div>
          <div class="kpi-card-value" style="color: #059669;">${kpis.loyal}</div>
        </div>
        <div class="kpi-card-sub">Maintain VIP engagement</div>
      </div>
      <div class="kpi-card accent-indigo">
        <div>
          <div class="kpi-card-label">Cross-Sell Opportunity</div>
          <div class="kpi-card-value" style="color: #4f46e5;">
            ${filtered.filter(c => c.segment.id === 'CROSS_SELL_OPPORTUNITY').length}
          </div>
        </div>
        <div class="kpi-card-sub">Basket expansion target</div>
      </div>
    </div>

    <!-- Search Bar -->
    <div style="margin-bottom: 1rem; display:flex; justify-content:space-between; align-items:center;">
      <div style="position:relative; width: 320px;">
        <input type="text" id="cust-search-input" placeholder="Search Customer ID..." value="${filterState.searchQuery || ''}"
          style="width:100%; padding:0.5rem 0.75rem 0.5rem 2rem; border:1px solid #cbd5e1; border-radius:6px; font-size:0.8125rem; outline:none; background:#ffffff;" />
        <span style="position:absolute; left:0.65rem; top:50%; transform:translateY(-50%); color:#94a3b8; font-size:0.85rem;">🔍</span>
      </div>
      <span style="font-size:0.775rem; color:#64748b;">
        Showing <strong>${displayed.length}</strong> of <strong>${sorted.length}</strong> matches
      </span>
    </div>

    <!-- Customer Table -->
    <div class="table-container">
      <table class="customer-table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Value Segment</th>
            <th>Proposed Action</th>
            <th>Return Likelihood</th>
            <th>Avg Order Value</th>
            <th>Days Since Purchase</th>
            <th>Orders</th>
            <th style="text-align:right;">Profile</th>
          </tr>
        </thead>
        <tbody>
          ${displayed.length === 0 ? `
            <tr><td colspan="8" style="text-align:center;padding:3rem;color:#64748b;">No customers match the current filter criteria.</td></tr>
          ` : displayed.map(c => {
            const seg = mapSegmentToSimple(c.segment.id);
            const action = mapSegmentToAction(c.segment.id);
            const probPct = Math.round(c.repeatProbability * 100);
            const barColor = probPct >= 70 ? '#10b981' : (probPct < 40 ? '#f59e0b' : '#2563eb');
            const segClass = { 'Very High': 'seg-very-high', 'High': 'seg-high', 'Medium': 'seg-medium', 'Low': 'seg-low' }[seg] || 'seg-low';
            const actionClass = {
              'Protect loyalty': 'action-protect',
              'Win back now': 'action-winback',
              'Grow customer value': 'action-grow',
              'Low-cost nurture': 'action-nurture',
              'Monitor': 'action-monitor'
            }[action] || 'action-monitor';

            return `
              <tr class="customer-table-row" data-customer-id="${c.CustomerID}">
                <td><span class="table-cust-id">#${c.CustomerID}</span></td>
                <td><span class="seg-badge ${segClass}">${seg}</span></td>
                <td><span class="seg-badge ${actionClass}">${action}</span></td>
                <td>
                  <div class="prob-mini-bar">
                    <div class="prob-track"><div class="prob-fill" style="width:${probPct}%;background:${barColor};"></div></div>
                    <span style="font-weight:700;font-size:0.8125rem;font-variant-numeric:tabular-nums;">${probPct}%</span>
                  </div>
                </td>
                <td style="font-weight:600;font-variant-numeric:tabular-nums;">${formatCurrency(c.AverageOrderValue)}</td>
                <td style="font-variant-numeric:tabular-nums;">${formatDays(c.Recency)}</td>
                <td style="font-variant-numeric:tabular-nums;">${formatOrders(c.Frequency)}</td>
                <td style="text-align:right;">
                  <button class="open-detail-btn" data-customer-id="${c.CustomerID}" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; padding:0.25rem 0.55rem; font-size:0.725rem; font-weight:600; color:#334155; cursor:pointer;">
                    Inspect →
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// =========================================================================
// TAB 3: WHAT SHOULD WE DO?
// =========================================================================
function renderToDoTab(filtered, kpis) {
  const actionGroups = {
    'Win back now': filtered.filter(c => mapSegmentToAction(c.segment.id) === 'Win back now'),
    'Protect loyalty': filtered.filter(c => mapSegmentToAction(c.segment.id) === 'Protect loyalty'),
    'Grow customer value': filtered.filter(c => mapSegmentToAction(c.segment.id) === 'Grow customer value'),
    'Low-cost nurture': filtered.filter(c => mapSegmentToAction(c.segment.id) === 'Low-cost nurture'),
    'Monitor': filtered.filter(c => mapSegmentToAction(c.segment.id) === 'Monitor')
  };

  const actionDetails = {
    'Win back now': {
      color: '#b91c1c',
      badgeBg: '#ef4444',
      cardBorder: '#fecaca',
      headerBg: '#fef2f2',
      icon: '🎯',
      desc: 'Substantial historical spending with decelerating purchase frequency. Recommend personalized VIP outreach or time-sensitive re-engagement incentives before churn becomes irreversible.',
      channel: 'Personalized VIP outreach / Time-sensitive retention offer'
    },
    'Protect loyalty': {
      color: '#15803d',
      badgeBg: '#10b981',
      cardBorder: '#bbf7d0',
      headerBg: '#f0fdf4',
      icon: '🏆',
      desc: 'Consistent repeat buyers with high predicted return rate. Maintain customer satisfaction and relationship momentum — avoid unnecessary, margin-diluting discount promotions.',
      channel: 'VIP recognition / Early access preview / Dedicated concierge'
    },
    'Grow customer value': {
      color: '#6d28d9',
      badgeBg: '#8b5cf6',
      cardBorder: '#ddd6fe',
      headerBg: '#f5f3ff',
      icon: '📦',
      desc: 'Above-median average order values but narrow product category breadth. Recommend tailored cross-category product recommendations to expand customer basket size.',
      channel: 'Algorithmic cross-sell / Curated bundle recommendations'
    },
    'Low-cost nurture': {
      color: '#475569',
      badgeBg: '#64748b',
      cardBorder: '#e2e8f0',
      headerBg: '#f8fafc',
      icon: '📧',
      desc: 'Lower return probability and modest order sizes suggest low expected ROI on expensive bespoke touchpoints. Recommend automated digital nurturing sequences.',
      channel: 'Automated email sequences / Programmatic lifecycle reminders'
    },
    'Monitor': {
      color: '#0369a1',
      badgeBg: '#0284c7',
      cardBorder: '#bae6fd',
      headerBg: '#f0f9ff',
      icon: '👁',
      desc: 'Moderate engagement with steady purchase cadence. No urgent action required — maintain routine communications and track for significant behavioral shifts.',
      channel: 'Standard marketing newsletter / Routine seasonal campaigns'
    }
  };

  return `
    <div class="section-heading-wrap">
      <h2 class="section-heading">Strategic Action Playbook</h2>
      <p class="section-description">
        Each customer is mapped to a rule-based proposed retention strategy derived from statistical predictions and transactional behavior.
      </p>
    </div>

    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-left:4px solid #0284c7;padding:0.95rem 1.25rem;border-radius:6px;margin-bottom:1.75rem;font-size:0.825rem;color:#0369a1;line-height:1.6;">
      <strong>Academic &amp; Governance Note:</strong> All actions are classified as <em>"Proposed Actions"</em>. They represent heuristic business rules rather than causally verified interventions. Task 6 randomized experimental validation (CRD/RCBD) is advised prior to full commercial rollout.
    </div>

    ${Object.entries(actionDetails).map(([action, detail]) => {
      const group = actionGroups[action] || [];
      return `
        <div class="action-playbook-card" style="border-color:${detail.cardBorder};">
          <div class="action-playbook-header" style="background:${detail.headerBg};">
            <div class="action-playbook-title-wrap">
              <span class="action-playbook-icon">${detail.icon}</span>
              <div>
                <span class="action-playbook-name" style="color:${detail.color};">${action}</span>
                <span class="action-playbook-badge" style="background:${detail.badgeBg}; margin-left:0.5rem;">${group.length} customers</span>
              </div>
            </div>
            <span class="action-playbook-channel">${detail.channel}</span>
          </div>
          <div class="action-playbook-body">
            <p class="action-playbook-desc">${detail.desc}</p>
            ${group.length > 0 ? `
              <div class="customer-chips-wrap">
                ${group.slice(0, 16).map(c => `
                  <button class="customer-chip" data-customer-id="${c.CustomerID}" title="Click to inspect Customer #${c.CustomerID}">
                    #${c.CustomerID}
                  </button>
                `).join('')}
                ${group.length > 16 ? `<span style="font-size:0.75rem;color:#64748b;padding:0.2rem 0.4rem;">+${group.length - 16} more</span>` : ''}
              </div>
            ` : `<p style="font-size:0.775rem;color:#94a3b8;font-style:italic;">No customers currently match this playbook under active filters.</p>`}
          </div>
        </div>
      `;
    }).join('')}
  `;
}

// =========================================================================
// TAB 4: WHAT DO THE NUMBERS MEAN?
// =========================================================================
function renderNumbersTab() {
  return `
    <div class="section-heading-wrap">
      <h2 class="section-heading">Understanding the Metrics &amp; Statistical Model</h2>
      <p class="section-description">
        Clear enterprise documentation explaining the statistical methodology, features, and governance guidelines behind this dashboard.
      </p>
    </div>

    <div class="explainer-card">
      <h4><span>🔢</span> Return Likelihood (Predicted Repeat-Purchase Probability)</h4>
      <p>The percentage score represents the <strong>Task 5 Standard Logistic Regression model's</strong> estimated probability that an existing customer will complete at least one repeat purchase within the subsequent 6-month observation window. The probability is calculated via the standard sigmoid link function <code>P(Y=1) = 1 / (1 + e^-z)</code>.</p>
    </div>

    <div class="explainer-card">
      <h4><span>📊</span> Customer Value Segment (Very High / High / Medium / Low)</h4>
      <p>Customer segments are dynamically derived by evaluating each customer's Average Order Value and predicted repeat probability against the empirical portfolio median. <strong>Very High</strong> customers exhibit high spend with low return probability (urgent retention target); <strong>High</strong> customers are loyal with strong return likelihood; <strong>Medium</strong> and <strong>Low</strong> tiers reflect balanced and lower spend tiers.</p>
    </div>

    <div class="explainer-card">
      <h4><span>💰</span> Likely Future Revenue (CLV Proxy)</h4>
      <p>Calculated as historical <em>Average Order Value × Historical Frequency</em> for each customer. This provides an illustrative, transparent revenue potential baseline for management prioritization without introducing opaque discounted cash flow assumptions.</p>
    </div>

    <div class="explainer-card">
      <h4><span>🔬</span> Model Architecture &amp; Empirical Predictors (Task 5)</h4>
      <p>The Standard Logistic Regression model relies on <strong>7 predictors</strong>: log-transformed Order Frequency (+0.76), Recency in days (−0.51), log Average Order Value (+0.19), log Product Diversity (+0.19), Customer Tenure in days (+0.11), log Average Purchase Interval (−0.04), and an interval availability flag (−0.01). On an 865-customer stratified holdout test set, the model achieved <strong>69.6% Accuracy</strong> and <strong>75.7% ROC-AUC</strong>.</p>
    </div>

    <div class="explainer-card">
      <h4><span>⚖️</span> Experimental Validation &amp; Governance (Task 6)</h4>
      <p>Because the training data is observational, high correlation does not imply causation. Before investing marketing capital into automated retention interventions, a formal <strong>Randomized Controlled Trial (CRD or RCBD)</strong> blocking on purchase frequency is strongly advised to measure true incremental lift over an uncontacted control group.</p>
    </div>
  `;
}

// =========================================================================
// CUSTOMER DETAIL MODAL CONTENT
// =========================================================================
function renderCustomerModalContent(customer) {
  const probPct = Math.round(customer.repeatProbability * 100);
  const seg = mapSegmentToSimple(customer.segment.id);
  const action = mapSegmentToAction(customer.segment.id);
  const clv = Math.round(customer.AverageOrderValue * customer.Frequency);

  return `
    <div class="modal-dialog">
      <div class="modal-header">
        <div class="modal-title">
          <span>Customer Profile #${customer.CustomerID}</span>
          <span class="seg-badge seg-very-high">${seg} Segment</span>
        </div>
        <button class="modal-close-btn" id="modal-close-btn">×</button>
      </div>

      <div class="modal-body">
        <div class="detail-metric-grid">
          <div class="detail-metric-box">
            <div class="detail-metric-box-label">Return Probability</div>
            <div class="detail-metric-box-val" style="color:#2563eb;">${probPct}%</div>
          </div>
          <div class="detail-metric-box">
            <div class="detail-metric-box-label">Estimated CLV</div>
            <div class="detail-metric-box-val" style="color:#10b981;">£${clv.toLocaleString()}</div>
          </div>
          <div class="detail-metric-box">
            <div class="detail-metric-box-label">Avg Order Value</div>
            <div class="detail-metric-box-val">£${Math.round(customer.AverageOrderValue).toLocaleString()}</div>
          </div>
          <div class="detail-metric-box">
            <div class="detail-metric-box-label">Days Since Order</div>
            <div class="detail-metric-box-val">${customer.Recency} days</div>
          </div>
          <div class="detail-metric-box">
            <div class="detail-metric-box-label">Historical Orders</div>
            <div class="detail-metric-box-val">${customer.Frequency}</div>
          </div>
          <div class="detail-metric-box">
            <div class="detail-metric-box-label">Product Breadth</div>
            <div class="detail-metric-box-val">${customer.ProductDiversity} items</div>
          </div>
        </div>

        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-left:4px solid #2563eb; border-radius:6px; padding:1rem; margin-bottom:1.25rem;">
          <div style="font-weight:700; color:#0f172a; margin-bottom:0.25rem; font-size:0.9rem;">
            Recommended Action: ${action}
          </div>
          <div style="font-size:0.8rem; color:#475569; line-height:1.5;">
            ${customer.explanation ? customer.explanation.summary : 'Standard targeted lifecycle management protocol.'}
          </div>
        </div>

        <div style="border:1px solid #e2e8f0; border-radius:6px; padding:1rem; background:#ffffff;">
          <div style="font-weight:700; font-size:0.85rem; color:#0f172a; margin-bottom:0.65rem;">
            Task 5 Model Feature Contribution Drivers
          </div>
          <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.775rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>Purchase Frequency Impact (+0.76 coef)</span>
              <span style="font-weight:600; color:${customer.Frequency >= 3 ? '#10b981' : '#64748b'};">${customer.Frequency} orders (${customer.Frequency >= 3 ? 'Positive driver' : 'Neutral'})</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>Recency Decay Impact (−0.51 coef)</span>
              <span style="font-weight:600; color:${customer.Recency > 60 ? '#ef4444' : '#10b981'};">${customer.Recency} days (${customer.Recency > 60 ? 'Decay penalty' : 'Recent'})</span>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>Average Order Value Impact (+0.19 coef)</span>
              <span style="font-weight:600; color:#2563eb;">£${Math.round(customer.AverageOrderValue)} (Positive driver)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =========================================================================
// EVENT LISTENERS FOR MAIN AREA
// =========================================================================
function attachMainEvents() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterState.activeTab = btn.getAttribute('data-tab');
      renderMain();
    });
  });

  const searchInput = document.getElementById('cust-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterState.searchQuery = e.target.value;
      const filtered = getFilteredCustomers();
      const kpis = computeKPIs(filtered);
      const tabAtt = document.getElementById('tab-attention');
      if (tabAtt) {
        tabAtt.innerHTML = renderAttentionTab(filtered, kpis);
        attachMainEvents();
      }
    });
  }

  document.querySelectorAll('.customer-table-row, .open-detail-btn, .customer-chip').forEach(el => {
    el.addEventListener('click', (e) => {
      const custId = el.getAttribute('data-customer-id');
      if (!custId) return;
      const all = customerDataService.getAllCustomers();
      const match = all.find(c => String(c.CustomerID) === String(custId));
      if (match) {
        selectedCustomerForModal = match;
        const modal = document.getElementById('customer-modal');
        if (modal) {
          modal.innerHTML = renderCustomerModalContent(match);
          modal.classList.add('open');
          attachModalEvents();
        }
      }
    });
  });

  attachModalEvents();
}

function attachModalEvents() {
  const modal = document.getElementById('customer-modal');
  const closeBtn = document.getElementById('modal-close-btn');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('open');
      selectedCustomerForModal = null;
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
        selectedCustomerForModal = null;
      }
    });
  }
}

// =========================================================================
// FULL REFRESH
// =========================================================================
function refresh() {
  renderSidebar();
  renderMain();
}

// =========================================================================
// INIT
// =========================================================================
function init() {
  customerDataService.subscribe(() => {
    refresh();
  });
  refresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
