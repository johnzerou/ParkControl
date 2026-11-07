/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/pricing.js — Motor de Cálculo Tarifário, Tolerância e Frações
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import { calculateMinutesDifference, formatDuration, formatBRL } from './utils.js';

/**
 * Calcula a cobrança detalhada da permanência com base nas regras RN006, RN007, RN008 e RN009.
 * 
 * @param {Object} params
 * @param {string|Date} params.entryTime - Data/hora de entrada (ISO)
 * @param {string|Date} params.exitTime - Data/hora de saída (ISO)
 * @param {number} params.hourlyRate - Tarifa da 1ª hora em R$
 * @param {number} [params.toleranceMinutes=10] - Minutos de tolerância gratuita (RN007)
 * @param {number} [params.fractionMinutes=15] - Duração do bloco de fração adicional em min (RN009)
 * @param {number} [params.fractionPercent=0.25] - Percentual da tarifa horária por fração (25%)
 * 
 * @returns {Object} Memória de cálculo completa e valor total
 */
export function calculateParkingFee({
  entryTime,
  exitTime,
  hourlyRate,
  toleranceMinutes = 10,
  fractionMinutes = 15,
  fractionPercent = 0.25
}) {
  const rate = Number(hourlyRate);
  if (isNaN(rate) || rate < 0) {
    throw new Error('A tarifa horária deve ser um valor positivo válido.');
  }

  const startDate = new Date(entryTime);
  const endDate = new Date(exitTime);

  if (endDate.getTime() < startDate.getTime()) {
    throw new Error('A data/hora de saída não pode ser anterior à data/hora de entrada (RN014).');
  }

  const totalMinutes = calculateMinutesDifference(startDate, endDate);
  const formattedDuration = formatDuration(totalMinutes);

  // Cenário 1: Dentro da Tolerância (RN007)
  if (totalMinutes <= toleranceMinutes) {
    return {
      totalMinutes,
      formattedDuration,
      withinTolerance: true,
      firstHourCharged: false,
      firstHourAmount: 0,
      excessMinutes: 0,
      fractionsCharged: 0,
      fractionRate: 0,
      fractionTotalAmount: 0,
      totalAmount: 0,
      summary: `Permanência de ${formattedDuration} dentro da tolerância (${toleranceMinutes} min). Isento de cobrança.`
    };
  }

  const firstHourAmount = rate;

  // Cenário 2: Ultrapassou a tolerância mas está dentro dos primeiros 60 minutos (RN008)
  if (totalMinutes <= 60) {
    return {
      totalMinutes,
      formattedDuration,
      withinTolerance: false,
      firstHourCharged: true,
      firstHourAmount,
      excessMinutes: 0,
      fractionsCharged: 0,
      fractionRate: 0,
      fractionTotalAmount: 0,
      totalAmount: firstHourAmount,
      summary: `Permanência de ${formattedDuration}. Cobrança da 1ª hora integral (${formatBRL(firstHourAmount)}).`
    };
  }

  // Cenário 3: Superior à 1ª hora (RN009)
  // Períodos adicionais cobrados em frações iniciadas de 15 minutos (25% cada)
  const excessMinutes = totalMinutes - 60;
  const fractionsCharged = Math.ceil(excessMinutes / fractionMinutes);
  const fractionRate = Math.round(rate * fractionPercent * 100) / 100;
  const fractionTotalAmount = Math.round(fractionsCharged * fractionRate * 100) / 100;
  const totalAmount = Math.round((firstHourAmount + fractionTotalAmount) * 100) / 100;

  return {
    totalMinutes,
    formattedDuration,
    withinTolerance: false,
    firstHourCharged: true,
    firstHourAmount,
    excessMinutes,
    fractionsCharged,
    fractionRate,
    fractionTotalAmount,
    totalAmount,
    summary: `Permanência de ${formattedDuration}: 1ª hora (${formatBRL(firstHourAmount)}) + ${fractionsCharged} fração(ões) de ${fractionMinutes} min (${formatBRL(fractionTotalAmount)}).`
  };
}

/**
 * Calcula o troco para pagamentos realizados em dinheiro (RN016).
 * @param {number} totalAmount - Valor total devido
 * @param {number} amountPaid - Valor entregue em dinheiro pelo cliente
 * @returns {Object} Detalhes do troco e status de liquidação
 */
export function calculateCashPayment(totalAmount, amountPaid) {
  const total = Math.round(Number(totalAmount) * 100) / 100;
  const paid = Math.round(Number(amountPaid) * 100) / 100;

  if (isNaN(paid) || paid < total) {
    return {
      isValid: false,
      changeAmount: 0,
      missingAmount: Math.round((total - paid) * 100) / 100,
      message: `Valor entregue (${formatBRL(paid)}) é insuficiente para quitar o total de ${formatBRL(total)}.`
    };
  }

  const changeAmount = Math.round((paid - total) * 100) / 100;
  return {
    isValid: true,
    changeAmount,
    missingAmount: 0,
    message: changeAmount > 0 
      ? `Troco a devolver: ${formatBRL(changeAmount)}` 
      : 'Pagamento exato, sem troco.'
  };
}
