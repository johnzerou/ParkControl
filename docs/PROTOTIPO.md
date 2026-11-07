# ESPECIFICAÇÃO DE TELAS E PROTÓTIPO DE INTERFACE
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 1.0.0  
**Data de Atualização:** Novembro de 2026  

---

### 1. Diretrizes de Design e Identidade Visual (UI/UX)
O protótipo do **ParkControl** foi concebido sob a inspiração de softwares modernos de gestão corporativa (SaaS), unindo alta densidade informacional, legibilidade e navegabilidade ágil.

- **Paleta de Cores Institucional:**
  - `Azul-Escuro (Dark Navy)`: `#0F172A` (Sidebar, títulos, rodapé e alto contraste)
  - `Azul Principal (Primary Blue)`: `#2563EB` (Ações primárias, botões de destaque, tabs ativas)
  - `Verde de Sucesso (Success Emerald)`: `#16A34A` (Confirmações, vagas livres, indicadores positivos)
  - `Vermelho de Erro (Danger Red)`: `#DC2626` (Alertas impeditivos, lotação, exclusões)
  - `Cinza de Fundo (Slate Background)`: `#F8FAFC` (Plano de fundo geral de descanso visual)
  - `Branco Puro (Card Surface)`: `#FFFFFF` (Cards, tabelas, modais)
  - `Bordas e Linhas de Separação`: `#E2E8F0`
- **Tipografia:** Família Inter / System UI Sans-serif moderna, com escala tipográfica proporcional e pesos definidos para títulos, métricas numéricas e dados tabulares.
- **Microinterações e Feedback:** Notificações flutuantes (*Toasts*) com animações suaves de entrada/saída, anéis de foco visíveis em campos ativos para conformidade com acessibilidade, e atualização em tempo real de contadores de permanência.

---

### 2. Estrutura Estrutural do Layout
O sistema adota uma estrutura em Single Page Application (SPA), dividida em 3 grandes zonas ergonômicas:
1. **Navegação Lateral (Sidebar):** Contém a marca ParkControl, o menu principal com 6 módulos navegáveis (Dashboard, Entrada, Estacionados, Histórico, Financeiro, Configurações), atalhos rápidos e créditos acadêmicos.
2. **Cabeçalho Superior (Header):** Exibe o nome do estabelecimento configurado, badge com total de vagas disponíveis em tempo real, relógio dinâmico do sistema e botões de atalho rápido (Carga de Demonstração e Entrada Rápida).
3. **Área de Conteúdo Dinâmico (Main View):** Apresenta a tela ativa selecionada sem recarregar a página, garantindo fluidez instantânea.
4. **Rodapé Discreto (Footer):** Apresenta os créditos acadêmicos obrigatórios:  
   *Desenvolvido por João Pedro Ribas da Silva e Nicolas Ferreira Souza | ADS Noite — FATEC Carapicuíba | 2026*

---

### 3. Descrição Detalhada das Telas

#### Tela 1 — Dashboard Geral
- **Objetivo:** Oferecer uma visão executiva e operacional instantânea do estacionamento.
- **Componentes:**
  - **Grid de Cards de KPI:**
    1. *Total de Vagas:* Capacidade global combinada (Carros + Motos).
    2. *Vagas Disponíveis:* Saldo livre segregado por carros e motos.
    3. *Vagas Ocupadas:* Quantidade de veículos no pátio no instante atual.
    4. *Taxa de Ocupação (%):* Percentual de preenchimento com barra de progresso visual colorida (Verde < 70%, Amarelo 70-89%, Vermelho $\ge 90\%$).
    5. *Entradas do Dia:* Total de veículos que ingressaram na data de hoje.
    6. *Saídas do Dia:* Total de veículos que concluíram saída na data de hoje.
    7. *Faturamento do Dia:* Receita total quitada e confirmada na data de hoje (R$).
  - **Gráfico Vetorial SVG de Fluxo:** Gráfico dinâmico com barras indicando a quantidade de movimentações ao longo das faixas horárias do dia.
  - **Painel de Acesso Rápido / Movimentações Recentes:** Tabela contendo os últimos registros de entrada e saída com badges de status, permitindo ação imediata.
- **Correspondência de Requisitos:** RF004, RF011, RF015, RNF001, RNF002.

#### Tela 2 — Entrada de Veículos
- **Objetivo:** Capturar o ingresso de um veículo com rapidez e segurança de dados.
- **Componentes:**
  - **Card de Formulário de Entrada:**
    - Campo de Placa com máscara inteligente e auto-capitalização para caixa alta (suporta padrão tradicional `ABC-1234` e Mercosul `ABC1D23`).
    - Seleção de Categoria: Cards de rádio clicáveis com ícones SVG para *Carro* e *Moto*, exibindo a tarifa horária vigente e o saldo atual de vagas disponíveis de cada tipo.
    - Campo de Condutor / Responsável (opcional).
    - Campo de Data/Hora de Entrada: Inicializado automaticamente com o horário local atual, com suporte a ajuste pontual pelo operador.
    - Botão de Ação: "Confirmar Entrada do Veículo" (com destaque visual e bloqueio automático se a categoria estiver lotada).
  - **Painel Lateral Informativo:** Regras de tolerância e tabela de preços vigentes para conferência rápida pelo operador.
  - **Modal de Tíquete de Entrada:** Disparado logo após o registro, contendo o tíquete com código de identificação único, placa, data/hora e regras, com botão "Imprimir Tíquete".
- **Correspondência de Requisitos:** RF001, RF004, RF005, RF013, RF014, RF016, RN001, RN002, RN003, RN013.

#### Tela 3 — Veículos Estacionados
- **Objetivo:** Gerenciar ativamente a frota que ocupa as dependências do estacionamento.
- **Componentes:**
  - **Barra de Ferramentas e Filtros:**
    - Campo de busca instantânea por placa (filtro dinâmico durante a digitação).
    - Filtro por categoria (Todos, Carros, Motos).
    - Contador de veículos listados vs. vagas totais.
  - **Tabela Operacional de Veículos Ativos:**
    - *Colunas:* ID Tíquete, Placa, Tipo (com badge visual e ícone), Horário de Entrada, Tempo de Permanência (atualizado segundo a segundo por cronômetro), Valor Estimado Devido e Coluna de Ações.
    - *Ação Principal:* Botão "Registrar Saída" que invoca o modal de checkout.
    - *Ação Secundária:* Botão "Tíquete" para visualizar novamente o comprovante de entrada.
  - **Estado Vazio (Empty State):** Exibição amigável com mensagem *"Nenhum veículo estacionado no momento"* caso o pátio esteja totalmente vazio.
- **Correspondência de Requisitos:** RF003, RF004, RF005, RF006, RF007, RF010, RNF009.

#### Tela 4 — Saída e Pagamento (Modal / Fluxo de Checkout)
- **Objetivo:** Efetuar o fechamento da conta do cliente, exibir a memória descritiva da cobrança, registrar a forma de pagamento e liberar a vaga.
- **Componentes:**
  - **Cabeçalho do Checkout:** Placa em destaque, identificador e tipo do veículo.
  - **Quadro de Tempos:** Data/hora de entrada, data/hora de saída (sugerida no instante atual ou ajustável) e tempo total decorrido.
  - **Memória Descritiva de Cálculo:**
    - Indicação clara se a estadia ficou dentro do limite de tolerância (R$ 0,00).
    - Discriminação do valor da primeira hora.
    - Discriminação das frações adicionais de 15 minutos cobradas a 25% da tarifa horária.
    - Valor total devido destacado em tipografia de grande porte.
  - **Seletor de Forma de Pagamento:**
    - Botões interativos para: *Dinheiro*, *Pix*, *Cartão de Débito* e *Cartão de Crédito*.
    - Para *Dinheiro:* Campo numérico para inserção do valor recebido e visor automático de "Troco a Devolver".
    - Para *Pix:* Exibição de QR Code demonstrativo e código Pix Copia e Cola.
  - **Botão de Ação:** "Confirmar Pagamento e Liberar Saída".
  - **Recibo Fiscal / Comprovante de Pagamento:** Modal final com formato de cupom contendo cabeçalho do estabelecimento, dados da permanência, memória tarifária, meio de pagamento quitado e botão para impressão via `window.print()`.
- **Correspondência de Requisitos:** RF002, RF006, RF007, RF008, RF011, RF014, RF016, RN004, RN005, RN006, RN007, RN008, RN009, RN010, RN011, RN016.

#### Tela 5 — Histórico de Movimentações
- **Objetivo:** Consultar, filtrar e auditar todas as estadias encerradas e faturadas.
- **Componentes:**
  - **Barra de Filtros Multicritério:**
    - Busca por placa.
    - Filtro por categoria (Todos, Carro, Moto).
    - Filtro por intervalo de datas (Data Início e Data Fim).
    - Botão "Limpar Filtros".
    - Botão "Exportar CSV" com download instantâneo em formato UTF-8 com BOM.
  - **Tabela Histórica:**
    - *Colunas:* Placa, Tipo, Data/Hora Entrada, Data/Hora Saída, Tempo Total, Valor Cobrado, Método de Pagamento, Status e Ação ("Ver Recibo").
  - **Estado Vazio:** Mensagem amigável quando nenhum registro atende aos critérios da busca.
- **Correspondência de Requisitos:** RF009, RF010, RF012, RF017, RF018, RN012.

#### Tela 6 — Módulo Financeiro
- **Objetivo:** Fornecer acompanhamento minucioso da receita do estacionamento e conciliação por canal de pagamento.
- **Componentes:**
  - **Cards Financeiros:**
    1. *Faturamento Total Acumulado (R$):* Soma histórica de todos os pagamentos confirmados.
    2. *Faturamento do Dia (R$):* Receita gerada na data de hoje.
    3. *Quantidade de Pagamentos:* Volume de tíquetes faturados no período.
    4. *Tíquete Médio (R$):* Média monetária por permanência paga.
  - **Resumo por Forma de Pagamento:** Cards e barras de distribuição percentual discriminando valores arrecadados em Pix, Dinheiro, Débito e Crédito.
  - **Gráfico Vetorial de Receitas:** Visualização gráfica da arrecadação com indicadores comparativos.
  - **Filtro Temporal Dinâmico:** Seletor de visualização (Hoje, Últimos 7 dias, Este Mês, Todo o Histórico).
  - **Tabela de Lançamentos Financeiros:** Extrato detalhado com data, placa, tíquete, forma e valor líquido confirmado.
- **Correspondência de Requisitos:** RF010, RF011, RF015, RN010, RN016.

#### Tela 7 — Configurações do Sistema
- **Objetivo:** Parametrizar as variáveis operacionais e gerenciais da unidade de estacionamento.
- **Componentes:**
  - **Formulário de Parâmetros:**
    - Nome Comercial do Estabelecimento.
    - Capacidade de Vagas: Vagas para Carros e Vagas para Motos (com validação estrita RN015 impedindo capacidade menor que a ocupação presente).
    - Tarifas Base: Valor da 1ª hora para Carro (R$) e para Moto (R$).
    - Tempo de Tolerância Inicial (minutos, padrão 10 min).
    - Fração Adicional de Cobrança (minutos, padrão 15 min a 25%).
    - Botão "Salvar Parâmetros".
  - **Painel de Homologação e Dados de Demonstração:**
    - Botão "Carregar Dados de Demonstração (Seed)": Injeta veículos ativos e histórico realista com 1 clique para facilidade de testes acadêmicos.
    - Botão "Limpar Todos os Dados (Reset de Fábrica)": Apaga os dados do LocalStorage e restaura o estado inicial limpo mediante confirmação de segurança.
- **Correspondência de Requisitos:** RF012, RF013, RF015, RF018, RF019, RN014, RN015, RN017.

---

### 4. Matriz de Correspondência entre Telas e Requisitos

| Tela do Protótipo | Requisitos Funcionais Atendidos | Regras de Negócio Relacionadas |
| :--- | :--- | :--- |
| **Tela 1: Dashboard** | RF004, RF011, RF015, RF018 | RN002, RN010, RN011 |
| **Tela 2: Entrada** | RF001, RF004, RF005, RF013, RF014, RF016 | RN001, RN002, RN003, RN013, RN014, RN017 |
| **Tela 3: Estacionados** | RF003, RF004, RF005, RF006, RF007, RF010 | RN005, RN006, RN007, RN008, RN009 |
| **Tela 4: Saída / Checkout** | RF002, RF006, RF007, RF008, RF011, RF014 | RN004, RN005, RN006, RN007, RN008, RN009, RN010, RN011, RN016 |
| **Tela 5: Histórico** | RF009, RF010, RF017, RF018 | RN012, RN014 |
| **Tela 6: Financeiro** | RF010, RF011, RF015 | RN010, RN014, RN016 |
| **Tela 7: Configurações** | RF012, RF013, RF016, RF018, RF019 | RN014, RN015, RN017 |

