# DOCUMENTO DE ARQUITETURA DE SOFTWARE
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 1.0.0  
**Data de Atualização:** Novembro de 2026  

---

### 1. Visão Geral da Arquitetura

O **ParkControl** foi arquitetado como uma aplicação web do tipo **Single Page Application (SPA)** puramente client-side, desenvolvida exclusivamente com **HTML5 semântico**, **CSS3 moderno** e **JavaScript Vanilla (ES6+)**. 

A arquitetura foi concebida sob rigorosos princípios de Engenharia de Software, priorizando:
- Alta coesão e baixo acoplamento entre os módulos.
- Desacoplamento estrito entre a lógica de negócio (cálculos tarifários, validação de regras, consistência de vagas) e a camada de apresentação (manipulação do DOM).
- Portabilidade total: o sistema roda em qualquer navegador moderno estaticamente, sem necessidade de servidores Node.js, transpiladores TypeScript, bundlers (Webpack/Vite) ou dependências de terceiros.
- Persistência desacoplada em camada de repositório abstraindo a API do `localStorage`.

---

### 2. Diagrama de Arquitetura em Camadas (Mermaid)

```mermaid
flowchart TD
    subgraph UI_Layer["Camada de Apresentação (View / UI)"]
        HTML["index.html (Semantic Structure)"]
        CSS["CSS3 (style.css, components.css, responsive.css)"]
        APP["app.js (SPA Orchestrator, DOM Events, Routing)"]
        COMP["Modais, Toasts, SVGs, Layout Responsivo"]
    end

    subgraph Controller_Modules["Módulos Especializados da Aplicação"]
        DASH["dashboard.js (Métricas, Gráficos SVG)"]
        VEH["vehicles.js (Entradas, Veículos Estacionados)"]
        PARK["parking.js (Controle de Vagas e Lotação)"]
        HIST["history.js (Histórico, Filtros, Exportação CSV)"]
        FIN["finance.js (Faturamento, Auditoria Financeira)"]
        SETT["settings.js (Configuração de Vagas e Tarifas)"]
    end

    subgraph Business_Domain["Camada de Domínio / Regras de Negócio (Pure JS)"]
        PRICING["pricing.js (Motor de Tarifação, Frações, Memória de Cálculo)"]
        UTILS["utils.js (Sanitização, Máscara Placa, Formatação BRL/Data)"]
    end

    subgraph Persistence_Layer["Camada de Acesso a Dados (Repository / Storage)"]
        STORE["storage.js (LocalStorage Adapter, Schema Validation, Seeds, Reset)"]
        LOCALSTORAGE[("Navegador: LocalStorage API")]
    end

    HTML & CSS --> APP
    APP --> DASH & VEH & PARK & HIST & FIN & SETT
    VEH & HIST & FIN --> PRICING
    VEH & SETT --> PARK
    DASH & HIST & FIN & SETT & VEH --> UTILS
    VEH & HIST & FIN & SETT & DASH --> STORE
    STORE --> LOCALSTORAGE
```

---

### 3. Organização e Responsabilidade dos Módulos

| Arquivo / Módulo | Camada | Responsabilidade Principal |
| :--- | :--- | :--- |
| **`index.html`** | Apresentação | Estrutura semântica da Single Page Application contendo sidebar de navegação, cabeçalho de status, áreas principais para cada tela (Dashboard, Entrada, Estacionados, Histórico, Financeiro, Configurações), templates de modais de saída e comprovante, e contêiner de notificações toast. |
| **`css/style.css`** | Estilo Base | Design tokens (variáveis CSS de cores, fontes, espaçamentos), reset CSS limpo, tipografia, estrutura da sidebar, cabeçalho e grid principal. |
| **`css/components.css`** | Componentes | Estilização de cards KPI, tabelas operacionais, badges de status, botões modernos, formulários, modais, recibos fiscais para tela/impressão (`@media print`) e notificações toast flutuantes. |
| **`css/responsive.css`** | Responsividade | Media queries para adaptação harmônica em dispositivos desktop, tablets e celulares, transformando a sidebar em menu expansível e reorganizando grids de cartões e tabelas. |
| **`js/utils.js`** | Utilitários | Funções auxiliares puras: sanitização de strings contra XSS (`escapeHTML`), validação e formatação de placas (antiga/Mercosul), formatação monetária padrão Real brasileiro (`Intl.NumberFormat`), formatação amigável de datas/horas e cálculo de diferença de tempo em minutos. |
| **`js/pricing.js`** | Lógica de Negócio | Motor tarifário puro: cálculo do tempo de permanência, validação da tolerância (RN007), cobrança da primeira hora (RN008), frações adicionais de 15 minutos a 25% (RN009), composição da memória de cálculo detalhada e cálculo de troco para pagamentos em dinheiro. |
| **`js/storage.js`** | Persistência | Abstração do `localStorage` com controle de integridade, versionamento de schema, inicialização das configurações padrão, leitura e escrita atômica, injeção de dados de demonstração (seed) e reset completo. |
| **`js/parking.js`** | Lógica de Negócio | Controle de capacidade e lotação: apuração de vagas ocupadas e disponíveis por categoria (carro/moto), cálculo da taxa percentual de ocupação e aplicação da regra de bloqueio por capacidade esgotada (RN002 e RN015). |
| **`js/vehicles.js`** | Controle Operacional | Gerenciamento de entradas e permanências ativas: criação de novos tíquetes, aplicação de identificador único (RN003), garantia de placa única ativa (RN001), vinculação da tarifa irretroativa no momento da entrada (RN017). |
| **`js/history.js`** | Controle Operacional | Gerenciamento do histórico de permanências concluídas: registro imutável pós-pagamento (RN012), filtragem multicritério (placa, tipo, intervalo de datas) e exportação dos dados filtrados para CSV com cabeçalho UTF-8 BOM (RF017). |
| **`js/finance.js`** | Controle Operacional | Consolidação das movimentações financeiras: cômputo de faturamento confirmado (RN010), segregação de receitas por método de pagamento (Dinheiro, Pix, Débito, Crédito) e apuração do tíquete médio. |
| **`js/settings.js`** | Configuração | Gestão dos parâmetros do estabelecimento: persistência de nomes, tarifas horárias, capacidades e tolerâncias, com verificação de segurança impedindo capacidades menores que a ocupação presente (RN015). |
| **`js/dashboard.js`** | Apresentação Analítica | Geração e renderização dos cartões de métricas em tempo real e montagem de gráficos vetoriais nativos em SVG para fluxo horário de veículos e composição de receitas, sem dependência de bibliotecas pesadas. |
| **`js/app.js`** | Orquestrador SPA | Inicialização do sistema, gerenciamento das abas ativas, captura de eventos de formulários, acionamento dos modais de checkout e de comprovante, despacho de notificações toast e loop de atualização em tempo real do pátio a cada segundo. |

---

### 4. Fluxo de Dados Operacional (Diagrama de Sequência)

#### 4.1. Fluxo de Entrada de Veículo

```mermaid
sequenceDiagram
    autonumber
    actor Operador
    participant UI as app.js (Interface)
    participant V as vehicles.js
    participant P as parking.js
    participant S as storage.js
    participant LS as LocalStorage

    Operador->>UI: Digita Placa e Categoria, clica "Confirmar Entrada"
    UI->>V: registerEntry(placa, tipo, condutor)
    V->>V: Valida formato da placa (RN013)
    V->>S: getActiveVehicles()
    S-->>V: Lista de veículos ativos
    V->>V: Verifica se placa já está ativa (RN001)
    V->>P: isCapacityAvailable(tipo)
    P-->>V: Retorna true/false (RN002)
    alt Lotação esgotada ou Placa Duplicada
        V-->>UI: Lança erro de validação
        UI-->>Operador: Exibe Toast de Erro impeditivo
    else Dados Válidos e Vaga Disponível
        V->>S: getSettings()
        S-->>V: Tarifas e tolerâncias vigentes
        V->>V: Cria objeto Ticket com tarifas vinculadas (RN017)
        V->>S: saveActiveVehicle(ticket)
        S->>LS: Atualiza parkcontrol_active
        V-->>UI: Retorna Ticket criado
        UI->>UI: Atualiza Dashboard e Tabela de Vagas
        UI-->>Operador: Exibe Toast de Sucesso e Modal do Tíquete de Entrada
    end
```

#### 4.2. Fluxo de Saída, Pagamento e Liberação de Vaga

```mermaid
sequenceDiagram
    autonumber
    actor Operador
    participant UI as app.js (Interface)
    participant Calc as pricing.js
    participant V as vehicles.js
    participant P as parking.js
    participant H as history.js
    participant S as storage.js

    Operador->>UI: Clica em "Registrar Saída" do veículo
    UI->>Calc: calculateFee(ticket, exitTime)
    Calc-->>UI: Retorna duração, valor total e memória de cálculo
    UI-->>Operador: Abre Modal de Checkout com detalhes e opções de pagamento
    Operador->>UI: Seleciona forma de pagamento e clica "Confirmar Pagamento"
    UI->>H: finalizeExit(ticketId, paymentMethod, exitTime)
    H->>S: getActiveVehicles()
    H->>H: Marca status 'finalizado' e anexa comprovante de pagamento
    H->>S: saveHistoryRecord(finalizedRecord)
    H->>S: removeActiveVehicle(ticketId)
    H->>P: releaseSlot(tipo)
    H-->>UI: Retorna registro finalizado com sucesso
    UI->>UI: Atualiza contadores, vagas e lista em tempo real
    UI-->>Operador: Exibe Toast e abre Recibo de Pagamento para impressão
```

---

### 5. Decisões Técnicas de Projeto

1. **Arquitetura Vanilla JS Modular sem Dependências:**
   - **Decisão:** Não utilizar frameworks SPA como React ou Vue nem bibliotecas externas de componentes ou gráficos (Chart.js).
   - **Justificativa:** Cumprimento rigoroso dos requisitos acadêmicos, eliminando etapas de build (`npm build`) e garantindo carregamento instantâneo, leveza extraordinária (< 250KB total com ícones) e compreensão didática absoluta de cada linha de código.
2. **Gráficos em SVG Puro Desenvolvidos Sob Medida:**
   - **Decisão:** Renderização de gráficos de barras e distribuição diretamente com elementos `<svg>` nativos construídos dinamicamente via JavaScript.
   - **Justificativa:** Garantia de total independência de CDNs externas, funcionamento offline impecável e estética customizada de acordo com a paleta de cores corporativa do projeto.
3. **Persistência via LocalStorage com Camada Abstrata de Repositório:**
   - **Decisão:** Isolar todas as chamadas `getItem`/`setItem` dentro de `storage.js`, encapsulando parsing com `JSON.parse` seguro e validação de schema.
   - **Justificativa:** Permite que no futuro a camada de armazenamento seja facilmente substituída por chamadas assíncronas `fetch()` para uma API REST com banco relacional sem necessidade de alterar as interfaces ou as regras de negócio.
4. **Sanitização Proativa Contra XSS:**
   - **Decisão:** Criação e uso sistemático do método `escapeHTML` em todas as interpolações de dados informados pelo usuário antes da inserção no DOM.
   - **Justificativa:** Segurança fundamental em aplicações web, impedindo ataques de injeção de scripts maliciosos.

---

### 6. Limitações Conhecidas do Protótipo Acadêmico

- **Armazenamento no Navegador (Client-side):** O `localStorage` é vinculado à origem e ao navegador local da máquina executora. Os dados não sincronizam automaticamente entre múltiplos computadores ou operadores remotos simultâneos.
- **Segurança e Criptografia:** Como protótipo acadêmico sem backend, não há autenticação JWT/OAuth2 com controle de senhas de operadores nem proteção contra inspeção manual de dados via DevTools do navegador.
- **Transações Financeiras Demonstrativas:** O fluxo de pagamento emite tíquetes e recibos de forma fidedigna ao processo comercial, porém não integra transações de débito/crédito reais com adquirentes nem gera QR Codes Pix com o Banco Central.
