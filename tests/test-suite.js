/**
 * ParkControl — Suíte de Testes Automatizados
 * tests/test-suite.js — Validação dos 15 Cenários de Homologação
 * Autores: João Pedro Ribas da Silva & Nicolas Ferreira Souza
 * FATEC Carapicuíba — ADS Noite 2026
 */

import {
  isValidPlate,
  normalizePlate,
  calculateMinutesDifference,
  formatDuration,
  formatBRL
} from '../js/utils.js';

import {
  getSettings,
  saveSettings,
  getActiveVehicles,
  getHistory,
  resetAllData
} from '../js/storage.js';

import {
  getCapacityStatus,
  isSlotAvailable
} from '../js/parking.js';

import {
  registerVehicleEntry,
  isPlateActive
} from '../js/vehicles.js';

import {
  calculateParkingFee,
  calculateCashPayment
} from '../js/pricing.js';

import {
  finalizeVehicleExit,
  filterHistory,
  generateHistoryCSV
} from '../js/history.js';

import {
  getFinancialMetrics
} from '../js/finance.js';

import {
  updateParkingSettings
} from '../js/settings.js';

const testResults = [];

function runTest(id, name, testFn) {
  try {
    testFn();
    testResults.push({ id, name, status: 'APROVADO', error: null });
    console.log(`[PASS] ${id}: ${name}`);
  } catch (err) {
    testResults.push({ id, name, status: 'FALHOU', error: err.message });
    console.error(`[FAIL] ${id}: ${name} -> ${err.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Asserção falhou');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Valores divergentes'}: esperado "${expected}", obtido "${actual}"`);
  }
}

console.log('================================================================');
console.log('INICIANDO SUÍTE DE TESTES DO PARKCONTROL — FATEC CARAPICUÍBA');
console.log('================================================================\n');

// Reset inicial para ambiente de teste limpo
resetAllData();

// CT01: Registro de um carro com vagas disponíveis
runTest('CT01', 'Registro de um carro com vagas disponíveis', () => {
  resetAllData();
  const initialCap = getCapacityStatus();
  assert(initialCap.cars.available > 0, 'Deveria haver vagas disponíveis para carros');

  const ticket = registerVehicleEntry({
    plate: 'ABC-1234',
    vehicleType: 'car',
    driverName: 'Carlos Silva'
  });

  assert(ticket.id.startsWith('PK-'), 'Tíquete deve conter ID com prefixo PK-');
  assertEqual(ticket.plate, 'ABC1234', 'Placa deve ser normalizada');
  assertEqual(ticket.vehicleType, 'car', 'Categoria deve ser car');
  assertEqual(ticket.status, 'active', 'Status deve ser active');
  assert(ticket.appliedPricing.hourlyRate === 10.00, 'Tarifa horária vinculada deve ser R$ 10,00');

  const afterCap = getCapacityStatus();
  assertEqual(afterCap.cars.occupied, 1, 'Carros ocupados deve ser 1');
  assertEqual(afterCap.cars.available, initialCap.cars.available - 1, 'Vagas disponíveis deve decrementar em 1');
});

// CT02: Tentativa de registrar duas entradas simultaneamente ativas para a mesma placa (RN001)
runTest('CT02', 'Tentativa de registrar duas entradas simultâneas com a mesma placa (RN001)', () => {
  resetAllData();
  registerVehicleEntry({ plate: 'BRA2E19', vehicleType: 'car' });

  let threw = false;
  try {
    registerVehicleEntry({ plate: 'BRA2E19', vehicleType: 'car' });
  } catch (err) {
    threw = true;
    assert(err.message.includes('já possui uma permanência ativa'), 'Mensagem de erro deve citar permanência ativa');
  }
  assert(threw, 'Deveria lançar erro ao tentar registrar placa repetida');
});

// CT03: Entrada quando o estacionamento está lotado (RN002)
runTest('CT03', 'Bloqueio de entrada quando a capacidade está lotada (RN002)', () => {
  resetAllData();
  // Configura capacidade de motos para 1 vaga
  saveSettings({ totalMotoSpots: 1 });

  // Ocupa a única vaga
  registerVehicleEntry({ plate: 'MOT1111', vehicleType: 'moto' });

  let threw = false;
  try {
    registerVehicleEntry({ plate: 'MOT2222', vehicleType: 'moto' });
  } catch (err) {
    threw = true;
    assert(err.message.includes('Capacidade esgotada'), 'Mensagem de erro deve indicar capacidade esgotada');
  }
  assert(threw, 'Deveria lançar erro por lotação esgotada');
});

// CT04: Registro de veículo com placa inválida (RN013)
runTest('CT04', 'Rejeição de registro com placas inválidas (RN013)', () => {
  resetAllData();
  const invalidPlates = ['123', 'ABCD12345', 'ABC@123', 'PLACA', ''];

  invalidPlates.forEach(plate => {
    let threw = false;
    try {
      registerVehicleEntry({ plate, vehicleType: 'car' });
    } catch (err) {
      threw = true;
      assert(err.message.includes('Formato de placa inválido'), `Deveria acusar erro de formato para placa: "${plate}"`);
    }
    assert(threw, `Placa inválida "${plate}" deveria ter sido rejeitada`);
  });

  // Testa se placa válida padrão Mercosul e Tradicional passam
  assert(isValidPlate('ABC-1234'), 'ABC-1234 tradicional deve ser válida');
  assert(isValidPlate('BRA2E19'), 'BRA2E19 Mercosul deve ser válida');
});

// CT05: Cálculo para permanência dentro da tolerância (RN007)
runTest('CT05', 'Cálculo tarifário dentro da tolerância de 10 minutos (RN007)', () => {
  const entry = '2026-11-07T10:00:00.000Z';
  const exit5m = '2026-11-07T10:05:00.000Z'; // 5 min
  const exit10m = '2026-11-07T10:10:00.000Z'; // 10 min exatos

  const res5m = calculateParkingFee({ entryTime: entry, exitTime: exit5m, hourlyRate: 10.00, toleranceMinutes: 10 });
  assertEqual(res5m.totalMinutes, 5, 'Duração de 5 minutos');
  assertEqual(res5m.withinTolerance, true, 'Deve estar dentro da tolerância');
  assertEqual(res5m.totalAmount, 0, 'Valor deve ser R$ 0,00');

  const res10m = calculateParkingFee({ entryTime: entry, exitTime: exit10m, hourlyRate: 10.00, toleranceMinutes: 10 });
  assertEqual(res10m.totalMinutes, 10, 'Duração de 10 minutos');
  assertEqual(res10m.withinTolerance, true, 'Deve estar dentro da tolerância no limite');
  assertEqual(res10m.totalAmount, 0, 'Valor no limite da tolerância deve ser R$ 0,00');
});

// CT06: Cálculo para permanência superior à primeira hora (RN008, RN009)
runTest('CT06', 'Cálculo para permanências superiores à primeira hora (RN008, RN009)', () => {
  const entry = '2026-11-07T10:00:00.000Z';

  // 11 minutos (ultrapassou tolerância -> 1ª hora cheia = R$ 10,00)
  const exit11m = '2026-11-07T10:11:00.000Z';
  const res11m = calculateParkingFee({ entryTime: entry, exitTime: exit11m, hourlyRate: 10.00, toleranceMinutes: 10 });
  assertEqual(res11m.totalAmount, 10.00, '11 min cobra 1ª hora cheia (R$ 10,00)');

  // 60 minutos (1ª hora exata = R$ 10,00)
  const exit60m = '2026-11-07T11:00:00.000Z';
  const res60m = calculateParkingFee({ entryTime: entry, exitTime: exit60m, hourlyRate: 10.00 });
  assertEqual(res60m.totalAmount, 10.00, '60 min cobra 1ª hora cheia');

  // 70 minutos (1h + 10 min excedentes -> 1 fração de 15 min = R$ 10 + R$ 2,50 = R$ 12,50)
  const exit70m = '2026-11-07T11:10:00.000Z';
  const res70m = calculateParkingFee({ entryTime: entry, exitTime: exit70m, hourlyRate: 10.00 });
  assertEqual(res70m.fractionsCharged, 1, '1 fração cobrada');
  assertEqual(res70m.totalAmount, 12.50, '70 min cobra R$ 12,50');

  // 140 minutos (2h 20 min -> 1h + 80 min excedentes -> 6 frações = R$ 10 + 6*2,50 = R$ 25,00)
  const exit140m = '2026-11-07T12:20:00.000Z';
  const res140m = calculateParkingFee({ entryTime: entry, exitTime: exit140m, hourlyRate: 10.00 });
  assertEqual(res140m.fractionsCharged, 6, '80 min excedentes = 6 frações de 15 min');
  assertEqual(res140m.totalAmount, 25.00, '140 min cobra R$ 25,00');

  // Moto (tarifa R$ 5,00/h, 25% = R$ 1,25) para 70 minutos -> R$ 5,00 + R$ 1,25 = R$ 6,25
  const resMoto70m = calculateParkingFee({ entryTime: entry, exitTime: exit70m, hourlyRate: 5.00 });
  assertEqual(resMoto70m.totalAmount, 6.25, 'Moto 70 min cobra R$ 6,25');
});

// CT07: Cálculo para permanência atravessando dias diferentes (meia-noite)
runTest('CT07', 'Cálculo tarifário atravessando a meia-noite', () => {
  const entryNight = '2026-11-07T23:45:00.000Z';
  const exitNextDay = '2026-11-08T01:15:00.000Z'; // 90 minutos de permanência

  const res = calculateParkingFee({ entryTime: entryNight, exitTime: exitNextDay, hourlyRate: 10.00 });
  assertEqual(res.totalMinutes, 90, 'Permanência deve ser exatamente 90 minutos');
  assertEqual(res.excessMinutes, 30, 'Excedente de 30 minutos após a 1ª hora');
  assertEqual(res.fractionsCharged, 2, '30 min excedentes = 2 frações de 15 min');
  assertEqual(res.totalAmount, 15.00, 'Tarifa 90 min = R$ 10,00 + 2 * R$ 2,50 = R$ 15,00');
});

// CT08: Finalização correta de pagamento e saída (RN004, RN010, RN011, RN012)
runTest('CT08', 'Finalização correta de pagamento e saída de veículo', () => {
  resetAllData();
  const ticket = registerVehicleEntry({
    plate: 'KLU9090',
    vehicleType: 'car',
    entryTime: new Date(Date.now() - 45 * 60 * 1000) // 45 min atrás
  });

  const finalized = finalizeVehicleExit({
    ticketId: ticket.id,
    paymentMethod: 'pix',
    exitTime: new Date()
  });

  assertEqual(finalized.id, ticket.id, 'ID finalizado deve corresponder ao tíquete');
  assertEqual(finalized.status, 'completed', 'Status deve ser completed');
  assertEqual(finalized.payment.method, 'pix', 'Forma de pagamento deve ser pix');
  assertEqual(finalized.totalCharged, 10.00, '45 min cobra 1ª hora (R$ 10,00)');

  // Verifica se foi removido da lista de ativos
  const activeList = getActiveVehicles();
  assert(!activeList.some(v => v.id === ticket.id), 'Veículo não deve mais constar nos ativos');

  // Verifica se está no histórico
  const history = getHistory();
  assert(history.some(h => h.id === ticket.id), 'Veículo deve constar no histórico');
});

// CT09: Atualização da quantidade de vagas disponíveis após saída (RN011)
runTest('CT09', 'Atualização correta da quantidade de vagas após saída', () => {
  resetAllData();
  const beforeEntry = getCapacityStatus();

  const ticket = registerVehicleEntry({ plate: 'VAG1010', vehicleType: 'car' });
  const duringParking = getCapacityStatus();
  assertEqual(duringParking.cars.available, beforeEntry.cars.available - 1, 'Vaga livre decrementada durante estadia');

  finalizeVehicleExit({
    ticketId: ticket.id,
    paymentMethod: 'credit',
    exitTime: new Date()
  });

  const afterExit = getCapacityStatus();
  assertEqual(afterExit.cars.available, beforeEntry.cars.available, 'Vaga livre restaurada imediatamente após a saída');
});

// CT10: Preservação dos dados após persistência local (RF018)
runTest('CT10', 'Preservação da integridade de dados e persistência (RF018)', () => {
  resetAllData();
  registerVehicleEntry({ plate: 'SAV1234', vehicleType: 'car', driverName: 'Roberto' });

  const active = getActiveVehicles();
  assert(active.length === 1, 'Deve conter 1 veículo persistido');
  assertEqual(active[0].plate, 'SAV1234', 'Placa recuperada com exatidão');
  assertEqual(active[0].driverName, 'Roberto', 'Condutor recuperado com exatidão');
});

// CT11: Filtros e pesquisas no histórico (RF010)
runTest('CT11', 'Filtros e pesquisas no histórico por placa e categoria (RF010)', () => {
  resetAllData();
  const t1 = registerVehicleEntry({ plate: 'FLT1000', vehicleType: 'car' });
  const t2 = registerVehicleEntry({ plate: 'MOT5000', vehicleType: 'moto' });

  finalizeVehicleExit({ ticketId: t1.id, paymentMethod: 'pix' });
  finalizeVehicleExit({ ticketId: t2.id, paymentMethod: 'money', amountPaid: 20 });

  const searchCar = filterHistory({ query: 'FLT' });
  assertEqual(searchCar.length, 1, 'Busca por FLT deve retornar 1');
  assertEqual(searchCar[0].plate, 'FLT1000', 'Deve ser o carro');

  const filterMotos = filterHistory({ vehicleType: 'moto' });
  assertEqual(filterMotos.length, 1, 'Filtro por motos deve retornar 1');
  assertEqual(filterMotos[0].vehicleType, 'moto', 'Deve ser moto');
});

// CT12: Exportação para CSV compatível com padrão brasileiro (RF017)
runTest('CT12', 'Geração de CSV com delimitador ponto e vírgula e BOM UTF-8 (RF017)', () => {
  resetAllData();
  const ticket = registerVehicleEntry({ plate: 'CSV1234', vehicleType: 'car', driverName: 'José da Silva' });
  finalizeVehicleExit({ ticketId: ticket.id, paymentMethod: 'pix' });

  const history = getHistory();
  const csv = generateHistoryCSV(history);

  assert(csv.startsWith('\uFEFF'), 'CSV deve iniciar com o Byte Order Mark (BOM UTF-8)');
  assert(csv.includes('ID_Tíquete;Placa;Categoria;Condutor;Data_Entrada'), 'Cabeçalho deve conter termos em português e ponto e vírgula');
  assert(csv.includes('"CSV1234"'), 'CSV deve conter a placa entre aspas');
  assert(csv.includes('"José da Silva"'), 'CSV deve manter caracteres acentuados');
});

// CT13: Alteração de tarifas e preservação da tarifa de permanências já iniciadas (RN017)
runTest('CT13', 'Irretroatividade: novas tarifas não alteram permanências já ativas (RN017)', () => {
  resetAllData();
  // Configuração inicial: Carro R$ 10,00
  saveSettings({ carHourlyRate: 10.00 });

  // Entrada registrada com tarifa de R$ 10,00
  const ticket = registerVehicleEntry({
    plate: 'TAR1010',
    vehicleType: 'car',
    entryTime: new Date(Date.now() - 40 * 60 * 1000)
  });

  // Administrador altera tarifa para R$ 20,00
  updateParkingSettings({
    parkingName: 'ParkControl',
    totalCarSpots: 20,
    totalMotoSpots: 10,
    carHourlyRate: 20.00,
    motoHourlyRate: 10.00,
    toleranceMinutes: 10,
    fractionMinutes: 15
  });

  // Saída do veículo
  const finalized = finalizeVehicleExit({
    ticketId: ticket.id,
    paymentMethod: 'pix',
    exitTime: new Date()
  });

  // O valor cobrado DEVE ser R$ 10,00 e NÃO R$ 20,00!
  assertEqual(finalized.totalCharged, 10.00, 'Tarifa cobrada deve respeitar a fixada na entrada (R$ 10,00)');
});

// CT14: Validação de configurações inválidas e proteção de capacidade (RN014, RN015)
runTest('CT14', 'Impedimento de redução de capacidade abaixo da ocupação (RN015) e validações (RN014)', () => {
  resetAllData();
  // Estaciona 3 carros
  registerVehicleEntry({ plate: 'CAP0001', vehicleType: 'car' });
  registerVehicleEntry({ plate: 'CAP0002', vehicleType: 'car' });
  registerVehicleEntry({ plate: 'CAP0003', vehicleType: 'car' });

  // Tenta reduzir a capacidade de carros para 2 (menor que 3 ocupados)
  let threwCapacity = false;
  try {
    updateParkingSettings({
      parkingName: 'ParkControl',
      totalCarSpots: 2,
      totalMotoSpots: 10,
      carHourlyRate: 10.00,
      motoHourlyRate: 5.00,
      toleranceMinutes: 10,
      fractionMinutes: 15
    });
  } catch (err) {
    threwCapacity = true;
    assert(err.message.includes('RN015'), 'Erro deve referenciar a regra RN015');
  }
  assert(threwCapacity, 'Deveria bloquear redução de vagas abaixo da lotação');

  // Tenta salvar tarifa negativa
  let threwNegative = false;
  try {
    updateParkingSettings({
      parkingName: 'ParkControl',
      totalCarSpots: 10,
      totalMotoSpots: 10,
      carHourlyRate: -5.00,
      motoHourlyRate: 5.00,
      toleranceMinutes: 10,
      fractionMinutes: 15
    });
  } catch (err) {
    threwNegative = true;
  }
  assert(threwNegative, 'Deveria rejeitar valores negativos (RN014)');
});

// CT15: Consistência dos indicadores financeiros (RN010, RF015)
runTest('CT15', 'Faturamento confirmado deriva estritamente de pagamentos concluídos (RN010)', () => {
  resetAllData();

  // Veículo ativo com 2 horas de estadia (faturamento estimado R$ 25,00, mas NÃO confirmado!)
  registerVehicleEntry({
    plate: 'PRV0001',
    vehicleType: 'car',
    entryTime: new Date(Date.now() - 140 * 60 * 1000)
  });

  const metricsBeforeExit = getFinancialMetrics('today');
  assertEqual(metricsBeforeExit.totalRevenue, 0, 'Faturamento confirmado deve ser zero com apenas veículo ativo');

  // Registra e finaliza saída de outro veículo
  const t2 = registerVehicleEntry({
    plate: 'PAG0002',
    vehicleType: 'car',
    entryTime: new Date(Date.now() - 40 * 60 * 1000)
  });

  finalizeVehicleExit({ ticketId: t2.id, paymentMethod: 'pix' });

  const metricsAfterExit = getFinancialMetrics('today');
  assertEqual(metricsAfterExit.totalRevenue, 10.00, 'Faturamento confirmado deve refletir exclusivamente a saída concluída');
  assertEqual(metricsAfterExit.paymentCount, 1, 'Volume de pagamentos deve ser 1');
  assertEqual(metricsAfterExit.byMethod.pix.total, 10.00, 'Total em Pix deve ser R$ 10,00');
});

console.log('\n================================================================');
const passed = testResults.filter(t => t.status === 'APROVADO').length;
const total = testResults.length;
console.log(`RESULTADO FINAL DA SUÍTE DE TESTES: ${passed}/${total} APROVADOS (${Math.round((passed/total)*100)}%)`);
console.log('================================================================');

if (passed !== total) {
  process.exit(1);
}

