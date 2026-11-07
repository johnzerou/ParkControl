# REGRAS DE NEGÓCIO DO SISTEMA
## ParkControl — Sistema de Controle e Gerenciamento de Estacionamento

**Instituição:** Faculdade de Tecnologia de Carapicuíba — FATEC Carapicuíba  
**Curso:** Análise e Desenvolvimento de Sistemas (ADS Noite)  
**Ano:** 2026  
**Autores:** João Pedro Ribas da Silva & Nicolas Ferreira Souza  
**Versão:** 1.0.0  
**Data de Atualização:** Novembro de 2026  

---

### 1. Introdução
Este documento define formalmente o conjunto de Regras de Negócio (RN) que regem o comportamento operacional, os cálculos de permanência e tarifação, as restrições de integridade e a consistência dos dados do sistema **ParkControl**. Todas as regras aqui especificadas foram implementadas de maneira estrita na camada de lógica do frontend em Vanilla JavaScript.

---

### 2. Catálogo Detalhado de Regras de Negócio

#### RN001 — Placa única ativa
- **Enunciado:** Um veículo não poderá realizar uma nova entrada enquanto houver uma permanência ativa registrada para a mesma placa no pátio.
- **Justificativa:** No mundo real, um mesmo veículo físico não pode ingressar simultaneamente duas vezes em um estacionamento sem antes ter registrado sua saída. A duplicidade provocaria distorções na contagem de vagas, registros fantasmas e inconsistência na cobrança.
- **Exceção:** Não há exceções. Caso o condutor retorne após ter efetuado a saída regular e pagamento da permanência anterior, uma nova entrada é permitida normalmente.
- **Exemplo Prático:** Se o veículo `ABC-1234` deu entrada às 10:00 e permanece no pátio, uma tentativa de entrada às 10:30 com a placa `ABC-1234` será sumariamente rejeitada pelo sistema com a mensagem: *"Veículo com placa ABC-1234 já possui uma permanência ativa em andamento."*

#### RN002 — Controle de lotação
- **Enunciado:** O sistema deverá impedir novas entradas quando a capacidade correspondente ao tipo de veículo (carro ou motocicleta) estiver esgotada.
- **Justificativa:** Garantir o respeito à capacidade física do estabelecimento, evitando superlotação, obstrução das pistas de manobra e descumprimento de normas regulamentares.
- **Exceção:** Não há exceções. A ocupação de vagas de carros não interfere na capacidade de motos e vice-versa, sendo o controle estritamente segregado por categoria.
- **Exemplo Prático:** Se a capacidade de carros é de 20 vagas e existem 20 carros ativos no pátio, o sistema desabilita a confirmação de entrada para carros, exibindo: *"Capacidade máxima para Carro atingida (20/20 vagas ocupadas)."* Caso haja vagas para motos (ex: 5/10), motos continuam sendo admitidas.

#### RN003 — Identificador e dados da entrada
- **Enunciado:** Cada registro de entrada deverá gerar obrigatoriamente um identificador único exclusivo, armazenando a placa normalizada, o tipo do veículo, o nome do responsável (se informado), a data e o horário de entrada precisos.
- **Justificativa:** Assegurar a rastreabilidade unívoca de cada tíquete de estacionamento, permitindo auditoria pontual e evitando colisões de dados.
- **Exceção:** Nenhuma.
- **Exemplo Prático:** Ao registrar um carro placa `BRA2E19`, o sistema gera o identificador `PK-1731000000000-842` (timestamp + sufixo randômico único), gravando a data/hora exata em padrão ISO 8601.

#### RN004 — Saída restrita a permanências ativas
- **Enunciado:** A operação de saída e checkout somente poderá ser executada para registros que possuam status 'ativo' (em andamento).
- **Justificativa:** Evitar encerramentos duplicados, estornos indevidos ou recálculo de cobrança sobre tíquetes que já foram quitados e arquivados no histórico.
- **Exceção:** Nenhuma.
- **Exemplo Prático:** Se uma permanência já teve sua saída confirmada às 11:00, o botão de checkout dessa permanência não estará mais disponível, e qualquer tentativa manual de reprocessamento via API interna retornará erro de validação de estado.

#### RN005 — Cálculo do tempo de permanência
- **Enunciado:** O sistema deverá calcular o tempo de permanência como a diferença exata entre a data/hora de saída (ou momento atual de consulta) e a data/hora de entrada registrada.
- **Justificativa:** Base fundamental para a apuração transparente da estadia e correta aplicação das faixas tarifárias.
- **Exceção:** Nenhuma. O cálculo deve operar em milissegundos e converter para minutos totais inteiros e representação textual formatada (`Xh Ymin` ou `Ymin`).
- **Exemplo Prático:** Entrada às `14:00` e saída às `15:25`: Duração = 85 minutos (1 hora e 25 minutos).

#### RN006 — Tarifação automatizada
- **Enunciado:** O valor a ser cobrado será calculado automaticamente pelo algoritmo do sistema, tomando como base a duração da permanência e os parâmetros tarifários vinculados à respectiva entrada.
- **Justificativa:** Eliminar erros operacionais decorrentes de cálculos manuais feitos pelo operador do caixa.
- **Exceção:** Não há cálculos discricionários manuais sem respaldo nos parâmetros do sistema.
- **Exemplo Prático:** Para carro com tarifa horária de R$ 10,00, uma estadia de 45 minutos resulta automaticamente em R$ 10,00.

#### RN007 — Período de tolerância
- **Enunciado:** O estacionamento deverá dispor de um período inicial configurável de tolerância, com valor padrão definido em 10 minutos. Permanências com duração menor ou igual ao tempo de tolerância terão valor total a pagar de R$ 0,00 (isenção total).
- **Justificativa:** Prática padrão no setor de estacionamentos para permitir desistências imediatas, erro de rota do condutor ou embarque/desembarque rápido sem ônus.
- **Exceção:** Nenhuma. A tolerância é verificada em minutos corridos $\le$ tolerância configurada.
- **Exemplo Prático:** Entrada às `10:00` e saída às `10:08` (8 minutos de estadia com tolerância de 10 min): Tarifa cobrada = R$ 0,00.

#### RN008 — Cobrança da primeira hora cheia
- **Enunciado:** Ultrapassado o tempo de tolerância (tempo > tolerância), caso o tempo total de permanência seja menor ou igual a 60 minutos, será cobrado o valor correspondente a 1 (uma) hora integral.
- **Justificativa:** Princípio de remuneração mínima da vaga ocupada, cobrindo os custos fixos de recepção e guarda do veículo.
- **Exceção:** Nenhuma. Não há desconto proporcional dentro da primeira hora após o término da tolerância.
- **Exemplo Prático:** Para um carro (tarifa R$ 10,00/h):
  - Permanência de 11 minutos: ultrapassa a tolerância (10 min) $\rightarrow$ cobra 1 hora cheia = R$ 10,00.
  - Permanência de 59 minutos $\rightarrow$ dentro de 60 min $\rightarrow$ cobra 1 hora cheia = R$ 10,00.

#### RN009 — Frações adicionais subsequentes à primeira hora
- **Enunciado:** Após completados os primeiros 60 minutos, qualquer período adicional de permanência será cobrado em frações iniciadas de 15 minutos. Cada fração de 15 minutos iniciada corresponde a 25% (um quarto) do valor da tarifa horária contratada.
- **Fórmula de Frações:**  
  $$\text{Minutos Excedentes} = \text{Permanência Total em Minutos} - 60$$  
  $$\text{Frações Cobradas} = \left\lceil \frac{\text{Minutos Excedentes}}{15} \right\rceil$$  
  $$\text{Valor Total} = \text{Tarifa 1ª Hora} + (\text{Frações Cobradas} \times (0{,}25 \times \text{Tarifa Horária}))$$
- **Justificativa:** Garantir justiça tarifária ao cliente cobrando em blocos reduzidos de 15 minutos, respeitando o princípio consumerista de fração iniciada.
- **Exceção:** Nenhuma. 1 minuto excedente já inicia a respectiva fração de 15 minutos (arredondamento para cima via teto matemático).
- **Exemplo Prático:** Carro (R$ 10,00/h, 25% = R$ 2,50 por fração):
  - 61 minutos: 1h + 1 minuto excedente (inicia a 1ª fração) = R$ 10,00 + R$ 2,50 = R$ 12,50.
  - 75 minutos: 1h + 15 minutos excedentes (completa a 1ª fração) = R$ 10,00 + R$ 2,50 = R$ 12,50.
  - 76 minutos: 1h + 16 minutos excedentes (inicia a 2ª fração) = R$ 10,00 + 2 $\times$ R$ 2,50 = R$ 15,00.

#### RN010 — Registro e faturamento confirmado
- **Enunciado:** Somente pagamentos devidamente selecionados, validados e confirmados na rotina de saída poderão integrar as métricas de faturamento realizado do caixa e dos dashboards.
- **Justificativa:** Preservar a conciliação financeira; valores de permanências ativas em andamento são classificados estritamente como *faturamento estimado/provisório* e não transitam no caixa definitivo.
- **Exceção:** Permanências com saída dentro da tolerância geram registro financeiro com valor R$ 0,00 e método "Isento / Tolerância", não agregando receita financeira, mas constando no livro de ocorrências operacionais.

#### RN011 — Liberação atômica da vaga
- **Enunciado:** Uma vaga física somente poderá ser computada como liberada após a conclusão com êxito da transação de pagamento e efetivação da saída.
- **Justificativa:** Evitar que uma vaga seja disponibilizada antes do término do atendimento ou em caso de cancelamento/interrupção do checkout pelo operador.
- **Exceção:** Nenhuma.

#### RN012 — Preservação e imutabilidade do histórico
- **Enunciado:** Todas as permanências concluídas deverão permanecer gravadas no histórico de movimentações, sem permissão de alteração ou exclusão arbitrária pelo operador na rotina comum de checkout.
- **Justificativa:** Garantir a auditabilidade das transações, conferência fiscal de fechamento de turno e consistência dos relatórios analíticos.
- **Exceção:** Somente o comando explícito de reset global de fábrica restaura a base vazia para fins de novo ciclo de homologação acadêmica.

#### RN013 — Padronização e validação de placas brasileiras
- **Enunciado:** O sistema deve reconhecer e validar veículos portadores de placas brasileiras em ambos os formatos oficiais:
  1. **Formato Tradicional:** 3 letras seguidas de 4 números (ex: `ABC-1234` ou `ABC1234`).
  2. **Formato Mercosul:** 3 letras, 1 número, 1 letra e 2 números (ex: `BRA2E19`).
  Todas as letras devem ser automaticamente normalizadas para caixa alta (maiúsculas) e hífens devem ser mantidos ou removidos de forma uniforme na persistência.
- **Expressão Regular Adotada:**
  - Padrão consolidado: `^[A-Z]{3}[0-9][0-9A-Z][0-9]{2}$` (cobrindo ambos os formatos ao remover o hífen opcional).
- **Justificativa:** Evitar registros com formatos inválidos ou caracteres ilegíveis, assegurando padronização nacional.

#### RN014 — Integridade e restrições de consistência
- **Enunciado:** O sistema deve rejeitar categoricamente:
  1. Qualquer valor monetário negativo em tarifas ou cobranças.
  2. Data/hora de saída cronologicamente anterior à data/hora de entrada.
  3. Capacidades máximas inferiores a 1 ou campos numéricos vazios/NaN.
  4. Registros parciais sem preenchimento dos campos mandatórios.
- **Justificativa:** Blindar o modelo de dados contra corrupção lógica do estado do protótipo.

#### RN015 — Proteção na redução de capacidade física
- **Enunciado:** O sistema deverá impedir que o administrador altere e salve a capacidade configurada de vagas de um tipo de veículo para um valor inferior à quantidade de veículos daquele mesmo tipo atualmente estacionados no pátio.
- **Justificativa:** Evitar inconsistências como "ocupação de 150%" ou vagas disponíveis negativas (ex: ter 8 carros no pátio e tentar reduzir o limite de vagas para 5).
- **Exemplo Prático:** Se há 8 carros estacionados, ao tentar definir o total de vagas para 6, o sistema aborta a operação e informa: *"Não é permitido reduzir a capacidade para 6 vagas, pois existem 8 carros estacionados no momento."*

#### RN016 — Métodos de pagamento aceitos
- **Enunciado:** O sistema deverá suportar a seleção das seguintes modalidades de pagamento:
  1. Dinheiro (com campo para valor entregue e cálculo do troco);
  2. Pix (com exibição demonstrativa de código / chave de pagamento);
  3. Cartão de Débito;
  4. Cartão de Crédito.
- **Natureza:** Registro puramente demonstrativo e gerencial, sem conexão direta com gateways adquirentes ou APIs bancárias reais.

#### RN017 — Irretroatividade na alteração de tarifas
- **Enunciado:** Quaisquer alterações realizadas na tela de configurações nos valores das tarifas horárias, tolerância ou frações de tempo passarão a valer exclusivamente para **novas entradas** registradas após a alteração. Cada permanência armazena uma cópia integral da tabela tarifária vigente no instante de sua entrada.
- **Justificativa:** Princípio jurídico e comercial de proteção ao consumidor. O cliente contrata o serviço com base nos preços afixados e vigentes no instante de seu ingresso; aumentos tarifários posteriores não podem incidir sobre veículos já estacionados.

---

### 3. Tabela Comparativa de Cenários de Teste e Casos Extremos

Considerando a tabela padrão:
- **Tarifa Carro:** R$ 10,00 / hora | Fração 15 min: R$ 2,50 (25%)
- **Tarifa Moto:** R$ 5,00 / hora | Fração 15 min: R$ 1,25 (25%)
- **Tolerância:** 10 minutos
- **Fração Adicional:** 15 minutos

| Caso / Cenário | Duração Real | Regra Aplicada | Carro (R$) | Moto (R$) | Justificativa / Memória de Cálculo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cenário 1: 5 minutos** | 5 min | RN007 (Tolerância) | **R$ 0,00** | **R$ 0,00** | $5 \text{ min} \le 10 \text{ min}$ (tolerância). Isenção integral concedida. |
| **Cenário 2: 10 minutos** | 10 min | RN007 (Limite Tolerância) | **R$ 0,00** | **R$ 0,00** | $10 \text{ min} \le 10 \text{ min}$. Limite exato da tolerância. Isento. |
| **Cenário 3: 11 minutos** | 11 min | RN008 (1ª Hora Integral) | **R$ 10,00** | **R$ 5,00** | Ultrapassou a tolerância em 1 minuto. Cobrança de 1 hora cheia integral. |
| **Cenário 4: 30 minutos** | 30 min | RN008 (1ª Hora Integral) | **R$ 10,00** | **R$ 5,00** | Dentro do período da primeira hora ($\le 60 \text{ min}$). Cobra 1 hora cheia. |
| **Cenário 5: 1 hora exata** | 60 min | RN008 (Limite da 1ª Hora) | **R$ 10,00** | **R$ 5,00** | Exatamente 60 minutos decorridos. Cobrança de 1 hora cheia. |
| **Cenário 6: 1h e 10 min** | 70 min | RN009 (1ª Hora + Fração) | **R$ 12,50** | **R$ 6,25** | Excedente = 10 min. $10/15 = 0{,}67 \rightarrow 1$ fração de 15 min iniciada. Total: $10{,}00 + (1 \times 2{,}50) = 12{,}50$. |
| **Cenário 7: 1h e 15 min** | 75 min | RN009 (1ª Hora + Fração) | **R$ 12,50** | **R$ 6,25** | Excedente = 15 min. $15/15 = 1{,}00 \rightarrow 1$ fração completada. Total: $10{,}00 + (1 \times 2{,}50) = 12{,}50$. |
| **Cenário 8: 1h e 16 min** | 76 min | RN009 (1ª Hora + 2 Frações) | **R$ 15,00** | **R$ 7,50** | Excedente = 16 min. Inicia a 2ª fração ($16/15 = 1{,}07 \rightarrow 2$ frações). Total: $10{,}00 + (2 \times 2{,}50) = 15{,}00$. |
| **Cenário 9: 2h e 20 min** | 140 min | RN009 (1ª Hora + 6 Frações) | **R$ 25,00** | **R$ 12,50** | Excedente = $140 - 60 = 80 \text{ min}$. $80/15 = 5{,}33 \rightarrow 6$ frações de 15 min. $6 \times 2{,}50 = 15{,}00$. Total: $10{,}00 + 15{,}00 = 25{,}00$. |
| **Cenário 10: Virada Meia-noite** | 90 min (23:45 às 01:15) | RN005 + RN009 | **R$ 15,00** | **R$ 7,50** | Cálculo por data e hora absoluta (UTC/Timestamp). 90 min = 1h + 30 min excedentes ($30/15 = 2$ frações). $10{,}00 + (2 \times 2{,}50) = 15{,}00$. |
| **Cenário 11: 24 horas (dia seguinte)** | 1440 min | RN005 + RN009 | **R$ 240,00** | **R$ 120,00** | Excedente = $1380 \text{ min} \rightarrow 92$ frações de 15 min. $10{,}00 + (92 \times 2{,}50) = 240{,}00$. |

---

### 4. Coerência entre Especificação e Implementação
As fórmulas e validações acima foram transcritas em funções puras nos arquivos `js/pricing.js`, `js/vehicles.js` e `js/utils.js`, garantindo que não existam desvios entre a teoria da especificação e o comportamento computacional do protótipo.

