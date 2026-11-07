/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/history.js — Histórico de Movimentações, Finalização de Saída e Exportação CSV
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import { getActiveVehicles, removeActiveVehicle, getHistory, saveHistoryRecord } from './storage.js';
import { calculateParkingFee, calculateCashPayment } from './pricing.js';
import { formatBRL, formatDateTime, generateUniqueId, normalizePlate } from './utils.js';

const PAYMENT_LABELS = {
  money: 'Dinheiro',
  pix: 'Pix',
  debit: 'Cartão de Débito',
  credit: 'Cartão de Crédito',
  tolerance: 'Isento / Tolerância'
};

/**
 * Conclui a saída de um veículo, registrando o pagamento, liberando a vaga e arquivando no histórico.
 * 
 * @param {Object} params
 * @param {string} params.ticketId - ID do tíquete ativo
 * @param {string} params.paymentMethod - 'money' | 'pix' | 'debit' | 'credit'
 * @param {number} [params.amountPaid] - Valor entregue (se em dinheiro)
 * @param {string|Date} [params.exitTime] - Data/hora de saída (padrão: agora)
 * 
 * @returns {Object} Registro histórico finalizado
 */
export function finalizeVehicleExit({ ticketId, paymentMethod, amountPaid = 0, exitTime = new Date() }) {
  const activeList = getActiveVehicles();
  const ticket = activeList.find(t => t.id === ticketId);

  // Validação: permanência deve existir e estar ativa (RN004)
  if (!ticket) {
    throw new Error('Permanência ativa não encontrada ou já finalizada anteriormente (RN004).');
  }

  const exitDate = new Date(exitTime);
  const entryDate = new Date(ticket.entryTime);

  if (exitDate.getTime() < entryDate.getTime()) {
    throw new Error('A data/hora de saída não pode ser cronologicamente anterior à entrada (RN014).');
  }

  // Cálculo da cobrança com base nas tarifas vinculadas na entrada (RN017)
  const pricing = calculateParkingFee({
    entryTime: ticket.entryTime,
    exitTime: exitDate.toISOString(),
    hourlyRate: ticket.appliedPricing.hourlyRate,
    toleranceMinutes: ticket.appliedPricing.toleranceMinutes,
    fractionMinutes: ticket.appliedPricing.fractionMinutes,
    fractionPercent: ticket.appliedPricing.fractionPercent
  });

  let effectiveMethod = paymentMethod;
  let cashDetails = { amountPaid: pricing.totalAmount, changeAmount: 0 };

  if (pricing.withinTolerance || pricing.totalAmount === 0) {
    effectiveMethod = 'tolerance';
  } else {
    // Validação da forma de pagamento (RN016)
    if (!['money', 'pix', 'debit', 'credit'].includes(paymentMethod)) {
      throw new Error('Forma de pagamento inválida. Escolha Dinheiro, Pix, Débito ou Crédito.');
    }

    // Se pagamento em dinheiro, valida valor entregue e troco
    if (paymentMethod === 'money') {
      const cashCheck = calculateCashPayment(pricing.totalAmount, amountPaid);
      if (!cashCheck.isValid) {
        throw new Error(cashCheck.message);
      }
      cashDetails = {
        amountPaid: Number(amountPaid),
        changeAmount: cashCheck.changeAmount
      };
    } else {
      cashDetails = {
        amountPaid: pricing.totalAmount,
        changeAmount: 0
      };
    }
  }

  const paymentRecord = {
    paymentId: generateUniqueId('PAY'),
    method: effectiveMethod,
    methodLabel: PAYMENT_LABELS[effectiveMethod] || effectiveMethod,
    amountPaid: cashDetails.amountPaid,
    changeAmount: cashDetails.changeAmount,
    totalAmount: pricing.totalAmount,
    paymentTime: exitDate.toISOString()
  };

  const finalizedRecord = {
    id: ticket.id,
    plate: ticket.plate,
    vehicleType: ticket.vehicleType,
    driverName: ticket.driverName || '',
    entryTime: ticket.entryTime,
    exitTime: exitDate.toISOString(),
    totalMinutes: pricing.totalMinutes,
    formattedDuration: pricing.formattedDuration,
    totalCharged: pricing.totalAmount,
    payment: paymentRecord,
    calculationMemory: pricing,
    status: 'completed',
    finalizedAt: new Date().toISOString()
  };

  // Liberação atômica da vaga física e arquivamento (RN011, RN012)
  removeActiveVehicle(ticket.id);
  saveHistoryRecord(finalizedRecord);

  return finalizedRecord;
}

/**
 * Filtra as movimentações históricas por placa, tipo de veículo e intervalo de datas.
 * 
 * @param {Object} filters
 * @param {string} [filters.query=''] - Busca por placa ou condutor
 * @param {string} [filters.vehicleType='all'] - 'all' | 'car' | 'moto'
 * @param {string} [filters.startDate=''] - Data inicial (YYYY-MM-DD)
 * @param {string} [filters.endDate=''] - Data final (YYYY-MM-DD)
 * 
 * @returns {Array<Object>} Lista filtrada de registros do histórico
 */
export function filterHistory({ query = '', vehicleType = 'all', startDate = '', endDate = '' }) {
  const history = getHistory();
  const cleanQuery = query.trim().toUpperCase();

  return history.filter(item => {
    // Filtro por texto
    const matchesQuery = !cleanQuery ||
      item.plate.includes(cleanQuery) ||
      (item.driverName && item.driverName.toUpperCase().includes(cleanQuery)) ||
      item.id.includes(cleanQuery);

    // Filtro por tipo de veículo
    const matchesType = vehicleType === 'all' || item.vehicleType === vehicleType;

    // Filtro por data de saída
    let matchesDate = true;
    if (startDate) {
      const itemDateStr = item.exitTime.slice(0, 10);
      if (itemDateStr < startDate) matchesDate = false;
    }
    if (endDate && matchesDate) {
      const itemDateStr = item.exitTime.slice(0, 10);
      if (itemDateStr > endDate) matchesDate = false;
    }

    return matchesQuery && matchesType && matchesDate;
  });
}

/**
 * Converte uma lista de registros em conteúdo CSV compatível com Excel (RF017).
 * Utiliza delimitador ponto e vírgula (;) e adiciona o BOM UTF-8 (\uFEFF) para caracteres em português.
 * 
 * @param {Array<Object>} records - Lista de registros
 * @returns {string} String formatada em CSV com BOM UTF-8
 */
export function generateHistoryCSV(records) {
  const headers = [
    'ID_Tíquete',
    'Placa',
    'Categoria',
    'Condutor',
    'Data_Entrada',
    'Data_Saída',
    'Duração_Minutos',
    'Duração_Formatada',
    'Valor_Cobrado_BRL',
    'Forma_Pagamento',
    'Status',
    'Data_Registro'
  ];

  const rows = records.map(r => [
    `"${r.id}"`,
    `"${r.plate}"`,
    `"${r.vehicleType === 'car' ? 'Carro' : 'Moto'}"`,
    `"${r.driverName || 'Não Informado'}"`,
    `"${formatDateTime(r.entryTime)}"`,
    `"${formatDateTime(r.exitTime)}"`,
    r.totalMinutes,
    `"${r.formattedDuration}"`,
    `"${formatBRL(r.totalCharged)}"`,
    `"${r.payment ? r.payment.methodLabel : '-'}"`,
    `"${r.status === 'completed' ? 'Finalizado' : r.status}"`,
    `"${formatDateTime(r.finalizedAt)}"`
  ]);

  const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\r\n');
  return '\uFEFF' + csvContent; // Adiciona BOM para suporte correto a acentos no Excel
}

/**
 * Dispara o download de um arquivo CSV no navegador do usuário (RF017).
 * @param {Array<Object>} records - Registros a exportar
 * @param {string} [filename] - Nome do arquivo
 */
export function downloadCSV(records, filename = `parkcontrol_historico_${new Date().toISOString().slice(0, 10)}.csv`) {
  if (!records || records.length === 0) {
    throw new Error('Não existem registros para exportar no período selecionado.');
  }

  const csvString = generateHistoryCSV(records);
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
