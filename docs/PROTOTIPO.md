# ESPECIFICAÇÃO DE TELAS E PROTÓTIPO DE INTERFACE
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 2.1.0 (Tema Escuro Corporativo B2B)  
**Data de Atualização:** Novembro de 2026  

---

### 1. Diretrizes de Design e Identidade Visual (UI/UX)
O protótipo do **ParkControl** foi projetado sob o paradigma de sistemas operacionais corporativos B2B de controle de pátio e caixa, priorizando conforto visual em tema escuro, leitura rápida, hierarquia tipográfica clara e ausência de elementos decorativos artificiais.

- **Paleta de Cores em Tema Escuro:**
  - `Background Principal`: `#0B1220`
  - `Sidebar e Cabeçalhos`: `#0F172A`
  - `Superfície de Painéis`: `#111827`
  - `Superfície Secundária`: `#0D1526`
  - `Bordas Técnicas (1px)`: `#1F2937` e `#334155`
  - `Destaque Primário`: `#3B82F6`
  - `Sucesso Operacional`: `#22C55E`
  - `Alerta / Atenção`: `#F59E0B`
  - `Erro / Lotação`: `#EF4444`
  - `Hierarquia de Texto`: `#E5E7EB` (Principal), `#94A3B8` (Secundário) e `#64748B` (Auxiliar).
- **Tipografia e Alinhamento Numérico:**
  - Fonte `Inter` para interface combinada com `JetBrains Mono` (`tabular-nums`) para placas veiculares, tickets, relógio operacional e valores financeiros.
- **Geometria e Acabamento:**
  - Raios de borda contidos (`4px` a `6px`), divisores internos contínuos e foco estrito na operação.

---

### 2. Estrutura do Layout
O sistema opera como uma **Single Page Application (SPA)** organizada em três zonas:
1. **Sidebar Lateral (`236px`):** Identificação da unidade (`ParkControl` / nome do estabelecimento), grupos de navegação (*Operação* e *Gestão*) com indicador lateral discreto no item ativo e seção utilitária inferior (*Ferramentas*: `Carregar demonstração` e `Limpar dados`).
2. **Topbar (`56px`):** Exibe o título da seção ativa à esquerda e, à direita, o indicador discreto de disponibilidade (`20 de 20 vagas livres`), o relógio tabular e a ação principal `Nova Entrada`.
3. **Área de Conteúdo Principal:** Renderiza as seis visões operacionais com grades assimétricas e tabelas de largura total.

---

### 3. Descrição Detalhada das Telas

#### Tela 1 — Dashboard
- **Objetivo:** Leitura imediata da ocupação física e do movimento diário do estacionamento.
- **Componentes:**
  - **Faixa Contínua de Indicadores (`.metrics-strip`):** Quatro blocos integrados separados por divisores verticais de `1px`: *Capacidade*, *Vagas disponíveis* (detalhando carros e motos), *Ocupação* (com barra de progresso de `4px` e contagem de entradas/saídas do dia) e *Faturamento do dia*.
  - **Grade Assimétrica (`1.6fr / 1fr`):**
    - *Movimentações por horário:* Gráfico de barras em SVG nativo com eixos, linhas de referência discretas e volume por faixa horária (`06–09h` a `21–24h`).
    - *Ocupação por categoria e Mapa de Vagas:* Barras de ocupação para Carros e Motos acompanhadas da matriz visual de vagas físicas (`C01`–`C15` e `M01`–`M05`) diferenciando posições livres e ocupadas.
  - **Tabela de Largura Total (`Movimentações do dia`):** Exibe Placa, Categoria, Condutor/Veículo, Horário, Status e coluna alinhada à direita com o valor cobrado ou botão rápido `Registrar saída`.
- **Correspondência de Requisitos:** RF004, RF011, RF015, RNF001, RNF002.

#### Tela 2 — Entradas
- **Objetivo:** Emissão rápida de tickets de entrada com consulta imediata às tarifas e vagas disponíveis.
- **Componentes:**
  - **Layout em 2 Colunas (`1fr / 320px`):**
    - *Coluna Principal (`Nova Entrada`):* Seleção de categoria (*Carro / Utilitário* ou *Motocicleta*), campo de placa em caixa alta monoespaçada (Mercosul e Tradicional), horário de entrada e identificação opcional de condutor/modelo.
    - *Painel Lateral de Apoio:* Quadros de **Tarifas vigentes** (1ª hora Carro/Moto, Hora adicional, Tolerância) e **Disponibilidade** atualizada por categoria.
  - **Modal de Ticket de Entrada:** Comprovante estruturado com opção de impressão imediata (`@media print`).
- **Correspondência de Requisitos:** RF001, RF004, RF005, RF013, RF014, RF016, RN001, RN002, RN003, RN013.

#### Tela 3 — Veículos no Pátio
- **Objetivo:** Monitorar os veículos estacionados e acionar o registro de saída.
- **Componentes:**
  - **Barra de Filtro Integrada:** Busca em tempo real por placa, ticket ou condutor, filtro por categoria e contador de veículos no pátio.
  - **Tabela Operacional:** Colunas para Ticket, Placa, Categoria, Condutor/Veículo, Entrada, Permanência, Parcial acumulada (alinhada à direita) e ações (`Ticket` e `Registrar saída`).
- **Correspondência de Requisitos:** RF003, RF004, RF005, RF006, RF007, RF010, RNF009.

#### Tela 4 — Registrar Saída / Caixa (Modal)
- **Objetivo:** Apresentar o cálculo da estadia, registrar a forma de pagamento e liberar a vaga.
- **Componentes:**
  - **Resumo do Veículo e Total:** Tag de placa, categoria e valor total destacado.
  - **Grade de Tempos e Regra Aplicada:** Horários de entrada e saída, tempo de permanência e nota técnica com a memória de cálculo.
  - **Seletor de Forma de Pagamento:** Opções para *Pix*, *Débito*, *Crédito* e *Dinheiro* (com cálculo automático de troco).
  - **Modal de Recibo de Pagamento:** Exibido após a conclusão, pronto para impressão.
- **Correspondência de Requisitos:** RF002, RF006, RF007, RF008, RF011, RF014, RF016, RN004 a RN011, RN016.

#### Tela 5 — Histórico
- **Objetivo:** Consulta de estadias finalizadas, reemissão de recibos e exportação de dados.
- **Componentes:**
  - **Barra de Filtros:** Busca textual, seletor de categoria, intervalo de datas (inicial/final), botão `Limpar` e ação `Exportar CSV` (`UTF-8 com BOM`).
  - **Tabela de Histórico:** Ticket, Placa, Categoria, Entrada, Saída, Permanência, Pagamento, Valor e botão `Recibo`.
- **Correspondência de Requisitos:** RF009, RF010, RF012, RF017, RF018, RN012.

#### Tela 6 — Financeiro
- **Objetivo:** Apuração de receitas e análise por meio de pagamento.
- **Componentes:**
  - **Controle Segmentado de Período:** *Todo o período*, *Hoje*, *7 dias* e *Mês atual*.
  - **Faixa de Indicadores Financeiros:** *Receita no período*, *Faturamento hoje*, *Pagamentos* e *Ticket médio*.
  - **Grade Assimétrica (`360px / 1fr`):** Painel *Por forma de pagamento* com barras proporcionais à esquerda e tabela *Pagamentos registrados* à direita.
- **Correspondência de Requisitos:** RF010, RF011, RF015, RN010, RN016.

#### Tela 7 — Configurações
- **Objetivo:** Parametrização operacional do estabelecimento, capacidade e regras de cobrança.
- **Componentes:**
  - **Layout Horizontal Split B2B:** Três seções horizontais (*Estabelecimento*, *Capacidade do pátio* e *Tarifas e tolerância*) com título e descrição técnica à esquerda e campos de configuração à direita.
  - **Trava de Capacidade (`RN015`):** Impede configurar um limite de vagas inferior ao número de veículos ocupando o pátio no momento.
- **Correspondência de Requisitos:** RF012, RF013, RF016, RF018, RF019, RN014, RN015, RN017.

---

### 4. Matriz de Correspondência entre Telas e Requisitos

| Tela do Protótipo | Requisitos Funcionais Atendidos | Regras de Negócio Relacionadas |
| :--- | :--- | :--- |
| **Tela 1: Dashboard** | RF004, RF011, RF015, RF018 | RN002, RN010, RN011 |
| **Tela 2: Entradas** | RF001, RF004, RF005, RF013, RF014, RF016 | RN001, RN002, RN003, RN013, RN014, RN017 |
| **Tela 3: Veículos no Pátio** | RF003, RF004, RF005, RF006, RF007, RF010 | RN005, RN006, RN007, RN008, RN009 |
| **Tela 4: Registrar Saída (Modal)** | RF002, RF006, RF007, RF008, RF011, RF014 | RN004, RN005, RN006, RN007, RN008, RN009, RN010, RN011, RN016 |
| **Tela 5: Histórico** | RF009, RF010, RF017, RF018 | RN012, RN014 |
| **Tela 6: Financeiro** | RF010, RF011, RF015 | RN010, RN014, RN016 |
| **Tela 7: Configurações** | RF012, RF013, RF016, RF018, RF019 | RN014, RN015, RN017 |
