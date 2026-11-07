/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/parking.js — Gestão de Vagas, Lotação e Disponibilidade por Categoria
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import { getSettings, getActiveVehicles } from './storage.js';

/**
 * Computa o estado consolidado da capacidade e ocupação do estacionamento (RN002, RN004).
 * @returns {Object} Estatísticas completas de vagas por tipo e globais
 */
export function getCapacityStatus() {
  const settings = getSettings();
  const activeVehicles = getActiveVehicles();

  const totalCarSpots = settings.totalCarSpots;
  const totalMotoSpots = settings.totalMotoSpots;
  const totalSpots = totalCarSpots + totalMotoSpots;

  const occupiedCar = activeVehicles.filter(v => v.vehicleType === 'car').length;
  const occupiedMoto = activeVehicles.filter(v => v.vehicleType === 'moto').length;
  const totalOccupied = occupiedCar + occupiedMoto;

  const availableCar = Math.max(0, totalCarSpots - occupiedCar);
  const availableMoto = Math.max(0, totalMotoSpots - occupiedMoto);
  const totalAvailable = Math.max(0, totalSpots - totalOccupied);

  const carOccupancyPct = totalCarSpots > 0 ? Math.round((occupiedCar / totalCarSpots) * 100) : 0;
  const motoOccupancyPct = totalMotoSpots > 0 ? Math.round((occupiedMoto / totalMotoSpots) * 100) : 0;
  const overallOccupancyPct = totalSpots > 0 ? Math.round((totalOccupied / totalSpots) * 100) : 0;

  return {
    totalSpots,
    totalOccupied,
    totalAvailable,
    overallOccupancyPct,
    cars: {
      total: totalCarSpots,
      occupied: occupiedCar,
      available: availableCar,
      occupancyPct: carOccupancyPct,
      isFull: availableCar === 0
    },
    motos: {
      total: totalMotoSpots,
      occupied: occupiedMoto,
      available: availableMoto,
      occupancyPct: motoOccupancyPct,
      isFull: availableMoto === 0
    }
  };
}

/**
 * Verifica se há vaga disponível para o tipo especificado de veículo (RN002).
 * @param {'car'|'moto'} vehicleType - Categoria do veículo
 * @returns {boolean} True se houver vaga livre
 */
export function isSlotAvailable(vehicleType) {
  const status = getCapacityStatus();
  if (vehicleType === 'car') {
    return status.cars.available > 0;
  }
  if (vehicleType === 'moto') {
    return status.motos.available > 0;
  }
  return false;
}

/**
 * Valida se é permitido alterar a capacidade de vagas sem violar a ocupação atual (RN015).
 * Impede que a nova capacidade configurada seja menor que os veículos já estacionados.
 * 
 * @param {number} newCarCapacity - Nova quantidade proposta para carros
 * @param {number} newMotoCapacity - Nova quantidade proposta para motos
 * @returns {Object} Resultado da validação { isValid: boolean, message?: string }
 */
export function validateCapacityChange(newCarCapacity, newMotoCapacity) {
  const status = getCapacityStatus();
  const carCap = parseInt(newCarCapacity, 10);
  const motoCap = parseInt(newMotoCapacity, 10);

  if (isNaN(carCap) || carCap <= 0) {
    return { isValid: false, message: 'A capacidade de vagas para carros deve ser de no mínimo 1 vaga.' };
  }
  if (isNaN(motoCap) || motoCap <= 0) {
    return { isValid: false, message: 'A capacidade de vagas para motos deve ser de no mínimo 1 vaga.' };
  }

  if (carCap < status.cars.occupied) {
    return {
      isValid: false,
      message: `Não é possível reduzir a capacidade de carros para ${carCap}, pois existem ${status.cars.occupied} carro(s) estacionados atualmente (RN015).`
    };
  }

  if (motoCap < status.motos.occupied) {
    return {
      isValid: false,
      message: `Não é possível reduzir a capacidade de motos para ${motoCap}, pois existem ${status.motos.occupied} moto(s) estacionadas atualmente (RN015).`
    };
  }

  return { isValid: true };
}
