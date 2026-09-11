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

## 6. Autorizações já concedidas

- ✅ **Pode juntar (`merge`) a branch de trabalho na `main` sempre que
  concluir uma etapa**, sem pedir permissão a cada vez. É o que publica o site.
- ✅ Pode criar e enviar commits normalmente.
- ❌ **Nunca peça a ela credenciais no chat** (senha do banco, tokens). Elas
  ficam só nas variáveis de ambiente da Vercel. O `SETUP_TOKEN` está salvo com
  ela — peça se precisar do link de setup.

## 7. Dados reais (medidos, não estimados)

- **3.851 veículos** na aba `Veiculos`, 45 colunas.
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

A tabela está criada e **vazia**. Falta levar os dados.

Caminho planejado: **gerar um CSV** a partir da planilha ao vivo e a Kim sobe
por **TiDB Cloud → Data → Import → "Upload a local file"** (aceita CSV até
250 MiB; SQL só via Amazon S3, por isso CSV).

Cuidados que já identificamos para esse CSV:
- Datas no formato `AAAA-MM-DD HH:MM:SS`.
- `valor_veiculo` como número com ponto decimal.
- Células vazias em colunas DATETIME/INT **não podem ir como texto vazio** —
  precisam da representação de nulo que o importador do TiDB espera
  (normalmente `\N`). **Peça a ela uma captura da tela de configuração da
  importação** antes de gerar o arquivo final, para acertar de primeira.
- UTF-8 (a base tem acentos: "NÃO", nomes de donatárias).

Alternativa, se o CSV der trabalho: criar um endpoint de importação no próprio
site (como foi feito com `/api/setup`), lendo os dados de um arquivo commitado
no repositório. Atenção ao limite de tempo de execução de função na Vercel —
seria preciso importar em lotes.

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
