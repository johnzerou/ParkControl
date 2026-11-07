# HISTÓRIAS DE USUÁRIO (USER STORIES)
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 1.0.0  
**Data de Atualização:** Novembro de 2026  

---

### 1. Introdução
Este documento detalha as Histórias de Usuário (User Stories) do projeto **ParkControl**, mapeadas a partir das necessidades operacionais dos usuários do sistema. Cada história adota a sintaxe padrão de metodologias ágeis, acompanhada de critérios de aceitação mensuráveis e a correspondência explícita com os Requisitos Funcionais (RF).

---

### 2. Catálogo de Histórias de Usuário

#### US001 — Entrada Rápida de Veículos
- **História:**  
  *Como* operador de pátio,  
  *quero* registrar a entrada de um veículo informando sua placa e categoria de forma ágil,  
  *para* que o condutor receba seu tíquete rapidamente e a contagem de vagas seja imediatamente atualizada sem filas na guarita.
- **Requisitos Funcionais Relacionados:** RF001, RF003, RF004, RF005, RF013, RF014, RF016.
- **Critérios de Aceitação:**
  1. A placa deve ser aceita nos formatos antigo (`ABC-1234`) e Mercosul (`ABC1D23`), convertendo automaticamente letras minúsculas em maiúsculas.
  2. A data e hora devem ser preenchidas automaticamente com o momento atual do clique ou digitação.
  3. Se a placa informada já constar com uma permanência ativa no pátio, a entrada deve ser bloqueada com alerta de duplicidade (RN001).
  4. Se a capacidade daquela categoria de veículo estiver esgotada, a entrada deve ser impedida com aviso de lotação (RN002).
  5. Após a confirmação, o tíquete de entrada deve ser gerado com opção imediata de impressão.

---

#### US002 — Monitoramento Contínuo do Pátio e Vagas
- **História:**  
  *Como* operador de pátio ou gerente,  
  *quero* consultar a relação completa de veículos atualmente estacionados com seus tempos e valores estimados calculados em tempo real,  
  *para* que eu saiba a qualquer instante a lotação física e possa tirar dúvidas de clientes sobre o valor parcial de sua estadia.
- **Requisitos Funcionais Relacionados:** RF003, RF004, RF006, RF007, RF010.
- **Critérios de Aceitação:**
  1. A lista deve exibir placa, categoria, hora de entrada, tempo decorrido formatado (`Xh Ymin`) e valor estimado atualizado.
  2. Deve haver um campo de pesquisa para filtrar veículos pela placa instantaneamente enquanto o operador digita.
  3. Deve ser possível filtrar a tabela pelas categorias "Todos", "Carros" e "Motos".
  4. A contagem de tempo e o valor estimado devem ser recalculados automaticamente sem necessidade de recarregar a página web (`F5`).

---

#### US003 — Checkout Transparente e Memória de Cálculo
- **História:**  
  *Como* operador de caixa,  
  *quero* selecionar um veículo para saída e visualizar a memória detalhada do cálculo tarifário (tolerância, primeira hora e frações),  
  *para* explicar com clareza e transparência a composição do valor final ao cliente e evitar contestações.
- **Requisitos Funcionais Relacionados:** RF002, RF005, RF006, RF007, RF008, RF014.
- **Critérios de Aceitação:**
  1. O checkout deve detalhar os minutos totais de permanência e a regra específica aplicada (ex: tolerância de até 10 minutos com custo R$ 0,00; primeira hora integral; frações de 15 minutos adicionais a 25%).
  2. Permanências com menos de 10 minutos devem resultar em valor final R$ 0,00 (RN007).
  3. Permanências entre 11 e 60 minutos devem cobrar exatamente o valor de 1 hora inteira (RN008).
  4. Frações de 15 minutos devem ser computadas a cada minuto adicional iniciado após 60 minutos (RN009).
  5. O valor deve respeitar a tabela de tarifas contratada na entrada do veículo, mesmo se as tarifas gerais tiverem sido alteradas posteriormente (RN017).

---

#### US004 — Liquidação Financeira Flexível e Emissão de Recibo
- **História:**  
  *Como* operador de caixa,  
  *quero* selecionar a forma de pagamento informada pelo cliente (Dinheiro, Pix, Débito ou Crédito), calcular o troco quando em dinheiro e emitir o recibo fiscal/térmico,  
  *para* finalizar a cobrança com segurança e entregar o comprovante ao motorista.
- **Requisitos Funcionais Relacionados:** RF002, RF008, RF010, RF014, RF016.
- **Critérios de Aceitação:**
  1. O sistema deve disponibilizar botões ou opções para Dinheiro, Pix, Débito e Crédito.
  2. Ao selecionar "Dinheiro", o sistema deve permitir inserir o valor recebido e calcular o troco em tempo real, bloqueando se o valor for menor que o devido.
  3. Ao confirmar o pagamento, a vaga física deve ser liberada imediatamente (RN011).
  4. O sistema deve abrir o modal de comprovante com layout amigável para impressão em impressora térmica ou padrão A4/PDF.

---

#### US005 — Auditoria de Histórico e Exportação CSV
- **História:**  
  *Como* administrador do estacionamento,  
  *quero* consultar o histórico completo de entradas e saídas finalizadas com filtros por data e placa, e poder exportar esses dados para uma planilha CSV,  
  *para* realizar a prestação de contas, análises contábeis externas e auditoria do pátio.
- **Requisitos Funcionais Relacionados:** RF009, RF010, RF017, RF018.
- **Critérios de Aceitação:**
  1. A tabela histórica deve conter todas as movimentações concluídas com placa, tipo, data/hora de entrada e saída, tempo total, valor pago e método.
  2. Deve permitir filtragem por intervalo de datas e por fragmento de placa.
  3. O botão "Exportar CSV" deve gerar um arquivo `.csv` codificado em UTF-8 com BOM, garantindo que acentuações e caracteres da língua portuguesa abram sem distorções no Microsoft Excel.
  4. O arquivo exportado deve refletir os dados filtrados na tela.

---

#### US006 — Gestão Estratégica via Dashboard
- **História:**  
  *Como* gestor do estacionamento,  
  *quero* visualizar em um dashboard integrado os principais indicadores operacionais (total de vagas, taxa de ocupação, entradas e saídas do dia e faturamento confirmado),  
  *para* tomar decisões ágeis de gestão e alocação de equipe.
- **Requisitos Funcionais Relacionados:** RF004, RF011, RF015.
- **Critérios de Aceitação:**
  1. Todos os indicadores devem ser derivados das movimentações reais persistidas, sem números fixos fictícios.
  2. A taxa de ocupação deve ser expressa em porcentagem com barra de progresso visual colorida.
  3. O faturamento diário deve somar apenas os tíquetes efetivamente quitados e confirmados no dia de hoje (RN010).
  4. Devem ser exibidos gráficos em SVG limpos e interativos para fluxo e distribuição de faturamento.

---

#### US007 — Parametrização Segura de Vagas e Tarifas
- **História:**  
  *Como* administrador,  
  *quero* configurar a quantidade de vagas e as tarifas de carros e motos com validações de integridade,  
  *para* adaptar o sistema a mudanças sazonais ou reformas no pátio com total segurança.
- **Requisitos Funcionais Relacionados:** RF012, RF013, RF016.
- **Critérios de Aceitação:**
  1. O sistema deve impedir que a capacidade de vagas de um tipo seja reduzida para um número inferior à quantidade de veículos daquele mesmo tipo estacionados no momento (RN015).
  2. O sistema deve rejeitar valores negativos ou campos em branco (RN014).
  3. As configurações devem ser salvas de forma persistente no LocalStorage.
  4. Novas tarifas não podem alterar retroativamente permanências que já estavam ativas no pátio (RN017).

---

#### US008 — Facilidade de Demonstração e Homologação Acadêmica
- **História:**  
  *Como* avaliador acadêmico ou professor,  
  *quero* dispor de um mecanismo para injetar dados de teste consistentes ou restaurar o estado vazio original com um clique,  
  *para* inspecionar rapidamente o comportamento do sistema sem precisar cadastrar dezenas de veículos manualmente.
- **Requisitos Funcionais Relacionados:** RF018, RF019.
- **Critérios de Aceitação:**
  1. O botão "Carregar Dados de Demonstração" deve criar veículos ativos representativos e histórico do dia com múltiplos métodos de pagamento.
  2. O botão "Limpar Todos os Dados" deve resetar com confirmação o estado para o padrão vazio.
  3. A aplicação não deve possuir dependência de mocks fixos inalteráveis no código fonte.

