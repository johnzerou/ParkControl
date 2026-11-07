/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/settings.js — Gerenciamento e Validação de Parâmetros Operacionais
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import { getSettings, saveSettings } from './storage.js';
import { validateCapacityChange } from './parking.js';

/**
 * Atualiza e salva as configurações do estacionamento com validação rigorosa (RN014, RN015, RN017).
 * 
 * @param {Object} params
 * @param {string} params.parkingName - Nome do estacionamento
 * @param {number} params.totalCarSpots - Vagas totais para carros
 * @param {number} params.totalMotoSpots - Vagas totais para motos
 * @param {number} params.carHourlyRate - Tarifa da 1ª hora para carro
 * @param {number} params.motoHourlyRate - Tarifa da 1ª hora para moto
 * @param {number} params.toleranceMinutes - Tempo de tolerância em minutos
 * @param {number} params.fractionMinutes - Minutos da fração adicional
 * 
 * @returns {Object} Configurações validadas e persistidas
 */
export function updateParkingSettings({
  parkingName,
  totalCarSpots,
  totalMotoSpots,
  carHourlyRate,
  motoHourlyRate,
  toleranceMinutes,
  fractionMinutes
}) {
  const name = String(parkingName || '').trim();
  if (!name) {
    throw new Error('O nome do estacionamento não pode ficar em branco.');
  }

  const carSpots = parseInt(totalCarSpots, 10);
  const motoSpots = parseInt(totalMotoSpots, 10);
  const carRate = parseFloat(carHourlyRate);
  const motoRate = parseFloat(motoHourlyRate);
  const tolerance = parseInt(toleranceMinutes, 10);
  const fraction = parseInt(fractionMinutes, 10);

  // Validação de Integridade (RN014)
  if (isNaN(carRate) || carRate < 0) {
    throw new Error('A tarifa de carro não pode ser negativa ou inválida.');
  }
  if (isNaN(motoRate) || motoRate < 0) {
    throw new Error('A tarifa de moto não pode ser negativa ou inválida.');
  }
  if (isNaN(tolerance) || tolerance < 0) {
    throw new Error('O tempo de tolerância deve ser um número maior ou igual a zero.');
  }
  if (isNaN(fraction) || fraction <= 0) {
    throw new Error('A fração adicional deve ser de no mínimo 1 minuto.');
  }

  // Validação de Capacidade vs Ocupação Presente (RN015)
  const capacityValidation = validateCapacityChange(carSpots, motoSpots);
  if (!capacityValidation.isValid) {
    throw new Error(capacityValidation.message);
  }

  return saveSettings({
    parkingName: name,
    totalCarSpots: carSpots,
    totalMotoSpots: motoSpots,
    carHourlyRate: carRate,
    motoHourlyRate: motoRate,
    toleranceMinutes: tolerance,
    fractionMinutes: fraction
  });
}

