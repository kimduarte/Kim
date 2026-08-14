# Controle Financeiro & Quitação de Empréstimos

Sistema de uso pessoal em Google Apps Script (planilha + app da web embutido)
para controlar entradas/saídas e organizar a quitação de empréstimos o mais
rápido possível, comparando as estratégias **avalanche** (foca no juro mais
alto) e **bola de neve** (foca no menor saldo).

## Instalação

1. Crie uma planilha nova em [sheets.google.com](https://sheets.google.com).
2. Vá em **Extensões > Apps Script**.
3. Apague o conteúdo do arquivo `Código.gs` que vem por padrão e cole nele
   todo o conteúdo de [`CodigoCompleto.gs`](./CodigoCompleto.gs).
4. No editor do Apps Script, clique em **Arquivo > Novo > Arquivo HTML**,
   nomeie exatamente `PaginaCompleta` e cole nele todo o conteúdo de
   [`PaginaCompleta.html`](./PaginaCompleta.html).
5. Salve (ícone de disquete) e volte para a planilha, recarregando a página.
6. Um menu **Controle Financeiro** vai aparecer na planilha. Clique em
   **1) Criar estrutura inicial** — isso cria as abas `Lancamentos`,
   `Emprestimos`, `PagamentosEmprestimo` e `Config`.
7. No editor do Apps Script, clique em **Implantar > Nova implantação**,
   escolha o tipo **App da Web**, defina "Executar como: Eu" e
   "Quem pode acessar: Só eu" (ou "Qualquer pessoa com o link", se quiser
   acessar sem estar logado), e implante. O link gerado é o seu app — pode
   salvar como atalho no celular.

## Como usar

- **Painel**: resumo do mês (entradas, saídas, saldo), dívida ativa total,
  o "aporte extra" disponível por mês para acelerar a quitação (calculado
  automaticamente pela média das suas entradas/saídas dos últimos meses,
  ou definido manualmente) e a estratégia recomendada com a ordem sugerida
  de quitação dos empréstimos.
- **Lançamentos**: registre entradas e saídas do dia a dia.
- **Empréstimos**: cadastre cada empréstimo (valor original, saldo devedor,
  taxa de juros mensal, parcela mínima) e registre os pagamentos feitos —
  o saldo devedor é atualizado automaticamente.
- **Comparar Estratégias**: simula lado a lado quanto tempo e quanto de
  juros cada estratégia (avalanche x bola de neve) levaria para quitar
  tudo, com um valor de aporte extra à sua escolha.

## Como o cálculo de quitação funciona

A cada mês simulado: aplica os juros sobre o saldo de cada empréstimo ativo,
paga a parcela mínima de todos, e destina o aporte extra inteiro ao
empréstimo prioritário da estratégia escolhida (maior juro, na avalanche;
menor saldo, na bola de neve). Quando um empréstimo é quitado, o valor que
ele consumia passa a reforçar o próximo da fila no mesmo mês — é o efeito
"bola de neve"/"avalanche" que acelera a quitação com o passar do tempo.

É uma simulação para planejamento (assume taxa de juros e parcela mínima
constantes), não uma tabela de amortização exata do seu contrato — trate os
prazos como estimativa.
