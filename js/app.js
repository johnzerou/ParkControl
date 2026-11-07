/**
 * ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
 * js/app.js — Controlador Principal de Interface, Navegação, Eventos e Modais
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 */

import {
  getSettings,
  saveSettings,
  getActiveVehicles,
  getHistory,
  resetToFactory,
  seedDemoData
} from './storage.js';

import {
  registerVehicleEntry,
  previewVehicleCheckout,
  completeVehicleCheckout,
  getCapacityStatus
} from './parking.js';

import {
  getFinancialMetrics,
  getPaymentMethodLabel,
  getFilteredHistory,
  generateHistoryCSV
} from './finance.js';

import {
  getDashboardMetrics,
  renderMovementsChartSVG,
  renderCategoryBreakdownHTML,
  renderPaymentDistributionSVG
} from './dashboard.js';

import {
  formatPlateDisplay,
  formatBRL,
  formatDateTimeBR,
  formatDuration,
  getLocalDatetimeInputValue,
  escapeHTML
} from './utils.js';

/* ==================== ESTADO DA INTERFACE ==================== */
const AppState = {
  currentView: 'dashboard',
  selectedCheckoutVehicleId: null,
  selectedPaymentMethod: 'pix',
  currentCheckoutPreview: null,
  financePeriod: 'all',
  liveTimerId: null
};

/* ==================== INICIALIZAÇÃO ==================== */
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initHeaderClock();
  initEntryForm();
  initParkedSection();
  initHistorySection();
  initFinanceSection();
  initSettingsSection();
  initModals();
  initDemoAndResetButtons();

  refreshAllViews();

  // Atualiza tempos de permanência e parciais a cada 30 segundos
  AppState.liveTimerId = setInterval(() => {
    if (AppState.currentView === 'parked' || AppState.currentView === 'dashboard') {
      renderParkedTable();
      renderDashboardView();
    }
  }, 30000);
});

/* ==================== SISTEMA DE NOTIFICAÇÕES (TOAST) ==================== */
export function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: '✓',
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

/* ==================== NAVEGAÇÃO ENTRE SEÇÕES ==================== */
function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn[data-view]');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebar = document.querySelector('.sidebar');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetView = btn.getAttribute('data-view');
      navigateTo(targetView);
      if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  });

  document.querySelectorAll('[data-goto-view]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const target = trigger.getAttribute('data-goto-view');
      navigateTo(target);
    });
  });

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

function navigateTo(viewName) {
  AppState.currentView = viewName;

  document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view') === viewName);
  });

  document.querySelectorAll('.app-view').forEach(section => {
    section.classList.toggle('active', section.id === `view-${viewName}`);
  });

  const viewTitles = {
    dashboard: 'Dashboard',
    entry: 'Entradas',
    parked: 'Veículos no Pátio',
    history: 'Histórico',
    finance: 'Financeiro',
    settings: 'Configurações'
  };

  const pageTitleEl = document.getElementById('current-page-title');
  if (pageTitleEl && viewTitles[viewName]) {
    pageTitleEl.textContent = viewTitles[viewName];
  }

  if (viewName === 'entry') {
    const timeInput = document.getElementById('entry-time');
    if (timeInput) timeInput.value = getLocalDatetimeInputValue();
    updateEntrySpotsAvailability();
  } else if (viewName === 'settings') {
    populateSettingsForm();
  }

  refreshAllViews();
}

/* ==================== RELÓGIO E STATUS GLOBAL ==================== */
function initHeaderClock() {
  const clockEl = document.getElementById('header-live-clock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  updateClock();
  setInterval(updateClock, 1000);
}

function updateGlobalHeaderAndBadges() {
  const settings = getSettings();
  const capacity = getCapacityStatus();

  const estNameEl = document.getElementById('header-establishment-name');
  if (estNameEl) estNameEl.textContent = settings.establishmentName;

  const parkedBadge = document.getElementById('nav-parked-count');
  if (parkedBadge) parkedBadge.textContent = capacity.totalOccupied;

  const headerSpotsEl = document.getElementById('header-available-spots');
  if (headerSpotsEl) {
    headerSpotsEl.textContent = `${capacity.totalAvailable} de ${capacity.totalCapacity} vagas livres`;
  }
}

function refreshAllViews() {
  updateGlobalHeaderAndBadges();
  renderDashboardView();
  updateEntrySpotsAvailability();
  renderParkedTable();
  renderHistoryTable();
  renderFinanceView();
}

/* ==================== 1. DASHBOARD ==================== */
function renderDashboardView() {
  const data = getDashboardMetrics();
  const active = getActiveVehicles();
  const history = getHistory();

  setText('dash-total-spots', data.capacity.totalCapacity);
  setText('dash-avail-spots', data.capacity.totalAvailable);
  setText('dash-avail-details', `${data.capacity.car.available} carros · ${data.capacity.moto.available} motos`);
  setText('dash-occupied-spots', data.capacity.totalOccupied);
  setText('dash-occupancy-rate', `${data.capacity.occupancyRate}%`);
  setText('dash-entries-today', data.entriesTodayCount);
  setText('dash-exits-today', data.exitsTodayCount);
  setText('dash-today-revenue', formatBRL(data.todayRevenue));

  const progressFill = document.getElementById('dash-occupancy-bar');
  if (progressFill) {
    progressFill.style.width = `${Math.min(100, data.capacity.occupancyRate)}%`;
    progressFill.style.backgroundColor =
      data.capacity.occupancyRate >= 90 ? '#EF4444' :
      data.capacity.occupancyRate >= 70 ? '#F59E0B' : '#3B82F6';
  }

  const chartContainer = document.getElementById('dash-chart-container');
  if (chartContainer) {
    chartContainer.innerHTML = renderMovementsChartSVG(active, history);
  }

  const catBreakdownEl = document.getElementById('dash-category-breakdown');
  if (catBreakdownEl) {
    catBreakdownEl.innerHTML = renderCategoryBreakdownHTML(data.capacity);
  }

  const recentTbody = document.getElementById('dash-recent-tbody');
  if (!recentTbody) return;

  if (data.recentActivities.length === 0) {
    recentTbody.innerHTML = `
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
    if (newEntryBtn) newEntryBtn.addEventListener('click', () => navigateTo('entry'));
    const seedBtn = document.getElementById('dash-empty-seed');
    if (seedBtn) {
      seedBtn.addEventListener('click', () => {
        seedDemoData();
        refreshAllViews();
        showToast('Demonstração carregada', 'Veículos no pátio e histórico preenchidos.', 'success');
      });
    }
    return;
  }

  recentTbody.innerHTML = data.recentActivities.map(act => {
    const isCar = act.vehicleType === 'car';
    const typeBadge = isCar
      ? `<span class="badge badge-car">Carro</span>`
      : `<span class="badge badge-moto">Moto</span>`;

    const statusBadge = act.status === 'active'
      ? `<span class="badge badge-active">No pátio</span>`
      : `<span class="badge badge-completed">Finalizado</span>`;

    const rightCell = act.status === 'completed'
      ? `<span class="mono" style="color: #E5E7EB; font-weight: 600;">${formatBRL(act.totalCharged)}</span>`
      : `<button type="button" class="btn btn-secondary btn-xs btn-dash-checkout" data-id="${escapeHTML(act.id)}">Registrar saída</button>`;

    return `
      <tr>
        <td><span class="plate-tag">${escapeHTML(formatPlateDisplay(act.plate))}</span></td>
        <td>${typeBadge}</td>
        <td style="color: #E5E7EB;">${escapeHTML(act.driverName || '—')}</td>
        <td class="mono">${formatDateTimeBR(act.timestamp)}</td>
        <td>${statusBadge}</td>
        <td class="col-right">${rightCell}</td>
      </tr>
    `;
  }).join('');

  recentTbody.querySelectorAll('.btn-dash-checkout').forEach(btn => {
    btn.addEventListener('click', () => {
      openCheckoutModal(btn.getAttribute('data-id'));
    });
  });
}

/* ==================== 2. REGISTRO DE ENTRADA ==================== */
function initEntryForm() {
  const form = document.getElementById('form-entry');
  const plateInput = document.getElementById('entry-plate');
  const timeInput = document.getElementById('entry-time');
  const typeCards = document.querySelectorAll('.vehicle-type-card');

  if (timeInput) {
    timeInput.value = getLocalDatetimeInputValue();
  }

  typeCards.forEach(card => {
    card.addEventListener('click', () => {
      typeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  if (plateInput) {
    plateInput.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (val.length > 8) val = val.slice(0, 8);
      e.target.value = val;
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const plate = document.getElementById('entry-plate').value;
      const driverName = document.getElementById('entry-driver').value;
      const entryTimeRaw = document.getElementById('entry-time').value;
      const checkedRadio = document.querySelector('input[name="entry-vehicle-type"]:checked');
      const vehicleType = checkedRadio ? checkedRadio.value : 'car';

      const entryIso = entryTimeRaw ? new Date(entryTimeRaw).toISOString() : new Date().toISOString();

      const result = registerVehicleEntry({
        plate,
        vehicleType,
        driverName,
        entryTime: entryIso
      });

      if (!result.success) {
        showToast('Entrada recusada', result.error, 'error');
        return;
      }

      showToast(
        'Entrada registrada',
        `Veículo ${formatPlateDisplay(result.ticket.plate)} (${result.ticket.id}) alocado no pátio.`,
        'success'
      );

      form.reset();
      if (timeInput) timeInput.value = getLocalDatetimeInputValue();
      typeCards.forEach((c, idx) => c.classList.toggle('selected', idx === 0));

      refreshAllViews();
      openEntryTicketModal(result.ticket);
    });
  }
}

function updateEntrySpotsAvailability() {
  const cap = getCapacityStatus();
  const settings = getSettings();

  setText('entry-car-spots-info', `${cap.car.available} de ${cap.car.total} livres`);
  setText('entry-moto-spots-info', `${cap.moto.available} de ${cap.moto.total} livres`);

  setText('entry-side-car-rate', formatBRL(settings.carFirstHourRate));
  setText('entry-side-moto-rate', formatBRL(settings.motoFirstHourRate));
  setText('entry-side-fraction', `${settings.additionalHourRatePercent}% da 1ª hora`);
  setText('entry-side-tolerance', `${settings.toleranceMinutes} min`);
  setText('entry-side-car-avail', `${cap.car.available} / ${cap.car.total} livres`);
  setText('entry-side-moto-avail', `${cap.moto.available} / ${cap.moto.total} livres`);

  const submitBtn = document.getElementById('btn-submit-entry');
  if (submitBtn) {
    submitBtn.disabled = cap.isFull;
    submitBtn.textContent = cap.isFull ? 'Pátio lotado' : 'Confirmar entrada';
  }
}

/* ==================== 3. VEÍCULOS NO PÁTIO ==================== */
function initParkedSection() {
  const searchInput = document.getElementById('parked-search');
  const typeSelect = document.getElementById('parked-type-filter');

  if (searchInput) {
    searchInput.addEventListener('input', () => renderParkedTable());
  }
  if (typeSelect) {
    typeSelect.addEventListener('change', () => renderParkedTable());
  }
}

function renderParkedTable() {
  const tbody = document.getElementById('parked-tbody');
  if (!tbody) return;

  const searchVal = (document.getElementById('parked-search')?.value || '').trim().toUpperCase();
  const typeVal = document.getElementById('parked-type-filter')?.value || 'all';

  const activeVehicles = getActiveVehicles();
  const filtered = activeVehicles.filter(v => {
    const matchesSearch = !searchVal ||
      v.plate.includes(searchVal.replace(/[^A-Z0-9]/g, '')) ||
      (v.driverName && v.driverName.toUpperCase().includes(searchVal)) ||
      (v.id && v.id.toUpperCase().includes(searchVal));

    const matchesType = typeVal === 'all' || v.vehicleType === typeVal;
    return matchesSearch && matchesType;
  });

  setText('parked-filtered-count', filtered.length);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <div class="empty-state-title">Nenhum veículo no pátio</div>
            <div class="empty-state-desc">Não há veículos ativos correspondentes aos filtros selecionados.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(v => {
    const preview = previewVehicleCheckout(v.id);
    const durationText = preview.success ? preview.preview.billing.durationFormatted : '0min';
    const partialAmount = preview.success ? formatBRL(preview.preview.billing.totalCharged) : 'R$ 0,00';

    const typeBadge = v.vehicleType === 'car'
      ? `<span class="badge badge-car">Carro</span>`
      : `<span class="badge badge-moto">Moto</span>`;

    return `
      <tr>
        <td class="mono">${escapeHTML(v.id)}</td>
        <td><span class="plate-tag">${escapeHTML(formatPlateDisplay(v.plate))}</span></td>
        <td>${typeBadge}</td>
        <td style="color: #E5E7EB;">${escapeHTML(v.driverName || '—')}</td>
        <td class="mono">${formatDateTimeBR(v.entryTime)}</td>
        <td class="mono" style="color: #93C5FD;">${durationText}</td>
        <td class="col-right mono" style="color: #E5E7EB; font-weight: 600;">${partialAmount}</td>
        <td class="col-right">
          <div class="table-actions">
            <button type="button" class="btn btn-secondary btn-xs btn-view-ticket" data-id="${escapeHTML(v.id)}">Ticket</button>
            <button type="button" class="btn btn-primary btn-xs btn-checkout-vehicle" data-id="${escapeHTML(v.id)}">Registrar saída</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-checkout-vehicle').forEach(btn => {
    btn.addEventListener('click', () => openCheckoutModal(btn.getAttribute('data-id')));
  });

  tbody.querySelectorAll('.btn-view-ticket').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const vehicle = getActiveVehicles().find(item => item.id === id);
      if (vehicle) openEntryTicketModal(vehicle);
    });
  });
}

/* ==================== 4. MODAL DE SAÍDA E CAIXA ==================== */
function initModals() {
  document.getElementById('checkout-modal-close')?.addEventListener('click', closeCheckoutModal);
  document.getElementById('checkout-cancel-btn')?.addEventListener('click', closeCheckoutModal);

  const methodBtns = document.querySelectorAll('.payment-method-btn');
  methodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      methodBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      AppState.selectedPaymentMethod = btn.getAttribute('data-method');
      updateCheckoutPaymentMethodUI();
    });
  });

  const cashInput = document.getElementById('checkout-cash-received');
  if (cashInput) {
    cashInput.addEventListener('input', updateCashChangeDisplay);
  }

  document.getElementById('checkout-confirm-btn')?.addEventListener('click', handleConfirmCheckout);

  document.getElementById('entry-ticket-close')?.addEventListener('click', () => {
    document.getElementById('modal-entry-ticket')?.classList.remove('open');
  });
  document.getElementById('entry-ticket-print')?.addEventListener('click', () => window.print());

  document.getElementById('receipt-modal-close')?.addEventListener('click', () => {
    document.getElementById('modal-receipt')?.classList.remove('open');
  });
  document.getElementById('receipt-modal-print')?.addEventListener('click', () => window.print());
}

function openCheckoutModal(vehicleId) {
  const result = previewVehicleCheckout(vehicleId);
  if (!result.success) {
    showToast('Erro na saída', result.error, 'error');
    return;
  }

  AppState.selectedCheckoutVehicleId = vehicleId;
  AppState.currentCheckoutPreview = result.preview;
  AppState.selectedPaymentMethod = 'pix';

  const { vehicle, exitTime, billing } = result.preview;

  setText('checkout-plate-display', formatPlateDisplay(vehicle.plate));
  setText('checkout-ticket-id', vehicle.id);

  const typeBadgeEl = document.getElementById('checkout-type-badge');
  if (typeBadgeEl) {
    typeBadgeEl.innerHTML = vehicle.vehicleType === 'car'
      ? '<span class="badge badge-car">Carro / Utilitário</span>'
      : '<span class="badge badge-moto">Motocicleta</span>';
  }

  setText('checkout-entry-time', formatDateTimeBR(vehicle.entryTime));
  setText('checkout-exit-time', formatDateTimeBR(exitTime));
  setText('checkout-duration', billing.durationFormatted);
  setText('checkout-total-price', formatBRL(billing.totalCharged));
  setText('checkout-memory-summary', billing.memorySummary);

  document.querySelectorAll('.payment-method-btn').forEach(btn => {
    btn.classList.toggle('selected', btn.getAttribute('data-method') === 'pix');
  });

  const cashInput = document.getElementById('checkout-cash-received');
  if (cashInput) cashInput.value = billing.totalCharged.toFixed(2);

  updateCheckoutPaymentMethodUI();

  const modal = document.getElementById('modal-checkout');
  if (modal) modal.classList.add('open');
}

function updateCheckoutPaymentMethodUI() {
  const cashContainer = document.getElementById('checkout-cash-container');
  const pixContainer = document.getElementById('checkout-pix-container');

  if (cashContainer) {
    cashContainer.style.display = AppState.selectedPaymentMethod === 'money' ? 'block' : 'none';
  }
  if (pixContainer) {
    pixContainer.style.display = AppState.selectedPaymentMethod === 'pix' ? 'flex' : 'none';
  }

  if (AppState.selectedPaymentMethod === 'money') {
    updateCashChangeDisplay();
  }
}

function updateCashChangeDisplay() {
  const cashInput = document.getElementById('checkout-cash-received');
  const changeEl = document.getElementById('checkout-change-display');
  if (!cashInput || !changeEl || !AppState.currentCheckoutPreview) return;

  const total = AppState.currentCheckoutPreview.billing.totalCharged;
  const received = parseFloat(cashInput.value) || 0;
  const diff = received - total;

  if (diff < 0) {
    changeEl.textContent = `Faltam ${formatBRL(Math.abs(diff))}`;
    changeEl.style.color = '#EF4444';
  } else {
    changeEl.textContent = formatBRL(diff);
    changeEl.style.color = '#22C55E';
  }
}

function handleConfirmCheckout() {
  if (!AppState.selectedCheckoutVehicleId || !AppState.currentCheckoutPreview) return;

  const total = AppState.currentCheckoutPreview.billing.totalCharged;
  let cashReceived = total;

  if (AppState.selectedPaymentMethod === 'money') {
    const cashInput = document.getElementById('checkout-cash-received');
    cashReceived = parseFloat(cashInput?.value || 0);
  }

  const result = completeVehicleCheckout({
    vehicleId: AppState.selectedCheckoutVehicleId,
    paymentMethod: AppState.selectedPaymentMethod,
    cashReceived,
    exitTime: AppState.currentCheckoutPreview.exitTime
  });

  if (!result.success) {
    showToast('Pagamento pendente', result.error, 'error');
    return;
  }

  closeCheckoutModal();
  refreshAllViews();

  showToast(
    'Saída concluída',
    `Placa ${formatPlateDisplay(result.receipt.plate)} liberada (${formatBRL(result.receipt.totalCharged)}).`,
    'success'
  );

  openReceiptModal(result.receipt);
}

function closeCheckoutModal() {
  const modal = document.getElementById('modal-checkout');
  if (modal) modal.classList.remove('open');
  AppState.selectedCheckoutVehicleId = null;
  AppState.currentCheckoutPreview = null;
}

/* ==================== COMPROVANTES (ENTRADA E RECIBO) ==================== */
function openEntryTicketModal(ticket) {
  const settings = getSettings();
  setText('ticket-est-name', settings.establishmentName);
  setText('ticket-id-display', ticket.id);
  setText('ticket-plate-display', formatPlateDisplay(ticket.plate));
  setText('ticket-type-display', ticket.vehicleType === 'car' ? 'Carro / Utilitário' : 'Motocicleta');
  setText('ticket-entry-time-display', formatDateTimeBR(ticket.entryTime));
  setText('ticket-driver-display', ticket.driverName || 'Não informado');
  setText('ticket-rules-display', `Tolerância: ${settings.toleranceMinutes} min | 1ª hora: ${formatBRL(ticket.vehicleType === 'car' ? settings.carFirstHourRate : settings.motoFirstHourRate)}`);

  document.getElementById('modal-entry-ticket')?.classList.add('open');
}

function openReceiptModal(receipt) {
  const settings = getSettings();
  setText('receipt-est-name', settings.establishmentName);
  setText('receipt-id-display', receipt.id);
  setText('receipt-plate-display', formatPlateDisplay(receipt.plate));
  setText('receipt-type-display', receipt.vehicleType === 'car' ? 'Carro / Utilitário' : 'Motocicleta');
  setText('receipt-entry-display', formatDateTimeBR(receipt.entryTime));
  setText('receipt-exit-display', formatDateTimeBR(receipt.exitTime));
  setText('receipt-duration-display', receipt.durationFormatted || formatDuration(receipt.durationMinutes));
  setText('receipt-memory-display', receipt.memorySummary);
  setText('receipt-total-display', formatBRL(receipt.totalCharged));
  setText('receipt-method-display', getPaymentMethodLabel(receipt.paymentMethod));

  document.getElementById('modal-receipt')?.classList.add('open');
}

/* ==================== 5. HISTÓRICO DE MOVIMENTAÇÕES ==================== */
function initHistorySection() {
  const inputs = ['history-search', 'history-type-filter', 'history-start-date', 'history-end-date'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', renderHistoryTable);
      el.addEventListener('change', renderHistoryTable);
    }
  });

  document.getElementById('history-clear-filters')?.addEventListener('click', () => {
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = id === 'history-type-filter' ? 'all' : '';
    });
    renderHistoryTable();
  });

  document.getElementById('history-export-csv')?.addEventListener('click', () => {
    const filtered = getCurrentFilteredHistory();
    if (filtered.length === 0) {
      showToast('Exportação vazia', 'Não há registros no filtro atual para exportar.', 'warning');
      return;
    }
    const csvContent = generateHistoryCSV(filtered);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `historico_parkcontrol_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('Arquivo exportado', 'Relatório CSV gerado com sucesso.', 'success');
  });
}

function getCurrentFilteredHistory() {
  return getFilteredHistory({
    search: document.getElementById('history-search')?.value || '',
    vehicleType: document.getElementById('history-type-filter')?.value || 'all',
    startDate: document.getElementById('history-start-date')?.value || '',
    endDate: document.getElementById('history-end-date')?.value || ''
  });
}

function renderHistoryTable() {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  const filtered = getCurrentFilteredHistory();
  setText('history-filtered-count', filtered.length);

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="empty-state">
            <div class="empty-state-title">Nenhum registro encontrado</div>
            <div class="empty-state-desc">As operações finalizadas aparecerão nesta listagem.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(h => {
    const typeBadge = h.vehicleType === 'car'
      ? `<span class="badge badge-car">Carro</span>`
      : `<span class="badge badge-moto">Moto</span>`;

    return `
      <tr>
        <td class="mono">${escapeHTML(h.id)}</td>
        <td><span class="plate-tag">${escapeHTML(formatPlateDisplay(h.plate))}</span></td>
        <td>${typeBadge}</td>
        <td class="mono">${formatDateTimeBR(h.entryTime)}</td>
        <td class="mono">${formatDateTimeBR(h.exitTime)}</td>
        <td class="mono">${h.durationFormatted || formatDuration(h.durationMinutes)}</td>
        <td>${escapeHTML(getPaymentMethodLabel(h.paymentMethod))}</td>
        <td class="col-right mono" style="color: #E5E7EB; font-weight: 600;">${formatBRL(h.totalCharged)}</td>
        <td class="col-right">
          <button type="button" class="btn btn-secondary btn-xs btn-history-receipt" data-id="${escapeHTML(h.id)}">Recibo</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-history-receipt').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const record = getHistory().find(item => item.id === id);
      if (record) openReceiptModal(record);
    });
  });
}

/* ==================== 6. FINANCEIRO ==================== */
function initFinanceSection() {
  const periodBtns = document.querySelectorAll('.finance-period-btn');
  periodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      periodBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      AppState.financePeriod = btn.getAttribute('data-period');
      renderFinanceView();
    });
  });
}

function renderFinanceView() {
  const metrics = getFinancialMetrics(AppState.financePeriod);

  setText('fin-total-revenue', formatBRL(metrics.totalRevenue));
  setText('fin-today-revenue', formatBRL(metrics.todayRevenue));
  setText('fin-payments-count', metrics.paymentsCount);
  setText('fin-average-ticket', formatBRL(metrics.averageTicket));

  const chartBox = document.getElementById('fin-payment-distribution-chart');
  if (chartBox) {
    chartBox.innerHTML = renderPaymentDistributionSVG(metrics.byMethod);
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

  tbody.innerHTML = metrics.records.slice(0, 15).map(r => `
    <tr>
      <td class="mono">${formatDateTimeBR(r.exitTime)}</td>
      <td><span class="plate-tag">${escapeHTML(formatPlateDisplay(r.plate))}</span></td>
      <td class="mono">${r.durationFormatted || formatDuration(r.durationMinutes)}</td>
      <td>${escapeHTML(getPaymentMethodLabel(r.paymentMethod))}</td>
      <td class="col-right mono" style="color: #22C55E; font-weight: 600;">${formatBRL(r.totalCharged)}</td>
    </tr>
  `).join('');
}

/* ==================== 7. CONFIGURAÇÕES ==================== */
function initSettingsSection() {
  populateSettingsForm();

  const form = document.getElementById('form-settings');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const capacity = getCapacityStatus();
    const newCarSpots = parseInt(document.getElementById('setting-car-spots').value, 10);
    const newMotoSpots = parseInt(document.getElementById('setting-moto-spots').value, 10);
    const newCarRate = parseFloat(document.getElementById('setting-car-rate').value);
    const newMotoRate = parseFloat(document.getElementById('setting-moto-rate').value);
    const newTolerance = parseInt(document.getElementById('setting-tolerance').value, 10);
    const newFraction = parseInt(document.getElementById('setting-fraction').value, 10);
    const newName = document.getElementById('setting-parking-name').value.trim();

    if (newCarSpots < capacity.car.occupied) {
      showToast('Capacidade inválida', `Há ${capacity.car.occupied} carro(s) no pátio no momento.`, 'error');
      return;
    }
    if (newMotoSpots < capacity.moto.occupied) {
      showToast('Capacidade inválida', `Há ${capacity.moto.occupied} moto(s) no pátio no momento.`, 'error');
      return;
    }

    if (newCarRate <= 0 || newMotoRate <= 0) {
      showToast('Tarifa inválida', 'Os valores da 1ª hora devem ser maiores que zero.', 'error');
      return;
    }

    saveSettings({
      establishmentName: newName || 'Estacionamento Central',
      carSpots: newCarSpots,
      motoSpots: newMotoSpots,
      carFirstHourRate: newCarRate,
      motoFirstHourRate: newMotoRate,
      toleranceMinutes: newTolerance,
      additionalHourRatePercent: newFraction
    });

    refreshAllViews();
    showToast('Configurações salvas', 'Parâmetros operacionais atualizados.', 'success');
  });
}

function populateSettingsForm() {
  const s = getSettings();
  const cap = getCapacityStatus();

  setInputValue('setting-parking-name', s.establishmentName);
  setInputValue('setting-car-spots', s.carSpots);
  setInputValue('setting-moto-spots', s.motoSpots);
  setInputValue('setting-car-rate', s.carFirstHourRate);
  setInputValue('setting-moto-rate', s.motoFirstHourRate);
  setInputValue('setting-tolerance', s.toleranceMinutes);
  setInputValue('setting-fraction', s.additionalHourRatePercent);

  const occInfo = document.getElementById('settings-current-occupancy-info');
  if (occInfo) {
    occInfo.textContent = `Ocupação atual: ${cap.car.occupied} carro(s) e ${cap.moto.occupied} moto(s) no pátio.`;
  }
}

/* ==================== DEMONSTRAÇÃO E LIMPEZA DE DADOS ==================== */
function initDemoAndResetButtons() {
  document.querySelectorAll('.btn-seed-demo').forEach(btn => {
    btn.addEventListener('click', () => {
      seedDemoData();
      populateSettingsForm();
      refreshAllViews();
      showToast('Demonstração carregada', 'Pátio e histórico preenchidos com registros realistas.', 'success');
    });
  });

  document.querySelectorAll('.btn-reset-data').forEach(btn => {
    btn.addEventListener('click', () => {
      const confirmed = window.confirm('Deseja limpar todos os veículos no pátio e o histórico de movimentações?');
      if (!confirmed) return;

      resetToFactory();
      populateSettingsForm();
      refreshAllViews();
      showToast('Dados limpos', 'Registros removidos e configurações restauradas.', 'info');
    });
  });
}

/* ==================== HELPERS DOM ==================== */
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}
