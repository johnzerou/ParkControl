# MATRIZ DE RASTREABILIDADE DE REQUISITOS
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 1.0.0  
**Data de Atualização:** Novembro de 2026  

---

### 1. Visão Geral
A Matriz de Rastreabilidade garante o alinhamento bidirecional e a conformidade integral entre os Requisitos Funcionais (RF), Requisitos Não Funcionais (RNF), Regras de Negócio (RN), Casos de Uso (UC), Histórias de Usuário (US), Telas do Protótipo, Módulos de Código JavaScript e Cenários de Teste (CT).

---

### 2. Matriz Completa de Rastreabilidade

| Requisito Funcional | Descrição Resumida | Regras de Negócio | Casos de Uso | Histórias de Usuário | Tela(s) Associada(s) | Módulo(s) de Implementação | ID do Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **RF001** | Registrar entrada de veículo | RN001, RN002, RN003, RN013, RN014, RN017 | UC001 | US001 | Tela 2 (Entrada) | `vehicles.js`, `parking.js`, `storage.js` | CT01, CT02, CT03, CT04 |
| **RF002** | Registrar saída de veículo | RN004, RN005, RN006, RN007, RN008, RN009, RN010, RN011 | UC003, UC004 | US003, US004 | Tela 3 (Estacionados), Tela 4 (Checkout) | `vehicles.js`, `pricing.js`, `history.js`, `parking.js` | CT08, CT09 |
| **RF003** | Consultar veículos estacionados | RN005, RN006, RN007, RN008, RN009 | UC002 | US002 | Tela 3 (Estacionados) | `vehicles.js`, `pricing.js`, `app.js` | CT01, CT08 |
| **RF004** | Controlar vagas disponíveis/ocupadas | RN002, RN011, RN014, RN015 | UC001, UC002, UC004 | US001, US006 | Header, Tela 1 (Dashboard), Tela 2 | `parking.js`, `dashboard.js`, `storage.js` | CT01, CT03, CT09 |
| **RF005** | Identificar veículos pela placa | RN001, RN013, RN014 | UC001, UC002, UC003 | US001, US002 | Tela 2 (Entrada), Tela 3, Tela 5 | `utils.js`, `vehicles.js` | CT01, CT02, CT04 |
| **RF006** | Calcular tempo de permanência | RN005, RN014 | UC002, UC003 | US002, US003 | Tela 3 (Estacionados), Tela 4 (Checkout) | `pricing.js`, `utils.js` | CT05, CT06, CT07 |
| **RF007** | Calcular valor do estacionamento | RN006, RN007, RN008, RN009, RN014, RN017 | UC002, UC003 | US002, US003 | Tela 3, Tela 4 (Checkout) | `pricing.js` | CT05, CT06, CT07, CT13 |
| **RF008** | Registrar pagamentos | RN010, RN014, RN016 | UC004 | US004 | Tela 4 (Checkout / Pagamento) | `history.js`, `finance.js`, `pricing.js` | CT08, CT15 |
| **RF009** | Consultar histórico de entradas/saídas| RN012, RN014 | UC005 | US005 | Tela 5 (Histórico) | `history.js`, `storage.js` | CT08, CT11 |
| **RF010** | Pesquisar registros por filtros | RN005, RN012, RN013 | UC002, UC005 | US002, US005 | Tela 3 (Estacionados), Tela 5 (Histórico) | `vehicles.js`, `history.js`, `utils.js` | CT11 |
| **RF011** | Exibir dashboard com indicadores | RN002, RN010, RN011, RN014 | UC007 | US006 | Tela 1 (Dashboard) | `dashboard.js`, `parking.js`, `finance.js` | CT01, CT08, CT15 |
| **RF012** | Configurar capacidade | RN002, RN014, RN015 | UC008 | US007 | Tela 7 (Configurações) | `settings.js`, `parking.js` | CT14 |
| **RF013** | Configurar tarifas e tolerâncias | RN006, RN007, RN009, RN014, RN017 | UC008 | US007 | Tela 7 (Configurações) | `settings.js`, `pricing.js` | CT13, CT14 |
| **RF014** | Gerar comprovante (Tíquete/Recibo) | RN003, RN010, RN016 | UC001, UC004, UC005 | US001, US004 | Modais de Comprovante, `@media print` | `app.js`, `components.css` | CT01, CT08 |
| **RF015** | Consultar resumo financeiro | RN010, RN014, RN016 | UC007 | US006 | Tela 6 (Financeiro), Tela 1 (Dashboard) | `finance.js`, `dashboard.js` | CT08, CT15 |
| **RF016** | Validar dados informados pelo operador| RN013, RN014, RN015 | UC001, UC004, UC008 | US001, US007 | Todas as telas com formulários | `utils.js`, `vehicles.js`, `settings.js` | CT02, CT04, CT14 |
| **RF017** | Exportar registros para CSV | RN012, RN014 | UC006 | US005 | Tela 5 (Histórico) | `history.js`, `utils.js` | CT12 |
| **RF018** | Preservar dados após atualizar página| RN012, RN014, RN018 | Geral | Geral | Todas as telas | `storage.js` | CT10 |
| **RF019** | Carga e Reset de Dados de Teste | RN010, RN011, RN014 | UC009 | US008 | Tela 1 (Dashboard), Tela 7 | `storage.js`, `app.js` | CT10, CT15 |

---

### 3. Matriz de Requisitos Não Funcionais (RNF)

| Requisito Não Funcional | Descrição | Componente / Implementação | Critério de Validação |
| :--- | :--- | :--- | :--- |
| **RNF001** | Interface Responsiva | `responsive.css` com Grid/Flexbox | Renderização adaptativa em 320px, 768px, 1200px. |
| **RNF002** | Usabilidade e Navegação | `app.js`, navegação SPA instantânea | Troca de telas sem reload em < 50ms. |
| **RNF003** | Compatibilidade de Navegadores | JavaScript ES6+ e CSS3 nativos | Execução em Chrome, Firefox, Edge e Safari sem polifills legados. |
| **RNF004** | Organização e Modularidade | Módulos ES desacoplados em `js/` | Separação estrita de funções puras e isolamento de estado. |
| **RNF005** | Acessibilidade Básica | Contraste WCAG AA, tags semânticas e anéis de foco | Navegação por Tab e leitor de tela sem barreiras. |
| **RNF006** | Integridade dos Dados | `storage.js` com validação de payload | Nenhuma gravação com campos nulos mandatórios ou números negativos. |
| **RNF007** | Feedback Visual | Toasts animados e modais de confirmação | Notificação instantânea para qualquer ação do usuário. |
| **RNF008** | Persistência Local | Web Storage API (`localStorage`) | Dados mantidos entre sessões sob chaves versionadas. |
| **RNF009** | Desempenho Operacional | Algoritmos síncronos em memória | Cálculos e renderizações executados em menos de 16ms (60 FPS). |
| **RNF010** | Tratamento e Sanitização | `utils.escapeHTML` e validação defensiva | Impossibilidade de injeção XSS por campos de texto. |
| **RNF011** | Separação Camadas/Negócio | `pricing.js` e `parking.js` puros | Funções testáveis de forma independente fora do navegador (Node.js). |
| **RNF012** | Documentação Organizada | Pasta `docs/` com 11 especificações | Atendimento total à estrutura solicitada no roteiro acadêmico. |
