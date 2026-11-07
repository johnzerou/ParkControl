/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/vehicles.js — Controle de Entradas e Gerenciamento de Veículos Ativos
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import { normalizePlate, isValidPlate, generateUniqueId } from './utils.js';
import { getSettings, getActiveVehicles, saveActiveVehicle } from './storage.js';
import { isSlotAvailable } from './parking.js';

/**
 * Verifica se já existe uma permanência ativa no pátio para a placa informada (RN001).
 * @param {string} plate - Placa a consultar
 * @returns {boolean} True se a placa já estiver com veículo ativo no pátio
 */
export function isPlateActive(plate) {
  const clean = normalizePlate(plate);
  if (!clean) return false;
  const activeList = getActiveVehicles();
  return activeList.some(v => normalizePlate(v.plate) === clean && v.status === 'active');
}

/**
 * Registra a entrada de um veículo no estacionamento com todas as validações de integridade.
 * 
 * @param {Object} params
 * @param {string} params.plate - Placa do veículo (tradicional ou Mercosul)
 * @param {'car'|'moto'} params.vehicleType - Categoria ('car' ou 'moto')
 * @param {string} [params.driverName] - Nome do condutor (opcional)
 * @param {string|Date} [params.entryTime] - Horário de entrada (padrão: agora)
 * 
 * @returns {Object} Tíquete cadastrado
 */
export function registerVehicleEntry({ plate, vehicleType, driverName = '', entryTime = new Date() }) {
  const cleanPlate = normalizePlate(plate);

  // Validação 1: Placa válida conforme padrão brasileiro (RN013)
  if (!isValidPlate(cleanPlate)) {
    throw new Error('Formato de placa inválido. Informe uma placa válida no padrão tradicional (AAA-1234) ou Mercosul (AAA1B23).');
  }

  // Validação 2: Tipo de veículo obrigatório
  if (vehicleType !== 'car' && vehicleType !== 'moto') {
    throw new Error('Tipo de veículo inválido. Selecione "Carro" ou "Moto".');
  }

  // Validação 3: Placa única ativa no pátio (RN001)
  if (isPlateActive(cleanPlate)) {
    throw new Error(`O veículo de placa ${cleanPlate} já possui uma permanência ativa no pátio (RN001).`);
  }

  // Validação 4: Lotação da categoria (RN002)
  if (!isSlotAvailable(vehicleType)) {
    const typeLabel = vehicleType === 'car' ? 'Carros' : 'Motos';
    throw new Error(`Capacidade esgotada para ${typeLabel}. Novas entradas bloqueadas até liberação de vaga (RN002).`);
  }

  const settings = getSettings();
  const entryDate = new Date(entryTime);

  // Criação do Tíquete com snapshot tarifário no momento da entrada (RN017)
  const ticket = {
    id: generateUniqueId('PK'),
    plate: cleanPlate,
    vehicleType,
    driverName: String(driverName).trim(),
    entryTime: entryDate.toISOString(),
    status: 'active',
    appliedPricing: {
      hourlyRate: vehicleType === 'car' ? settings.carHourlyRate : settings.motoHourlyRate,
      toleranceMinutes: settings.toleranceMinutes,
      fractionMinutes: settings.fractionMinutes,
      fractionPercent: settings.fractionPercent,
      parkingName: settings.parkingName
    }
  };

  saveActiveVehicle(ticket);
  return ticket;
}

/**
 * Busca veículos ativos aplicando filtros de texto (placa/condutor) e categoria.
 * @param {string} [query=''] - Termo de busca
 * @param {string} [type='all'] - Categoria ('all', 'car', 'moto')
 * @returns {Array<Object>} Lista filtrada de veículos ativos
 */
export function filterActiveVehicles(query = '', type = 'all') {
  const list = getActiveVehicles();
  const cleanQuery = query.trim().toUpperCase();

  return list.filter(v => {
    const matchesQuery = !cleanQuery || 
      v.plate.includes(cleanQuery) || 
      (v.driverName && v.driverName.toUpperCase().includes(cleanQuery)) ||
      v.id.includes(cleanQuery);
    
    const matchesType = type === 'all' || v.vehicleType === type;

    return matchesQuery && matchesType;
  });
}

/**
 * Localiza uma permanência ativa por identificador ou placa.
 * @param {string} identifier - ID do tíquete ou placa
 * @returns {Object|null} Registro do veículo ou null
 */
export function findActiveVehicle(identifier) {
  if (!identifier) return null;
  const list = getActiveVehicles();
  const clean = normalizePlate(identifier);
  return list.find(v => v.id === identifier || normalizePlate(v.plate) === clean) || null;
}
