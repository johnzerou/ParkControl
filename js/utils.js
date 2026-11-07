/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/utils.js — Funções Utilitárias, Sanitização, Formatação e Validação
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

/**
 * Sanitiza strings para exibição segura no DOM, prevenindo vulnerabilidades de XSS (RNF010).
 * @param {string} str - Texto a ser sanitizado
 * @returns {string} Texto seguro com entidades HTML
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normaliza a placa veicular para caixa alta e remove caracteres especiais/espaços.
 * @param {string} plate - Placa informada
 * @returns {string} Placa limpa em letras maiúsculas
 */
export function normalizePlate(plate) {
  if (!plate) return '';
  return String(plate).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Valida a placa segundo as normas brasileiras: Padrão Tradicional (AAA-1234) ou Mercosul (AAA1B23) (RN013).
 * @param {string} plate - Placa a validar
 * @returns {boolean} True se válida
 */
export function isValidPlate(plate) {
  const clean = normalizePlate(plate);
  if (!clean || clean.length !== 7) return false;

  // Formato Antigo: 3 letras e 4 números (ex: ABC1234)
  const isTraditional = /^[A-Z]{3}[0-9]{4}$/.test(clean);

  // Formato Mercosul: 3 letras, 1 número, 1 letra, 2 números (ex: ABC1D23)
  const isMercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(clean);

  return isTraditional || isMercosul;
}

/**
 * Formata visualmente a placa para melhor legibilidade.
 * @param {string} plate - Placa limpa
 * @returns {string} Placa formatada (ex: "ABC-1234" ou "ABC1D23")
 */
export function formatPlate(plate) {
  const clean = normalizePlate(plate);
  if (!clean) return '';
  if (/^[A-Z]{3}[0-9]{4}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  }
  return clean;
}

/**
 * Formata um valor numérico para o padrão de moeda Real Brasileiro (BRL: R$ XX,XX).
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado em moeda brasileira
 */
export function formatBRL(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Calcula a diferença em minutos inteiros entre dois instantes no tempo (RN005).
 * @param {string|Date} start - Data/hora inicial
 * @param {string|Date} end - Data/hora final
 * @returns {number} Minutos totais decorridos
 */
export function calculateMinutesDifference(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) return 0;
  return Math.floor(diffMs / (1000 * 60));
}

/**
 * Formata uma quantidade de minutos em texto legível (ex: "1h 25min" ou "25min").
 * @param {number} minutes - Minutos totais
 * @returns {string} Representação formatada
 */
export function formatDuration(minutes) {
  const total = Math.max(0, Math.floor(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;

  if (hours === 0) {
    return `${mins} min`;
  }
  return `${hours}h ${mins < 10 ? '0' : ''}${mins}min`;
}

/**
 * Formata uma data ISO em representação completa (DD/MM/AAAA HH:mm:ss).
 * @param {string|Date} date - Data ISO
 * @returns {string} Data e hora formatada
 */
export function formatDateTime(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formata apenas o horário (HH:mm).
 * @param {string|Date} date - Data ISO
 * @returns {string} Horário formatado
 */
export function formatTimeOnly(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formata apenas a data (DD/MM/AAAA).
 * @param {string|Date} date - Data ISO
 * @returns {string} Data formatada
 */
export function formatDateOnly(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Gera um identificador único para o tíquete (RN003).
 * @param {string} prefix - Prefixo identificador (padrão 'PK')
 * @returns {string} Identificador único rastreável
 */
export function generateUniqueId(prefix = 'PK') {
  const timestamp = Date.now();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${timestamp}-${randomSuffix}`;
}

/**
 * Obtém a data e hora atual em formato ISO local para preenchimento de inputs datetime-local.
 * @param {Date} [date] - Data opcional
 * @returns {string} String formatada para input datetime-local (YYYY-MM-DDTHH:mm)
 */
export function getLocalDatetimeInputValue(date = new Date()) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
