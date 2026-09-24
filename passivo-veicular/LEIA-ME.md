# Produtividade do Passivo Veicular

Ferramenta para registrar e acompanhar a produção do Setor de Passivo Veicular:
as atividades do dia a dia, quem fez, para qual UF, e os veículos transferidos e
baixados.

É **um arquivo só** (`index.html`). Não precisa de internet, instalação nem
planilha. Não tem ligação com o sistema de veículos doados (pasta `apps-script/`)
nem com o site novo (pasta `site/`).

## Como abrir

1. Baixe o arquivo `index.html` desta pasta.
2. Dê dois cliques nele. Abre no navegador (Chrome ou Edge funcionam melhor).
3. Na primeira vez aparecem **dados de exemplo, com nomes inventados**. Clique em
   “Apagar exemplos e começar” para cadastrar a equipe de verdade.

## As quatro abas

- **Painel** – totais do período, produção por servidor e por atividade, mapa do
  atendimento por UF e evolução por dia, semana ou mês. O botão “Relatório em
  texto” gera um resumo pronto para colar no SEI ou num e-mail.
- **Registrar atividade** – data, servidor, UF, atividade, quantidade e, se
  quiser, uma referência (placa, nº SEI ou nº do ofício) e uma observação. Logo
  abaixo fica a lista de registros, com busca, edição e exclusão.
- **Equipe e UFs** – cadastro dos servidores e o mapa em que se escolhe quem
  responde por cada ente federado.
- **Dados e backup** – cópia de segurança, planilha para o Excel, ajuste das
  atividades e dos nomes do setor.

## Onde ficam os dados (importante)

Os registros ficam guardados **no navegador do computador onde a ferramenta foi
aberta**. Nada vai para a internet nem para este repositório.

Consequências:

- Se os dados de navegação forem apagados, os registros somem. Por isso, baixe a
  **cópia de segurança** toda semana.
- Cada computador tem os seus próprios registros. Para juntar a equipe:
  1. A coordenação cadastra a equipe e as UFs e baixa a cópia de segurança.
  2. Cada servidor abre a ferramenta e usa “Restaurar ou juntar uma cópia” com
     esse arquivo. Assim todos ficam com a mesma lista de nomes.
  3. Periodicamente, cada um baixa a própria cópia e envia para a coordenação.
  4. A coordenação junta as cópias. Um registro repetido não é contado duas vezes,
     e o mesmo nome de servidor vindo de computadores diferentes vira uma pessoa só.

## As 15 atividades

| Categoria | Atividades |
|---|---|
| Análise e instrução de processos | Diligências da Unidade de Triagem de Multas; instrução para baixa definitiva; autorização de baixa definitiva; notificação de cobrança |
| Consultas e apoio técnico | Apoio técnico (pendências, boletos, espelho de CRLV); consulta no Detran Digital; demandas da RedeLog |
| Ofícios e solicitações | Ofício de cancelamento de auto de infração; ofício de exclusão de débitos de IPVA; prescrição de licenciamento; pagamento de taxas |
| Diligências e relatórios | Diligência ao Detran-DF; relatório anual do passivo |
| Veículos regularizados | Veículo transferido; veículo baixado |

Nomes e categorias podem ser ajustados na aba “Dados e backup”.

## Notas técnicas (para quem for mexer no código)

- HTML, CSS e JavaScript puros, sem bibliotecas nem nada carregado de fora.
- Dados em `localStorage`, chave `passivoVeicular.produtividade.v1`.
  Preferências de tela (aba, filtros) em `passivoVeicular.preferencias.v1`.
- Datas sempre como texto `AAAA-MM-DD` no fuso do computador, nunca em UTC.
- Exclusões ficam marcadas (`excluido: true`) em vez de apagadas, para que a
  junção de cópias não ressuscite um registro excluído. Na junção, vale a versão
  com `atualizadoEm` mais recente.
- A cópia de segurança é um JSON com `app: "passivo-veicular-produtividade"`.
- O repositório é público: **não commitar dados reais** (nomes, placas, números
  de processo).
