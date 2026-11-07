# ESPECIFICAÇÃO DE TELAS E PROTÓTIPO DE INTERFACE
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 2.0.0 (Tema Escuro Corporativo B2B)  
**Data de Atualização:** Novembro de 2026  

---

### 1. Diretrizes de Design e Identidade Visual (UI/UX)
O protótipo do **ParkControl** foi projetado sob o paradigma de consoles operacionais corporativos e plataformas SaaS B2B de missão crítica (inspirado em sistemas de telemetria, logística e monitoramento contínuo), priorizando conforto visual para operadores em turnos prolongados, alta densidade informacional, contraste rigoroso e sobriedade estética.

- **Paleta de Cores em Tema Escuro (Dark Enterprise):**
  - `Fundo Base (Deep Dark Navy)`: `#0B1220` (Plano de fundo geral para redução de fadiga ocular)
  - `Superfície de Navegação (Sidebar / Topbar)`: `#0D1527`
  - `Superfície de Cartões e Tabelas`: `#111A2E` e `#0E1626`
  - `Bordas de Precisão (1px)`: `#1E293B` (Primária) e `#162032` (Divisores internos)
  - `Destaque Técnico (Primary Accent)`: `#3B82F6` (Ações principais, indicadores ativos e foco)
  - `Sucesso Operacional (Emerald)`: `#10B981` (Vagas disponíveis, confirmações e recebimentos)
  - `Atenção / Tolerância (Amber)`: `#F59E0B` (Ocupação intermediária e alertas)
  - `Erro / Lotação (Rose Red)`: `#EF4444` (Bloqueios de capacidade e exclusões)
  - `Hierarquia de Texto`: `#F8FAFC` (Títulos e métricas), `#CBD5E1` (Dados tabulares), `#94A3B8` (Legendas) e `#64748B` (Metadados).
- **Tipografia e Alinhamento Numérico:**
  - Família Sans-serif de sistema (`Inter` / `-apple-system` / `Segoe UI`) combinada com fonte monoespaçada (`JetBrains Mono` / `Consolas`) para placas veiculares, identificadores de tíquetes, relógio em tempo real e valores financeiros.
  - Aplicação de `font-variant-numeric: tabular-nums` em todos os contadores e KPIs para evitar oscilações horizontais durante a atualização segundo a segundo.
- **Geometria e Acabamento:**
  - Raios de borda contidos (`4px` a `8px`), conferindo seriedade e aspecto de ferramenta corporativa real.
  - Remoção de elementos decorativos supérfluos, mantendo foco exclusivo na operação de pátio e caixa.

---

### 2. Estrutura Estrutural do Layout
O sistema opera como uma **Single Page Application (SPA)** dividida em zonas funcionais de alta eficiência:
1. **Sidebar Lateral (`240px`):** Apresenta a identidade `PARKCONTROL • Console Operacional`, os grupos de navegação (*Operação*, *Gestão & Auditoria* e *Ambiente & Teste*) e o indicador de status do terminal (`● Terminal Online • v2.4.0`).
2. **Topbar / Cabeçalho Compacto (`56px`):** Exibe o título da visão ativa, a identificação da unidade (`ParkControl Central`), o contador dinâmico de vagas livres, o relógio tabular em tempo real e o botão primário `+ Nova Entrada`.
3. **Área de Conteúdo Dinâmico (Main View):** Renderiza instantaneamente os módulos sem recarregamento de página.
4. **Rodapé Técnico (Footer):** Exibe o status operacional do console local.

---

### 3. Descrição Detalhada das Telas

#### Tela 1 — Visão Geral / Dashboard
- **Objetivo:** Fornecer leitura instantânea da saúde operacional e financeira do estacionamento.
- **Componentes:**
  - **Grid de KPIs Corporativos:**
    1. *Capacidade Homologada:* Total de vagas físicas configuradas (Carros + Motos).
    2. *Vagas Disponíveis:* Saldo livre imediato segregado por categoria.
    3. *Ocupação do Pátio:* Quantidade de veículos estacionados, percentual de lotação em fonte monoespaçada e barra de progresso fina (`4px`).
    4. *Faturamento Realizado (Hoje):* Receita líquida confirmada no dia, acompanhada do balanço de entradas (`in`) e saídas (`out`).
  - **Gráfico Vetorial SVG de Fluxo Horário:** Gráfico em tema escuro com linhas de grade pontilhadas em `#1E293B`, barras de volume por faixa de horário e trilhos de referência.
  - **Painel de Últimas Atividades:** Tabela compacta com as movimentações mais recentes, chapas de placa em estilo metálico fosco e atalho direto para checkout.
- **Correspondência de Requisitos:** RF004, RF011, RF015, RNF001, RNF002.

#### Tela 2 — Entrada de Veículos
- **Objetivo:** Registrar o ingresso de veículos com rapidez, validação preventiva e emissão de tíquete.
- **Componentes:**
  - **Seletor Segmentado de Categoria:** Chave seletora estilo hardware industrial para *Automóvel / Carro* e *Motocicleta / Moto*, exibindo em tempo real as vagas livres e a tarifa horária de cada categoria.
  - **Campo de Placa Automotiva:** Input centralizado em fonte monoespaçada de alto contraste (`#070C15`), com conversão automática para maiúsculas e validação dos padrões Mercosul (`BRA2E19`) e Tradicional (`ABC-1234`).
  - **Campos de Condutor e Data/Hora:** Preenchimento automático do timestamp atual com possibilidade de ajuste.
  - **Modal de Tíquete de Ingresso:** Exibido após a confirmação, formatado como comprovante térmico com opção de impressão imediata via `@media print`.
- **Correspondência de Requisitos:** RF001, RF004, RF005, RF013, RF014, RF016, RN001, RN002, RN003, RN013.

#### Tela 3 — Pátio / Veículos Estacionados
- **Objetivo:** Monitorar a frota ativa no pátio com atualização contínua de tempo e tarifa.
- **Componentes:**
  - **Barra de Filtragem Rápida:** Busca instantânea por placa, condutor ou código do tíquete e seletor por categoria.
  - **Tabela de Alta Densidade:**
    - *Colunas:* Identificador, Placa (badge metálico), Tipo, Horário de Ingresso, Duração (recalculada a cada segundo), Tarifa Estimada e Ações Operacionais (*Registrar Saída* e *Tíquete*).
  - **Estado Vazio Refinado:** Indicação visual discreta quando o pátio encontra-se livre.
- **Correspondência de Requisitos:** RF003, RF004, RF005, RF006, RF007, RF010, RNF009.

#### Tela 4 — Checkout de Saída e Liquidação (Modal)
- **Objetivo:** Apresentar a memória de cálculo auditável, processar o pagamento e liberar a vaga.
- **Componentes:**
  - **Extrato da Permanência:** Identificador, horários de ingresso e saída, duração total e linha dedicada à **Memória de Cálculo** (indicando isenção por tolerância de 10 min, cobrança da 1ª hora integral ou adição de frações de 15 min a 25%).
  - **Seletor de Meio de Pagamento:** Botões segmentados para *Pix Instantâneo*, *Dinheiro em Espécie*, *Cartão de Débito* e *Cartão de Crédito*.
  - **Calculadora de Troco em Tempo Real:** Ao selecionar Dinheiro, exibe campo para valor entregue pelo cliente e calcula automaticamente o troco devido ou alerta sobre valor insuficiente.
  - **Comprovante / Recibo Fiscal:** Modal subsequente com o recibo consolidado pronto para impressão térmica em preto e branco puro.
- **Correspondência de Requisitos:** RF002, RF006, RF007, RF008, RF011, RF014, RF016, RN004 a RN011, RN016.

#### Tela 5 — Histórico de Saídas
- **Objetivo:** Auditar registros passados e exportar relatórios compatíveis com planilhas corporativas.
- **Componentes:**
  - **Filtros Multicritério:** Busca textual, categoria e intervalo de datas (Data Inicial e Data Final).
  - **Exportador CSV (`UTF-8 com BOM`):** Gera arquivo `.csv` com delimitador ponto e vírgula (`;`), garantindo abertura direta no Microsoft Excel com acentuação e formatação monetária preservadas.
  - **Tabela Histórica:** Lista imutável de operações fechadas com botão para reabertura e reimpressão do recibo fiscal.
- **Correspondência de Requisitos:** RF009, RF010, RF012, RF017, RF018, RN012.

#### Tela 6 — Fluxo Financeiro
- **Objetivo:** Consolidar as receitas confirmadas e analisar a performance por canal de recebimento.
- **Componentes:**
  - **Seletor de Janela Temporal:** Botões para *Histórico Completo*, *Hoje*, *Últimos 7 Dias* e *Este Mês*.
  - **Cards de Auditoria:** Faturamento no Período, Receita do Dia, Tíquetes Faturados e Tíquete Médio.
  - **Gráfico de Rosca SVG (Donut Chart):** Representação visual da composição da receita (Pix, Crédito, Débito e Dinheiro) com valor total centralizado e legenda percentual.
  - **Extrato de Lançamentos:** Tabela detalhada das liquidações financeiras.
- **Correspondência de Requisitos:** RF010, RF011, RF015, RN010, RN016.

#### Tela 7 — Parâmetros Operacionais (Configurações)
- **Objetivo:** Ajustar limites físicos de vagas e regras de tarifação com travas de segurança.
- **Componentes:**
  - **Formulário de Parâmetros:** Nome da unidade, vagas para carros e motos, tarifas da 1ª hora, minutos de tolerância e minutos de fração adicional.
  - **Validação de Ocupação (`RN015`):** Alerta informativo em tempo real sobre a lotação atual, impedindo que a capacidade configurada seja reduzida para um número menor que os veículos presentes no pátio.
  - **Aviso de Irretroatividade (`RN017`):** Garantia de que reajustes tarifários aplicam-se apenas a novas entradas.
- **Correspondência de Requisitos:** RF012, RF013, RF016, RF018, RF019, RN014, RN015, RN017.

---

### 4. Matriz de Correspondência entre Telas e Requisitos

| Tela do Protótipo | Requisitos Funcionais Atendidos | Regras de Negócio Relacionadas |
| :--- | :--- | :--- |
| **Tela 1: Visão Geral (Dashboard)** | RF004, RF011, RF015, RF018 | RN002, RN010, RN011 |
| **Tela 2: Entrada de Veículo** | RF001, RF004, RF005, RF013, RF014, RF016 | RN001, RN002, RN003, RN013, RN014, RN017 |
| **Tela 3: Pátio / Estacionados** | RF003, RF004, RF005, RF006, RF007, RF010 | RN005, RN006, RN007, RN008, RN009 |
| **Tela 4: Checkout e Pagamento** | RF002, RF006, RF007, RF008, RF011, RF014 | RN004, RN005, RN006, RN007, RN008, RN009, RN010, RN011, RN016 |
| **Tela 5: Histórico de Saídas** | RF009, RF010, RF017, RF018 | RN012, RN014 |
| **Tela 6: Fluxo Financeiro** | RF010, RF011, RF015 | RN010, RN014, RN016 |
| **Tela 7: Parâmetros (Configurações)** | RF012, RF013, RF016, RF018, RF019 | RN014, RN015, RN017 |
