/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/dashboard.js — Métricas do Dashboard e Gráficos Vetoriais SVG Nativos (Tema Escuro Corporativo)
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 */

import { getCapacityStatus } from './parking.js';
import { getActiveVehicles, getHistory } from './storage.js';
import { getFinancialMetrics } from './finance.js';
import { formatBRL } from './utils.js';

/**
 * Computa todos os indicadores operacionais do Dashboard em tempo real (RF011).
 * Todos os valores são derivados dos registros reais do protótipo.
 * 
 * @returns {Object} Dados consolidados para o dashboard
 */
export function getDashboardMetrics() {
  const capacity = getCapacityStatus();
  const activeVehicles = getActiveVehicles();
  const history = getHistory();
  const financial = getFinancialMetrics('today');

  const todayStr = new Date().toISOString().slice(0, 10);

  // Entradas de hoje (ativos que entraram hoje + saídas de hoje que entraram hoje)
  const entriesTodayCount = activeVehicles.filter(v => v.entryTime && v.entryTime.slice(0, 10) === todayStr).length +
    history.filter(h => h.entryTime && h.entryTime.slice(0, 10) === todayStr).length;

  // Saídas de hoje
  const exitsTodayCount = history.filter(h => h.exitTime && h.exitTime.slice(0, 10) === todayStr).length;

  // Faturamento confirmado hoje
  const todayRevenue = financial.todayRevenue;

  // Movimentações recentes combinadas (ativos e finalizados de hoje, ordenados por tempo decrescente)
  const recentActivities = [
    ...activeVehicles.map(v => ({
      id: v.id,
      plate: v.plate,
      vehicleType: v.vehicleType,
      driverName: v.driverName,
      timestamp: v.entryTime,
      type: 'entry',
      typeLabel: 'Entrada Ativa',
      status: 'active'
    })),
    ...history.slice(0, 10).map(h => ({
      id: h.id,
      plate: h.plate,
      vehicleType: h.vehicleType,
      driverName: h.driverName,
      timestamp: h.exitTime,
      type: 'exit',
      typeLabel: 'Saída Finalizada',
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
 * Gera um gráfico de barras em SVG nativo para tema escuro representando o fluxo de movimentações.
 * @param {Array<Object>} active - Veículos ativos
 * @param {Array<Object>} history - Histórico
 * @returns {string} Código SVG do gráfico
 */
export function renderMovementsChartSVG(active, history) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const hourBuckets = {
    '06h-09h': 0,
    '09h-12h': 0,
    '12h-15h': 0,
    '15h-18h': 0,
    '18h-21h': 0,
    '21h-24h': 0
  };

  const countHour = (isoString) => {
    if (!isoString || isoString.slice(0, 10) !== todayStr) return;
    const hour = new Date(isoString).getHours();
    if (hour >= 6 && hour < 9) hourBuckets['06h-09h']++;
    else if (hour >= 9 && hour < 12) hourBuckets['09h-12h']++;
    else if (hour >= 12 && hour < 15) hourBuckets['12h-15h']++;
    else if (hour >= 15 && hour < 18) hourBuckets['15h-18h']++;
    else if (hour >= 18 && hour < 21) hourBuckets['18h-21h']++;
    else if (hour >= 21 && hour < 24) hourBuckets['21h-24h']++;
  };

  active.forEach(v => countHour(v.entryTime));
  history.forEach(h => {
    countHour(h.entryTime);
    countHour(h.exitTime);
  });

  const keys = Object.keys(hourBuckets);
  const values = Object.values(hourBuckets);
  const totalMovements = values.reduce((a, b) => a + b, 0);
  const maxVal = Math.max(...values, 4);

  const width = 540;
  const height = 190;
  const paddingBottom = 28;
  const paddingTop = 26;
  const chartHeight = height - paddingTop - paddingBottom;
  const barWidth = 42;
  const step = (width - 60) / keys.length;

  // Linhas de grade sutis
  const gridLines = [0.25, 0.5, 0.75, 1.0].map(fraction => {
    const y = height - paddingBottom - (fraction * chartHeight);
    return `<line x1="30" y1="${y}" x2="${width - 15}" y2="${y}" stroke="#1E293B" stroke-dasharray="3 3" stroke-width="1" />`;
  }).join('');

  let barsHTML = '';

  keys.forEach((bucket, idx) => {
    const val = values[idx];
    const barHeight = val > 0 ? Math.max(4, Math.round((val / maxVal) * chartHeight)) : 0;
    const x = 34 + idx * step + (step - barWidth) / 2;
    const y = height - paddingBottom - barHeight;

    const barColor = val > 0 ? '#3B82F6' : '#1E293B';
    const textColor = val > 0 ? '#F8FAFC' : '#64748B';

    barsHTML += `
      <g class="chart-bar-group" style="cursor: pointer;">
        <!-- Barra de base (trilho vazio sutil) -->
        <rect x="${x}" y="${paddingTop}" width="${barWidth}" height="${chartHeight}" rx="4" fill="#131D31" opacity="0.4" />
        
        <!-- Barra de volume real -->
        ${val > 0 ? `
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="${barColor}">
            <title>${bucket}: ${val} operação(ões)</title>
          </rect>
          <text x="${x + barWidth / 2}" y="${y - 8}" font-size="11" font-weight="600" fill="${textColor}" text-anchor="middle" font-family="monospace">${val}</text>
        ` : `
          <text x="${x + barWidth / 2}" y="${height - paddingBottom - 8}" font-size="10" fill="#475569" text-anchor="middle" font-family="monospace">-</text>
        `}
        <text x="${x + barWidth / 2}" y="${height - 8}" font-size="11" font-weight="500" fill="#94A3B8" text-anchor="middle">${bucket}</text>
      </g>
    `;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">
      ${gridLines}
      <line x1="25" y1="${height - paddingBottom}" x2="${width - 15}" y2="${height - paddingBottom}" stroke="#334155" stroke-width="1" />
      ${barsHTML}
    </svg>
  `;
}

/**
 * Gera um gráfico de rosca (Donut Chart) em SVG nativo para distribuição por meio de pagamento no tema escuro.
 * @param {Object} byMethod - Estrutura com totais por método
 * @returns {string} Código HTML/SVG do gráfico
 */
export function renderPaymentDistributionSVG(byMethod) {
  const methods = [
    { key: 'pix', label: 'Pix', color: '#10B981', val: byMethod.pix ? byMethod.pix.total : 0 },
    { key: 'credit', label: 'Cartão Crédito', color: '#3B82F6', val: byMethod.credit ? byMethod.credit.total : 0 },
    { key: 'debit', label: 'Cartão Débito', color: '#06B6D4', val: byMethod.debit ? byMethod.debit.total : 0 },
    { key: 'money', label: 'Dinheiro', color: '#F59E0B', val: byMethod.money ? byMethod.money.total : 0 }
  ];

  const total = methods.reduce((acc, m) => acc + m.val, 0);

  if (total === 0) {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 180px; text-align: center; color: #64748B;">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#334155" stroke-width="1.5" style="margin-bottom: 8px;">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M16 12h-4V8"></path>
        </svg>
        <span style="font-size: 13px; font-weight: 500; color: #94A3B8;">Nenhum pagamento liquidado</span>
        <span style="font-size: 11px; color: #64748B; margin-top: 2px;">Os recebimentos finalizados no período serão totalizados aqui.</span>
      </div>
    `;
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let strokeOffset = 0;

  const circles = methods.map(m => {
    if (m.val === 0) return '';
    const pct = m.val / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const circleSvg = `
      <circle cx="85" cy="85" r="${radius}" fill="transparent"
        stroke="${m.color}" stroke-width="16"
        stroke-dasharray="${strokeDasharray}"
        stroke-dashoffset="${strokeOffset}"
        stroke-linecap="round"
        transform="rotate(-90 85 85)">
        <title>${m.label}: ${formatBRL(m.val)} (${Math.round(pct * 100)}%)</title>
      </circle>
    `;
    strokeOffset -= pct * circumference;
    return circleSvg;
  }).join('');

  const legend = methods.map(m => {
    const pct = total > 0 ? Math.round((m.val / total) * 100) : 0;
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #162032; font-size: 12px;">
        <span style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: ${m.color};"></span>
          <span style="color: #CBD5E1; font-weight: 500;">${m.label}</span>
        </span>
        <div style="text-align: right;">
          <strong style="color: #F8FAFC; font-family: monospace;">${formatBRL(m.val)}</strong>
          <span style="font-size: 11px; color: #64748B; margin-left: 6px;">(${pct}%)</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 20px;">
      <svg width="170" height="170" viewBox="0 0 170 170">
        <!-- Círculo de fundo do trilho -->
        <circle cx="85" cy="85" r="${radius}" fill="transparent" stroke="#162032" stroke-width="16" />
        ${circles}
        <text x="85" y="80" font-size="10" font-weight="600" fill="#94A3B8" text-anchor="middle" letter-spacing="0.05em">RECEITA</text>
        <text x="85" y="97" font-size="13" font-weight="700" fill="#F8FAFC" text-anchor="middle" font-family="monospace">${formatBRL(total)}</text>
      </svg>
      <div style="flex: 1; min-width: 200px;">
        ${legend}
      </div>
    </div>
  `;
}
