/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/dashboard.js — Métricas do Dashboard e Gráficos Vetoriais SVG Nativos
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import { getCapacityStatus } from './parking.js';
import { getActiveVehicles, getHistory } from './storage.js';
import { getFinancialMetrics } from './finance.js';

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
 * Gera um gráfico de barras em SVG nativo representando o fluxo de movimentações por bloco de horários.
 * @param {Array<Object>} active - Veículos ativos
 * @param {Array<Object>} history - Histórico
 * @returns {string} Código SVG do gráfico
 */
export function renderMovementsChartSVG(active, history) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const hourBuckets = {
    '06-09h': 0,
    '09-12h': 0,
    '12-15h': 0,
    '15-18h': 0,
    '18-21h': 0,
    '21-24h': 0
  };

  const countHour = (isoString) => {
    if (!isoString || isoString.slice(0, 10) !== todayStr) return;
    const hour = new Date(isoString).getHours();
    if (hour >= 6 && hour < 9) hourBuckets['06-09h']++;
    else if (hour >= 9 && hour < 12) hourBuckets['09-12h']++;
    else if (hour >= 12 && hour < 15) hourBuckets['12-15h']++;
    else if (hour >= 15 && hour < 18) hourBuckets['15-18h']++;
    else if (hour >= 18 && hour < 21) hourBuckets['18-21h']++;
    else if (hour >= 21) hourBuckets['21-24h']++;
  };

  active.forEach(v => countHour(v.entryTime));
  history.forEach(h => {
    countHour(h.entryTime);
    countHour(h.exitTime);
  });

  const keys = Object.keys(hourBuckets);
  const values = Object.values(hourBuckets);
  const maxVal = Math.max(...values, 5); // Escala mínima de 5 para boa visibilidade

  const width = 500;
  const height = 180;
  const paddingBottom = 26;
  const paddingTop = 20;
  const barWidth = 44;
  const availableWidth = width - 40;
  const step = availableWidth / keys.length;

  let barsHTML = '';

  keys.forEach((bucket, idx) => {
    const val = values[idx];
    const barHeight = Math.round((val / maxVal) * (height - paddingTop - paddingBottom));
    const x = 30 + idx * step + (step - barWidth) / 2;
    const y = height - paddingBottom - barHeight;

    barsHTML += `
      <g class="chart-bar-group">
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="#2563EB" opacity="0.85">
          <title>${bucket}: ${val} movimentações</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${y - 6}" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">${val > 0 ? val : ''}</text>
        <text x="${x + barWidth / 2}" y="${height - 8}" font-size="11" fill="#64748B" text-anchor="middle">${bucket}</text>
      </g>
    `;
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" class="chart-svg" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="${height - paddingBottom}" x2="${width - 10}" y2="${height - paddingBottom}" stroke="#E2E8F0" stroke-width="1" />
      ${barsHTML}
    </svg>
  `;
}

/**
 * Gera um gráfico de rosca (Donut Chart) em SVG nativo para distribuição por meio de pagamento.
 * @param {Object} byMethod - Estrutura com totais por método
 * @returns {string} Código SVG do gráfico
 */
export function renderPaymentDistributionSVG(byMethod) {
  const methods = [
    { key: 'pix', label: 'Pix', color: '#16A34A', val: byMethod.pix ? byMethod.pix.total : 0 },
    { key: 'credit', label: 'Crédito', color: '#2563EB', val: byMethod.credit ? byMethod.credit.total : 0 },
    { key: 'debit', label: 'Débito', color: '#0284C7', val: byMethod.debit ? byMethod.debit.total : 0 },
    { key: 'money', label: 'Dinheiro', color: '#D97706', val: byMethod.money ? byMethod.money.total : 0 }
  ];

  const total = methods.reduce((acc, m) => acc + m.val, 0);

  if (total === 0) {
    return `
      <div style="text-align: center; padding: 40px 10px; color: #64748B; font-size: 13px;">
        Nenhum faturamento registrado no período selecionado.
      </div>
    `;
  }

  // Raio do círculo
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  let strokeOffset = 0;

  const circles = methods.map(m => {
    if (m.val === 0) return '';
    const pct = m.val / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const circleSvg = `
      <circle cx="90" cy="90" r="${radius}" fill="transparent"
        stroke="${m.color}" stroke-width="22"
        stroke-dasharray="${strokeDasharray}"
        stroke-dashoffset="${strokeOffset}"
        transform="rotate(-90 90 90)">
        <title>${m.label}: R$ ${m.val.toFixed(2)} (${Math.round(pct * 100)}%)</title>
      </circle>
    `;
    strokeOffset -= pct * circumference;
    return circleSvg;
  }).join('');

  const legend = methods.map(m => {
    const pct = total > 0 ? Math.round((m.val / total) * 100) : 0;
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 12px;">
        <span style="display: flex; align-items: center; gap: 8px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${m.color};"></span>
          <span>${m.label}</span>
        </span>
        <strong>R$ ${m.val.toFixed(2)} (${pct}%)</strong>
      </div>
    `;
  }).join('');

  return `
    <div style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 16px;">
      <svg width="180" height="180" viewBox="0 0 180 180">
        ${circles}
        <text x="90" y="94" font-size="13" font-weight="700" fill="#0F172A" text-anchor="middle">Receita</text>
      </svg>
      <div style="flex: 1; min-width: 170px;">
        ${legend}
      </div>
    </div>
  `;
}
