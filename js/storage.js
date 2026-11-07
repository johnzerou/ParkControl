/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/storage.js — Camada de Acesso a Dados e Persistência Local (LocalStorage)
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import { generateUniqueId } from './utils.js';

const STORAGE_KEYS = {
  SETTINGS: 'parkcontrol_settings',
  ACTIVE: 'parkcontrol_active',
  HISTORY: 'parkcontrol_history'
};

const DEFAULT_SETTINGS = {
  parkingName: 'ParkControl Central',
  totalCarSpots: 20,
  totalMotoSpots: 10,
  carHourlyRate: 10.00,
  motoHourlyRate: 5.00,
  toleranceMinutes: 10,
  fractionMinutes: 15,
  fractionPercent: 0.25,
  lastUpdated: new Date().toISOString()
};

// Mecanismo de fallback em memória para execução fora do navegador (ex: testes em Node.js)
let inMemoryStorage = {};

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key) => inMemoryStorage[key] || null,
    setItem: (key, val) => { inMemoryStorage[key] = String(val); },
    removeItem: (key) => { delete inMemoryStorage[key]; },
    clear: () => { inMemoryStorage = {}; }
  };
}

/**
 * Lê e desserializa dados JSON do armazenamento local com segurança.
 * @param {string} key - Chave de busca
 * @param {*} defaultValue - Valor retornado caso nulo ou com erro
 * @returns {*} Conteúdo recuperado
 */
function safeGetJSON(key, defaultValue) {
  try {
    const raw = getStorage().getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`[ParkControl Storage] Erro ao recuperar chave "${key}":`, err);
    return defaultValue;
  }
}

/**
 * Serializa e grava dados no armazenamento local.
 * @param {string} key - Chave de gravação
 * @param {*} data - Dados a persistir
 */
function safeSetJSON(key, data) {
  try {
    getStorage().setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`[ParkControl Storage] Falha ao persistir chave "${key}":`, err);
    throw new Error('Não foi possível salvar os dados no armazenamento local.');
  }
}

/**
 * Inicializa e recupera as configurações do estacionamento.
 * @returns {Object} Configurações ativas
 */
export function getSettings() {
  const current = safeGetJSON(STORAGE_KEYS.SETTINGS, null);
  if (!current) {
    saveSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
  return { ...DEFAULT_SETTINGS, ...current };
}

/**
 * Salva as configurações do estacionamento validando valores.
 * @param {Object} newSettings - Novos parâmetros
 * @returns {Object} Configurações atualizadas
 */
export function saveSettings(newSettings) {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...newSettings,
    totalCarSpots: Math.max(1, parseInt(newSettings.totalCarSpots, 10) || DEFAULT_SETTINGS.totalCarSpots),
    totalMotoSpots: Math.max(1, parseInt(newSettings.totalMotoSpots, 10) || DEFAULT_SETTINGS.totalMotoSpots),
    carHourlyRate: Math.max(0, parseFloat(newSettings.carHourlyRate) || DEFAULT_SETTINGS.carHourlyRate),
    motoHourlyRate: Math.max(0, parseFloat(newSettings.motoHourlyRate) || DEFAULT_SETTINGS.motoHourlyRate),
    toleranceMinutes: Math.max(0, parseInt(newSettings.toleranceMinutes, 10) || 0),
    fractionMinutes: Math.max(1, parseInt(newSettings.fractionMinutes, 10) || 15),
    fractionPercent: 0.25,
    lastUpdated: new Date().toISOString()
  };
  safeSetJSON(STORAGE_KEYS.SETTINGS, settings);
  return settings;
}

/**
 * Obtém todos os veículos atualmente estacionados (ativos).
 * @returns {Array<Object>} Lista de permanências ativas
 */
export function getActiveVehicles() {
  const list = safeGetJSON(STORAGE_KEYS.ACTIVE, []);
  return Array.isArray(list) ? list : [];
}

/**
 * Salva uma nova permanência ativa ou atualiza existente.
 * @param {Object} ticket - Tíquete do veículo
 * @returns {Array<Object>} Lista atualizada de veículos ativos
 */
export function saveActiveVehicle(ticket) {
  const list = getActiveVehicles();
  const index = list.findIndex(v => v.id === ticket.id);
  if (index >= 0) {
    list[index] = ticket;
  } else {
    list.push(ticket);
  }
  safeSetJSON(STORAGE_KEYS.ACTIVE, list);
  return list;
}

/**
 * Remove um veículo da lista de ativos (utilizado na saída).
 * @param {string} ticketId - Identificador do tíquete
 * @returns {Object|null} Veículo removido ou null se não encontrado
 */
export function removeActiveVehicle(ticketId) {
  const list = getActiveVehicles();
  const index = list.findIndex(v => v.id === ticketId);
  if (index === -1) return null;
  const removed = list.splice(index, 1)[0];
  safeSetJSON(STORAGE_KEYS.ACTIVE, list);
  return removed;
}

/**
 * Obtém o histórico completo de movimentações finalizadas.
 * @returns {Array<Object>} Coleção de registros históricos
 */
export function getHistory() {
  const list = safeGetJSON(STORAGE_KEYS.HISTORY, []);
  return Array.isArray(list) ? list : [];
}

/**
 * Adiciona um registro finalizado ao histórico (imutável).
 * @param {Object} record - Registro concluído com pagamento
 * @returns {Array<Object>} Histórico atualizado
 */
export function saveHistoryRecord(record) {
  const list = getHistory();
  list.unshift(record); // Insere no início (mais recente primeiro)
  safeSetJSON(STORAGE_KEYS.HISTORY, list);
  return list;
}

/**
 * Limpa todos os dados operacionais e restaura as configurações de fábrica (Reset).
 */
export function resetAllData() {
  const storage = getStorage();
  storage.removeItem(STORAGE_KEYS.ACTIVE);
  storage.removeItem(STORAGE_KEYS.HISTORY);
  saveSettings(DEFAULT_SETTINGS);
}

/**
 * Popula a base com dados realistas de demonstração (Seed) para testes acadêmicos.
 */
export function seedDemoData() {
  const now = Date.now();
  const minutesAgo = (min) => new Date(now - min * 60 * 1000).toISOString();

  // Veículos ativos demonstrativos
  const demoActive = [
    {
      id: generateUniqueId('PK'),
      plate: 'BRA2E19',
      vehicleType: 'car',
      driverName: 'Carlos Mendonça',
      entryTime: minutesAgo(35), // 35 min atrás -> 1ª hora
      status: 'active',
      appliedPricing: { hourlyRate: 10.00, toleranceMinutes: 10, fractionMinutes: 15, fractionPercent: 0.25 }
    },
    {
      id: generateUniqueId('PK'),
      plate: 'FTC2026',
      vehicleType: 'car',
      driverName: 'Mariana Souza',
      entryTime: minutesAgo(75), // 75 min atrás -> 1h + 1 fração (R$ 12,50)
      status: 'active',
      appliedPricing: { hourlyRate: 10.00, toleranceMinutes: 10, fractionMinutes: 15, fractionPercent: 0.25 }
    },
    {
      id: generateUniqueId('PK'),
      plate: 'MOT4411',
      vehicleType: 'moto',
      driverName: 'Rodrigo Lima',
      entryTime: minutesAgo(8), // 8 min atrás -> tolerância (R$ 0,00)
      status: 'active',
      appliedPricing: { hourlyRate: 5.00, toleranceMinutes: 10, fractionMinutes: 15, fractionPercent: 0.25 }
    },
    {
      id: generateUniqueId('PK'),
      plate: 'ABC1234',
      vehicleType: 'car',
      driverName: 'Lucas Ferreira',
      entryTime: minutesAgo(140), // 140 min atrás -> 2h 20 min (R$ 25,00)
      status: 'active',
      appliedPricing: { hourlyRate: 10.00, toleranceMinutes: 10, fractionMinutes: 15, fractionPercent: 0.25 }
    }
  ];

  // Histórico demonstrativo com saídas já finalizadas hoje
  const demoHistory = [
    {
      id: generateUniqueId('PK'),
      plate: 'XYZ9876',
      vehicleType: 'car',
      driverName: 'Ana Paula',
      entryTime: minutesAgo(180),
      exitTime: minutesAgo(120),
      totalMinutes: 60,
      formattedDuration: '1h 00min',
      totalCharged: 10.00,
      payment: { method: 'pix', methodLabel: 'Pix', amountPaid: 10.00, changeAmount: 0 },
      status: 'completed',
      finalizedAt: minutesAgo(120)
    },
    {
      id: generateUniqueId('PK'),
      plate: 'DEF5678',
      vehicleType: 'moto',
      driverName: 'Gabriel Ribeiro',
      entryTime: minutesAgo(110),
      exitTime: minutesAgo(30),
      totalMinutes: 80,
      formattedDuration: '1h 20min',
      totalCharged: 7.50, // 5 + 2*1.25
      payment: { method: 'credit', methodLabel: 'Cartão de Crédito', amountPaid: 7.50, changeAmount: 0 },
      status: 'completed',
      finalizedAt: minutesAgo(30)
    },
    {
      id: generateUniqueId('PK'),
      plate: 'KLU3020',
      vehicleType: 'car',
      driverName: 'Renato Silva',
      entryTime: minutesAgo(90),
      exitTime: minutesAgo(85),
      totalMinutes: 5,
      formattedDuration: '5 min',
      totalCharged: 0.00,
      payment: { method: 'tolerance', methodLabel: 'Isento / Tolerância', amountPaid: 0, changeAmount: 0 },
      status: 'completed',
      finalizedAt: minutesAgo(85)
    },
    {
      id: generateUniqueId('PK'),
      plate: 'OPQ4321',
      vehicleType: 'car',
      driverName: 'Beatriz Almeida',
      entryTime: minutesAgo(240),
      exitTime: minutesAgo(150),
      totalMinutes: 90,
      formattedDuration: '1h 30min',
      totalCharged: 15.00,
      payment: { method: 'money', methodLabel: 'Dinheiro', amountPaid: 20.00, changeAmount: 5.00 },
      status: 'completed',
      finalizedAt: minutesAgo(150)
    }
  ];

  safeSetJSON(STORAGE_KEYS.ACTIVE, demoActive);
  safeSetJSON(STORAGE_KEYS.HISTORY, demoHistory);
}

