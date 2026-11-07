# APRESENTAÇÃO DO PROJETO
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 1.0.0  
**Data de Atualização:** Novembro de 2026  

---

### 1. Identificação do Projeto
- **Nome do Projeto:** ParkControl — Sistema de Controle e Gerenciamento de Estacionamento
- **Natureza:** Protótipo Acadêmico Funcional / Projeto de Engenharia de Software
- **Repositório Oficial:** [https://github.com/johnzerou/ParkControl.git](https://github.com/johnzerou/ParkControl.git)
- **Autores:** João Pedro Ribas da Silva e Nicolas Ferreira Souza
- **Instituição de Ensino:** Faculdade de Tecnologia de Carapicuíba (FATEC Carapicuíba)
- **Curso:** Graduação Tecnológica em Análise e Desenvolvimento de Sistemas (ADS)
- **Turno:** Noturno
- **Ano de Desenvolvimento:** 2026

---

### 2. Contextualização do Projeto
O setor de mobilidade urbana e guarda de veículos enfrenta desafios crescentes relacionados à agilidade operacional, precisão no controle de fluxo e confiabilidade nas transações financeiras. Pequenos e médios estabelecimentos de estacionamento frequentemente operam por meio de anotações manuais, planilhas desarticuladas ou softwares legados com interfaces obsoletas e processos lentos. Esse cenário propicia falhas humanas recorrentes, tais como: cálculo incorreto de permanência e frações tarifárias, perda de registros de entrada, controle ineficiente de lotação e divergências no fechamento de caixa.

Nesse contexto, o **ParkControl** surge como uma proposta acadêmica e prática desenvolvida no âmbito do curso de Análise e Desenvolvimento de Sistemas da FATEC Carapicuíba. O objetivo central é demonstrar a aplicação rigorosa de conceitos modernos de Engenharia de Software, Arquitetura de Software Frontend, Usabilidade (UI/UX) e boas práticas de codificação no desenvolvimento de uma aplicação web interativa, responsiva e independente de infraestruturas complexas de backend.

---

### 3. Problema Identificado
Estacionamentos sem automação informatizada adequada sofrem com:
1. **Erros no cálculo de tarifas e frações de tempo:** Aplicação inconsistente do período de tolerância, primeira hora e frações de 15 minutos, gerando prejuízos operacionais ou reclamações de clientes.
2. **Falta de visibilidade da capacidade em tempo real:** Dificuldade em determinar instantaneamente vagas disponíveis para diferentes categorias de veículos (carros e motocicletas), provocando superlotação física ou recusa indevida de clientes.
3. **Fragilidade no fechamento de caixa:** Ausência de consolidação automática das modalidades de pagamento (Pix, Dinheiro, Débito e Crédito) e impossibilidade de auditoria imediata dos tíquetes emitidos.
4. **Perda de histórico operacional:** Inexistência de registros digitais auditáveis de entradas, saídas e faturamento, dificultando a tomada de decisão estratégica baseada em dados.

---

### 4. Justificativa
A criação do ParkControl justifica-se academicamente pela oportunidade de consolidar habilidades fundamentais do ciclo de vida de desenvolvimento de software (SDLC): especificação formal de requisitos, modelagem conceitual e lógica, arquitetura modular em Vanilla JavaScript (ES6+), design de interfaces responsivas com foco na experiência do usuário e elaboração de planos de testes metódicos. 

Do ponto de vista prático, o sistema demonstra que uma arquitetura puramente client-side, bem estruturada e orientada a padrões de projeto limpos, é capaz de entregar alto valor agregado, permitindo a operação imediata do negócio diretamente pelo navegador, com persistência local resiliente e interface padrão SaaS empresarial.

---

### 5. Objetivo Geral
Desenvolver um protótipo funcional, moderno, responsivo e interativo para controle e gerenciamento de estacionamento, acompanhado por uma documentação técnica e acadêmica completa de Engenharia de Software, assegurando a fidelidade estrita às regras de negócio e rastreabilidade total entre requisitos e código implementado.

---

### 6. Objetivos Específicos
- Projetar e implementar a arquitetura frontend utilizando exclusivamente **HTML5 semântico**, **CSS3 moderno** e **JavaScript puro (Vanilla JS)** em módulos ES nativos.
- Implementar mecanismos rigorosos de persistência em **LocalStorage**, garantindo integridade de dados, sanitização contra XSS e validações defensivas.
- Implementar o algoritmo determinístico de tarifação com tolerância inicial (10 minutos), primeira hora cheia e frações adicionais de 15 minutos a 25% da tarifa horária (RN006 a RN009).
- Desenvolver um controle dinâmico de vagas segregado por categoria de veículo (carros e motocicletas), com bloqueio automático em caso de lotação (RN002) e impedimento de redução de capacidade abaixo da lotação real (RN015).
- Criar rotinas de emissão e impressão de comprovantes de entrada e recibos de pagamento fiscais formatados para impressão em folha ou impressora térmica.
- Disponibilizar relatórios operacionais e consolidação financeira por método de pagamento, com gráficos dinâmicos construídos sem bibliotecas externas e exportação de dados para CSV em conformidade com o padrão brasileiro (UTF-8 com BOM).
- Conduzir uma suíte de testes de validação cobrindo casos operacionais nominais e casos extremos de borda (virada de meia-noite, permanência exata na tolerância, frações mínimas e excedentes).

---

### 7. Escopo da Solução
#### 7.1. O que está no escopo (Atendido pelo Protótipo):
- Cadastro imediato de entrada de veículos com identificação da placa (padrão antigo e Mercosul), tipo e condutor opcional.
- Monitoramento contínuo de veículos estacionados com recálculo automático de permanência e valor estimado segundo a segundo.
- Checkout completo de saída com memória de cálculo detalhada, seleção de meio de pagamento demonstrativo, cálculo de troco para dinheiro e geração de recibo.
- Histórico completo de movimentações com filtros por placa, data e tipo, acompanhado de exportador CSV nativo.
- Módulo financeiro com indicadores de faturamento diário, total acumulado, tíquete médio e receita segregada por método.
- Painel de configurações operacionais com capacidade de personalização de vagas, tarifas e tolerâncias.
- Mecanismo explícito para carga de dados de demonstração (seed) e restauração segura do estado inicial (reset).

#### 7.2. O que está fora do escopo (Limitações do Protótipo Acadêmico):
- Integração bancária real com APIs de adquirentes de cartão ou gateway do Banco Central (Pix); as transações são demonstrativas para controle operacional.
- Concorrência de escrita multi-operador simultânea em tempo real (limitação inerente ao LocalStorage do navegador).
- Reconhecimento automático de placas por visão computacional (LPR / OCR de câmeras físicas).

---

### 8. Tecnologias Utilizadas
| Camada / Função | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Estrutura** | HTML5 Semântico | Garantia de acessibilidade, SEO e estruturação hierárquica clara (`header`, `nav`, `main`, `section`, `article`, `footer`). |
| **Estilização** | CSS3 Moderno | Flexbox, CSS Grid, Custom Properties (variáveis CSS), transições suaves e mídia queries responsivas sem dependência de frameworks. |
| **Lógica e Controle** | JavaScript (ES6+ Vanilla) | Execução performática, manipulação ágil do DOM, arquitetura modular e desacoplada sem necessidade de transpiladores ou bundlers. |
| **Persistência** | LocalStorage API | Armazenamento de dados no cliente no formato JSON, atendendo à proposta de protótipo acadêmico portátil e autônomo. |
| **Gráficos e Ícones** | SVG Nativo | Elementos visuais vetoriais leves, nítidos em qualquer resolução e sem impacto no tempo de carregamento da aplicação. |
| **Documentação** | Markdown (.md) | Padrão técnico universal para repositórios de software e documentação acadêmica versionada. |

---

### 9. Resultados Esperados
- Entrega de um protótipo com navegabilidade fluida e intuitiva, com padrão visual corporativo (SaaS).
- Total consistência no fluxo de estados do veículo (Entrada $\rightarrow$ Estacionado $\rightarrow$ Saída $\rightarrow$ Histórico).
- Zero divergências contábeis entre os tíquetes finalizados e os montantes reportados nos dashboards financeiro e operacional.
- Documentação técnica e acadêmica que atenda integralmente às boas práticas de Engenharia de Software, servindo como modelo de especificação para trabalhos acadêmicos de graduação.

---

### 10. Considerações Finais
O ParkControl consolida os conhecimentos adquiridos na FATEC Carapicuíba pelos discentes João Pedro Ribas da Silva e Nicolas Ferreira Souza. A solução comprova que a engenharia de software disciplinada — baseada em levantamento minucioso de requisitos, modelagem rigorosa e arquitetura limpa — é a base para a construção de sistemas computacionais confiáveis, manuteníveis e prontos para evolução tecnológica.
