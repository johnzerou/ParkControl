# ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-blue.svg)](LICENSE)
[![Status do Projeto](https://img.shields.io/badge/Status-Conclu%C3%ADdo%20%7C%20Homologado-16A34A.svg)](#)
[![Testes Automatizados](https://img.shields.io/badge/Testes-15%2F15%20Aprovados%20(100%25)-brightgreen.svg)](#)
[![Padrão de Código](https://img.shields.io/badge/JavaScript-Vanilla%20ES6%2B-F7DF1E.svg)](#)

O **ParkControl** é um sistema web moderno, interativo e responsivo para controle e gestão completa de estacionamentos. Desenvolvido sob rigorosos princípios de Engenharia de Software e arquitetura frontend limpa, o projeto foi concebido e implementado exclusivamente com **HTML5 semântico**, **CSS3 moderno** e **JavaScript Vanilla (ES6+)** nativo, sem qualquer dependência de frameworks ou compiladores externos.

---

## Autores

- **João Pedro Ribas da Silva**
- **Nicolas Ferreira Souza**

**Curso:** Graduação Tecnológica em Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Ano de Desenvolvimento:** 2026  
**Repositório Oficial:** [https://github.com/johnzerou/ParkControl.git](https://github.com/johnzerou/ParkControl.git)

---

## Objetivo do Projeto

Simular com fidelidade a operação real de um estabelecimento de estacionamento de veículos, permitindo o controle instantâneo de pátio, fluxos de entrada e saída, cálculo determinístico de tarifas, checkout financeiro demonstrativo, auditoria de movimentações e parametrização do negócio, acompanhado de uma documentação técnica e acadêmica completa de Engenharia de Software.

---

## Funcionalidades Principais

- **Dashboard Operacional em Tempo Real (Tela 1):**
  - Contadores de vagas totais, vagas ocupadas, vagas disponíveis (carros e motos) e taxa de ocupação percentual com barra dinâmica colorida.
  - Indicadores de entradas do dia, saídas do dia e faturamento confirmado.
  - Gráficos vetoriais dinâmicos em SVG nativo (fluxo de movimentações por faixa horária e distribuição de receitas por método de pagamento) sem bibliotecas externas.
  - Painel com resumo das movimentações mais recentes e atalhos rápidos.
- **Entrada Ágil de Veículos (Tela 2):**
  - Reconhecimento e validação imediata de placas nos padrões Brasileiro Tradicional (`AAA-1234`) e Mercosul (`AAA1B23`), com normalização automática para maiúsculas (RN013).
  - Bloqueio automático caso o veículo já possua uma estadia ativa no pátio (RN001).
  - Bloqueio automático de novas entradas em caso de lotação física da categoria (RN002).
  - Geração de tíquete único rastreável com horário oficial e snapshot tarifário no momento do ingresso (RN003, RN017).
  - Emissão e impressão do tíquete de entrada em layout térmico via `@media print` (RF014).
- **Gestão de Veículos Estacionados (Tela 3):**
  - Tabela com listagem instantânea de veículos ativos no pátio.
  - Cronômetro dinâmico atualizado segundo a segundo com o tempo de permanência decorrido e projeção do valor financeiro estimado.
  - Busca rápida em tempo de digitação por placa, tíquete ou condutor, com filtros por categoria (Carros / Motos).
  - Ação direta de chamada para saída e visualização de tíquete.
- **Saída e Pagamento / Checkout (Tela 4 - Modal):**
  - Apresentação da memória de cálculo detalhada da tarifa:
    - *Tolerância gratuita inicial:* estadias até 10 minutos pagam R$ 0,00 (RN007).
    - *Primeira hora integral:* cobrada após o fim da tolerância até 60 minutos (RN008).
    - *Frações subsequentes:* cada fração iniciada de 15 minutos adiciona 25% da tarifa horária (RN009).
  - Suporte aos meios de pagamento: Dinheiro, Pix, Cartão de Débito e Cartão de Crédito (RN016).
  - Para dinheiro: campo de valor entregue com cálculo automático e exibição em tempo real do troco.
  - Liberação atômica da vaga física e arquivamento imediato no histórico (RN011, RN012).
  - Emissão e impressão do Recibo de Pagamento / Cupom Fiscal de saída.
- **Histórico e Exportação (Tela 5):**
  - Registro permanente e auditável de todas as permanências concluídas.
  - Filtros avançados por fragmento de placa, tipo de veículo e intervalo de datas.
  - Exportação para planilha CSV com codificação UTF-8 com BOM (`\uFEFF`), assegurando compatibilidade perfeita com o Microsoft Excel e LibreOffice Calc (RF017).
  - Reimpressão de comprovantes de estadias passadas com 1 clique.
- **Auditoria e Gestão Financeira (Tela 6):**
  - Indicadores de faturamento total acumulado, faturamento do dia, volume de transações e tíquete médio.
  - Filtro dinâmico por período (Hoje, Últimos 7 dias, Mês, Todo o Histórico).
  - Gráfico de distribuição percentual por canal de pagamento e extrato analítico de lançamentos.
- **Configurações e Parâmetros (Tela 7):**
  - Parametrização do nome do estacionamento, capacidade de vagas (carros/motos), tarifas horárias e tempos de tolerância/fração.
  - Proteção de integridade que impede a redução da capacidade de vagas para valores inferiores à lotação atual de veículos no pátio (RN015).
  - Botão de "Carga de Dados de Demonstração (Seed)" e "Reset de Fábrica" para testes e homologação acadêmica rápida.

---

## Tecnologias Utilizadas

| Tecnologia | Descrição |
| :--- | :--- |
| **HTML5 Semântico** | Estruturação acessível com tags semânticas (`<aside>`, `<header>`, `<main>`, `<article>`, `<section>`, `<footer>`). |
| **CSS3 Moderno** | Flexbox, CSS Grid, Custom Properties (variáveis CSS), animações suaves e design tokens padronizados. |
| **JavaScript Puro (Vanilla JS)** | Módulos ES nativos (`import`/`export`), sem React, Vue, Angular ou transpilação. |
| **Web Storage API (LocalStorage)** | Persistência local desacoplada com validação de esquema, recuperação segura e integridade. |
| **SVG Nativo** | Ícones e gráficos de barras/rosca criados dinamicamente sem dependências externas. |
| **Node.js (Test Runner)** | Utilizado estritamente para execução da suíte automatizada de testes unitários. |

---

## Estrutura do Projeto

```
ParkControl/
├── index.html                   # Interface principal da Single Page Application (SPA)
├── package.json                 # Metadados do projeto e script de testes ES Modules
├── README.md                    # Apresentação, guia de execução e créditos acadêmicos
├── css/
│   ├── style.css                # Variáveis globais, reset, layout, sidebar e cabeçalho
│   ├── components.css           # Botões, cards de KPI, tabelas, modais, toasts e cupom térmico
│   └── responsive.css           # Regras de mídia (@media) para Desktop, Tablet e Celular
├── js/
│   ├── app.js                   # Orquestrador SPA, roteamento interno, eventos e modais
│   ├── storage.js               # Repositório LocalStorage, persistência, seed e reset
│   ├── pricing.js               # Motor de tarifação (tolerância, 1ª hora, frações de 15 min)
│   ├── parking.js               # Gestão de vagas, ocupação e controle de lotação (RN002/RN015)
│   ├── vehicles.js              # Registro de entradas, validação de placa única e busca
│   ├── history.js               # Registro histórico de saídas, filtros e exportador CSV com BOM
│   ├── finance.js               # Faturamento confirmado, KPIs financeiros e conciliação
│   ├── settings.js              # Gerenciamento das configurações operacionais do pátio
│   ├── dashboard.js             # Métricas em tempo real e renderização de gráficos SVG
│   └── utils.js                 # Sanitização XSS, validação de placas e formatação monetária
├── assets/
│   └── icons/                   # Ícones vetoriais SVG
├── tests/
│   └── test-suite.js            # Suíte de testes automatizados dos 15 cenários de homologação
└── docs/                        # Documentação técnica e acadêmica completa em Markdown
    ├── APRESENTACAO_PROJETO.md  # Contexto, justificativa, objetivos e escopo do projeto
    ├── REQUISITOS.md            # Especificação completa de Requisitos Funcionais e Não Funcionais
    ├── REGRAS_NEGOCIO.md        # Catálogo formal de Regras de Negócio (RN001 a RN017)
    ├── CASOS_DE_USO.md          # Especificação detalhada de Casos de Uso com diagramas Mermaid
    ├── HISTORIAS_USUARIO.md     # User Stories com critérios de aceitação objetivos
    ├── ARQUITETURA.md           # Arquitetura frontend, fluxo de dados e decisões técnicas
    ├── MODELO_DADOS.md          # Diagrama ER, entidades, tipos e exemplos de JSON
    ├── PROTOTIPO.md             # Descrição detalhada das telas, componentes e interações
    ├── PLANO_TESTES.md          # Matriz de testes homologada com resultados reais (15/15)
    └── RASTREABILIDADE.md       # Matriz bidirecional de rastreabilidade (RF, RN, UC, US, Código)
```

---

## Como Executar Localmente

Como a aplicação é construída com **HTML5, CSS3 e módulos ES nativos de JavaScript**, o protótipo não requer compilação (`npm build`). Recomenda-se executá-lo através de qualquer servidor estático local para evitar restrições de CORS que alguns navegadores impõem ao protocolo `file://` com módulos JavaScript.

### Opção 1: Usando Python (Nativo em Windows, Linux e macOS)
Abra o terminal na pasta do projeto e execute:
```bash
# Inicia um servidor HTTP na porta 8000
python -m http.server 8000
```
Em seguida, abra o navegador e acesse: [http://localhost:8000](http://localhost:8000)

### Opção 2: Usando Node.js / npx serve
```bash
# Inicia um servidor estático leve
npx serve .
```

### Opção 3: Extensão Live Server (VS Code)
1. Abra a pasta do projeto no VS Code.
2. Clique com o botão direito no arquivo `index.html`.
3. Selecione **"Open with Live Server"**.

---

## Como Executar a Suíte de Testes Automatizados

O projeto inclui uma suíte completa em `tests/test-suite.js` que valida todos os 15 cenários de teste exigidos na especificação:

```bash
# Executa a suíte de testes com Node.js
npm test
# ou
node tests/test-suite.js
```

**Resultado obtido na homologação:**
```text
================================================================
INICIANDO SUÍTE DE TESTES DO PARKCONTROL — FATEC CARAPICUÍBA
================================================================
[PASS] CT01: Registro de um carro com vagas disponíveis
[PASS] CT02: Tentativa de registrar duas entradas simultâneas com a mesma placa (RN001)
[PASS] CT03: Bloqueio de entrada quando a capacidade está lotada (RN002)
[PASS] CT04: Rejeição de registro com placas inválidas (RN013)
[PASS] CT05: Cálculo tarifário dentro da tolerância de 10 minutos (RN007)
[PASS] CT06: Cálculo para permanências superiores à primeira hora (RN008, RN009)
[PASS] CT07: Cálculo tarifário atravessando a meia-noite
[PASS] CT08: Finalização correta de pagamento e saída de veículo
[PASS] CT09: Atualização correta da quantidade de vagas após saída
[PASS] CT10: Preservação da integridade de dados e persistência (RF018)
[PASS] CT11: Filtros e pesquisas no histórico por placa e categoria (RF010)
[PASS] CT12: Geração de CSV com delimitador ponto e vírgula e BOM UTF-8 (RF017)
[PASS] CT13: Irretroatividade: novas tarifas não alteram permanências já ativas (RN017)
[PASS] CT14: Impedimento de redução de capacidade abaixo da ocupação (RN015) e validações (RN014)
[PASS] CT15: Faturamento confirmado deriva estritamente de pagamentos concluídos (RN010)
================================================================
RESULTADO FINAL DA SUÍTE DE TESTES: 15/15 APROVADOS (100%)
================================================================
```

---

## Como Utilizar o Sistema

1. **Carga Rápida de Demonstração (Recomendado para Avaliação):**
   - No menu lateral esquerdo ou na barra de navegação, clique no botão azul **"Carregar Demonstração"**.
   - O sistema injetará automaticamente veículos estacionados com diferentes tempos de estadia e um histórico variado do dia.
2. **Registrar Entrada de Veículo:**
   - Acesse a aba **"Entrada de Veículo"**.
   - Selecione a categoria (*Carro* ou *Moto*).
   - Digite a placa (ex: `BRA2E19` ou `ABC-1234`).
   - Opcionalmente informe o nome do condutor e clique em **"Confirmar Entrada do Veículo"**.
   - O modal do tíquete abrirá com a opção **"Imprimir Tíquete"**.
3. **Acompanhar o Pátio:**
   - Acesse a aba **"Estacionados"**.
   - Observe a atualização contínua do tempo e do valor estimado.
   - Utilize a barra de pesquisa para localizar qualquer veículo pela placa.
4. **Realizar Saída e Pagamento (Checkout):**
   - Na linha do veículo desejado, clique em **"Registrar Saída"**.
   - O modal exibirá a memória de cálculo tarifária completa.
   - Escolha o meio de pagamento (*Pix*, *Dinheiro*, *Débito* ou *Crédito*).
   - Se selecionar dinheiro, informe o montante recebido para calcular o troco.
   - Clique em **"Confirmar Pagamento e Liberar Saída"**.
   - O recibo fiscal/térmico será gerado na tela com opção de impressão via navegador.
5. **Auditar Histórico e Exportar CSV:**
   - Acesse a aba **"Histórico"**.
   - Filtre por período ou placa.
   - Clique no botão verde **"Exportar CSV"** para baixar a planilha formatada em Excel.
6. **Configurar Parâmetros:**
   - Acesse a aba **"Configurações"** para ajustar capacidades de vagas, tolerância e preços.
   - Se desejar zerar a base de dados, utilize o botão **"Resetar de Fábrica"**.

---

## Localização da Documentação Técnica

Toda a documentação acadêmica de Engenharia de Software encontra-se organizada na pasta [`docs/`](docs/):

1. [Apresentação do Projeto (`docs/APRESENTACAO_PROJETO.md`)](docs/APRESENTACAO_PROJETO.md)
2. [Especificação de Requisitos de Software (`docs/REQUISITOS.md`)](docs/REQUISITOS.md)
3. [Catálogo de Regras de Negócio (`docs/REGRAS_NEGOCIO.md`)](docs/REGRAS_NEGOCIO.md)
4. [Especificação de Casos de Uso (`docs/CASOS_DE_USO.md`)](docs/CASOS_DE_USO.md)
5. [Histórias de Usuário (`docs/HISTORIAS_USUARIO.md`)](docs/HISTORIAS_USUARIO.md)
6. [Documento de Arquitetura de Software (`docs/ARQUITETURA.md`)](docs/ARQUITETURA.md)
7. [Modelo de Dados e Entidades (`docs/MODELO_DADOS.md`)](docs/MODELO_DADOS.md)
8. [Especificação de Telas e Protótipo (`docs/PROTOTIPO.md`)](docs/PROTOTIPO.md)
9. [Plano e Relatório de Testes (`docs/PLANO_TESTES.md`)](docs/PLANO_TESTES.md)
10. [Matriz de Rastreabilidade (`docs/RASTREABILIDADE.md`)](docs/RASTREABILIDADE.md)

---

## Limitações Conhecidas do Protótipo

- **Persistência em Cliente (`localStorage`):** Os dados são armazenados localmente no navegador da máquina executora. Não há sincronização automática em tempo real entre operadores em máquinas distintas.
- **Transações Financeiras Demonstrativas:** O sistema gera memória de cálculo, recibos e conciliação gerencial fidedignos, porém sem integração com adquirentes de cartão ou gateway Pix do Banco Central.
- **Autenticação:** Não contempla controle de acesso por múltiplos perfis (login/senha) com verificação em servidor backend.

---

## Próximas Melhorias Sugeridas

1. **Desenvolvimento de Backend com API REST:** Migração para backend em Node.js/Express, Python/FastAPI ou Java/Spring Boot.
2. **Banco de Dados Relacional:** Utilização de PostgreSQL com transações ACID para garantir concorrência multi-operador e integridade referencial.
3. **Autenticação e RBAC:** Implementação de JWT com controle de perfis (Operador de Pátio, Caixa, Gerente, Administrador).
4. **Integração com Câmeras LPR:** Reconhecimento automático de placas por visão computacional e OCR na cancela de entrada e saída.
5. **Integração com Gateways de Pagamento:** Geração de QR Code dinâmico Pix via API bancária e integração com maquininhas POS TEF.

---

<p align="center">
  <em>Desenvolvido por João Pedro Ribas da Silva e Nicolas Ferreira Souza | ADS Noite — FATEC Carapicuíba | 2026</em>
</p>
