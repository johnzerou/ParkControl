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
document.addEventListener('DOMContentLoaded', () => {
  // Inicialização padrão segura de configurações
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

  // Renderização inicial
  renderCurrentView();
  updateHeaderStatus();

  // Loop de atualização em tempo real (atualiza relógio e estimativas a cada segundo)
  setInterval(() => {
    updateHeaderClock();
    if (currentView === 'parked') {
      updateParkedDurationsAndFees();
    }
  }, 1000);
});

/* ==========================================================================
   Navegação e Alternância de Telas (SPA)
   ========================================================================== */
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetView = btn.dataset.view;
      if (targetView) {
        navigateTo(targetView);
        // Fecha sidebar no mobile ao clicar em um link
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('mobile-open');
      }
    });
  });

  // Atalhos rápidos no Dashboard ou cabeçalho
  document.querySelectorAll('[data-goto-view]').forEach(el => {
    el.addEventListener('click', () => {
      const view = el.dataset.gotoView;
      if (view) navigateTo(view);
    });
  });
}

export function navigateTo(viewName) {
  currentView = viewName;

  // Atualiza botões da Sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    const btn = item.querySelector('.nav-btn');
    if (btn && btn.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Alterna contêiner de visualização
  document.querySelectorAll('.app-view').forEach(view => {
    if (view.id === `view-${viewName}`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });

  // Atualiza título do cabeçalho
  const titles = {
    dashboard: 'Visão Geral e Indicadores',
    entry: 'Entrada de Veículos',
    parked: 'Veículos Estacionados',
    history: 'Histórico de Movimentações',
    finance: 'Controle Financeiro',
    settings: 'Configurações do Sistema'
  };
  const titleEl = document.getElementById('current-page-title');
  if (titleEl && titles[viewName]) {
    titleEl.textContent = titles[viewName];
  }

  renderCurrentView();
  updateHeaderStatus();
}

function renderCurrentView() {
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
  clockEl.textContent = now.toLocaleTimeString('pt-BR');
}

function updateHeaderStatus() {
  const capacity = getCapacityStatus();
  const settings = getSettings();

  const headerEstablishment = document.getElementById('header-establishment-name');
  if (headerEstablishment) {
    headerEstablishment.textContent = settings.parkingName;
  }

  const badgeSpots = document.getElementById('header-available-spots');
  if (badgeSpots) {
    badgeSpots.textContent = `${capacity.totalAvailable} vagas livres`;
  }

  // Atualiza contador numérico na sidebar
  const parkedBadgeCount = document.getElementById('nav-parked-count');
  if (parkedBadgeCount) {
    parkedBadgeCount.textContent = capacity.totalOccupied;
  }
}

/* ==========================================================================
   Tela 1 — Dashboard
   ========================================================================== */
function renderDashboard() {
  const metrics = getDashboardMetrics();
  const settings = getSettings();

  // Atualiza Cards de KPI
  const totalSpotsEl = document.getElementById('dash-total-spots');
  if (totalSpotsEl) totalSpotsEl.textContent = metrics.capacity.totalSpots;

  const availSpotsEl = document.getElementById('dash-avail-spots');
  if (availSpotsEl) {
    availSpotsEl.textContent = `${metrics.capacity.totalAvailable}`;
  }

  const availDetailsEl = document.getElementById('dash-avail-details');
  if (availDetailsEl) {
    availDetailsEl.textContent = `${metrics.capacity.cars.available} carros | ${metrics.capacity.motos.available} motos`;
  }

  const occupiedSpotsEl = document.getElementById('dash-occupied-spots');
  if (occupiedSpotsEl) occupiedSpotsEl.textContent = metrics.capacity.totalOccupied;

  const occupancyRateEl = document.getElementById('dash-occupancy-rate');
  if (occupancyRateEl) {
    occupancyRateEl.textContent = `${metrics.capacity.overallOccupancyPct}%`;
  }

  const progressBar = document.getElementById('dash-occupancy-bar');
  if (progressBar) {
    progressBar.style.width = `${metrics.capacity.overallOccupancyPct}%`;
    progressBar.className = 'progress-bar-fill';
    if (metrics.capacity.overallOccupancyPct >= 90) progressBar.classList.add('danger');
    else if (metrics.capacity.overallOccupancyPct >= 70) progressBar.classList.add('warning');
  }

  const entriesTodayEl = document.getElementById('dash-entries-today');
  if (entriesTodayEl) entriesTodayEl.textContent = metrics.entriesTodayCount;

  const exitsTodayEl = document.getElementById('dash-exits-today');
  if (exitsTodayEl) exitsTodayEl.textContent = metrics.exitsTodayCount;

  const todayRevenueEl = document.getElementById('dash-today-revenue');
  if (todayRevenueEl) todayRevenueEl.textContent = formatBRL(metrics.todayRevenue);

  // Renderiza Gráfico SVG de Movimentações
  const chartContainer = document.getElementById('dash-chart-container');
  if (chartContainer) {
    const active = getActiveVehicles();
    const history = getHistory();
    chartContainer.innerHTML = renderMovementsChartSVG(active, history);
  }

  // Renderiza Tabela de Movimentações Recentes
  const recentTableBody = document.getElementById('dash-recent-tbody');
  if (recentTableBody) {
    if (metrics.recentActivities.length === 0) {
      recentTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">
            <p>Nenhuma movimentação registrada hoje.</p>
          </td>
        </tr>
      `;
    } else {
      recentTableBody.innerHTML = metrics.recentActivities.map(act => `
        <tr>
          <td><span class="plate-badge">${formatPlate(act.plate)}</span></td>
          <td>
            <span class="badge ${act.vehicleType === 'car' ? 'badge-car' : 'badge-moto'}">
              ${act.vehicleType === 'car' ? 'Carro' : 'Moto'}
            </span>
          </td>
          <td>${formatTimeOnly(act.timestamp)}</td>
          <td>
            <span class="badge ${act.status === 'active' ? 'badge-warning' : 'badge-success'}">
              ${act.status === 'active' ? 'Estacionado' : 'Finalizado'}
            </span>
          </td>
          <td>
            ${act.status === 'active' 
              ? `<button class="btn btn-outline btn-sm action-checkout-btn" data-id="${escapeHTML(act.id)}">Registrar Saída</button>`
              : `<span style="font-weight:700; color:var(--color-primary);">${formatBRL(act.totalCharged)}</span>`
            }
          </td>
        </tr>
      `).join('');

      // Liga os botões de saída rápida da tabela recente
      recentTableBody.querySelectorAll('.action-checkout-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          openCheckoutModal(btn.dataset.id);
        });
      });
    }
  }
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
      e.target.value = e.target.value.toUpperCase();
    });
  }

  // Seleção visual das categorias Carro / Moto
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
  }
}

function renderEntryView() {
  const capacity = getCapacityStatus();
  const settings = getSettings();

  // Atualiza indicadores de vagas nos cards de seleção
  const carSpotsInfo = document.getElementById('entry-car-spots-info');
  if (carSpotsInfo) {
    carSpotsInfo.textContent = `${capacity.cars.available} vagas livres (${formatBRL(settings.carHourlyRate)}/h)`;
  }

  const motoSpotsInfo = document.getElementById('entry-moto-spots-info');
  if (motoSpotsInfo) {
    motoSpotsInfo.textContent = `${capacity.motos.available} vagas livres (${formatBRL(settings.motoHourlyRate)}/h)`;
  }

  // Define data/hora atual no input
  const timeInput = document.getElementById('entry-time');
  if (timeInput) {
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

    showToast('Entrada Confirmada!', `Veículo ${formatPlate(ticket.plate)} registrado com sucesso.`, 'success');

    // Limpa formulário
    if (plateInput) plateInput.value = '';
    if (driverInput) driverInput.value = '';

    updateHeaderStatus();
    renderEntryView();

    // Abre comprovante do tíquete de entrada
    openEntryTicketModal(ticket);

  } catch (err) {
    showToast('Erro no Registro de Entrada', err.message, 'danger');
  }
}

/* ==========================================================================
   Tela 3 — Veículos Estacionados
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

function renderParkedList() {
  const searchInput = document.getElementById('parked-search');
  const typeFilter = document.getElementById('parked-type-filter');

  const query = searchInput ? searchInput.value : '';
  const type = typeFilter ? typeFilter.value : 'all';

  const vehicles = filterActiveVehicles(query, type);
  const tbody = document.getElementById('parked-tbody');
  const countBadge = document.getElementById('parked-filtered-count');

  if (countBadge) {
    countBadge.textContent = `${vehicles.length} veículo(s)`;
  }

  if (!tbody) return;

  if (vehicles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="2" y="5" width="20" height="14" rx="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
            <h4>Nenhum veículo encontrado</h4>
            <p>${query ? 'Nenhum veículo ativo corresponde à sua pesquisa.' : 'O pátio está vazio no momento. Registre novas entradas para começar.'}</p>
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
        <td><strong>${escapeHTML(v.id)}</strong></td>
        <td><span class="plate-badge">${formatPlate(v.plate)}</span></td>
        <td>
          <span class="badge ${v.vehicleType === 'car' ? 'badge-car' : 'badge-moto'}">
            ${v.vehicleType === 'car' ? 'Carro' : 'Moto'}
          </span>
        </td>
        <td>${formatDateTime(v.entryTime)}</td>
        <td class="col-duration" style="font-weight:600;">${feeInfo.formattedDuration}</td>
        <td class="col-estimated-fee" style="font-weight:700; color:var(--color-primary);">
          ${formatBRL(feeInfo.totalAmount)}
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-primary btn-sm btn-action-checkout" data-id="${escapeHTML(v.id)}">
              Registrar Saída
            </button>
            <button class="btn btn-outline btn-sm btn-action-view-ticket" data-id="${escapeHTML(v.id)}">
              Tíquete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Event Listeners nos botões da tabela
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
    if (modal) modal.classList.remove('active');
    currentCheckoutTicket = null;
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // Seleção do meio de pagamento
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

function openCheckoutModal(ticketId) {
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

  // Preenche dados do modal
  document.getElementById('checkout-plate-display').textContent = formatPlate(ticket.plate);
  document.getElementById('checkout-ticket-id').textContent = ticket.id;
  document.getElementById('checkout-type-badge').textContent = ticket.vehicleType === 'car' ? 'Carro' : 'Moto';
  document.getElementById('checkout-entry-time').textContent = formatDateTime(ticket.entryTime);
  document.getElementById('checkout-exit-time').textContent = formatDateTime(now);
  document.getElementById('checkout-duration').textContent = feeInfo.formattedDuration;
  document.getElementById('checkout-total-price').textContent = formatBRL(feeInfo.totalAmount);
  document.getElementById('checkout-memory-summary').textContent = feeInfo.summary;

  // Reseta seleção de método
  document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('selected'));
  const defaultMethodBtn = document.querySelector('.payment-method-btn[data-method="pix"]');
  if (defaultMethodBtn) defaultMethodBtn.classList.add('selected');
  togglePaymentInputs('pix');

  modal.classList.add('active');
}

function togglePaymentInputs(method) {
  const cashContainer = document.getElementById('checkout-cash-container');
  const pixContainer = document.getElementById('checkout-pix-container');
  const cashInput = document.getElementById('checkout-cash-received');

  if (cashContainer) {
    cashContainer.style.display = method === 'money' ? 'block' : 'none';
  }
  if (pixContainer) {
    pixContainer.style.display = method === 'pix' ? 'block' : 'none';
  }

  if (method === 'money' && cashInput) {
    cashInput.value = '';
    updateCashCalculation();
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
    changeDisplay.textContent = cashResult.message;
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

    showToast('Saída Concluída!', `Veículo ${formatPlate(finalizedRecord.plate)} liberado com sucesso.`, 'success');

    // Fecha modal de checkout
    const checkoutModal = document.getElementById('modal-checkout');
    if (checkoutModal) checkoutModal.classList.remove('active');

    // Atualiza interface
    updateHeaderStatus();
    renderCurrentView();

    // Abre Comprovante/Recibo final para impressão
    openReceiptModal(finalizedRecord);

  } catch (err) {
    showToast('Falha na Saída', err.message, 'danger');
  }
}

/* ==========================================================================
   Modais de Comprovante (Tíquete de Entrada e Recibo de Pagamento)
   ========================================================================== */
function openEntryTicketModal(ticket) {
  const modal = document.getElementById('modal-entry-ticket');
  if (!modal) return;

  const settings = getSettings();

  document.getElementById('ticket-est-name').textContent = settings.parkingName;
  document.getElementById('ticket-id-display').textContent = ticket.id;
  document.getElementById('ticket-plate-display').textContent = formatPlate(ticket.plate);
  document.getElementById('ticket-type-display').textContent = ticket.vehicleType === 'car' ? 'Carro' : 'Moto';
  document.getElementById('ticket-entry-time-display').textContent = formatDateTime(ticket.entryTime);
  document.getElementById('ticket-driver-display').textContent = ticket.driverName || 'Não Informado';
  document.getElementById('ticket-rules-display').textContent = `Tolerância: ${ticket.appliedPricing.toleranceMinutes} min | 1ª Hora: ${formatBRL(ticket.appliedPricing.hourlyRate)} | Fração 15 min: ${formatBRL(ticket.appliedPricing.hourlyRate * 0.25)}`;

  modal.classList.add('active');

  const closeBtn = document.getElementById('entry-ticket-close');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');

  const printBtn = document.getElementById('entry-ticket-print');
  if (printBtn) printBtn.onclick = () => window.print();
}

function openReceiptModal(record) {
  const modal = document.getElementById('modal-receipt');
  if (!modal) return;

  const settings = getSettings();
  currentReceiptData = record;

  document.getElementById('receipt-est-name').textContent = settings.parkingName;
  document.getElementById('receipt-id-display').textContent = record.id;
  document.getElementById('receipt-plate-display').textContent = formatPlate(record.plate);
  document.getElementById('receipt-type-display').textContent = record.vehicleType === 'car' ? 'Carro' : 'Moto';
  document.getElementById('receipt-entry-display').textContent = formatDateTime(record.entryTime);
  document.getElementById('receipt-exit-display').textContent = formatDateTime(record.exitTime);
  document.getElementById('receipt-duration-display').textContent = record.formattedDuration;
  document.getElementById('receipt-memory-display').textContent = record.calculationMemory.summary;
  document.getElementById('receipt-total-display').textContent = formatBRL(record.totalCharged);
  document.getElementById('receipt-method-display').textContent = record.payment.methodLabel;

  modal.classList.add('active');

  const closeBtn = document.getElementById('receipt-modal-close');
  if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');

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
        showToast('Exportação Concluída', `${records.length} registro(s) exportado(s) para CSV com sucesso.`, 'success');
      } catch (err) {
        showToast('Falha na Exportação', err.message, 'danger');
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

function renderHistoryList() {
  const records = getFilteredHistoryRecords();
  const tbody = document.getElementById('history-tbody');
  const countBadge = document.getElementById('history-filtered-count');

  if (countBadge) countBadge.textContent = `${records.length} movimentação(ões)`;
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <h4>Nenhum registro histórico encontrado</h4>
            <p>Não há movimentações concluídas correspondentes aos filtros aplicados.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map(r => `
    <tr>
      <td><span class="plate-badge">${formatPlate(r.plate)}</span></td>
      <td>
        <span class="badge ${r.vehicleType === 'car' ? 'badge-car' : 'badge-moto'}">
          ${r.vehicleType === 'car' ? 'Carro' : 'Moto'}
        </span>
      </td>
      <td>${formatDateTime(r.entryTime)}</td>
      <td>${formatDateTime(r.exitTime)}</td>
      <td>${r.formattedDuration}</td>
      <td style="font-weight:700; color:var(--color-primary);">${formatBRL(r.totalCharged)}</td>
      <td>
        <span class="badge badge-outline">${r.payment ? r.payment.methodLabel : '-'}</span>
      </td>
      <td>
        <button class="btn btn-outline btn-sm history-view-receipt-btn" data-id="${escapeHTML(r.id)}">
          Ver Recibo
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
      periodButtons.forEach(b => b.classList.remove('btn-primary'));
      periodButtons.forEach(b => b.classList.add('btn-secondary'));
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      financePeriod = btn.dataset.period || 'all';
      renderFinanceDashboard();
    });
  });
}

function renderFinanceDashboard() {
  const metrics = getFinancialMetrics(financePeriod);

  document.getElementById('fin-total-revenue').textContent = formatBRL(metrics.totalRevenue);
  document.getElementById('fin-today-revenue').textContent = formatBRL(metrics.todayRevenue);
  document.getElementById('fin-payments-count').textContent = metrics.paymentCount;
  document.getElementById('fin-average-ticket').textContent = formatBRL(metrics.averageTicket);

  // Renderiza gráfico SVG de distribuição
  const chartEl = document.getElementById('fin-payment-distribution-chart');
  if (chartEl) {
    chartEl.innerHTML = renderPaymentDistributionSVG(metrics.byMethod);
  }

  // Tabela de lançamentos financeiros
  const tbody = document.getElementById('fin-transactions-tbody');
  if (tbody) {
    if (metrics.records.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <p>Nenhuma transação financeira no período selecionado.</p>
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = metrics.records.map(r => `
        <tr>
          <td>${formatDateTime(r.exitTime)}</td>
          <td><strong>${escapeHTML(r.id)}</strong></td>
          <td><span class="plate-badge">${formatPlate(r.plate)}</span></td>
          <td>${r.payment ? r.payment.methodLabel : '-'}</td>
          <td>${r.formattedDuration}</td>
          <td style="font-weight:700; color:var(--color-success);">${formatBRL(r.totalCharged)}</td>
        </tr>
      `).join('');
    }
  }
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

function renderSettingsForm() {
  const settings = getSettings();
  const capacity = getCapacityStatus();

  document.getElementById('setting-parking-name').value = settings.parkingName;
  document.getElementById('setting-car-spots').value = settings.totalCarSpots;
  document.getElementById('setting-moto-spots').value = settings.totalMotoSpots;
  document.getElementById('setting-car-rate').value = settings.carHourlyRate.toFixed(2);
  document.getElementById('setting-moto-rate').value = settings.motoHourlyRate.toFixed(2);
  document.getElementById('setting-tolerance').value = settings.toleranceMinutes;
  document.getElementById('setting-fraction').value = settings.fractionMinutes;

  // Informa ocupação presente para referência da regra RN015
  const infoEl = document.getElementById('settings-current-occupancy-info');
  if (infoEl) {
    infoEl.textContent = `Ocupação atual no pátio: ${capacity.cars.occupied} carro(s) e ${capacity.motos.occupied} moto(s). Capacidades não podem ser menores que estes valores (RN015).`;
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
    const updated = updateParkingSettings({
      parkingName: name,
      totalCarSpots: carSpots,
      totalMotoSpots: motoSpots,
      carHourlyRate: carRate,
      motoHourlyRate: motoRate,
      toleranceMinutes: tolerance,
      fractionMinutes: fraction
    });

    showToast('Configurações Salvas!', 'Os parâmetros foram atualizados com sucesso.', 'success');
    updateHeaderStatus();
    renderSettingsForm();

  } catch (err) {
    showToast('Erro ao Salvar Configurações', err.message, 'danger');
  }
}

/* ==========================================================================
   Botões de Demonstração (Seed) e Reset de Fábrica
   ========================================================================== */
function setupDemoAndReset() {
  const seedBtns = document.querySelectorAll('.btn-seed-demo');
  const resetBtns = document.querySelectorAll('.btn-reset-data');

  seedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Deseja carregar dados de demonstração (veículos ativos e histórico)? Os dados atuais serão combinados ou atualizados.')) {
        seedDemoData();
        showToast('Demonstração Carregada!', 'Dados fictícios de demonstração injetados com sucesso para avaliação.', 'info');
        updateHeaderStatus();
        renderCurrentView();
      }
    });
  });

  resetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('ATENÇÃO: Deseja realmente limpar TODOS os dados operacionais e restaurar as configurações padrão de fábrica?')) {
        resetAllData();
        showToast('Reset Concluído', 'Todos os registros foram apagados e o sistema está limpo.', 'warning');
        updateHeaderStatus();
        renderCurrentView();
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
      sidebar.classList.toggle('mobile-open');
    });
  }
}

/**
 * Dispara uma notificação visual flutuante (Toast) no canto da tela (RNF007).
 * @param {string} title - Título da mensagem
 * @param {string} message - Conteúdo detalhado
 * @param {'success'|'danger'|'warning'|'info'} [type='success'] - Tipo do alerta
 */
export function showToast(title, message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <div class="toast-icon">
      ${type === 'success' ? '✓' : type === 'danger' ? '✕' : 'ℹ'}
    </div>
    <div class="toast-content">
      <h5>${escapeHTML(title)}</h5>
      <p>${escapeHTML(message)}</p>
    </div>
  `;

  container.appendChild(toast);

  // Auto-remoção após 4 segundos
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
