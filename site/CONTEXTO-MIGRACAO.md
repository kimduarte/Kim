# Contexto do projeto — Migração SGP/COLOG para site próprio

> Documento de passagem. Cole o conteúdo abaixo no início de uma nova sessão
> do Claude Code para continuar o projeto de migração sem perder contexto.
> A sessão anterior fica dedicada à manutenção do sistema atual em Apps Script.

---

## 1. Quem é a pessoa com quem você trabalha

Kim Duarte (kimduarte.17@gmail.com), Serviço de Gestão de Patrimônio /
Coordenação de Logística — SENASP / Ministério da Justiça.

**Ela não é programadora.** Isso muda como você deve trabalhar:

- Explique em português claro, sem jargão. Quando usar um termo técnico, explique.
- Instruções de interface devem ser clique a clique ("clique no botão preto
  escrito X, no canto superior direito").
- **Nunca invente caminhos de menu.** As interfaces (Vercel, TiDB Cloud) mudaram
  várias vezes em relação ao esperado. Peça uma captura de tela e oriente pela
  tela real dela. Isso funcionou bem e economizou tempo.
- Ela não consegue revisar seu código. A responsabilidade de verificar o que
  você escreve é **sua** — rode o build, teste, confira contra a fonte real
  antes de entregar.
- Ela é paciente e colaborativa, mas o tempo dela é limitado: não a faça caçar
  coisas na interface sem necessidade.

## 2. O que é o sistema

Sistema de controle de veículos doados pela SENASP a estados e municípios:
cadastro de processos de doação, acompanhamento da transferência de
propriedade, emissão de ATPVe, cobrança das donatárias, estatísticas, e
geração de ofícios (inclusive o de baixa de IPVA junto à Secretaria de
Economia do DF).

**É uma ferramenta pessoal de trabalho dela**, não um sistema institucional
contratado pelo Ministério. Isso importa para escolhas de licenciamento
(ex.: o plano gratuito Hobby da Vercel é adequado).

### Sistema atual (continua funcionando, NÃO mexer)

- Google Apps Script + Google Sheets.
- Repositório: `kimduarte/Kim`, pasta `apps-script/`
  (`CodigoCompleto.gs` — servidor; `PaginaCompleta.html` — telas).
- Planilha ao vivo: **"Base de Veículos Doados"**, Drive ID
  `1tPvBg5YBsDY86lh3zOe9wAWNgKVOJM9bsfN2vL5rslU`, aba `Veiculos`.
- A Kim atualiza esse sistema colando o código manualmente no editor do Apps
  Script. O GitHub é só histórico — publicar no GitHub **não** altera o
  sistema em produção dela.
- **A manutenção desse sistema é feita em OUTRA sessão.** Nesta, só migração.

## 3. Para onde estamos indo

| Camada | Escolha | Situação |
|---|---|---|
| Hospedagem | **Vercel** (plano Hobby, gratuito) | ✅ pronto |
| Banco de dados | **TiDB Cloud Starter** (gratuito) | ✅ pronto |
| Código | **Next.js 16 + React 19 + TypeScript** | ✅ esqueleto pronto |
| Repositório | `kimduarte/Kim`, pasta `site/` | ✅ pronto |

Alternativas descartadas (não reabrir sem motivo novo):
- **Hostinger** — chegou a ser escolhida, mas o plano Business renova a
  US$16,99/mês e não tem a integração oficial com TiDB. A Vercel saiu
  equivalente em custo e bem mais simples de operar.
- **Manter no Apps Script** — foi a recomendação inicial (os gargalos reais
  de desempenho já tinham sido corrigidos), mas a Kim decidiu migrar. Decisão
  dela, já tomada; não relitigar.

## 4. O que JÁ está feito

### Vercel
- Conta criada (login via GitHub), plano **Hobby**.
- Projeto **`sisget`** → site no ar em **https://sisget.vercel.app**
- Publica automaticamente a partir da branch **`main`**.
- 6 variáveis de ambiente cadastradas no ambiente **Production**:
  - `TIDB_HOST`, `TIDB_PORT`, `TIDB_USER`, `TIDB_DATABASE` (tipo Config)
  - `TIDB_PASSWORD`, `SETUP_TOKEN` (tipo Secret)
  - ⚠️ As variáveis só valem após uma **publicação nova**. Ao mudar qualquer
    uma, é preciso republicar (Deployments → `···` → Redeploy).

### TiDB Cloud
- Cluster **`sgp-veiculos`**, plano **Starter (gratuito)**, TiDB v8.5.3.
- Região **São Paulo (`sa-east-1`)** — host
  `gateway01.sa-east-1.prod.aws.tidbcloud.com`, porta `4000`.
- Networking: Public Endpoint habilitado, regra `Allow_all_public_connections`
  (0.0.0.0–255.255.255.255). Necessário porque os IPs da Vercel mudam; a
  proteção real é senha + TLS.
- **Banco `sgp` e tabela `veiculos` criados e conferidos: 45 colunas, 10
  índices, 0 registros.**
- Limites do plano gratuito: 5 GiB de armazenamento e 50 milhões de Request
  Units/mês. Medição real: a base atual ocupa ~0,24% do limite mesmo
  projetando 50% de crescimento. Folga enorme.

### Código já no repositório (pasta `site/`)
- `app/page.tsx`, `app/layout.tsx`, `app/globals.css` — página inicial
  provisória ("em construção").
- `lib/db.ts` — conexão com TiDB via `mysql2`, TLS obrigatório,
  `dateStrings: true` (evita que o fuso UTC da Vercel desloque datas
  digitadas no Brasil).
- `app/api/setup/route.ts` — cria banco e tabela (idempotente), protegido por
  token, e **confere no próprio banco** o resultado. Responde em HTML legível.
- `db/01-criar-tabelas.sql` — o mesmo DDL em arquivo, para referência.
- `lib/colunas-veiculos.ts` — as 45 colunas (planilha → banco) com tipo e
  tamanho. Fonte única dessa correspondência; as telas vão ler daqui também.
- `app/api/importar/route.ts` — recebe os veículos em lotes e grava.
  Confere tudo antes de gravar qualquer coisa (ver seção 9).

### Código no repositório (pasta `apps-script/`)
- `EnviarParaOSite.gs` — script que a Kim cola no editor do Apps Script da
  planilha. Lê a aba `Veiculos` e envia para `/api/importar`. Não altera a
  planilha, só lê.

## 5. Restrições importantes do ambiente

**O ambiente onde você (Claude) roda NÃO alcança a internet externa.** Já foi
testado e confirmado: `hostinger.com`, `sisget.vercel.app` e o próprio banco
TiDB (porta 4000) estão todos bloqueados pelo proxy de saída.

Consequências práticas:

- Você **não consegue** conectar no banco, rodar migração, nem abrir o site
  publicado para conferir.
- O método que funciona é: **você prepara, ela executa.** Ou colando um texto
  que você entrega, ou subindo um arquivo que você gera, ou abrindo um
  endereço do próprio site (que roda na Vercel e *tem* acesso ao banco).
- Foi assim que a tabela foi criada: por um endpoint no próprio site.
- Para conferir o que está acontecendo, peça capturas de tela a ela.
- **Você consegue** acessar o Google Drive/Sheets dela pelas ferramentas MCP —
  use isso para conferir dados reais em vez de supor.

**O repositório `kimduarte/Kim` é PÚBLICO.** Confirmado pela API do GitHub.
Consequência: **nenhum dado real de veículo pode ser commitado** — chassi,
RENAVAM, placa, CNPJ, endereços e nomes de servidores ficariam visíveis para
qualquer pessoa. Isso descarta a ideia de commitar um arquivo de dados e
importar por um endpoint que lê do repositório.
(A planilha em si está a salvo: é compartilhada apenas com 7 contas nomeadas,
não com "qualquer pessoa com o link". O ID dela no repositório não abre nada.)

## 6. Autorizações já concedidas

- ✅ **Pode juntar (`merge`) a branch de trabalho na `main` sempre que
  concluir uma etapa**, sem pedir permissão a cada vez. É o que publica o site.
- ✅ Pode criar e enviar commits normalmente.
- ❌ **Nunca peça a ela credenciais no chat** (senha do banco, tokens). Elas
  ficam só nas variáveis de ambiente da Vercel. O `SETUP_TOKEN` está salvo com
  ela — peça se precisar do link de setup.

## 7. Dados reais (medidos, não estimados)

- **3.852 veículos** na aba `Veiculos`, 45 colunas (eram 3.851 na medição
  anterior; a base cresce).
- ~433 bytes de dado por veículo; ~1,67 MB de dado bruto no total.
- Aba `LogAlteracoes`: 2.231 registros, ~650 KB.
- **Uma duplicidade intencional**: chassi `93XDLLC2TVCT12957` / placa
  `UIY6D30` aparece em dois registros — `VC-003529` (excluído, na lixeira) e
  `VC-003570` (ativo). É o mesmo veículo recadastrado após correção do Termo
  de Doação. Por isso **não há restrição UNIQUE em chassi/placa no banco** —
  ela quebraria a importação. A checagem de duplicidade fica no código, que
  sabe ignorar excluídos.

## 8. Mapa das colunas (planilha → banco)

A tabela usa `snake_case`. Correspondência:

```
ID→id                            DataCadastro→data_cadastro
Ano→ano                          Mes→mes
UF→uf                            Ente→ente
Donataria→donataria              TermoDoacao→termo_doacao
Descricao→descricao              Marca→marca
Chassi→chassi                    Renavam→renavam
Placa→placa                      Transferido→transferido
DataTransferencia→data_transferencia
Observacoes→observacoes          CadastradoPor→cadastrado_por
UltimaAtualizacao→ultima_atualizacao
AtualizadoPor→atualizado_por     CNPJDonataria→cnpj_donataria
CEP→cep                          Logradouro→logradouro
Numero→numero                    Complemento→complemento
Bairro→bairro                    Municipio→municipio
ATPVeEmitido→atpve_emitido       ATPVeEnviado→atpve_enviado
Contrato→contrato                Aditivo→aditivo
NumeroAditivo→numero_aditivo     QtdVeiculosContrato→qtd_veiculos_contrato
QtdVeiculosAditivo→qtd_veiculos_aditivo
NumeroProcesso→numero_processo   MotivoInclusaoPosterior→motivo_inclusao_posterior
NumeroSei→numero_sei             ValorVeiculo→valor_veiculo
DataEmissaoSegundaViaATPVe→data_emissao_segunda_via
DataEmissaoATPVe→data_emissao_atpve
Excluido→excluido                ExcluidoPor→excluido_por
DataExclusao→data_exclusao       DataEnvioATPVe→data_envio_atpve
StatusCadastro→status_cadastro   AnoModelo→ano_modelo
```

## 9. PRÓXIMO PASSO — importar os 3.851 veículos

A tabela está criada e **vazia**. O código para levar os dados está pronto e
testado; falta a Kim executar.

### Como funciona (e por que não é mais o CSV)

O plano anterior era gerar um CSV e subir em TiDB Cloud → Data → Import. Foi
trocado por um caminho melhor: **a própria planilha envia os dados para o
site**, via `UrlFetchApp` do Apps Script.

Vantagens sobre o CSV:
- Os dados vão da planilha dela direto para o banco dela. Não passam pelo
  Claude, nem pelo repositório (que é público), nem por um arquivo no
  computador dela.
- Acaba a incerteza sobre como o importador do TiDB representa campo vazio
  (`\N` ou não) — quem converte é código nosso, dos dois lados.
- Serve depois para **ressincronizar** durante o período em que os dois
  sistemas vão rodar em paralelo. É só rodar de novo.

### O passo a passo que ela executa

1. Planilha → Extensões → Apps Script → novo arquivo `EnviarParaOSite`,
   cola `apps-script/EnviarParaOSite.gs`, preenche o `CODIGO_DE_SEGURANCA`
   (é o `SETUP_TOKEN`) e salva.
2. Roda **`PASSO_1_conferir`** — não envia nada, só lê a planilha e escreve
   um relatório. Termina com `PROBLEMAS ENCONTRADOS: N`. Se N não for zero,
   ela manda o relatório antes de seguir.
3. Roda **`PASSO_2_enviar`** — envia em lotes de 200.
4. Abre `https://sisget.vercel.app/api/importar?token=SEU_CODIGO` no
   navegador: uma página com as contagens para conferir contra a planilha.

### Cuidados que já estão resolvidos no código

- **Duas passadas.** O envio primeiro valida TODOS os lotes sem gravar nada;
  só grava se não houver nenhum problema. Nunca sobra meia base importada.
- **Repetir é seguro.** Grava com `REPLACE`, então o mesmo veículo enviado
  duas vezes é regravado por cima, não duplicado. Isso também resolve o
  limite de 6 minutos do Apps Script: se estourar, é só rodar de novo.
- **Datas** viram texto `AAAA-MM-DD HH:MM:SS` no fuso do Brasil, casando com
  o `dateStrings: true` do `lib/db.ts`. O que ela vê na planilha é o que fica
  no banco.
- **Valor do veículo** aceita número e texto no padrão brasileiro
  ("196.950,00"), com a mesma regra do `normalizarValorMonetario_` atual.
- **Campos SIM/NÃO em branco** viram `NÃO` (é como o sistema atual sempre
  leu). Caixa de seleção marcada/desmarcada também é entendida.
- **RENAVAM/chassi guardados como número** na planilha viram texto sem
  notação científica nem separador de milhar. O `PASSO_1` ainda avisa
  quantos estão nessa situação, porque aí pode haver zero à esquerda já
  perdido na planilha — problema anterior à migração, mas que vale conferir.
- **Texto que não cabe** no campo é reportado com linha, ID e campo, em vez
  de o banco cortar pela metade em silêncio.

### O que foi testado

Sem acesso ao banco a partir daqui, foi testado tudo que não depende dele:
- `npm run build` passa (TypeScript incluído).
- O endpoint foi exercitado de verdade no caminho `validar` (que não toca o
  banco): caminho feliz, token errado, corpo inválido, ação desconhecida,
  data inexistente (31/02), mês 13, texto grande demais, SIM/NÃO inválido,
  inteiro com letra, ano fora do SMALLINT, valor ilegível, ID em branco, ID
  repetido, coluna faltando, colunas fora de ordem e lote de 200.
- O `.gs` foi rodado em Node com a planilha simulada (datas como `Date`,
  valor como texto brasileiro, RENAVAM como número, caixa de seleção,
  acentos, linha em branco no fim) e o que ele produziu foi alimentado no
  endpoint real — passa.
- O caminho ruim também: planilha com defeitos gera relatório apontando
  linha, ID, campo e motivo, e o envio para antes de gravar.

**Ainda não testado (só dá para testar com ela):** a conexão real com o
TiDB e a gravação em si. O `REPLACE INTO` em lote e as contagens da página
de conferência nunca rodaram contra o banco de verdade.

### Achado: o limite de 6 minutos do Apps Script

A primeira execução do `PASSO_1_conferir` na base real levou **5min27**
(22:43:39 → 22:49:06 nos registros do Cloud). O Apps Script desliga qualquer
execução aos 6 minutos, e o envio faz tudo o que a conferência faz **mais**
12 mil conversões de data e 20 idas à internet. Ia estourar.

Duas mudanças resolveram:

1. **`Utilities.formatDate` saiu do caminho.** É uma chamada de serviço do
   Google, e havia uma por data — 12.117 delas num envio completo. Trocada
   por `formatarDataLocal_`, conta feita em JavaScript puro com os métodos
   comuns de `Date`, que já devolvem a hora no fuso do projeto. Medido: zero
   chamadas de serviço no caminho do envio. O `PASSO_1` compara as duas
   contas numa amostra de 50 datas reais e acusa se um dia divergirem.
2. **O envio virou retomável.** `PASSO_2_enviar` lê a planilha em fatias de
   200 linhas (nunca a aba inteira de uma vez) e guarda em
   `PropertiesService` a próxima linha a processar. Se bater 4min30, ele
   para limpo, salva onde parou e manda rodar de novo — a execução seguinte
   continua dali. `PASSO_2B_recomecarDoPrimeiroVeiculo` zera esse progresso.

Efeito colateral: a validação em duas passadas (validar tudo, só então
gravar) saiu. Ela não fazia mais sentido com retomada, em que base parcial é
estado normal e recuperável. A rede de proteção continua: o `PASSO_1` valida
tudo localmente antes (e é espelho fiel do servidor — há teste conferindo que
os dois chegam à mesma contagem de problemas), e o servidor valida cada lote
inteiro antes de gravar qualquer linha dele.

### Achado: zeros à esquerda comidos pela planilha

O `PASSO_1_conferir` rodado na base real (3.852 veículos) apontou campos de
tamanho fixo guardados como NÚMERO na planilha — e número não tem zero à
esquerda. O Google Sheets converte sozinho qualquer célula que pareça número.

| Campo | Como número | Exemplo achado | Tamanho certo |
|---|---|---|---|
| `Renavam` | 3.846 de 3.846 | 23 com 9 dígitos, 3.823 com 10, **nenhum com 11** | 11 |
| `CEP` | 397 de 397 | 67 com 7 dígitos, 330 com 8 | 8 |
| `CNPJDonataria` | 395 de 395 | 13 com 12, 77 com 13, 305 com 14 | 14 |
| `NumeroSei` | 3.839 | 8 com 7, 3.831 com 8 | variável |

Medido na base real: 67 CEPs e 90 CNPJs são corrigidos. Os 67 CEPs são 16,9%
do total — bate com a proporção de CEPs brasileiros que começam com zero (a
faixa `0…` é São Paulo), o que é uma confirmação independente de que a
correção está certa. `Chassi` (3.846 com 17) e `Placa` (3.846 com 7) estão
todos como texto e íntegros. `NumeroSei` não tem tamanho fixo, então fica
intocado.

**Resolvido no código (determinístico):** CEP e CNPJ têm tamanho fixo, então
só existe uma resposta certa. `restaurarZeros_` no `.gs` completa o CEP até 8
e o CNPJ até 14 — este último só quando já tem 12 ou 13 dígitos, para não
transformar um CPF (11) em CNPJ. Ligado por `RESTAURAR_ZEROS_PERDIDOS`.
Reforço de que é o certo: o próprio sistema atual recusa CEP que não tenha 8
dígitos (`CEP inválido`, em `validarESanitizarVeiculo_`).

**Em aberto:** o `RENAVAM`, e a evidência ficou muito mais forte com os
números reais. Se os RENAVAMs tivessem tamanhos variados por natureza,
apareceriam alguns com 11 dígitos. **Nenhum dos 3.846 tem.** O que existe é
exatamente o padrão de zero perdido: 3.823 com 10 dígitos (perderam um zero)
e 23 com 9 (perderam dois). Some-se que o valor de exemplo, 1.326.606.414,
está na casa do contador RENAVAM atual — ou seja, o número real é
`01326606414`.

Ainda assim não foi ligado: `validarRenavam_` aceita de 9 a 11 dígitos, então
o sistema nunca reclamou, e são 3.846 registros de patrimônio público. A
checagem definitiva custa um minuto: a Kim abre um ATPVe ou CRLV e vê se o
RENAVAM impresso tem 11 dígitos começando com zero. Confirmado, é só virar
`RESTAURAR_ZERO_DO_RENAVAM` para `true` e rodar o `PASSO_2_enviar` de novo —
o `REPLACE` atualiza os registros existentes, não duplica.

**Importante:** a correção vale só para o que vai ao banco. A planilha não é
alterada — o script nunca escreve nela. Ou seja, **o dado continua errado na
planilha e no sistema atual**. Corrigir lá é trabalho para a outra sessão, a
que cuida do Apps Script.

### Depois da importação
1. Conferir: contagem no banco tem que bater com 3.851, e conciliar uma
   amostra manualmente com a planilha.
2. Recriar as telas, uma de cada vez (Processos, Cadastro, Estatísticas,
   ATPVe, Cobrança, TEP, Produtividade, Lixeira, Usuários).
3. Rodar os dois sistemas em paralelo até a Kim confirmar que bate tudo.
4. Só então desligar o Apps Script.

## 10. Como trabalhar bem neste projeto

O que funcionou até aqui e vale manter:

- **Conferir contra a fonte real, não supor.** Um bug de exibição foi
  encontrado baixando a planilha ao vivo e comparando com a tela — a suspeita
  inicial (cache) estava errada.
- **Testar antes de entregar.** Rodar `npm run build`, testar os caminhos de
  erro, conferir a página num navegador headless (Playwright está disponível
  no ambiente e funciona para páginas locais).
- **Mensagens de erro escritas para ela**, não para programador: o endpoint de
  setup responde em HTML dizendo exatamente o que falta e onde configurar.
- **Entregar uma tarefa por vez** e esperar o retorno. Ela executa na
  interface e volta com o resultado ou uma captura de tela.
- **Ser honesto sobre limitações** em vez de tentar contornar por fora.
