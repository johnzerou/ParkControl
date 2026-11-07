# PLANO DE TESTES E HOMOLOGAÇÃO DE SOFTWARE
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 1.0.0  
**Data de Atualização:** Novembro de 2026  

---

### 1. Visão Geral e Estratégia de Testes
Este documento formaliza o Plano de Testes do sistema **ParkControl**, englobando testes funcionais, de validação de regras de negócio, de integração de módulos e de consistência de interface. A suíte foi programada de forma automatizada e executada via Node.js v24 sobre os módulos ES nativos, permitindo verificar a exatidão matemática dos cálculos tarifários, o comportamento do controle de vagas e a integridade da persistência.

**Ambiente de Execução dos Testes:**
- **Plataforma:** Node.js v24.18.1 / V8 Engine
- **Módulo de Execução:** `tests/test-suite.js`
- **Total de Cenários Executados:** 15
- **Taxa de Aprovação:** 100% (15 de 15 aprovados)
- **Data da Homologação:** Novembro de 2026

---

### 2. Matriz Detalhada de Testes de Homologação

---

#### CT01 — Registro de um carro com vagas disponíveis
- **ID do Teste:** CT01
- **Requisito Relacionado:** RF001, RF004, RN003
- **Cenário:** Cadastrar a entrada regular de um automóvel quando o estacionamento possui vagas livres.
- **Pré-condição:** Pátio com capacidade configurada e vagas disponíveis para carros ($> 0$).
- **Passos:**
  1. Invocar a rotina de registro com a placa `ABC-1234`, categoria `car` e condutor `Carlos Silva`.
  2. Verificar o objeto do tíquete retornado.
  3. Consultar a apuração de vagas do estacionamento.
- **Resultado Esperado:** Tíquete gerado com identificador único iniciando com `PK-`, placa normalizada para `ABC1234`, status `active`, tarifas vinculadas e vagas disponíveis de carros decrementadas em exatamente 1.
- **Resultado Obtido:** Tíquete gerado com ID único rastreável, placa `ABC1234`, status `active` e vagas decrementadas em 1 unidade.
- **Status:** **Aprovado**

---

#### CT02 — Tentativa de registrar duas entradas simultâneas com a mesma placa
- **ID do Teste:** CT02
- **Requisito Relacionado:** RF001, RF016, RN001
- **Cenário:** Tentar realizar uma nova entrada com uma placa que já possui uma estadia ativa em andamento no pátio.
- **Pré-condição:** Veículo com placa `BRA2E19` já cadastrado com status `active`.
- **Passos:**
  1. Submeter uma nova requisição de entrada informando a mesma placa `BRA2E19`.
  2. Capturar o retorno/exceção lançada pelo sistema.
- **Resultado Esperado:** Operação bloqueada com lançamento de erro impeditivo contendo a mensagem *"já possui uma permanência ativa no pátio (RN001)"*.
- **Resultado Obtido:** Lançamento imediato de exceção impeditiva, impedindo a duplicidade e mantendo a contagem de vagas inalterada.
- **Status:** **Aprovado**

---

#### CT03 — Bloqueio de entrada quando a capacidade está lotada
- **ID do Teste:** CT03
- **Requisito Relacionado:** RF001, RF004, RN002
- **Cenário:** Tentar registrar entrada para uma categoria de veículo cuja capacidade física de vagas esteja esgotada.
- **Pré-condição:** Capacidade de motos configurada para 1 vaga e 1 moto ativa já estacionada (0 vagas livres).
- **Passos:**
  1. Submeter entrada de uma segunda motocicleta com placa `MOT2222`.
  2. Inspecionar a validação do sistema.
- **Resultado Esperado:** Bloqueio da entrada com emissão de alerta *"Capacidade esgotada para Motos (RN002)"*.
- **Resultado Obtido:** Operação rejeitada com mensagem de capacidade esgotada; nenhuma alteração na base persistida.
- **Status:** **Aprovado**

---

#### CT04 — Rejeição de registro com placas inválidas
- **ID do Teste:** CT04
- **Requisito Relacionado:** RF005, RF016, RN013
- **Cenário:** Submeter sequências alfanuméricas fora dos padrões vigentes brasileiros (Tradicional e Mercosul).
- **Pré-condição:** Sistema operacional.
- **Passos:**
  1. Testar entradas com strings inválidas: `'123'`, `'ABCD12345'`, `'ABC@123'`, `'PLACA'` e `''`.
  2. Testar entradas com placas válidas: `'ABC-1234'` e `'BRA2E19'`.
- **Resultado Esperado:** Rejeição estrita de todos os formatos fora da norma com erro *"Formato de placa inválido"*; aceitação regular das placas no padrão correto.
- **Resultado Obtido:** Todas as placas inválidas foram rejeitadas com erro informativo; placas tradicionais e Mercosul validadas com sucesso.
- **Status:** **Aprovado**

---

#### CT05 — Cálculo tarifário dentro da tolerância de 10 minutos
- **ID do Teste:** CT05
- **Requisito Relacionado:** RF006, RF007, RN007
- **Cenário:** Apurar o valor devido para estadias com duração menor ou igual ao tempo de tolerância configurado (10 minutos).
- **Pré-condição:** Tabela tarifária com tolerância de 10 minutos e tarifa de R$ 10,00/h.
- **Passos:**
  1. Submeter permanência com duração de 5 minutos (ex: 10:00 às 10:05).
  2. Submeter permanência com duração exata de 10 minutos (ex: 10:00 às 10:10).
- **Resultado Esperado:** Flag `withinTolerance: true`, minutos totais calculados e `totalAmount: 0.00` (isenção total).
- **Resultado Obtido:** Ambos os casos retornaram exatamente R$ 0,00 e flag de tolerância ativada.
- **Status:** **Aprovado**

---

#### CT06 — Cálculo para permanências superiores à primeira hora
- **ID do Teste:** CT06
- **Requisito Relacionado:** RF006, RF007, RN008, RN009
- **Cenário:** Verificar a correta tarifação da primeira hora integral e aplicação de frações de 15 minutos (25% da hora).
- **Pré-condição:** Tarifa Carro = R$ 10,00/h (fração = R$ 2,50); Tarifa Moto = R$ 5,00/h (fração = R$ 1,25).
- **Passos:**
  1. Testar 11 minutos (ultrapassou tolerância): esperado 1ª hora = R$ 10,00.
  2. Testar 60 minutos (limite da 1ª hora): esperado 1ª hora = R$ 10,00.
  3. Testar 70 minutos (1h + 10 min excedentes): esperado 1h + 1 fração (15 min) = R$ 12,50 (carro) e R$ 6,25 (moto).
  4. Testar 140 minutos (1h + 80 min excedentes): esperado 1h + 6 frações = R$ 25,00 (carro).
- **Resultado Esperado:** Aplicação do teto na divisão por 15 minutos e cálculo exato sem perdas de centavos.
- **Resultado Obtido:** Todos os valores conferiram perfeitamente: 11 min = R$ 10,00; 60 min = R$ 10,00; 70 min = R$ 12,50; 140 min = R$ 25,00.
- **Status:** **Aprovado**

---

#### CT07 — Cálculo tarifário atravessando a meia-noite
- **ID do Teste:** CT07
- **Requisito Relacionado:** RF006, RF007, RN005, RN009
- **Cenário:** Calcular estadia em que a entrada ocorre antes da meia-noite (23:45) e a saída após a virada do dia (01:15 do dia subsequente).
- **Pré-condição:** Entrada: `2026-11-07T23:45:00.000Z`, Saída: `2026-11-08T01:15:00.000Z` (90 minutos).
- **Passos:**
  1. Executar o cálculo de permanência e tarifação para as duas datas ISO absolutas.
- **Resultado Esperado:** Duração de 90 minutos apurada, 30 minutos excedentes convertidos em 2 frações de 15 minutos e total de R$ 15,00 (R$ 10,00 + 2 $\times$ R$ 2,50).
- **Resultado Obtido:** 90 minutos corridos calculados, 2 frações contabilizadas e valor total exato de R$ 15,00.
- **Status:** **Aprovado**

---

#### CT08 — Finalização correta de pagamento e saída de veículo
- **ID do Teste:** CT08
- **Requisito Relacionado:** RF002, RF008, RF009, RN004, RN010, RN011, RN012
- **Cenário:** Efetuar a rotina completa de checkout com seleção de pagamento Pix, conferindo a integridade dos estados.
- **Pré-condição:** Veículo `KLU9090` ativo com 45 minutos de pátio.
- **Passos:**
  1. Chamar `finalizeVehicleExit` passando o ID do tíquete e método `'pix'`.
  2. Consultar o retorno e verificar se o veículo foi removido dos ativos e gravado no histórico.
- **Resultado Esperado:** Status do registro `'completed'`, método registrado como Pix, valor de R$ 10,00, ausência do ID na lista de ativos e presença na lista de histórico.
- **Resultado Obtido:** Veículo concluído com sucesso, registro histórico imutável criado e vaga liberada.
- **Status:** **Aprovado**

---

#### CT09 — Atualização da quantidade de vagas disponíveis após saída
- **ID do Teste:** CT09
- **Requisito Relacionado:** RF004, RN011
- **Cenário:** Validar que a vaga é liberada imediatamente após a liquidação da permanência.
- **Pré-condição:** Vagas conhecidas antes da entrada.
- **Passos:**
  1. Registrar entrada (vagas livres diminuem em 1).
  2. Finalizar a saída com pagamento.
  3. Reavaliar a capacidade do estacionamento.
- **Resultado Esperado:** Saldo de vagas livres retorna exatamente à quantidade inicial antes da entrada.
- **Resultado Obtido:** Restauração perfeita das vagas livres sem discrepâncias.
- **Status:** **Aprovado**

---

#### CT10 — Preservação da integridade de dados e persistência
- **ID do Teste:** CT10
- **Requisito Relacionado:** RF018, RNF006, RNF008
- **Cenário:** Verificar se os dados cadastrados persistem intactos e são recuperados sem distorções.
- **Pré-condição:** Estado inicial limpo.
- **Passos:**
  1. Registrar entrada com placa `SAV1234` e condutor `Roberto`.
  2. Recuperar a lista persistida via `getActiveVehicles()`.
- **Resultado Esperado:** Objeto recuperado mantém todos os atributos originais idênticos.
- **Resultado Obtido:** Dados preservados integralmente com tipos preservados.
- **Status:** **Aprovado**

---

#### CT11 — Filtros e pesquisas no histórico por placa e categoria
- **ID do Teste:** CT11
- **Requisito Relacionado:** RF010, RF009
- **Cenário:** Realizar consultas refinadas no histórico por fragmento de placa e por tipo de veículo.
- **Pré-condição:** Histórico populado com 1 carro (`FLT1000`) e 1 moto (`MOT5000`).
- **Passos:**
  1. Filtrar histórico com termo de busca `'FL'`.
  2. Filtrar histórico selecionando categoria `'moto'`.
- **Resultado Esperado:** Busca por `'FL'` retorna apenas o carro `FLT1000`; filtro de categoria retorna apenas a moto `MOT5000`.
- **Resultado Obtido:** Ambas as filtragens retornaram os conjuntos esperados com exatidão.
- **Status:** **Aprovado**

---

#### CT12 — Geração de CSV com delimitador ponto e vírgula e BOM UTF-8
- **ID do Teste:** CT12
- **Requisito Relacionado:** RF017, RN012
- **Cenário:** Validar a conformidade da exportação tabular com as normas do Microsoft Excel no Brasil.
- **Pré-condição:** Histórico contendo registro com acentuação (`José da Silva`).
- **Passos:**
  1. Executar `generateHistoryCSV(history)`.
  2. Inspecionar os bytes iniciais e o formato das linhas.
- **Resultado Esperado:** Início com o caractere BOM `\uFEFF`, separador `;`, cabeçalhos em português e caracteres acentuados legíveis.
- **Resultado Obtido:** CSV gerado com BOM UTF-8 válido e formato perfeitamente compatível com planilhas.
- **Status:** **Aprovado**

---

#### CT13 — Irretroatividade de tarifas em permanências ativas
- **ID do Teste:** CT13
- **Requisito Relacionado:** RF013, RN017
- **Cenário:** Comprovar que a alteração da tarifa horária pelo administrador não atinge veículos que já estavam estacionados antes do reajuste.
- **Pré-condição:** Veículo `TAR1010` ingressa no pátio sob a tarifa vigente de R$ 10,00/h.
- **Passos:**
  1. Administrador reajusta a tarifa para R$ 20,00/h na tela de Configurações.
  2. Realizar o checkout de saída do veículo `TAR1010` (estadia de 40 min).
- **Resultado Esperado:** Cobrança de R$ 10,00 (tarifa contratada na entrada) e não R$ 20,00.
- **Resultado Obtido:** Cobrança final de exatamente R$ 10,00, comprovando a aplicação do snapshot tarifário.
- **Status:** **Aprovado**

---

#### CT14 — Impedimento de redução de capacidade abaixo da lotação e validações
- **ID do Teste:** CT14
- **Requisito Relacionado:** RF012, RF016, RN014, RN015
- **Cenário:** Tentar configurar o total de vagas para um valor inferior ao número de carros estacionados e submeter valores negativos.
- **Pré-condição:** 3 carros estacionados no pátio.
- **Passos:**
  1. Tentar salvar capacidade de carros igual a 2 vagas.
  2. Tentar salvar tarifa horária com valor negativo ($-5{,}00$).
- **Resultado Esperado:** Abortamento de ambas as operações com emissão de mensagens explicativas.
- **Resultado Obtido:** Redução de vagas abaixo da ocupação bloqueada com citação à RN015; valor negativo rejeitado (RN014).
- **Status:** **Aprovado**

---

#### CT15 — Consistência dos indicadores financeiros
- **ID do Teste:** CT15
- **Requisito Relacionado:** RF011, RF015, RN010
- **Cenário:** Confirmar que apenas pagamentos de saídas finalizadas compõem a receita realizada do caixa.
- **Pré-condição:** 1 veículo ativo no pátio há 2 horas (receita projetada de R$ 25,00, mas não quitada).
- **Passos:**
  1. Consultar métricas financeiras antes de qualquer saída $\rightarrow$ Faturamento deve ser R$ 0,00.
  2. Registrar e finalizar a saída de outro veículo pagando R$ 10,00 via Pix.
  3. Reconsultar o faturamento consolidado.
- **Resultado Esperado:** Faturamento do dia atualizado para exatamente R$ 10,00, sem inclusão indevida da estadia em aberto.
- **Resultado Obtido:** Faturamento verificado de R$ 10,00 e 1 pagamento contabilizado no método Pix.
- **Status:** **Aprovado**

---

### 3. Conclusão da Homologação
A execução dos 15 cenários de teste certificou que todos os Requisitos Funcionais (RF001 a RF018) e Regras de Negócio (RN001 a RN017) foram atendidos rigorosamente pelo código implementado, atestando a robustez e estabilidade do protótipo **ParkControl**.

