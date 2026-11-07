# ESPECIFICAÇÃO DE REQUISITOS DE SOFTWARE (SRS)
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 1.0.0  
**Data de Atualização:** Novembro de 2026  

---

### 1. Introdução e Visão Geral
Este documento apresenta a especificação técnica formal dos Requisitos Funcionais (RF) e Requisitos Não Funcionais (RNF) do sistema **ParkControl**. O objetivo é orientar o projeto, a codificação, a verificação e a homologação do protótipo, estabelecendo critérios mensuráveis e objetivos de qualidade e conformidade com as regras de negócio.

### 2. Stakeholders e Atores
| Ator / Stakeholder | Papel no Sistema | Descrição das Atividades |
| :--- | :--- | :--- |
| **Operador de Pátio / Caixa** | Usuário Operacional | Responsável por registrar a entrada e saída física dos veículos, conferir placas, efetuar o recebimento de valores e emitir comprovantes. |
| **Administrador / Gerente** | Usuário Gestor | Acompanha indicadores operacionais em tempo real no Dashboard, analisa relatórios financeiros, exporta dados para auditoria e define capacidades e parâmetros tarifários. |
| **Cliente / Condutor** | Beneficiário Indireto | Proprietário ou motorista do veículo que usufrui da vaga de estacionamento e recebe o tíquete/comprovante impresso com os valores e tempos discriminados. |
| **Avaliador Acadêmico** | Stakeholder Auditor | Docente ou banca examinadora responsável por validar a integridade técnica, o cumprimento dos requisitos de Engenharia de Software e a fidelidade às regras especificadas. |

---

### 3. Requisitos Funcionais (RF)

#### RF001 — Registrar entrada de veículo
- **Identificador:** RF001
- **Nome:** Registrar entrada de veículo
- **Descrição completa:** O sistema deve permitir ao operador registrar a entrada de um veículo no estacionamento, capturando os dados essenciais para identificação e tarifação posterior.
- **Ator responsável:** Operador de Pátio / Caixa.
- **Prioridade:** Alta.
- **Entradas necessárias:** Placa do veículo (obrigatória), tipo do veículo (carro ou moto - obrigatório), nome do responsável/condutor (opcional), data e hora da entrada (automática ou ajustável no registro).
- **Processamento esperado:** Validar o formato da placa (padrão antigo ou Mercosul), verificar se já não existe uma permanência ativa para a mesma placa (RN001), verificar se há vaga disponível para o tipo correspondente (RN002), gerar identificador único do tíquete (RN003), vincular as tarifas vigentes no momento da entrada (RN017), persistir o registro no LocalStorage e decrementar as vagas disponíveis.
- **Saídas/resultados:** Notificação de sucesso, exibição do tíquete com opção de impressão imediata e atualização automática dos indicadores operacionais.
- **Critérios de aceitação:** O registro só é concluído se houver vaga e a placa for válida e inédita entre as ativas; os dados são persistidos imediatamente.
- **Regras de negócio relacionadas:** RN001, RN002, RN003, RN013, RN014, RN017.

#### RF002 — Registrar saída de veículo
- **Identificador:** RF002
- **Nome:** Registrar saída de veículo
- **Descrição completa:** O sistema deve possibilitar a seleção de um veículo estacionado e o encerramento do seu ciclo de permanência após o devido pagamento.
- **Ator responsável:** Operador de Pátio / Caixa.
- **Prioridade:** Alta.
- **Entradas necessárias:** Seleção da permanência ativa (por placa ou identificador), horário de saída (automático no checkout), método de pagamento selecionado, valor recebido (se pagamento em dinheiro).
- **Processamento esperado:** Validar se a permanência está com status 'ativo' (RN004), calcular a diferença de tempo entre entrada e saída (RN005), calcular o valor devido conforme as regras tarifárias (RN006 a RN009), calcular troco se aplicável, registrar o pagamento confirmado (RN010), atualizar o status da permanência para 'finalizado', registrar a movimentação no histórico e liberar a vaga física (RN011).
- **Saídas/resultados:** Comprovante final de pagamento emitido, vaga liberada no painel e no LocalStorage, notificação visual de sucesso.
- **Critérios de aceitação:** A vaga só é dada como liberada após a finalização bem-sucedida do pagamento; não é permitida saída duplicada.
- **Regras de negócio relacionadas:** RN004, RN005, RN006, RN007, RN008, RN009, RN010, RN011, RN012, RN016.

#### RF003 — Consultar veículos atualmente estacionados
- **Identificador:** RF003
- **Nome:** Consultar veículos atualmente estacionados
- **Descrição completa:** O sistema deve disponibilizar uma visualização em lista/tabela de todos os veículos que se encontram no pátio no momento presente.
- **Ator responsável:** Operador de Pátio / Caixa, Administrador.
- **Prioridade:** Alta.
- **Entradas necessárias:** Nenhuma (carregamento automático) ou termos de busca/filtro (placa, tipo de veículo).
- **Processamento esperado:** Recuperar os registros com status 'ativo' do LocalStorage, computar dinamicamente o tempo decorrido e o valor estimado acumulado até o instante corrente.
- **Saídas/resultados:** Tabela estruturada contendo: Identificador, Placa, Tipo, Horário de Entrada, Tempo de Permanência decorrido, Valor Estimado, Status e botão de Ação para saída.
- **Critérios de aceitação:** Os tempos e valores estimados devem ser atualizados continuamente a cada intervalo de tempo sem exigir recarregamento da página.
- **Regras de negócio relacionadas:** RN005, RN006, RN007, RN008, RN009.

#### RF004 — Controlar quantidade de vagas disponíveis e ocupadas
- **Identificador:** RF004
- **Nome:** Controlar quantidade de vagas disponíveis e ocupadas
- **Descrição completa:** O sistema deve rastrear e calcular em tempo real a lotação do estabelecimento, discriminada por categoria de veículo (carros e motos) e globalmente.
- **Ator responsável:** Sistema / Operador.
- **Prioridade:** Alta.
- **Entradas necessárias:** Total de vagas configuradas e lista de permanências ativas.
- **Processamento esperado:** Contar veículos ativos para carros e motos, subtrair do limite configurado para cada tipo, derivar vagas disponíveis e percentual de ocupação.
- **Saídas/resultados:** Indicadores visuais na barra de status, cards no Dashboard e bloqueio de novos registros no formulário caso esgotadas.
- **Critérios de aceitação:** Vagas disponíveis = Capacidade total - Veículos ativos. Valores nunca podem ser negativos.
- **Regras de negócio relacionadas:** RN002, RN011, RN014, RN015.

#### RF005 — Identificar veículos pela placa
- **Identificador:** RF005
- **Nome:** Identificar veículos pela placa
- **Descrição completa:** O sistema deve prover mecanismo de busca e validação por placa automotiva, aceitando formatos vigentes no território nacional.
- **Ator responsável:** Operador de Pátio / Caixa.
- **Prioridade:** Média.
- **Entradas necessárias:** String alfanumérica digitada pelo operador.
- **Processamento esperado:** Limpeza de caracteres especiais, conversão para caixa alta (uppercase), validação regex para formatos tradicional (ex: `ABC-1234`) e Mercosul (ex: `ABC1D23`).
- **Saídas/resultados:** Placa padronizada e sanitizada ou mensagem informativa de formato inválido.
- **Critérios de aceitação:** Rejeitar placas que não atendam às normas e garantir uniformidade na comparação de duplicidade.
- **Regras de negócio relacionadas:** RN001, RN013, RN014.

#### RF006 — Calcular automaticamente o tempo de permanência
- **Identificador:** RF006
- **Nome:** Calcular automaticamente o tempo de permanência
- **Descrição completa:** O sistema deve calcular a duração da estadia do veículo a partir do registro de entrada até a saída (ou instante atual).
- **Ator responsável:** Sistema.
- **Prioridade:** Alta.
- **Entradas necessárias:** Timestamp de entrada (ISO 8601) e Timestamp de saída (ISO 8601).
- **Processamento esperado:** Subtração dos tempos em milissegundos convertida para minutos totais, horas e minutos formatados (ex: `1h 25min`).
- **Saídas/resultados:** Minutos totais (inteiro para regras de cobrança) e string amigável de exibição.
- **Critérios de aceitação:** Lidar com precisão com permanências de curta duração, longas durações e travessia de dias (meia-noite). Não permitir saídas anteriores à entrada.
- **Regras de negócio relacionadas:** RN005, RN014.

#### RF007 — Calcular o valor do estacionamento
- **Identificador:** RF007
- **Nome:** Calcular o valor do estacionamento
- **Descrição completa:** O sistema deve aplicar a tabela de preços do estabelecimento de acordo com a política de tolerância, primeira hora cheia e frações subsequentes.
- **Ator responsável:** Sistema.
- **Prioridade:** Alta.
- **Entradas necessárias:** Minutos totais de permanência, tarifas associadas ao tíquete (valor hora, tolerância, minutos da fração e percentual de fração).
- **Processamento esperado:** 
  1. Se permanência $\le$ tolerância (ex: 10 min): valor = R$ 0,00.
  2. Se tolerância < permanência $\le$ 60 min: valor = 1 hora integral.
  3. Se permanência > 60 min: valor = 1 hora integral + (número de frações iniciadas de 15 minutos $\times$ 25% da tarifa horária).
- **Saídas/resultados:** Valor numérico em moeda corrente (BRL) e detalhamento da memória de cálculo.
- **Critérios de aceitação:** Precisão matemática estrita sem erros de arredondamento em ponto flutuante; aderência total aos exemplos documentados.
- **Regras de negócio relacionadas:** RN006, RN007, RN008, RN009, RN014, RN017.

#### RF008 — Registrar pagamentos
- **Identificador:** RF008
- **Nome:** Registrar pagamentos
- **Descrição completa:** O sistema deve registrar a liquidação financeira da tarifa de estacionamento antes de permitir a saída do veículo.
- **Ator responsável:** Operador de Pátio / Caixa.
- **Prioridade:** Alta.
- **Entradas necessárias:** Forma de pagamento escolhida (Dinheiro, Pix, Cartão de Débito, Cartão de Crédito), valor pago.
- **Processamento esperado:** Verificar se o valor pago cobre o total devido, calcular eventual troco para pagamento em dinheiro, gerar identificador do pagamento, vincular ao tíquete e gravar no livro de movimentações financeiras.
- **Saídas/resultados:** Registro de pagamento confirmado com data, hora, método e valor.
- **Critérios de aceitação:** O pagamento é requisito obrigatório para liberar a saída; métodos inválidos são impedidos.
- **Regras de negócio relacionadas:** RN010, RN014, RN016.

#### RF009 — Consultar histórico de entradas e saídas
- **Identificador:** RF009
- **Nome:** Consultar histórico de entradas e saídas
- **Descrição completa:** O sistema deve armazenar e permitir a visualização de todas as permanências já concluídas no estabelecimento.
- **Ator responsável:** Operador de Pátio / Caixa, Administrador.
- **Prioridade:** Média.
- **Entradas necessárias:** Nenhuma para listagem padrão; filtros opcionais para refinamento.
- **Processamento esperado:** Recuperar movimentações finalizadas do LocalStorage e ordenar por data de saída decrescente.
- **Saídas/resultados:** Tabela histórica detalhando: Placa, Tipo de Veículo, Entrada, Saída, Duração Total, Valor Cobrado, Forma de Pagamento e Status ('Finalizado').
- **Critérios de aceitação:** Registros históricos devem ser imutáveis e persistir independentemente de reinicializações do navegador.
- **Regras de negócio relacionadas:** RN012, RN014.

#### RF010 — Pesquisar registros por placa, data e status
- **Identificador:** RF010
- **Nome:** Pesquisar registros por placa, data e status
- **Descrição completa:** O sistema deve fornecer mecanismos de filtragem instantânea nos históricos e listagens operacionais.
- **Ator responsável:** Operador, Administrador.
- **Prioridade:** Média.
- **Entradas necessárias:** Fragmento de placa, intervalo de datas (início e fim), status (Ativo, Finalizado) e tipo de veículo.
- **Processamento esperado:** Filtragem em memória dos objetos persistidos aplicando combinações lógicas (AND) dos filtros ativos.
- **Saídas/resultados:** Listagem filtrada exibida na tela com contador de resultados encontrados.
- **Critérios de aceitação:** Filtragem em tempo de digitação ou submissão rápida sem atrasos perceptíveis.
- **Regras de negócio relacionadas:** RN005, RN012, RN013.

#### RF011 — Exibir dashboard com indicadores operacionais
- **Identificador:** RF011
- **Nome:** Exibir dashboard com indicadores operacionais
- **Descrição completa:** O sistema deve apresentar um painel consolidado com métricas-chave do desempenho do estacionamento.
- **Ator responsável:** Administrador, Operador.
- **Prioridade:** Alta.
- **Entradas necessárias:** Registros ativos e históricos persistidos.
- **Processamento esperado:** Calcular total de vagas, vagas disponíveis por tipo, taxa de ocupação percentual, quantidade de entradas do dia corrente, quantidade de saídas do dia corrente, faturamento confirmado do dia e distribuição de movimentações horárias.
- **Saídas/resultados:** Cards com métricas principais, lista de movimentações recentes e gráficos vetoriais (SVG) dinâmicos de fluxo e receita.
- **Critérios de aceitação:** Todas as métricas devem ser derivadas de registros reais do sistema, sem valores fictícios estáticos.
- **Regras de negócio relacionadas:** RN002, RN010, RN011, RN014.

#### RF012 — Configurar capacidade do estacionamento
- **Identificador:** RF012
- **Nome:** Configurar capacidade do estacionamento
- **Descrição completa:** O sistema deve permitir ao gestor parametrizar o número total de vagas físicas disponíveis para carros e para motocicletas.
- **Ator responsável:** Administrador.
- **Prioridade:** Média.
- **Entradas necessárias:** Capacidade máxima para carros (inteiro positivo), capacidade máxima para motos (inteiro positivo).
- **Processamento esperado:** Validar se os valores são números inteiros $\ge 1$, validar se o novo limite não é inferior à ocupação de veículos ativos no momento (RN015), atualizar as configurações e salvar no LocalStorage.
- **Saídas/resultados:** Notificação de sucesso e atualização imediata do cálculo de vagas do dashboard.
- **Critérios de aceitação:** Bloquear tentativas de reduzir vagas para valores menores que a ocupação real atual.
- **Regras de negócio relacionadas:** RN002, RN014, RN015.

#### RF013 — Configurar tarifas e tolerâncias
- **Identificador:** RF013
- **Nome:** Configurar tarifas e tolerâncias
- **Descrição completa:** O sistema deve permitir alterar as tarifas horárias para carros e motos, o tempo de tolerância inicial e o tempo da fração adicional.
- **Ator responsável:** Administrador.
- **Prioridade:** Média.
- **Entradas necessárias:** Tarifa horária de carro (R$), tarifa horária de moto (R$), minutos de tolerância (ex: 10), minutos da fração adicional (ex: 15).
- **Processamento esperado:** Validar se os valores são positivos e coerentes, salvar na entidade de configurações. As novas tarifas devem vigorar apenas para novas entradas (RN017).
- **Saídas/resultados:** Configurações salvas e notificação ao operador.
- **Critérios de aceitação:** Veículos já estacionados mantêm a tarifa contratada no momento da entrada.
- **Regras de negócio relacionadas:** RN006, RN007, RN009, RN014, RN017.

#### RF014 — Gerar comprovante de estacionamento
- **Identificador:** RF014
- **Nome:** Gerar comprovante de estacionamento
- **Descrição completa:** O sistema deve gerar representações impressas ou digitais tanto do tíquete de entrada quanto do recibo de pagamento de saída.
- **Ator responsável:** Operador de Pátio / Caixa.
- **Prioridade:** Alta.
- **Entradas necessárias:** Objeto da permanência (com dados do veículo, datas, valores e identificador).
- **Processamento esperado:** Montar modal formatado simulando um cupom fiscal/tíquete térmico de estacionamento contendo cabeçalho do estabelecimento, dados do veículo, data/hora, discriminador de tarifa, forma de pagamento e chave de autenticidade; disponibilizar ação para acionar o comando de impressão do navegador (`window.print()`).
- **Saídas/resultados:** Visualização na tela do tíquete e saída formatada para impressoras térmicas ou padrão PDF.
- **Critérios de aceitação:** Layout otimizado via CSS `@media print` para ocultar barras de navegação e imprimir somente o comprovante.
- **Regras de negócio relacionadas:** RN003, RN010, RN016.

#### RF015 — Consultar resumo financeiro
- **Identificador:** RF015
- **Nome:** Consultar resumo financeiro
- **Descrição completa:** O sistema deve prover tela dedicada à auditoria e acompanhamento financeiro das operações.
- **Ator responsável:** Administrador.
- **Prioridade:** Alta.
- **Entradas necessárias:** Registros de pagamentos confirmados e seleção de filtro temporal (Hoje, 7 dias, Mês, Todo o Histórico).
- **Processamento esperado:** Somar valores arrecadados, computar faturamento diário e geral, calcular tíquete médio por permanência, agrupar faturamento por forma de pagamento (Pix, Dinheiro, Débito, Crédito) e plotar gráfico comparativo.
- **Saídas/resultados:** Cards de KPI financeiro, tabela discriminada de recebimentos e gráfico de barras/rosca em SVG demonstrando a composição da receita.
- **Critérios de aceitação:** O total financeiro deve bater exatamente com a soma dos tíquetes com pagamento confirmado.
- **Regras de negócio relacionadas:** RN010, RN014, RN016.

#### RF016 — Validar os dados informados pelo operador
- **Identificador:** RF016
- **Nome:** Validar os dados informados pelo operador
- **Descrição completa:** O sistema deve verificar de forma preventiva e defensiva todas as entradas fornecidas pelo usuário em todos os formulários.
- **Ator responsável:** Sistema.
- **Prioridade:** Alta.
- **Entradas necessárias:** Campos submetidos em formulários (placa, tipos, valores, datas, capacidades).
- **Processamento esperado:** Validar tipos de dados, limites numéricos, formatos de regex, ausência de campos obrigatórios e sanitizar entradas contra códigos maliciosos (XSS).
- **Saídas/resultados:** Alertas visuais e mensagens de erro contextuais caso ocorram inconsistências; liberação da ação se válido.
- **Critérios de aceitação:** Nenhuma operação com dados incompletos ou inválidos pode ser aceita ou corromper o estado do sistema.
- **Regras de negócio relacionadas:** RN013, RN014, RN015.

#### RF017 — Exportar registros para CSV
- **Identificador:** RF017
- **Nome:** Exportar registros para CSV
- **Descrição completa:** O sistema deve permitir a exportação das movimentações finalizadas para arquivo no formato Comma-Separated Values (CSV).
- **Ator responsável:** Administrador, Operador.
- **Prioridade:** Média.
- **Entradas necessárias:** Conjunto de dados filtrado ou total do histórico.
- **Processamento esperado:** Montar cadeia de texto com separador ponto e vírgula (`;`) ou vírgula, adicionar Byte Order Mark (BOM UTF-8 `\uFEFF`) para compatibilidade perfeita com o Microsoft Excel em português, e disparar download automático no navegador.
- **Saídas/resultados:** Arquivo baixado (ex: `parkcontrol_historico_YYYYMMDD.csv`).
- **Critérios de aceitação:** O arquivo gerado deve abrir sem erros de codificação de caracteres acentuados no Excel e LibreOffice Calc.
- **Regras de negócio relacionadas:** RN012, RN014.

#### RF018 — Preservar os dados após atualizar a página
- **Identificador:** RF018
- **Nome:** Preservar os dados após atualizar a página
- **Descrição completa:** O sistema deve manter intactos todos os cadastros, veículos estacionados, histórico financeiro e configurações entre recarregamentos da página e sessões do navegador.
- **Ator responsável:** Sistema.
- **Prioridade:** Alta.
- **Entradas necessárias:** Estado completo da aplicação.
- **Processamento esperado:** Toda mutação de estado bem-sucedida deve ser sincronizada com as chaves correspondentes no `localStorage`. Ao carregar o sistema, o módulo de armazenamento deve restaurar e validar a integridade da base.
- **Saídas/resultados:** Restauração perfeita do estado do pátio e das métricas operacionais após recarregar com F5 ou reabrir o navegador.
- **Critérios de aceitação:** Nenhuma perda de veículos ativos ou pagamentos efetuados após refresh da página.
- **Regras de negócio relacionadas:** RN012, RN014, RN018 (Persistência).

#### RF019 — Carga e Restauração de Dados de Demonstração (Seed/Reset)
- **Identificador:** RF019
- **Nome:** Carga e Restauração de Dados de Demonstração (Seed/Reset)
- **Descrição completa:** O sistema deve disponibilizar botões operacionais para que avaliadores acadêmicos possam carregar dados simulados coerentes com um clique ou restaurar o estado vazio limpo.
- **Ator responsável:** Avaliador Acadêmico / Administrador.
- **Prioridade:** Média.
- **Entradas necessárias:** Ação explícita do usuário via botão na interface com modal de confirmação.
- **Processamento esperado:** Gravar registros demonstrativos pré-definidos (veículos ativos, histórico de saídas do dia e pagamentos variados) ou limpar as chaves do LocalStorage restaurando as configurações padrão de fábrica.
- **Saídas/resultados:** Pátio populado com dados realistas para testes imediatos ou zerado com segurança.
- **Critérios de aceitação:** O sistema não utiliza dados mockados estáticos fixos no código; os dados mockados só existem se injetados via ação explícita de demonstração.
- **Regras de negócio relacionadas:** RN010, RN011, RN014.

---

### 4. Requisitos Não Funcionais (RNF)

| Identificador | Nome do Requisito | Descrição Técnica e Critério Verificável | Atendido no Protótipo? | Observação de Produção |
| :--- | :--- | :--- | :--- | :--- |
| **RNF001** | Interface Responsiva | O layout deve adaptar-se perfeitamente a resoluções de Desktop ($\ge 1024px$), Tablet ($768px$ a $1023px$) e Smartphones ($< 768px$), utilizando Flexbox, CSS Grid e media queries sem quebras de layout ou sobreposição de textos. | **Sim** | Em produção, recomenda-se testes adicionais em navegadores de coletores de dados e telas táteis de totens. |
| **RNF002** | Usabilidade e Facilidade de Navegação | O sistema deve adotar navegação lateral (sidebar) intuitiva em Single Page Application (SPA), permitindo alternância instantânea entre módulos em menos de 100ms, com indicação visual da aba ativa e hierarquia tipográfica clara. | **Sim** | Atendido integralmente na camada de apresentação. |
| **RNF003** | Compatibilidade com Navegadores | A aplicação deve ser compatível com as versões estáveis dos principais navegadores modernos (Google Chrome $\ge 110$, Mozilla Firefox $\ge 110$, Microsoft Edge $\ge 110$, Safari $\ge 16$) sem requerer plugins proprietários. | **Sim** | Utiliza JavaScript ES6+ e CSS3 nativos amplamente suportados. |
| **RNF004** | Organização e Manutenibilidade do Código | O código JavaScript deve ser estruturado em módulos com responsabilidades bem delimitadas (`utils`, `storage`, `pricing`, `vehicles`, `parking`, `history`, `finance`, `settings`, `dashboard`, `app`). Funções puras para regras de negócio devem ser isoladas. | **Sim** | Código documentado, modular e limpo seguindo princípios SOLID e clean code. |
| **RNF005** | Acessibilidade Básica | A interface deve apresentar contraste de cores em conformidade com as diretrizes WCAG 2.1 nível AA para textos e ícones, atributos ARIA adequados em botões interativos e modais, e foco visível para navegação via teclado (`Tab`). | **Sim** | Paleta com alto contraste (#0F172A sobre #FFFFFF e #F8FAFC) e anéis de foco visíveis. |
| **RNF006** | Integridade dos Dados | O sistema deve validar a coerência lógica dos dados antes de qualquer persistência: verificação de duplicidade de placas ativas, bloqueio de tempos de saída retroativos e tipagem rigorosa de atributos persistidos. | **Sim** | Assegurado pela camada de validação do módulo `storage.js` e regras de negócio. |
| **RNF007** | Feedback Visual das Operações | Todas as ações do usuário (salvar, remover, confirmar pagamento, erros de validação) devem produzir resposta visual imediata na tela por meio de notificações flutuantes (toasts) coloridas e modais com mensagens inequívocas. | **Sim** | Notificações com tempo de auto-dispensa e ícones representativos. |
| **RNF008** | Persistência Local | Todos os dados operacionais devem ser gravados em formato JSON no `localStorage` sob chaves com namespace próprio (`parkcontrol_settings`, `parkcontrol_active`, `parkcontrol_history`). | **Sim** | **Nota técnica:** O LocalStorage atende ao protótipo acadêmico; sistemas corporativos reais demandam banco de dados relacional (ex: PostgreSQL). |
| **RNF009** | Desempenho em Operações Comuns | Operações de busca, filtragem de tabelas, inserção de entradas e cálculos tarifários devem executar em tempo perceptível inferior a 50ms para volumes de até 1.000 registros locais. | **Sim** | Processamento síncrono em memória ultrarrápido sem latência de rede. |
| **RNF010** | Validação e Tratamento de Erros | Toda entrada de dados deve passar por sanitização (escape de caracteres especiais contra XSS) e tratamento defensivo com mensagens amigáveis em português ao usuário, sem quebrar o fluxo da aplicação (`try/catch`). | **Sim** | Nenhum uso de `eval()` ou inserção de HTML sem sanitização estrita. |
| **RNF011** | Separação entre Interface e Lógica de Negócio | Os módulos de cálculo de tarifação (`pricing.js`) e regras de pátio devem ser desacoplados da manipulação direta do DOM, permitindo testes de unidade automatizados independentes. | **Sim** | Funções puras recebem parâmetros primitivos e retornam estruturas de cálculo puras. |
| **RNF012** | Documentação Técnica Organizada | A documentação acadêmica e técnica deve ser completa, estruturada em arquivos Markdown (.md) claros, coerentes e padronizados com cabeçalho acadêmico e sem placeholders. | **Sim** | Conjunto completo com 11 documentos cobrindo todo o ciclo de engenharia de software. |

---

### 5. Resumo de Rastreabilidade Preliminar
Todos os requisitos funcionais descritos conectam-se diretamente às regras de negócio RN001 a RN017 e são respaldados por casos de uso e casos de teste específicos, garantindo que o protótipo execute rigorosamente o escopo planejado.

