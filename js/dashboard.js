/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/dashboard.js — Métricas Operacionais, Mapa de Vagas e Visualizações SVG
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 */

import { getCapacityStatus } from './parking.js';
import { getActiveVehicles, getHistory } from './storage.js';
import { getFinancialMetrics } from './finance.js';
import { formatBRL } from './utils.js';

/**
 * Computa os indicadores operacionais do Dashboard (RF011).
 * @returns {Object} Dados consolidados para o dashboard
 */
export function getDashboardMetrics() {
  const capacity = getCapacityStatus();
  const activeVehicles = getActiveVehicles();
  const history = getHistory();
  const financial = getFinancialMetrics('today');

  const todayStr = new Date().toISOString().slice(0, 10);

  const entriesTodayCount =
    activeVehicles.filter(v => v.entryTime && v.entryTime.slice(0, 10) === todayStr).length +
    history.filter(h => h.entryTime && h.entryTime.slice(0, 10) === todayStr).length;

  const exitsTodayCount = history.filter(h => h.exitTime && h.exitTime.slice(0, 10) === todayStr).length;
  const todayRevenue = financial.todayRevenue;

  const recentActivities = [
    ...activeVehicles.map(v => ({
      id: v.id,
      plate: v.plate,
      vehicleType: v.vehicleType,
      driverName: v.driverName,
      timestamp: v.entryTime,
      type: 'entry',
      typeLabel: 'No pátio',
      status: 'active'
    })),
    ...history.slice(0, 12).map(h => ({
      id: h.id,
      plate: h.plate,
      vehicleType: h.vehicleType,
      driverName: h.driverName,
      timestamp: h.exitTime,
      type: 'exit',
      typeLabel: 'Concluído',
      status: 'completed',
      totalCharged: h.totalCharged
    }))
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return {
    capacity,
    entriesTodayCount,
    exitsTodayCount,
    todayRevenue,
    recentActivities
  };
}

/**
 * Gera o gráfico SVG de movimentações por faixa de horário.
 * @param {Array<Object>} active - Veículos no pátio
 * @param {Array<Object>} history - Histórico de saídas
 * @returns {string} Markup SVG
 */
export function renderMovementsChartSVG(active, history) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const hourBuckets = {
    '06–09h': 0,
    '09–12h': 0,
    '12–15h': 0,
    '15–18h': 0,
    '18–21h': 0,
    '21–24h': 0
  };

  const countHour = (isoString) => {
    if (!isoString || isoString.slice(0, 10) !== todayStr) return;
    const hour = new Date(isoString).getHours();
    if (hour >= 6 && hour < 9) hourBuckets['06–09h']++;
    else if (hour >= 9 && hour < 12) hourBuckets['09–12h']++;
    else if (hour >= 12 && hour < 15) hourBuckets['12–15h']++;
    else if (hour >= 15 && hour < 18) hourBuckets['15–18h']++;
    else if (hour >= 18 && hour < 21) hourBuckets['18–21h']++;
    else if (hour >= 21 && hour < 24) hourBuckets['21–24h']++;
  };

  active.forEach(v => countHour(v.entryTime));
  history.forEach(h => {
    countHour(h.entryTime);
    countHour(h.exitTime);
  });

  const keys = Object.keys(hourBuckets);
  const values = Object.values(hourBuckets);
  const maxVal = Math.max(...values, 4);

  const width = 560;
  const height = 195;
  const padLeft = 34;
  const padRight = 16;
  const padTop = 22;
  const padBottom = 28;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const barWidth = 38;
  const step = plotWidth / keys.length;

  const gridRows = [0, 0.5, 1].map(frac => {
    const y = Math.round(height - padBottom - frac * plotHeight);
    const tickVal = Math.round(frac * maxVal);
    return `
      <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#1F2937" stroke-width="1" />
      <text x="${padLeft - 8}" y="${y + 3}" font-size="10" fill="#64748B" text-anchor="end" font-family="JetBrains Mono, monospace">${tickVal}</text>
    `;
  }).join('');

  const barsHTML = keys.map((bucket, idx) => {
    const val = values[idx];
    const barHeight = val > 0 ? Math.max(4, Math.round((val / maxVal) * plotHeight)) : 2;
    const x = Math.round(padLeft + idx * step + (step - barWidth) / 2);
    const y = height - padBottom - barHeight;
    const fill = val > 0 ? '#3B82F6' : '#1E293B';

    return `
      <g>
        <rect x="${x}" y="${padTop}" width="${barWidth}" height="${plotHeight}" rx="2" fill="#0D1526" />
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${fill}">
          <title>${bucket}: ${val} movimentação(ões)</title>
        </rect>
        ${val > 0 ? `<text x="${x + barWidth / 2}" y="${y - 6}" font-size="10.5" font-weight="600" fill="#E5E7EB" text-anchor="middle" font-family="JetBrains Mono, monospace">${val}</text>` : ''}
        <text x="${x + barWidth / 2}" y="${height - 8}" font-size="11" fill="#94A3B8" text-anchor="middle" font-family="JetBrains Mono, monospace">${bucket}</text>
      </g>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">
      ${gridRows}
      ${barsHTML}
    </svg>
  `;
}

/**
 * Renderiza o painel de Ocupação por Categoria + Mapa Visual de Vagas do Pátio.
 * @param {Object} capacity - Objeto retornado por getCapacityStatus()
 * @returns {string} HTML estruturado
 */
export function renderCategoryBreakdownHTML(capacity) {
  const carPct = capacity.car.total > 0 ? Math.round((capacity.car.occupied / capacity.car.total) * 100) : 0;
  const motoPct = capacity.moto.total > 0 ? Math.round((capacity.moto.occupied / capacity.moto.total) * 100) : 0;

  const maxCarCells = Math.min(capacity.car.total, 20);
  const maxMotoCells = Math.min(capacity.moto.total, 10);

  let cellsHTML = '';
  for (let i = 1; i <= maxCarCells; i++) {
    const isOccupied = i <= capacity.car.occupied;
    const label = `C${String(i).padStart(2, '0')}`;
    cellsHTML += `<div class="slot-cell ${isOccupied ? 'occupied' : ''}" title="Vaga Carro ${label}: ${isOccupied ? 'Ocupada' : 'Livre'}">${label}</div>`;
  }
  for (let i = 1; i <= maxMotoCells; i++) {
    const isOccupied = i <= capacity.moto.occupied;
    const label = `M${String(i).padStart(2, '0')}`;
    cellsHTML += `<div class="slot-cell ${isOccupied ? 'occupied' : ''}" title="Vaga Moto ${label}: ${isOccupied ? 'Ocupada' : 'Livre'}">${label}</div>`;
  }

  return `
    <div class="cat-breakdown-wrap">
      <div class="cat-row">
        <div class="cat-row-header">
          <span class="cat-row-title">Carros / Utilitários</span>
          <span class="cat-row-stats">${capacity.car.occupied}/${capacity.car.total} ocupadas (${capacity.car.available} livres)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${carPct}%; background-color: ${carPct >= 90 ? '#EF4444' : '#3B82F6'};"></div>
        </div>
      </div>

      <div class="cat-row">
        <div class="cat-row-header">
          <span class="cat-row-title">Motocicletas</span>
          <span class="cat-row-stats">${capacity.moto.occupied}/${capacity.moto.total} ocupadas (${capacity.moto.available} livres)</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${motoPct}%; background-color: ${motoPct >= 90 ? '#EF4444' : '#64748B'};"></div>
        </div>
      </div>

      <div class="slot-matrix-section">
        <div class="slot-matrix-header">
          <span> Setores C (Carros) e M (Motos)</span>
          <div class="slot-legend">
            <span class="slot-legend-item"><span class="slot-dot slot-dot-free"></span>Livre</span>
            <span class="slot-legend-item"><span class="slot-dot slot-dot-busy"></span>Ocupada</span>
          </div>
        </div>
        <div class="slot-grid">
          ${cellsHTML}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renderiza o detalhamento financeiro por forma de pagamento.
 * @param {Object} byMethod - Totais por forma de pagamento
 * @returns {string} HTML/SVG
 */
export function renderPaymentDistributionSVG(byMethod) {
  const methods = [
    { key: 'pix', label: 'Pix', color: '#22C55E', val: byMethod.pix ? byMethod.pix.total : 0, count: byMethod.pix ? byMethod.pix.count : 0 },
    { key: 'credit', label: 'Cartão de Crédito', color: '#3B82F6', val: byMethod.credit ? byMethod.credit.total : 0, count: byMethod.credit ? byMethod.credit.count : 0 },
    { key: 'debit', label: 'Cartão de Débito', color: '#60A5FA', val: byMethod.debit ? byMethod.debit.total : 0, count: byMethod.debit ? byMethod.debit.count : 0 },
    { key: 'money', label: 'Dinheiro', color: '#F59E0B', val: byMethod.money ? byMethod.money.total : 0, count: byMethod.money ? byMethod.money.count : 0 }
  ];

  const total = methods.reduce((acc, m) => acc + m.val, 0);

  return `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      ${methods.map(m => {
        const pct = total > 0 ? Math.round((m.val / total) * 100) : 0;
        return `
          <div style="display: flex; flex-direction: column; gap: 6px; padding-bottom: 12px; border-bottom: 1px solid #182234;">
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 12.5px;">
              <span style="display: inline-flex; align-items: center; gap: 8px; color: #E5E7EB; font-weight: 500;">
                <span style="width: 8px; height: 8px; border-radius: 2px; background-color: ${m.color};"></span>
                ${m.label}
              </span>
              <span class="mono" style="color: #E5E7EB; font-weight: 600;">${formatBRL(m.val)}</span>
            </div>
            <div class="progress-track" style="height: 4px;">
              <div class="progress-fill" style="width: ${pct}%; background-color: ${m.color};"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #64748B;">
              <span>${m.count} pagamento(s)</span>
              <span class="mono">${pct}%</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
