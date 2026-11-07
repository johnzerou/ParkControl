/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/app.js — Orquestrador SPA, Gerenciamento de Eventos, Telas e Modais
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import {
  escapeHTML,
  formatPlate,
  normalizePlate,
  formatBRL,
  formatDateTime,
  formatTimeOnly,
  formatDateOnly,
  formatDuration,
  calculateMinutesDifference,
  getLocalDatetimeInputValue
} from './utils.js';

import {
  getSettings,
  getActiveVehicles,
  getHistory,
  resetAllData,
  seedDemoData
} from './storage.js';

import {
  getCapacityStatus,
  isSlotAvailable
} from './parking.js';

import {
  registerVehicleEntry,
  filterActiveVehicles,
  findActiveVehicle
} from './vehicles.js';

import {
  calculateParkingFee,
  calculateCashPayment
} from './pricing.js';

import {
  finalizeVehicleExit,
  filterHistory,
  downloadCSV
} from './history.js';

import {
  getFinancialMetrics
} from './finance.js';

import {
  updateParkingSettings
} from './settings.js';

import {
  getDashboardMetrics,
  renderMovementsChartSVG,
  renderCategoryBreakdownHTML,
  renderPaymentDistributionSVG
} from './dashboard.js';

// Estado global da interface SPA
let currentView = 'dashboard';
let currentCheckoutTicket = null;
let currentReceiptData = null;
let financePeriod = 'all';

/* ==========================================================================
   Inicialização do Sistema
   ========================================================================== */
export function initApp() {
  if (typeof document === 'undefined') return;

  // Inicialização padrão segura de configurações (sem apagar dados existentes)
  getSettings();

  setupNavigation();
  setupHeaderClock();
  setupEntryForm();
  setupParkedView();
  setupCheckoutModal();
  setupHistoryView();
  setupFinanceView();
  setupSettingsView();
  setupDemoAndReset();
  setupMobileSidebar();

  // Renderização inicial completa
  updateHeaderStatus();
  renderDashboard();
  renderEntryView();
  renderParkedList();
  renderHistoryList();
  renderFinanceDashboard();
  renderSettingsForm();

  // Loop de atualização em tempo real (atualiza relógio e estimativas a cada segundo)
  setInterval(() => {
    updateHeaderClock();
    if (currentView === 'parked') {
      updateParkedDurationsAndFees();
    }
  }, 1000);
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

/* ==========================================================================
   Navegação e Alternância de Telas (SPA)
   ========================================================================== */
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn[data-view]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.dataset.view;
      if (targetView) {
        navigateTo(targetView);
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.classList.remove('open');
          sidebar.classList.remove('mobile-open');
        }
      }
    });
  });

  // Atalhos rápidos no Dashboard, Entradas ou Cabeçalho
  document.querySelectorAll('[data-goto-view]').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.gotoView;
      if (view) navigateTo(view);
    });
  });
}

export function navigateTo(viewName) {
  currentView = viewName;

  // Atualiza estado ativo nos botões e itens da Sidebar
  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle('active', isActive);
    const parentItem = btn.closest('.nav-item');
    if (parentItem) parentItem.classList.toggle('active', isActive);
  });

  // Alterna contêiner de visualização
  document.querySelectorAll('.app-view').forEach(view => {
    view.classList.toggle('active', view.id === `view-${viewName}`);
  });

  // Atualiza título do cabeçalho
  const titles = {
    dashboard: 'Dashboard',
    entry: 'Entradas',
    parked: 'Veículos no Pátio',
    history: 'Histórico',
    finance: 'Financeiro',
    settings: 'Configurações'
  };
  const titleEl = document.getElementById('current-page-title');
  if (titleEl && titles[viewName]) {
    titleEl.textContent = titles[viewName];
  }

  renderCurrentView();
  updateHeaderStatus();
}

export function renderCurrentView() {
  switch (currentView) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'entry':
      renderEntryView();
      break;
    case 'parked':
      renderParkedList();
      break;
    case 'history':
      renderHistoryList();
      break;
    case 'finance':
      renderFinanceDashboard();
      break;
    case 'settings':
      renderSettingsForm();
      break;
  }
}

/* ==========================================================================
   Cabeçalho, Relógio e Badges Globais
   ========================================================================== */
function setupHeaderClock() {
  updateHeaderClock();
}

function updateHeaderClock() {
  const clockEl = document.getElementById('header-live-clock');
  if (!clockEl) return;
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function updateHeaderStatus() {
  const capacity = getCapacityStatus();
  const settings = getSettings();

  const headerEstablishment = document.getElementById('header-establishment-name');
  if (headerEstablishment) {
    headerEstablishment.textContent = settings.parkingName;
  }

  const badgeSpots = document.getElementById('header-available-spots');
  if (badgeSpots) {
    badgeSpots.textContent = `${capacity.totalAvailable} de ${capacity.totalSpots} vagas livres`;
  }

  const parkedBadgeCount = document.getElementById('nav-parked-count');
  if (parkedBadgeCount) {
    parkedBadgeCount.textContent = capacity.totalOccupied;
  }
}

/* ==========================================================================
   Tela 1 — Dashboard
   ========================================================================== */
export function renderDashboard() {
  const metrics = getDashboardMetrics();

  const totalSpotsEl = document.getElementById('dash-total-spots');
  if (totalSpotsEl) totalSpotsEl.textContent = metrics.capacity.totalSpots;

  const availSpotsEl = document.getElementById('dash-avail-spots');
  if (availSpotsEl) availSpotsEl.textContent = `${metrics.capacity.totalAvailable}`;

  const availDetailsEl = document.getElementById('dash-avail-details');
  if (availDetailsEl) {
    availDetailsEl.textContent = `${metrics.capacity.cars.available} carros · ${metrics.capacity.motos.available} motos`;
  }

  const occupiedSpotsEl = document.getElementById('dash-occupied-spots');
  if (occupiedSpotsEl) occupiedSpotsEl.textContent = metrics.capacity.totalOccupied;

  const occupancyRateEl = document.getElementById('dash-occupancy-rate');
  if (occupancyRateEl) {
    occupancyRateEl.textContent = `${metrics.capacity.overallOccupancyPct}%`;
  }

  const progressBar = document.getElementById('dash-occupancy-bar');
  if (progressBar) {
    const pct = Math.min(100, metrics.capacity.overallOccupancyPct);
    progressBar.style.width = `${pct}%`;
    progressBar.style.backgroundColor =
      pct >= 90 ? '#EF4444' :
      pct >= 70 ? '#F59E0B' : '#3B82F6';
  }

  const entriesTodayEl = document.getElementById('dash-entries-today');
  if (entriesTodayEl) entriesTodayEl.textContent = metrics.entriesTodayCount;

  const exitsTodayEl = document.getElementById('dash-exits-today');
  if (exitsTodayEl) exitsTodayEl.textContent = metrics.exitsTodayCount;

  const todayRevenueEl = document.getElementById('dash-today-revenue');
  if (todayRevenueEl) todayRevenueEl.textContent = formatBRL(metrics.todayRevenue);

  // Gráfico SVG de Movimentações por Horário
  const chartContainer = document.getElementById('dash-chart-container');
  if (chartContainer) {
    const active = getActiveVehicles();
    const history = getHistory();
    chartContainer.innerHTML = renderMovementsChartSVG(active, history);
  }

  // Ocupação por Categoria + Mapa de Vagas
  const catBreakdownEl = document.getElementById('dash-category-breakdown');
  if (catBreakdownEl) {
    catBreakdownEl.innerHTML = renderCategoryBreakdownHTML(metrics.capacity);
  }

  // Tabela de Movimentações do Dia
  const recentTableBody = document.getElementById('dash-recent-tbody');
  if (!recentTableBody) return;

  if (metrics.recentActivities.length === 0) {
    recentTableBody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <div class="empty-state-title">Sem movimentações registradas</div>
            <div class="empty-state-desc">Registre a entrada de um veículo ou carregue os dados de demonstração na barra lateral.</div>
            <div class="empty-state-actions">
              <button type="button" class="btn btn-primary btn-xs" id="dash-empty-new-entry">Nova Entrada</button>
              <button type="button" class="btn btn-secondary btn-xs" id="dash-empty-seed">Carregar demonstração</button>
            </div>
          </div>
        </td>
      </tr>
    `;

    const newEntryBtn = document.getElementById('dash-empty-new-entry');
    if (newEntryBtn) {
      newEntryBtn.addEventListener('click', () => navigateTo('entry'));
    }

    const seedBtn = document.getElementById('dash-empty-seed');
    if (seedBtn) {
      seedBtn.addEventListener('click', () => triggerSeedDemo());
    }
    return;
  }

  recentTableBody.innerHTML = metrics.recentActivities.map(act => `
    <tr>
      <td><span class="plate-tag">${escapeHTML(formatPlate(act.plate))}</span></td>
      <td>
        <span class="badge ${act.vehicleType === 'car' ? 'badge-car' : 'badge-moto'}">
          ${act.vehicleType === 'car' ? 'Carro' : 'Moto'}
        </span>
      </td>
      <td style="color: #E5E7EB;">${escapeHTML(act.driverName || '—')}</td>
      <td class="mono">${formatDateTime(act.timestamp)}</td>
      <td>
        <span class="badge ${act.status === 'active' ? 'badge-active' : 'badge-completed'}">
          ${act.status === 'active' ? 'No pátio' : 'Finalizado'}
        </span>
      </td>
      <td class="col-right">
        ${act.status === 'active'
          ? `<button type="button" class="btn btn-secondary btn-xs action-checkout-btn" data-id="${escapeHTML(act.id)}">Registrar saída</button>`
          : `<span class="mono" style="font-weight: 600; color: #E5E7EB;">${formatBRL(act.totalCharged)}</span>`
        }
      </td>
    </tr>
  `).join('');

  recentTableBody.querySelectorAll('.action-checkout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openCheckoutModal(btn.dataset.id);
    });
  });
}

/* ==========================================================================
   Tela 2 — Entrada de Veículos
   ========================================================================== */
function setupEntryForm() {
  const form = document.getElementById('form-entry');
  const plateInput = document.getElementById('entry-plate');
  const typeCards = document.querySelectorAll('.vehicle-type-card');

  if (plateInput) {
    plateInput.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (val.length > 8) val = val.slice(0, 8);
      e.target.value = val;
    });
  }

  typeCards.forEach(card => {
    card.addEventListener('click', () => {
      typeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleEntrySubmit();
    });

    form.addEventListener('reset', () => {
      setTimeout(() => {
        typeCards.forEach((c, idx) => {
          c.classList.toggle('selected', idx === 0);
          const radio = c.querySelector('input[type="radio"]');
          if (radio) radio.checked = idx === 0;
        });
        const timeInput = document.getElementById('entry-time');
        if (timeInput) timeInput.value = getLocalDatetimeInputValue();
      }, 0);
    });
  }
}

export function renderEntryView() {
  const capacity = getCapacityStatus();
  const settings = getSettings();

  const carSpotsInfo = document.getElementById('entry-car-spots-info');
  if (carSpotsInfo) {
    carSpotsInfo.textContent = `${capacity.cars.available} vagas livres (${formatBRL(settings.carHourlyRate)}/h)`;
  }

  const motoSpotsInfo = document.getElementById('entry-moto-spots-info');
  if (motoSpotsInfo) {
    motoSpotsInfo.textContent = `${capacity.motos.available} vagas livres (${formatBRL(settings.motoHourlyRate)}/h)`;
  }

  // Painel lateral de tarifas e disponibilidade
  const sideCarRate = document.getElementById('entry-side-car-rate');
  if (sideCarRate) sideCarRate.textContent = formatBRL(settings.carHourlyRate);

  const sideMotoRate = document.getElementById('entry-side-moto-rate');
  if (sideMotoRate) sideMotoRate.textContent = formatBRL(settings.motoHourlyRate);

  const sideFraction = document.getElementById('entry-side-fraction');
  if (sideFraction) sideFraction.textContent = `${settings.fractionMinutes} min (25% da 1ª h)`;

  const sideTolerance = document.getElementById('entry-side-tolerance');
  if (sideTolerance) sideTolerance.textContent = `${settings.toleranceMinutes} min`;

  const sideCarAvail = document.getElementById('entry-side-car-avail');
  if (sideCarAvail) sideCarAvail.textContent = `${capacity.cars.available} / ${capacity.cars.total} livres`;

  const sideMotoAvail = document.getElementById('entry-side-moto-avail');
  if (sideMotoAvail) sideMotoAvail.textContent = `${capacity.motos.available} / ${capacity.motos.total} livres`;

  const timeInput = document.getElementById('entry-time');
  if (timeInput && !timeInput.value) {
    timeInput.value = getLocalDatetimeInputValue();
  }
}

function handleEntrySubmit() {
  const plateInput = document.getElementById('entry-plate');
  const driverInput = document.getElementById('entry-driver');
  const timeInput = document.getElementById('entry-time');
  const selectedTypeRadio = document.querySelector('input[name="entry-vehicle-type"]:checked');

  const plate = plateInput ? plateInput.value.trim() : '';
  const vehicleType = selectedTypeRadio ? selectedTypeRadio.value : 'car';
  const driverName = driverInput ? driverInput.value.trim() : '';
  const entryTimeVal = timeInput && timeInput.value ? new Date(timeInput.value) : new Date();

  try {
    const ticket = registerVehicleEntry({
      plate,
      vehicleType,
      driverName,
      entryTime: entryTimeVal
    });

    showToast('Entrada registrada', `Veículo ${formatPlate(ticket.plate)} alocado no pátio (${ticket.id}).`, 'success');

    if (plateInput) plateInput.value = '';
    if (driverInput) driverInput.value = '';
    if (timeInput) timeInput.value = getLocalDatetimeInputValue();

    updateHeaderStatus();
    renderEntryView();
    renderDashboard();
    renderParkedList();

    openEntryTicketModal(ticket);
  } catch (err) {
    showToast('Entrada recusada', err.message, 'danger');
  }
}

/* ==========================================================================
   Tela 3 — Veículos no Pátio
   ========================================================================== */
function setupParkedView() {
  const searchInput = document.getElementById('parked-search');
  const typeFilter = document.getElementById('parked-type-filter');

  if (searchInput) {
    searchInput.addEventListener('input', () => renderParkedList());
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', () => renderParkedList());
  }
}

export function renderParkedList() {
  const searchInput = document.getElementById('parked-search');
  const typeFilter = document.getElementById('parked-type-filter');

  const query = searchInput ? searchInput.value : '';
  const type = (typeFilter && typeFilter.value) ? typeFilter.value : 'all';

  const vehicles = filterActiveVehicles(query, type);
  const tbody = document.getElementById('parked-tbody');
  const countBadge = document.getElementById('parked-filtered-count');

  if (countBadge) {
    countBadge.textContent = `${vehicles.length}`;
  }

  if (!tbody) return;

  if (vehicles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-state-title">Nenhum veículo no pátio</div>
            <div class="empty-state-desc">${query ? 'Nenhum veículo ativo corresponde à busca informada.' : 'Não há veículos estacionados no momento.'}</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const now = new Date();

  tbody.innerHTML = vehicles.map(v => {
    const feeInfo = calculateParkingFee({
      entryTime: v.entryTime,
      exitTime: now.toISOString(),
      hourlyRate: v.appliedPricing.hourlyRate,
      toleranceMinutes: v.appliedPricing.toleranceMinutes,
      fractionMinutes: v.appliedPricing.fractionMinutes,
      fractionPercent: v.appliedPricing.fractionPercent
    });

    return `
      <tr data-ticket-id="${escapeHTML(v.id)}" data-entry-time="${escapeHTML(v.entryTime)}">
        <td class="mono">${escapeHTML(v.id)}</td>
        <td><span class="plate-tag">${escapeHTML(formatPlate(v.plate))}</span></td>
        <td>
          <span class="badge ${v.vehicleType === 'car' ? 'badge-car' : 'badge-moto'}">
            ${v.vehicleType === 'car' ? 'Carro' : 'Moto'}
          </span>
        </td>
        <td style="color: #E5E7EB;">${escapeHTML(v.driverName || '—')}</td>
        <td class="mono">${formatDateTime(v.entryTime)}</td>
        <td class="col-duration mono" style="color: #93C5FD;">${feeInfo.formattedDuration}</td>
        <td class="col-estimated-fee col-right mono" style="font-weight: 600; color: #E5E7EB;">
          ${formatBRL(feeInfo.totalAmount)}
        </td>
        <td class="col-right">
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-xs btn-action-view-ticket" data-id="${escapeHTML(v.id)}">
              Ticket
            </button>
            <button type="button" class="btn btn-primary btn-xs btn-action-checkout" data-id="${escapeHTML(v.id)}">
              Registrar saída
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-action-checkout').forEach(btn => {
    btn.addEventListener('click', () => openCheckoutModal(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-action-view-ticket').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = findActiveVehicle(btn.dataset.id);
      if (v) openEntryTicketModal(v);
    });
  });
}

function updateParkedDurationsAndFees() {
  const rows = document.querySelectorAll('#parked-tbody tr[data-ticket-id]');
  if (rows.length === 0) return;

  const activeVehicles = getActiveVehicles();
  const now = new Date();

  rows.forEach(row => {
    const ticketId = row.dataset.ticketId;
    const vehicle = activeVehicles.find(v => v.id === ticketId);
    if (!vehicle) return;

    const feeInfo = calculateParkingFee({
      entryTime: vehicle.entryTime,
      exitTime: now.toISOString(),
      hourlyRate: vehicle.appliedPricing.hourlyRate,
      toleranceMinutes: vehicle.appliedPricing.toleranceMinutes,
      fractionMinutes: vehicle.appliedPricing.fractionMinutes,
      fractionPercent: vehicle.appliedPricing.fractionPercent
    });

    const durationCol = row.querySelector('.col-duration');
    const feeCol = row.querySelector('.col-estimated-fee');

    if (durationCol) durationCol.textContent = feeInfo.formattedDuration;
    if (feeCol) feeCol.textContent = formatBRL(feeInfo.totalAmount);
  });
}

/* ==========================================================================
   Tela 4 — Modal de Saída e Pagamento (Checkout)
   ========================================================================== */
function setupCheckoutModal() {
  const modal = document.getElementById('modal-checkout');
  const closeBtn = document.getElementById('checkout-modal-close');
  const cancelBtn = document.getElementById('checkout-cancel-btn');
  const confirmBtn = document.getElementById('checkout-confirm-btn');
  const methodButtons = document.querySelectorAll('.payment-method-btn');
  const cashAmountInput = document.getElementById('checkout-cash-received');

  const closeModal = () => {
    if (modal) {
      modal.classList.remove('open');
      modal.classList.remove('active');
    }
    currentCheckoutTicket = null;
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  methodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      methodButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      const method = btn.dataset.method;
      togglePaymentInputs(method);
    });
  });

  if (cashAmountInput) {
    cashAmountInput.addEventListener('input', () => {
      updateCashCalculation();
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      handleCheckoutConfirm();
    });
  }
}

export function openCheckoutModal(ticketId) {
  const ticket = findActiveVehicle(ticketId);
  if (!ticket) {
    showToast('Atenção', 'Permanência não encontrada.', 'warning');
    return;
  }

  currentCheckoutTicket = ticket;
  const modal = document.getElementById('modal-checkout');
  if (!modal) return;

  const now = new Date();
  const feeInfo = calculateParkingFee({
    entryTime: ticket.entryTime,
    exitTime: now.toISOString(),
    hourlyRate: ticket.appliedPricing.hourlyRate,
    toleranceMinutes: ticket.appliedPricing.toleranceMinutes,
    fractionMinutes: ticket.appliedPricing.fractionMinutes,
    fractionPercent: ticket.appliedPricing.fractionPercent
  });

  document.getElementById('checkout-plate-display').textContent = formatPlate(ticket.plate);
  document.getElementById('checkout-ticket-id').textContent = ticket.id;

  const typeBadgeEl = document.getElementById('checkout-type-badge');
  if (typeBadgeEl) {
    typeBadgeEl.innerHTML = ticket.vehicleType === 'car'
      ? '<span class="badge badge-car">Carro / Utilitário</span>'
      : '<span class="badge badge-moto">Motocicleta</span>';
  }

  document.getElementById('checkout-entry-time').textContent = formatDateTime(ticket.entryTime);
  document.getElementById('checkout-exit-time').textContent = formatDateTime(now);
  document.getElementById('checkout-duration').textContent = feeInfo.formattedDuration;
  document.getElementById('checkout-total-price').textContent = formatBRL(feeInfo.totalAmount);
  document.getElementById('checkout-memory-summary').textContent = feeInfo.summary;

  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('selected'));
  const defaultMethodBtn = document.querySelector('.payment-method-btn[data-method="pix"]');
  if (defaultMethodBtn) defaultMethodBtn.classList.add('selected');
  togglePaymentInputs('pix');

  modal.classList.add('open');
  modal.classList.add('active');
}

function togglePaymentInputs(method) {
  const cashContainer = document.getElementById('checkout-cash-container');
  const pixContainer = document.getElementById('checkout-pix-container');
  const cashInput = document.getElementById('checkout-cash-received');
  const confirmBtn = document.getElementById('checkout-confirm-btn');

  if (cashContainer) {
    cashContainer.style.display = method === 'money' ? 'block' : 'none';
  }
  if (pixContainer) {
    pixContainer.style.display = method === 'pix' ? 'flex' : 'none';
  }

  if (method === 'money' && cashInput && currentCheckoutTicket) {
    const feeInfo = calculateParkingFee({
      entryTime: currentCheckoutTicket.entryTime,
      exitTime: new Date().toISOString(),
      hourlyRate: currentCheckoutTicket.appliedPricing.hourlyRate,
      toleranceMinutes: currentCheckoutTicket.appliedPricing.toleranceMinutes,
      fractionMinutes: currentCheckoutTicket.appliedPricing.fractionMinutes,
      fractionPercent: currentCheckoutTicket.appliedPricing.fractionPercent
    });
    cashInput.value = feeInfo.totalAmount.toFixed(2);
    updateCashCalculation();
  } else if (confirmBtn) {
    confirmBtn.disabled = false;
  }
}

function updateCashCalculation() {
  if (!currentCheckoutTicket) return;
  const cashInput = document.getElementById('checkout-cash-received');
  const changeDisplay = document.getElementById('checkout-change-display');
  const confirmBtn = document.getElementById('checkout-confirm-btn');

  const feeInfo = calculateParkingFee({
    entryTime: currentCheckoutTicket.entryTime,
    exitTime: new Date().toISOString(),
    hourlyRate: currentCheckoutTicket.appliedPricing.hourlyRate,
    toleranceMinutes: currentCheckoutTicket.appliedPricing.toleranceMinutes,
    fractionMinutes: currentCheckoutTicket.appliedPricing.fractionMinutes,
    fractionPercent: currentCheckoutTicket.appliedPricing.fractionPercent
  });

  const paidAmount = cashInput ? parseFloat(cashInput.value) || 0 : 0;
  const cashResult = calculateCashPayment(feeInfo.totalAmount, paidAmount);

  if (changeDisplay) {
    changeDisplay.textContent = cashResult.isValid ? formatBRL(cashResult.changeAmount) : `Faltam ${formatBRL(cashResult.missingAmount)}`;
    changeDisplay.style.color = cashResult.isValid ? 'var(--color-success)' : 'var(--color-danger)';
  }

  if (confirmBtn) {
    confirmBtn.disabled = !cashResult.isValid && feeInfo.totalAmount > 0;
  }
}

function handleCheckoutConfirm() {
  if (!currentCheckoutTicket) return;

  const selectedMethodBtn = document.querySelector('.payment-method-btn.selected');
  const paymentMethod = selectedMethodBtn ? selectedMethodBtn.dataset.method : 'pix';
  const cashInput = document.getElementById('checkout-cash-received');
  const amountPaid = paymentMethod === 'money' ? (cashInput ? parseFloat(cashInput.value) || 0 : 0) : 0;

  try {
    const finalizedRecord = finalizeVehicleExit({
      ticketId: currentCheckoutTicket.id,
      paymentMethod,
      amountPaid,
      exitTime: new Date()
    });

    showToast('Saída concluída', `Veículo ${formatPlate(finalizedRecord.plate)} liberado (${formatBRL(finalizedRecord.totalCharged)}).`, 'success');

    const checkoutModal = document.getElementById('modal-checkout');
    if (checkoutModal) {
      checkoutModal.classList.remove('open');
      checkoutModal.classList.remove('active');
    }
    currentCheckoutTicket = null;

    updateHeaderStatus();
    renderDashboard();
    renderParkedList();
    renderHistoryList();
    renderFinanceDashboard();

    openReceiptModal(finalizedRecord);
  } catch (err) {
    showToast('Falha na saída', err.message, 'danger');
  }
}

/* ==========================================================================
   Modais de Comprovante (Ticket de Entrada e Recibo de Pagamento)
   ========================================================================== */
export function openEntryTicketModal(ticket) {
  const modal = document.getElementById('modal-entry-ticket');
  if (!modal) return;

  const settings = getSettings();

  document.getElementById('ticket-est-name').textContent = settings.parkingName;
  document.getElementById('ticket-id-display').textContent = ticket.id;
  document.getElementById('ticket-plate-display').textContent = formatPlate(ticket.plate);
  document.getElementById('ticket-type-display').textContent = ticket.vehicleType === 'car' ? 'Carro / Utilitário' : 'Motocicleta';
  document.getElementById('ticket-entry-time-display').textContent = formatDateTime(ticket.entryTime);
  document.getElementById('ticket-driver-display').textContent = ticket.driverName || 'Não informado';
  document.getElementById('ticket-rules-display').textContent =
    `Tolerância: ${ticket.appliedPricing.toleranceMinutes} min | 1ª Hora: ${formatBRL(ticket.appliedPricing.hourlyRate)} | Fração ${ticket.appliedPricing.fractionMinutes} min: ${formatBRL(ticket.appliedPricing.hourlyRate * 0.25)}`;

  modal.classList.add('open');
  modal.classList.add('active');

  const closeBtn = document.getElementById('entry-ticket-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.remove('open');
      modal.classList.remove('active');
    };
  }

  const printBtn = document.getElementById('entry-ticket-print');
  if (printBtn) printBtn.onclick = () => window.print();
}

export function openReceiptModal(record) {
  const modal = document.getElementById('modal-receipt');
  if (!modal) return;

  const settings = getSettings();
  currentReceiptData = record;

  const summaryText =
    (record.calculationMemory && record.calculationMemory.summary) ||
    record.memorySummary ||
    `Permanência de ${record.formattedDuration || formatDuration(record.totalMinutes || 0)}.`;

  document.getElementById('receipt-est-name').textContent = settings.parkingName;
  document.getElementById('receipt-id-display').textContent = record.id;
  document.getElementById('receipt-plate-display').textContent = formatPlate(record.plate);
  document.getElementById('receipt-type-display').textContent = record.vehicleType === 'car' ? 'Carro / Utilitário' : 'Motocicleta';
  document.getElementById('receipt-entry-display').textContent = formatDateTime(record.entryTime);
  document.getElementById('receipt-exit-display').textContent = formatDateTime(record.exitTime);
  document.getElementById('receipt-duration-display').textContent = record.formattedDuration || formatDuration(record.totalMinutes || 0);
  document.getElementById('receipt-memory-display').textContent = summaryText;
  document.getElementById('receipt-total-display').textContent = formatBRL(record.totalCharged);
  document.getElementById('receipt-method-display').textContent = record.payment ? record.payment.methodLabel : 'Pix';

  modal.classList.add('open');
  modal.classList.add('active');

  const closeBtn = document.getElementById('receipt-modal-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.remove('open');
      modal.classList.remove('active');
    };
  }

  const printBtn = document.getElementById('receipt-modal-print');
  if (printBtn) printBtn.onclick = () => window.print();
}

/* ==========================================================================
   Tela 5 — Histórico de Movimentações
   ========================================================================== */
function setupHistoryView() {
  const searchInput = document.getElementById('history-search');
  const typeFilter = document.getElementById('history-type-filter');
  const startDateInput = document.getElementById('history-start-date');
  const endDateInput = document.getElementById('history-end-date');
  const clearBtn = document.getElementById('history-clear-filters');
  const exportBtn = document.getElementById('history-export-csv');

  const handleFilter = () => renderHistoryList();

  if (searchInput) searchInput.addEventListener('input', handleFilter);
  if (typeFilter) typeFilter.addEventListener('change', handleFilter);
  if (startDateInput) startDateInput.addEventListener('change', handleFilter);
  if (endDateInput) endDateInput.addEventListener('change', handleFilter);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (typeFilter) typeFilter.value = 'all';
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';
      renderHistoryList();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const records = getFilteredHistoryRecords();
      try {
        downloadCSV(records);
        showToast('Exportação concluída', `${records.length} registro(s) exportado(s) para CSV.`, 'success');
      } catch (err) {
        showToast('Exportação vazia', err.message, 'warning');
      }
    });
  }
}

function getFilteredHistoryRecords() {
  const query = document.getElementById('history-search')?.value || '';
  const vehicleType = document.getElementById('history-type-filter')?.value || 'all';
  const startDate = document.getElementById('history-start-date')?.value || '';
  const endDate = document.getElementById('history-end-date')?.value || '';

  return filterHistory({ query, vehicleType, startDate, endDate });
}

export function renderHistoryList() {
  const records = getFilteredHistoryRecords();
  const tbody = document.getElementById('history-tbody');
  const countBadge = document.getElementById('history-filtered-count');

  if (countBadge) countBadge.textContent = `${records.length}`;
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <div class="empty-state-title">Nenhum registro encontrado</div>
            <div class="empty-state-desc">Não há movimentações finalizadas para os critérios de pesquisa selecionados.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map(r => `
    <tr>
      <td class="mono">${escapeHTML(r.id)}</td>
      <td><span class="plate-tag">${escapeHTML(formatPlate(r.plate))}</span></td>
      <td>
        <span class="badge ${r.vehicleType === 'car' ? 'badge-car' : 'badge-moto'}">
          ${r.vehicleType === 'car' ? 'Carro' : 'Moto'}
        </span>
      </td>
      <td class="mono">${formatDateTime(r.entryTime)}</td>
      <td class="mono">${formatDateTime(r.exitTime)}</td>
      <td class="mono">${escapeHTML(r.formattedDuration || formatDuration(r.totalMinutes || 0))}</td>
      <td>${escapeHTML(r.payment ? r.payment.methodLabel : '—')}</td>
      <td class="col-right mono" style="font-weight: 600; color: #E5E7EB;">${formatBRL(r.totalCharged)}</td>
      <td class="col-right">
        <button type="button" class="btn btn-secondary btn-xs history-view-receipt-btn" data-id="${escapeHTML(r.id)}">
          Recibo
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.history-view-receipt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const rec = records.find(item => item.id === btn.dataset.id);
      if (rec) openReceiptModal(rec);
    });
  });
}

/* ==========================================================================
   Tela 6 — Módulo Financeiro
   ========================================================================== */
function setupFinanceView() {
  const periodButtons = document.querySelectorAll('.finance-period-btn');
  periodButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      periodButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      financePeriod = btn.dataset.period || 'all';
      renderFinanceDashboard();
    });
  });
}

export function renderFinanceDashboard() {
  const metrics = getFinancialMetrics(financePeriod);

  const totalRevEl = document.getElementById('fin-total-revenue');
  if (totalRevEl) totalRevEl.textContent = formatBRL(metrics.totalRevenue);

  const todayRevEl = document.getElementById('fin-today-revenue');
  if (todayRevEl) todayRevEl.textContent = formatBRL(metrics.todayRevenue);

  const countEl = document.getElementById('fin-payments-count');
  if (countEl) countEl.textContent = metrics.paymentCount;

  const avgEl = document.getElementById('fin-average-ticket');
  if (avgEl) avgEl.textContent = formatBRL(metrics.averageTicket);

  const chartEl = document.getElementById('fin-payment-distribution-chart');
  if (chartEl) {
    chartEl.innerHTML = renderPaymentDistributionSVG(metrics.byMethod);
  }

  const tbody = document.getElementById('fin-transactions-tbody');
  if (!tbody) return;

  if (metrics.records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state">
            <div class="empty-state-title">Sem pagamentos no período</div>
            <div class="empty-state-desc">Os lançamentos financeiros aparecerão após o encerramento de tickets.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = metrics.records.map(r => `
    <tr>
      <td class="mono">${formatDateTime(r.exitTime)}</td>
      <td><span class="plate-tag">${escapeHTML(formatPlate(r.plate))}</span></td>
      <td class="mono">${escapeHTML(r.formattedDuration || formatDuration(r.totalMinutes || 0))}</td>
      <td>${escapeHTML(r.payment ? r.payment.methodLabel : '—')}</td>
      <td class="col-right mono" style="font-weight: 600; color: #22C55E;">${formatBRL(r.totalCharged)}</td>
    </tr>
  `).join('');
}

/* ==========================================================================
   Tela 7 — Configurações
   ========================================================================== */
function setupSettingsView() {
  const form = document.getElementById('form-settings');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSettingsSave();
    });
  }
}

export function renderSettingsForm() {
  const settings = getSettings();
  const capacity = getCapacityStatus();

  const nameInput = document.getElementById('setting-parking-name');
  if (nameInput) nameInput.value = settings.parkingName;

  const carSpotsInput = document.getElementById('setting-car-spots');
  if (carSpotsInput) carSpotsInput.value = settings.totalCarSpots;

  const motoSpotsInput = document.getElementById('setting-moto-spots');
  if (motoSpotsInput) motoSpotsInput.value = settings.totalMotoSpots;

  const carRateInput = document.getElementById('setting-car-rate');
  if (carRateInput) carRateInput.value = settings.carHourlyRate.toFixed(2);

  const motoRateInput = document.getElementById('setting-moto-rate');
  if (motoRateInput) motoRateInput.value = settings.motoHourlyRate.toFixed(2);

  const toleranceInput = document.getElementById('setting-tolerance');
  if (toleranceInput) toleranceInput.value = settings.toleranceMinutes;

  const fractionInput = document.getElementById('setting-fraction');
  if (fractionInput) fractionInput.value = settings.fractionMinutes;

  const infoEl = document.getElementById('settings-current-occupancy-info');
  if (infoEl) {
    infoEl.textContent = `Ocupação atual: ${capacity.cars.occupied} carro(s) e ${capacity.motos.occupied} moto(s) no pátio.`;
  }
}

function handleSettingsSave() {
  const name = document.getElementById('setting-parking-name')?.value;
  const carSpots = document.getElementById('setting-car-spots')?.value;
  const motoSpots = document.getElementById('setting-moto-spots')?.value;
  const carRate = document.getElementById('setting-car-rate')?.value;
  const motoRate = document.getElementById('setting-moto-rate')?.value;
  const tolerance = document.getElementById('setting-tolerance')?.value;
  const fraction = document.getElementById('setting-fraction')?.value;

  try {
    updateParkingSettings({
      parkingName: name,
      totalCarSpots: carSpots,
      totalMotoSpots: motoSpots,
      carHourlyRate: carRate,
      motoHourlyRate: motoRate,
      toleranceMinutes: tolerance,
      fractionMinutes: fraction
    });

    showToast('Configurações salvas', 'Os parâmetros operacionais foram atualizados.', 'success');
    updateHeaderStatus();
    renderSettingsForm();
    renderEntryView();
    renderDashboard();
  } catch (err) {
    showToast('Erro ao salvar configurações', err.message, 'danger');
  }
}

/* ==========================================================================
   Botões de Demonstração (Seed) e Limpeza de Dados (Reset)
   ========================================================================== */
function triggerSeedDemo() {
  if (window.confirm('Deseja carregar os dados de demonstração (veículos ativos e histórico)? Os registros existentes serão preservados.')) {
    seedDemoData();
    showToast('Demonstração carregada', 'Pátio e histórico preenchidos com registros de demonstração.', 'info');
    updateHeaderStatus();
    renderDashboard();
    renderEntryView();
    renderParkedList();
    renderHistoryList();
    renderFinanceDashboard();
    renderSettingsForm();
  }
}

function setupDemoAndReset() {
  const seedBtns = document.querySelectorAll('.btn-seed-demo');
  const resetBtns = document.querySelectorAll('.btn-reset-data');

  seedBtns.forEach(btn => {
    btn.addEventListener('click', () => triggerSeedDemo());
  });

  resetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.confirm('ATENÇÃO: Deseja realmente limpar TODOS os dados operacionais e restaurar as configurações padrão de fábrica?')) {
        resetAllData();
        showToast('Dados limpos', 'Todos os registros foram apagados e as configurações iniciais restauradas.', 'warning');
        updateHeaderStatus();
        renderDashboard();
        renderEntryView();
        renderParkedList();
        renderHistoryList();
        renderFinanceDashboard();
        renderSettingsForm();
      }
    });
  });
}

/* ==========================================================================
   Menu Mobile e Toasts de Feedback Visual
   ========================================================================== */
function setupMobileSidebar() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      sidebar.classList.toggle('mobile-open');
    });
  }
}

export function showToast(title, message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
    danger: '✕',
    error: '✕',
    warning: '!',
    info: 'i'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <div class="toast-content">
      <div class="toast-title">${escapeHTML(title)}</div>
      <div class="toast-message">${escapeHTML(message)}</div>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 4000);
}
