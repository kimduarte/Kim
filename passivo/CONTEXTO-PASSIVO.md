# Contexto do projeto — Passivo Veicular (site próprio)

> Documento de passagem. Uma nova sessão do Claude deve ler este arquivo
> inteiro antes de começar. Ele resume o que foi decidido na sessão em que
> o protótipo foi desenhado a partir da planilha real de um estado.
> Leia também `site/CONTEXTO-MIGRACAO.md`: as regras de trabalho com a Kim,
> a infraestrutura (Vercel + TiDB) e as restrições do ambiente valem aqui.

---

## 1. O que é

O **Passivo Veicular** acompanha veículos doados pela SENASP que ainda têm
débitos (multas, IPVA, licenciamento, taxas) atrapalhando a transferência de
propriedade para as donatárias, e registra o que foi feito para regularizar
cada um: pedidos de cancelamento/baixa aos órgãos, pagamentos, transferências.

Hoje existe como Google Apps Script + planilha, ainda no começo. A decisão é
migrar para site próprio, como já está sendo feito com a Doação Veicular.

Quem usa: a Kim (admin) e, depois, os mobilizados da Coordenação de Logística.

## 2. O que está nesta pasta

| Arquivo | O que é |
|---|---|
| `prototipo/passivo-veicular.html` | Protótipo navegável, **sem dados**. Abre direto no navegador. É a referência de telas, campos, fluxos e regras — não é código para publicar. HTML + JS puro, estado só em memória. |
| `dados/DadosInfracoesRenainf.gs` | Tabela original de infrações do Apps Script (461 códigos), como a Kim enviou. |
| `dados/normalizar-tabela-infracoes.js` | Script que lê o `.gs` e gera a tabela limpa. Rode com `node dados/normalizar-tabela-infracoes.js`. |
| `dados/tabela-infracoes.json` | Tabela limpa: `{ codigo, artigo, descricao, valor }` × 461. **É esta que o site deve usar.** |
| `dados/tabela-infracoes-relatorio.txt` | O que o script corrigiu e o que precisa de revisão humana. |

## 3. Regras de negócio — já confirmadas pela Kim

### 3.1 Débitos
- **Cada débito é uma linha** (não uma coluna por órgão, como na planilha).
- Tipos: `Infração`, `IPVA`, `Licenciamento`, `Taxas`, `Outra`.
- Infração: nº do AIT, órgão autuador, **código**, **artigo**, descrição,
  data, valor, status (`Pendente`, `Enviado`, `Recebido`, `Cancelada`,
  `Negada`, `Paga`).
- Demais tipos: órgão/autoridade, exercício, vencimento, valor
  (obrigatório), status (`Pendente`, `Enviado`, `Pago`, `Baixado`).
- Cadastro de débito para placa não cadastrada: **avisa, não bloqueia**, e o
  débito aparece em "Precisa de atenção" no painel.
- AIT repetido: bloqueia.

### 3.2 Infrações — código e artigo (IMPRESCINDÍVEL)
- **Toda infração precisa ter código E artigo.** Os dois são obrigatórios.
- Ao digitar o **código**, preencher na hora **artigo, descrição e valor**.
- Ao digitar o **artigo**, preencher na hora **código, descrição e valor**.
  - Um artigo pode ter vários códigos (ex.: `162*II` → 502-91, 502-92,
    502-93). Nesse caso, mostrar a lista para a pessoa escolher.
- Se a pessoa trocar o código ou o artigo depois de um preenchimento
  automático, limpar o que foi preenchido automaticamente (para não ficar
  código de uma infração com descrição de outra).
- Código fora da tabela: avisar ("confira o auto") e deixar digitar o artigo
  à mão. Isso acontece de verdade — um auto real usa o código `754-50`, que
  não está na tabela.
- 17 infrações não têm valor fixo na tabela: avisar que o valor deve ser
  digitado a partir do auto.
- O valor preenchido é editável (desconto, valor diferente no auto).
- Tudo isso já funciona no protótipo — use como referência de comportamento.

### 3.3 Veículo transferido = valor pago (esforço de regularização)
- Se um veículo está **transferido** e tem valor lançado, **aquele valor foi
  pago para a transferência sair**. Não é débito em aberto.
- Esse valor é o **esforço de regularização** e precisa de estatística
  própria no painel: total pago, quantas transferências tiveram custo e
  quantas saíram sem custo, média e maior valor por veículo, pago por tipo,
  pago por instituição, e **pago ao longo do tempo (por mês/ano)**.
- Ao mudar um veículo para "Transferido" com débitos em aberto, o sistema
  pergunta se foram pagos e, se sim, pede data e comprovante.

### 3.4 Pagamento: data e comprovante
- A Kim confirmou: **registrar a data e o comprovante** de cada pagamento de
  transferência.
- Campos: data do pagamento (obrigatória, não futura), comprovantes
  (obrigatório, um ou mais, PDF ou imagem — IPVA e licenciamento costumam
  vir em guias separadas), nº SEI (opcional), observação.
- No site real os arquivos precisam ser armazenados de fato (ex.: Vercel
  Blob). No Apps Script, o anexo de boleto já foi tentado e desfeito por
  instabilidade; aqui a infraestrutura é outra.

### 3.5 Ofícios (tela nova)
- Na planilha, cada pedido de cancelamento era uma aba por órgão, e a
  numeração recomeçava em 1 a cada remessa. No site, cada **ofício** guarda:
  órgão destinatário, data, nº SEI, os débitos incluídos, a resposta do
  órgão e o resultado por débito.
- "Novo ofício": escolhe o órgão, marca os débitos pendentes dele, registra
  o envio (os débitos passam para `Enviado`).
- O sistema gera a "Planilha de solicitação de cancelamento/prescrição"
  com o cabeçalho do Ministério (colunas: ORD, placa, RENAVAM, chassi,
  modelo, ano, AIT, código, artigo).

### 3.6 Documentos gerados
- "Veículos com pendências de transferência" (o relatório que hoje é a aba
  principal de cada estado), com total em aberto, pago na transferência e
  data do pagamento. **Totais sempre calculados, nunca digitados.**
- Cabeçalho padrão: Ministério da Justiça e Segurança Pública / SENASP /
  Diretoria de Gestão de Fundo Nacional de Segurança Pública / Coordenação
  de Logística / Esplanada dos Ministérios, Bloco T, Edifício Sede.
  Brasília/DF - CEP 70.064-900.

### 3.7 Perfis
- `admin`: tudo, inclusive excluir, lixeira e tela de usuários.
- `usuario`: cadastra e edita; não exclui.
- `visitante`: só consulta.
- `sem_acesso`: e-mail não cadastrado — tela de bloqueio mostrando o e-mail
  que o login identificou.
- Exclusão é lógica (lixeira com restauração).

## 4. Decisões ainda em aberto (perguntar à Kim)

1. **IPVA pago ou baixado?** Nos veículos transferidos, ~98% do valor
   "pago" é IPVA. Como os veículos são da União doados a estados, pela
   imunidade recíproca (CF, art. 150, VI, "a") esse IPVA pode ter sido
   **baixado por ofício**, não pago. A Kim achou o total "um pouco alto".
   Proposta feita (sem resposta ainda): cada débito regularizado é
   **pago** (data + guia) ou **baixado/cancelado** (nº do ofício/SEI), e o
   painel mostra os dois separados. O licenciamento também ficou sem
   confirmação de pagamento.
2. **Mesmo site da Doação ou separado?** Recomendação: mesmo site e mesmo
   banco (TiDB), com tabelas novas. O veículo do passivo deveria apontar
   para a tabela `veiculos` da Doação pelo chassi, sem recadastro. Falta
   confirmar se todo veículo do passivo existe na base da Doação.
3. **Amarelo na coluna ORDEM** da planilha do ES em 4 veículos de guardas
   municipais: a Kim ainda não disse o que significa. Pode virar uma
   marcação no sistema.
4. **Tabela de infrações**: 2 linhas para a Kim conferir na fonte oficial
   (`711-00`, artigo `244*1 pr 1 A`; `917-20`, artigo `450*III*G`,
   provavelmente `45*III*G`). Ver `dados/tabela-infracoes-relatorio.txt`.

## 5. Como as planilhas por estado são hoje (para o importador)

Analisada a planilha do ES. A Kim mandou **ignorar** as abas
`ESPIRÍTO SANTO - INSTITUIÇÃO` e `ESPIRÍTO SANTO (2)`.

- **Aba principal por UF** (ex.: `ESPIRÍTO SANTO`): cabeçalho do Ministério
  nas linhas 1–10, títulos na linha 11, um veículo por linha a partir da 12.
  Colunas: ORDEM, PLACA, RENAVAM, CHASSI, MODELO, ANO, SITUAÇÃO DETRAN,
  CNPJ PROPRIETÁRIO, ESTADO, CNPJ ORIGEM POSSUIDOR, INSTITUIÇÃO, DOC DE
  DOAÇÃO, SITUAÇÃO ADMINISTRATIVA, LICENCIAMENTO, IPVA, e **uma coluna por
  órgão autuador** (no ES: PREF. CARIACICA, PRF, DER-ES, DER-ES), TOTAL.
- **Linhas ocultas = veículos transferidos.** O que fica visível é o
  relatório de pendentes. O valor dos transferidos continua na linha
  (é o valor pago — regra 3.3).
- **Abas por órgão** (PRF, DER-ES, PREF. …): cada uma é a planilha de um
  ofício de cancelamento. Colunas: ORD, PLACA, RENAVAM, CHASSI, MODELO, ANO,
  AIT, CÓDIGO. A numeração ORD recomeça em 1 a cada remessa; a data fica só
  no rodapé ("Brasília-DF, abril 2026."). Não tem valor por auto.
- **Problemas conhecidos** que o importador precisa tratar e relatar:
  - TOTAL da linha é `=SUM(N:R)` e ignora a segunda coluna DER-ES.
  - Multa guardada por órgão, somando vários autos numa célula; quando
    há mais de um auto, o valor individual não existe.
  - Autos nas abas de solicitação sem valor na aba principal.
  - Uma aba de solicitação com nome de uma prefeitura é, pelo título
    interno, de outro órgão/UF, com veículo que não está na lista da UF.
  - Coluna ESTADO mistura UF e ente, com várias grafias para o mesmo lugar.
  - CNPJ e RENAVAM salvos como número (perdem o zero à esquerda) — mesmo
    tratamento já feito na importação da Doação.
  - Nomes de instituição e modelo escritos de jeitos diferentes; muitos
    veículos sem instituição.
  - SITUAÇÃO ADMINISTRATIVA vazia.
- Sugestão: importador em duas passadas, igual ao da Doação (confere tudo e
  mostra um relatório de problemas antes de gravar qualquer coisa).

## 6. Modelo de dados sugerido

- `veiculos` — já existe (Doação). Passivo usa por chassi.
- `passivo_veiculos` — ou colunas extras — situação DETRAN (lista fechada:
  Em circulação / Em circulação — comunicado de venda / Transferido), UF,
  ente, instituição padronizada, exclusão lógica.
- `debitos` — id, veículo, tipo, órgão, AIT, código, artigo, descrição,
  exercício, vencimento, data da infração, valor, status,
  `pago_na_transferencia`, ofício.
- `pagamentos` — veículo, data, nº SEI, observação; `comprovantes` —
  arquivo, nome, tamanho.
- `oficios` + `oficio_debitos` — órgão, data, nº SEI, situação, resposta.
- `tabela_infracoes` — carregada de `dados/tabela-infracoes.json`.
- `orgaos` — órgãos autuadores por UF (o Apps Script tem uma aba
  `OrgaosAutuadores`; pedir à Kim).
- `usuarios` — e-mail, perfil.

## 7. Cuidados

- **O repositório é público.** Nunca commitar dado real: placa, chassi,
  RENAVAM, CNPJ, AIT, nomes. Os exemplos desta pasta foram tirados de
  propósito. A tabela de infrações é pública (CTB) e pode ficar.
- A Kim não é programadora: explicar em português claro, clique a clique,
  e testar tudo antes de entregar (ver `site/CONTEXTO-MIGRACAO.md`, seção 1).
- O ambiente do Claude não alcança o banco nem o site publicado; o método é
  "você prepara, ela executa" (seção 5 do mesmo arquivo).
