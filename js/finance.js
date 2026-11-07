/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/finance.js — Módulo Financeiro, Relatórios de Receita e Conciliação
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import { getHistory } from './storage.js';

/**
 * Filtra registros históricos por período pré-definido.
 * @param {Array<Object>} history - Lista de registros
 * @param {'today'|'7days'|'month'|'all'} period - Período selecionado
 * @returns {Array<Object>} Registros pertencentes ao período
 */
function filterHistoryByPeriod(history, period = 'all') {
  if (period === 'all') return history;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (period === 'today') {
    return history.filter(item => item.exitTime && item.exitTime.slice(0, 10) === todayStr);
  }

  if (period === '7days') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return history.filter(item => new Date(item.exitTime) >= sevenDaysAgo);
  }

  if (period === 'month') {
    const currentYearMonth = todayStr.slice(0, 7); // YYYY-MM
    return history.filter(item => item.exitTime && item.exitTime.slice(0, 7) === currentYearMonth);
  }

  return history;
}

/**
 * Computa as métricas financeiras consolidadas (RN010, RF015).
 * Apenas pagamentos de saídas finalizadas integram a receita realizada.
 * 
 * @param {'today'|'7days'|'month'|'all'} [period='all'] - Janela de tempo
 * @returns {Object} Indicadores financeiros apurados
 */
export function getFinancialMetrics(period = 'all') {
  const fullHistory = getHistory();
  const filteredRecords = filterHistoryByPeriod(fullHistory, period);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Faturamento Total no período selecionado
  const totalRevenue = filteredRecords.reduce((acc, curr) => acc + (curr.totalCharged || 0), 0);

  // Faturamento exclusivo de hoje
  const todayRevenue = fullHistory
    .filter(item => item.exitTime && item.exitTime.slice(0, 10) === todayStr)
    .reduce((acc, curr) => acc + (curr.totalCharged || 0), 0);

  // Quantidade de pagamentos realizados
  const paymentCount = filteredRecords.length;

  // Tíquete Médio (apenas tíquetes com valor > 0 para precisão)
  const paidTickets = filteredRecords.filter(r => (r.totalCharged || 0) > 0);
  const averageTicket = paidTickets.length > 0 ? totalRevenue / paidTickets.length : 0;

  // Agrupamento por forma de pagamento (RN016)
  const byMethod = {
    pix: { label: 'Pix', total: 0, count: 0, percentage: 0 },
    money: { label: 'Dinheiro', total: 0, count: 0, percentage: 0 },
    debit: { label: 'Cartão de Débito', total: 0, count: 0, percentage: 0 },
    credit: { label: 'Cartão de Crédito', total: 0, count: 0, percentage: 0 },
    tolerance: { label: 'Isento / Tolerância', total: 0, count: 0, percentage: 0 }
  };

  filteredRecords.forEach(item => {
    const method = (item.payment && item.payment.method) || 'tolerance';
    const amount = Number(item.totalCharged) || 0;

    if (byMethod[method]) {
      byMethod[method].total += amount;
      byMethod[method].count += 1;
    } else {
      byMethod[method] = { label: method, total: amount, count: 1, percentage: 0 };
    }
  });

  // Cálculo dos percentuais sobre a receita
  if (totalRevenue > 0) {
    Object.keys(byMethod).forEach(key => {
      byMethod[key].percentage = Math.round((byMethod[key].total / totalRevenue) * 100);
    });
  }

  return {
    period,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    todayRevenue: Math.round(todayRevenue * 100) / 100,
    paymentCount,
    paidTicketsCount: paidTickets.length,
    averageTicket: Math.round(averageTicket * 100) / 100,
    byMethod,
    records: filteredRecords
  };
}

