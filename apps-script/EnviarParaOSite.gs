/**
 * =====================================================================
 * ENVIAR OS VEÍCULOS DA PLANILHA PARA O SITE NOVO
 * =====================================================================
 *
 * COMO USAR (leia antes de rodar qualquer coisa):
 *
 *  1. Na planilha "Base de Veículos Doados", menu Extensões > Apps Script.
 *  2. No editor que abrir, clique no "+" ao lado de "Arquivos" (à esquerda)
 *     e escolha "Script". Dê o nome "EnviarParaOSite".
 *     ATENÇÃO: crie um arquivo NOVO. Não apague nem substitua o
 *     "CodigoCompleto" — é ele que faz o sistema atual funcionar.
 *  3. Apague o conteúdo que vier por padrão e cole TODO este arquivo.
 *  4. Preencha o CODIGO_DE_SEGURANCA logo abaixo (é o SETUP_TOKEN que você
 *     guardou quando criou as variáveis na Vercel).
 *  5. Clique no ícone de disquete (Salvar).
 *  6. Rode PRIMEIRO a função PASSO_1_conferir (escolha o nome dela na
 *     caixinha ao lado do botão "Executar" e clique em Executar).
 *     Ela não envia nada — só confere a planilha e escreve um relatório.
 *     No fim do relatório aparece "PROBLEMAS ENCONTRADOS: 0". Se o número
 *     não for zero, mande o relatório para o Claude antes de seguir.
 *  7. Só depois rode PASSO_2_enviar.
 *
 * O QUE ESTE ARQUIVO NÃO FAZ: ele não altera a planilha. Só lê.
 *
 * IMPORTANTE: depois de preencher o CODIGO_DE_SEGURANCA, este arquivo passa
 * a conter uma senha. Não mande ele de volta para o Claude nem publique em
 * lugar nenhum — mande só o relatório que aparece no "Registro de execução".
 * =====================================================================
 */

// ---------------------------------------------------------------------
// PREENCHA AQUI
// ---------------------------------------------------------------------

/** Endereço do site novo. Só mude se o endereço do site mudar. */
var ENDERECO_DO_SITE = 'https://sisget.vercel.app';

/** Cole entre as aspas o SETUP_TOKEN que está salvo com você. */
var CODIGO_DE_SEGURANCA = 'COLE_AQUI_O_SETUP_TOKEN';

/**
 * O Google Sheets transforma em NÚMERO qualquer célula que pareça número —
 * e número não tem zero à esquerda. Por isso o CEP "03033901" virou 3033901
 * e o CNPJ "04198514003846" virou 4198514003846 dentro da planilha.
 *
 * Com isto ligado, o zero é devolvido na hora de mandar para o banco:
 *   CEP  -> completa até 8 dígitos   (o sistema atual já exige 8: ver a
 *           validação "CEP inválido" no CodigoCompleto)
 *   CNPJ -> completa até 14 dígitos, e só quando já tem 12 ou 13, para não
 *           mexer num CPF (11 dígitos) por engano.
 *
 * Não é chute: os dois têm tamanho fixo, então só existe uma resposta certa.
 * A planilha NÃO é alterada — a correção vale só para o que vai ao banco.
 */
var RESTAURAR_ZEROS_PERDIDOS = true;

/**
 * O mesmo para o RENAVAM, que hoje tem 11 dígitos. DESLIGADO de propósito:
 * validarRenavam_ no sistema atual aceita de 9 a 11 dígitos, então um RENAVAM
 * de 10 pode ser legítimo. Só ligue depois de conferir um RENAVAM de verdade
 * num CRLV ou ATPVe e confirmar que ele começa com zero.
 */
var RESTAURAR_ZERO_DO_RENAVAM = false;

/**
 * Proteção contra clique errado. Só vire para true se você REALMENTE quiser
 * que PASSO_3_apagarTudoDoBanco apague todos os veículos do banco novo.
 * A planilha nunca é afetada, em nenhuma hipótese.
 */
var CONFIRMO_QUE_QUERO_APAGAR_TUDO = false;

// ---------------------------------------------------------------------
// Daqui para baixo não precisa mexer
// ---------------------------------------------------------------------

var ABA = 'Veiculos';
var VEICULOS_POR_LOTE = 200;

/**
 * As 45 colunas, com o tipo e o tamanho que o banco aceita.
 *
 * Precisa ficar igual a site/lib/colunas-veiculos.ts. Mudou lá, muda aqui.
 * (São dois arquivos porque este roda no Google e aquele roda no site — não
 * há como um enxergar o outro.)
 */
var COLUNAS = [
  ['ID', 'texto', 12],
  ['DataCadastro', 'data', 0],
  ['StatusCadastro', 'texto', 12],
  ['Ano', 'inteiro', 0],
  ['Mes', 'texto', 12],
  ['UF', 'texto', 10],
  ['Ente', 'texto', 20],
  ['Donataria', 'texto', 200],
  ['CNPJDonataria', 'texto', 20],
  ['TermoDoacao', 'texto', 120],
  ['NumeroProcesso', 'texto', 40],
  ['NumeroSei', 'texto', 30],
  ['Contrato', 'texto', 60],
  ['Aditivo', 'simnao', 3],
  ['NumeroAditivo', 'texto', 60],
  ['QtdVeiculosContrato', 'inteiro', 0],
  ['QtdVeiculosAditivo', 'inteiro', 0],
  ['MotivoInclusaoPosterior', 'texto', 300],
  ['Marca', 'texto', 60],
  ['Descricao', 'texto', 160],
  ['AnoModelo', 'texto', 9],
  ['Chassi', 'texto', 24],
  ['Renavam', 'texto', 15],
  ['Placa', 'texto', 10],
  ['ValorVeiculo', 'decimal', 0],
  ['CEP', 'texto', 10],
  ['Logradouro', 'texto', 160],
  ['Numero', 'texto', 20],
  ['Complemento', 'texto', 80],
  ['Bairro', 'texto', 100],
  ['Municipio', 'texto', 100],
  ['Transferido', 'simnao', 3],
  ['DataTransferencia', 'data', 0],
  ['ATPVeEmitido', 'simnao', 3],
  ['DataEmissaoATPVe', 'data', 0],
  ['ATPVeEnviado', 'simnao', 3],
  ['DataEnvioATPVe', 'data', 0],
  ['DataEmissaoSegundaViaATPVe', 'data', 0],
  ['Excluido', 'simnao', 3],
  ['ExcluidoPor', 'texto', 120],
  ['DataExclusao', 'data', 0],
  ['Observacoes', 'texto', 300],
  ['CadastradoPor', 'texto', 120],
  ['UltimaAtualizacao', 'data', 0],
  ['AtualizadoPor', 'texto', 120]
];

// =====================================================================
// PASSO 1 — conferir a planilha (não envia nada, não muda nada)
// =====================================================================

/** Quantos problemas o PASSO_1 achou. Zerado a cada conferência. */
var _problemasEncontrados = 0;

/** Registra um problema no relatório e conta. */
function problema_(r, texto) {
  _problemasEncontrados++;
  r.push('  [PROBLEMA] ' + texto);
}

function PASSO_1_conferir() {
  _problemasEncontrados = 0;
  var base = lerPlanilha_();
  var linhas = base.linhas;
  var fuso = Session.getScriptTimeZone();

  var r = [];
  r.push('==========================================================');
  r.push('CONFERÊNCIA DA PLANILHA — nada foi enviado nem alterado');
  r.push('==========================================================');
  r.push('Aba lida: ' + ABA);
  r.push('Veículos encontrados: ' + linhas.length);
  r.push('Fuso horário do script: ' + fuso);
  r.push('');

  if (base.faltando.length) {
    problema_(r, 'A planilha não tem estas colunas, que o banco espera:');
    r.push('             ' + base.faltando.join(', '));
    r.push('');
  }

  // --- Textos que não cabem no banco --------------------------------
  r.push('--- Campos de texto: maior texto encontrado x limite do banco ---');
  r.push('(só aparece na lista quem passou de 60% do limite)');
  var estourou = 0;
  for (var c = 0; c < COLUNAS.length; c++) {
    var nome = COLUNAS[c][0], tipo = COLUNAS[c][1], limite = COLUNAS[c][2];
    if (tipo !== 'texto' || !limite) continue;
    var pos = base.posicao[nome];
    if (pos === undefined || pos < 0) continue;

    var maior = 0, exemplo = '';
    for (var i = 0; i < linhas.length; i++) {
      var t = paraTexto_(linhas[i][pos]);
      if (t.length > maior) { maior = t.length; exemplo = t; }
      if (t.length > limite) estourou++;
    }
    if (maior > limite) {
      problema_(r, nome + ': o maior texto tem ' + maior + ' caracteres, mas o ' +
                   'banco só aceita ' + limite + ' — não vai caber.');
      r.push('             exemplo: ' + exemplo.substring(0, 80));
    } else if (maior > limite * 0.6) {
      r.push('  ' + nome + ': maior tem ' + maior + ', o banco aceita ' + limite + ' (ok)');
    }
  }
  if (estourou === 0) r.push('  Nenhum texto passa do limite do banco.');
  r.push('');

  // --- Datas ---------------------------------------------------------
  r.push('--- Campos de data ---');
  for (var c2 = 0; c2 < COLUNAS.length; c2++) {
    if (COLUNAS[c2][1] !== 'data') continue;
    var nomeD = COLUNAS[c2][0];
    var posD = base.posicao[nomeD];
    if (posD === undefined || posD < 0) continue;

    var preenchidas = 0, naoSaoData = 0, exemploRuim = '';
    for (var j = 0; j < linhas.length; j++) {
      var v = linhas[j][posD];
      if (v === '' || v === null) continue;
      preenchidas++;
      if (!ehData_(v)) {
        // Não é uma data de verdade: é texto. Pode ou não dar certo.
        if (!paraDataTexto_(v, fuso)) {
          naoSaoData++;
          if (!exemploRuim) exemploRuim = String(v);
        }
      }
    }
    var linhaD = '  ' + nomeD + ': ' + preenchidas + ' preenchida(s)';
    r.push(linhaD);
    if (naoSaoData > 0) {
      problema_(r, nomeD + ': ' + naoSaoData + ' célula(s) não são uma data que eu ' +
                   'saiba ler (ex.: "' + exemploRuim + '")');
    }
  }
  r.push('');

  // --- SIM/NÃO -------------------------------------------------------
  r.push('--- Campos SIM/NÃO: valores diferentes de SIM, NÃO ou vazio ---');
  var achouSimNao = false;
  for (var c3 = 0; c3 < COLUNAS.length; c3++) {
    if (COLUNAS[c3][1] !== 'simnao') continue;
    var nomeS = COLUNAS[c3][0];
    var posS = base.posicao[nomeS];
    if (posS === undefined || posS < 0) continue;

    var estranhos = {};
    var vazios = 0;
    for (var k = 0; k < linhas.length; k++) {
      var bruto = linhas[k][posS];
      var texto = String(bruto === null ? '' : bruto).trim().toUpperCase();
      if (!texto) { vazios++; continue; }
      if (texto === 'SIM' || texto === 'NÃO' || texto === 'NAO' ||
          texto === 'TRUE' || texto === 'FALSE') continue;
      estranhos[texto] = (estranhos[texto] || 0) + 1;
    }
    var chaves = Object.keys(estranhos);
    if (chaves.length) {
      achouSimNao = true;
      problema_(r, nomeS + ' tem valores que não são SIM nem NÃO: ' +
                   chaves.map(function (x) {
                     return '"' + x + '" (' + estranhos[x] + 'x)';
                   }).join(', '));
    }
    if (vazios) {
      r.push('  ' + nomeS + ': ' + vazios + ' em branco — vão virar "NÃO" (é o certo)');
    }
  }
  if (!achouSimNao) r.push('  Todos os valores são SIM, NÃO ou vazio.');
  r.push('');

  // --- Risco de zero à esquerda perdido ------------------------------
  // Chassi/RENAVAM/CEP/CNPJ guardados como NÚMERO na planilha podem ter
  // perdido o zero da frente antes mesmo desta migração. Vale conferir.
  // Campos de tamanho fixo guardados como número perdem o zero da frente
  // dentro da própria planilha. Aqui a gente mede quantos, de quanto, e o
  // que a correção vai fazer com eles.
  r.push('--- Documentos com tamanho fixo (zero à esquerda) ---');
  var suspeitos = [
    ['CEP', 8], ['CNPJDonataria', 14], ['Renavam', 11],
    ['Chassi', 17], ['Placa', 0], ['NumeroSei', 0]
  ];
  for (var s = 0; s < suspeitos.length; s++) {
    var nomeN = suspeitos[s][0], esperado = suspeitos[s][1];
    var posN = base.posicao[nomeN];
    if (posN === undefined || posN < 0) continue;

    var tamanhos = {}, comoNumero = 0, preenchidosN = 0;
    var corrigidos = 0, exemploCorrecao = '', curtos = 0, exemploCurto = '';
    for (var n = 0; n < linhas.length; n++) {
      var bn = linhas[n][posN];
      if (bn === '' || bn === null) continue;
      preenchidosN++;
      if (typeof bn === 'number') comoNumero++;

      var tn = paraTexto_(bn);
      tamanhos[tn.length] = (tamanhos[tn.length] || 0) + 1;

      var depois = restaurarZeros_(nomeN, tn);
      if (depois !== tn) {
        corrigidos++;
        if (!exemploCorrecao) exemploCorrecao = tn + '  vira  ' + depois;
      } else if (esperado && /^\d+$/.test(tn) && tn.length < esperado) {
        // Curto E a correção não pegou: é caso de decidir, não de contar
        // junto com os que já vão ser consertados.
        curtos++;
        if (!exemploCurto) exemploCurto = tn;
      }
    }
    if (!preenchidosN) continue;

    var chavesT = Object.keys(tamanhos).sort(function (a, b) { return Number(a) - Number(b); });
    r.push('  ' + nomeN + (esperado ? ' (o certo são ' + esperado + ' dígitos)' : '') + ':');
    r.push('    preenchidos: ' + preenchidosN + '   |   guardados como número: ' + comoNumero);
    r.push('    tamanhos encontrados: ' + chavesT.map(function (k) {
      return tamanhos[k] + ' com ' + k;
    }).join(', '));
    if (corrigidos) {
      r.push('    JÁ CORRIJO: ' + corrigidos + ' vão receber o zero de volta (ex.: ' +
             exemploCorrecao + ')');
    }
    if (curtos) {
      r.push('    A DECIDIR: ' + curtos + ' estão curtos e eu NÃO vou mexer ' +
             '(ex.: ' + exemploCurto + ')');
    }
  }
  r.push('');

  // --- Números inteiros (Ano, quantidades) ---------------------------
  r.push('--- Campos numéricos inteiros ---');
  for (var c4 = 0; c4 < COLUNAS.length; c4++) {
    if (COLUNAS[c4][1] !== 'inteiro') continue;
    var nomeI = COLUNAS[c4][0];
    var posI = base.posicao[nomeI];
    if (posI === undefined || posI < 0) continue;

    var preenchidosI = 0, invalidos = 0, grandes = 0, exI = '';
    for (var w = 0; w < linhas.length; w++) {
      var bi = linhas[w][posI];
      if (bi === '' || bi === null) continue;
      preenchidosI++;
      var ti = paraTexto_(bi);
      if (!/^-?\d+$/.test(ti)) {
        invalidos++;
        if (!exI) exI = ti;
        continue;
      }
      // "Ano" é um campo menor no banco (até 32767); os outros vão até
      // 2147483647. Conferir aqui evita descobrir isso só na hora de gravar.
      var limiteI = (nomeI === 'Ano') ? 32767 : 2147483647;
      if (Math.abs(Number(ti)) > limiteI) {
        grandes++;
        if (!exI) exI = ti;
      }
    }
    r.push('  ' + nomeI + ': ' + preenchidosI + ' preenchido(s)');
    if (invalidos) {
      problema_(r, nomeI + ': ' + invalidos + ' valor(es) que não são número ' +
                   'inteiro (ex.: "' + exI + '")');
    }
    if (grandes) {
      problema_(r, nomeI + ': ' + grandes + ' número(s) grande(s) demais para ' +
                   'o campo (ex.: ' + exI + ')');
    }
  }
  r.push('');

  // --- Valor do veículo ----------------------------------------------
  var posValor = base.posicao['ValorVeiculo'];
  if (posValor !== undefined && posValor >= 0) {
    var comoTexto = 0, exemploTexto = '', naoConverte = 0, exemploRuim2 = '', preenchidos = 0;
    for (var q = 0; q < linhas.length; q++) {
      var bv = linhas[q][posValor];
      if (bv === '' || bv === null) continue;
      preenchidos++;
      if (typeof bv !== 'number') {
        comoTexto++;
        if (!exemploTexto) exemploTexto = String(bv);
        var conv = paraDinheiro_(bv);
        if (conv === '' || isNaN(Number(conv))) {
          naoConverte++;
          if (!exemploRuim2) exemploRuim2 = String(bv);
        }
      }
    }
    r.push('--- Valor do veículo ---');
    r.push('  Preenchidos: ' + preenchidos);
    r.push('  Guardados como texto em vez de número: ' + comoTexto +
           (exemploTexto ? ' (ex.: "' + exemploTexto + '")' : ''));
    if (naoConverte) {
      problema_(r, 'ValorVeiculo: ' + naoConverte + ' valor(es) que eu não consigo ' +
                   'converter em número (ex.: "' + exemploRuim2 + '")');
    }
    r.push('');
  }

  // --- IDs -----------------------------------------------------------
  var posId = base.posicao['ID'];
  var vistos = {}, repetidos = [], semId = 0;
  for (var m = 0; m < linhas.length; m++) {
    var id = paraTexto_(linhas[m][posId]);
    if (!id) { semId++; continue; }
    if (vistos[id]) repetidos.push(id); else vistos[id] = true;
  }
  r.push('--- IDs ---');
  if (semId) problema_(r, semId + ' linha(s) com veículo mas sem ID.');
  else r.push('  Todos os veículos têm ID.');
  if (repetidos.length) {
    problema_(r, repetidos.length + ' ID(s) repetido(s): ' + repetidos.slice(0, 10).join(', '));
  } else {
    r.push('  Nenhum ID repetido.');
  }
  r.push('');

  // Veredito: um número, para não depender de ninguém caçar marcações no
  // meio do relatório.
  r.push('==========================================================');
  r.push('PROBLEMAS ENCONTRADOS: ' + _problemasEncontrados);
  if (_problemasEncontrados === 0) {
    r.push('Está tudo certo. Pode rodar PASSO_2_enviar.');
  } else {
    r.push('NÃO rode PASSO_2_enviar ainda.');
    r.push('Procure no relatório acima as linhas que começam com [PROBLEMA]');
    r.push('e mande o relatório inteiro para o Claude.');
  }
  r.push('==========================================================');

  mostrar_(r.join('\n'));
}

// =====================================================================
// PASSO 2 — enviar para o site
// =====================================================================

function PASSO_2_enviar() {
  if (!CODIGO_DE_SEGURANCA || CODIGO_DE_SEGURANCA.indexOf('COLE_AQUI') === 0) {
    mostrar_('Falta preencher o CODIGO_DE_SEGURANCA lá em cima, na linha que\n' +
             'começa com "var CODIGO_DE_SEGURANCA".');
    return;
  }

  var comecou = new Date().getTime();
  var base = lerPlanilha_();
  var fuso = Session.getScriptTimeZone();
  var r = [];

  if (base.faltando.length) {
    mostrar_('Não dá para enviar: a planilha não tem estas colunas:\n  ' +
             base.faltando.join(', '));
    return;
  }

  // Converte tudo de uma vez. A última posição de cada linha é o número da
  // linha na planilha, para o relatório de problemas saber onde apontar.
  var nomes = COLUNAS.map(function (c) { return c[0]; });
  var prontas = [];
  for (var i = 0; i < base.linhas.length; i++) {
    var origem = base.linhas[i];
    var destino = [];
    for (var c = 0; c < COLUNAS.length; c++) {
      var nome = COLUNAS[c][0], tipo = COLUNAS[c][1];
      var bruto = origem[base.posicao[nome]];
      if (tipo === 'data') destino.push(paraDataOuOriginal_(bruto, fuso));
      else if (tipo === 'decimal') destino.push(paraDinheiro_(bruto));
      else destino.push(restaurarZeros_(nome, paraTexto_(bruto)));
    }
    destino.push(base.primeiraLinhaDeDados + i); // nº da linha na planilha
    prontas.push(destino);
  }

  r.push('Veículos lidos da planilha: ' + prontas.length);
  r.push('');

  // --- 1ª passada: conferir tudo, sem gravar -------------------------
  r.push('--- Conferindo (nada é gravado nesta etapa) ---');
  var lotes = Math.ceil(prontas.length / VEICULOS_POR_LOTE);
  for (var v = 0; v < lotes; v++) {
    var pedaco = prontas.slice(v * VEICULOS_POR_LOTE, (v + 1) * VEICULOS_POR_LOTE);
    var resp = chamar_('validar', nomes, pedaco);
    if (!resp.ok) {
      r.push('  [PROBLEMA] PAREI no lote ' + (v + 1) + ' de ' + lotes);
      r.push(descreverErro_(resp));
      r.push('');
      r.push('NADA foi gravado no banco. Corrija a planilha e rode de novo,');
      r.push('ou mande este relatório para o Claude.');
      mostrar_(r.join('\n'));
      return;
    }
    r.push('  lote ' + (v + 1) + '/' + lotes + ': ' + resp.conferidos + ' ok');
  }
  r.push('  Tudo conferido, nenhum problema.');
  r.push('');

  // --- 2ª passada: gravar --------------------------------------------
  r.push('--- Gravando no banco ---');
  var gravados = 0;
  for (var g = 0; g < lotes; g++) {
    // O Apps Script desliga sozinho depois de 6 minutos. Se estiver perto
    // disso, para limpo e explica como continuar — em vez de morrer no meio
    // com uma mensagem de erro que não ajuda ninguém.
    if (new Date().getTime() - comecou > 5 * 60 * 1000) {
      r.push('');
      r.push('[ATENÇÃO] Parei por causa do tempo limite do Google (6 minutos).');
      r.push('    Já gravei ' + gravados + ' veículos.');
      r.push('    Rode PASSO_2_enviar de novo: gravar duas vezes o mesmo');
      r.push('    veículo NÃO duplica nada, ele só é regravado por cima.');
      mostrar_(r.join('\n'));
      return;
    }

    var pedacoG = prontas.slice(g * VEICULOS_POR_LOTE, (g + 1) * VEICULOS_POR_LOTE);
    var respG = chamar_('gravar', nomes, pedacoG);
    if (!respG.ok) {
      r.push('  [PROBLEMA] ERRO no lote ' + (g + 1) + ' de ' + lotes);
      r.push(descreverErro_(respG));
      r.push('');
      r.push('Gravei ' + gravados + ' veículos antes do erro. Rodar de novo é');
      r.push('seguro — não duplica. Mande este relatório para o Claude.');
      mostrar_(r.join('\n'));
      return;
    }
    gravados += respG.gravados;
    r.push('  lote ' + (g + 1) + '/' + lotes + ': ' + respG.gravados + ' gravados');
  }

  var segundos = Math.round((new Date().getTime() - comecou) / 1000);
  r.push('');
  r.push('==========================================================');
  r.push('PRONTO — ' + gravados + ' veículos gravados em ' + segundos + ' segundos.');
  r.push('==========================================================');
  r.push('Agora abra este endereço no navegador para conferir os números:');
  r.push(ENDERECO_DO_SITE + '/api/importar?token=SEU_CODIGO');
  r.push('(troque SEU_CODIGO pelo mesmo código de segurança)');
  mostrar_(r.join('\n'));
}

// =====================================================================
// PASSO 3 — apagar tudo do banco e recomeçar (raramente necessário)
// =====================================================================

function PASSO_3_apagarTudoDoBanco() {
  if (!CONFIRMO_QUE_QUERO_APAGAR_TUDO) {
    mostrar_('Não apaguei nada.\n\n' +
             'Esta função apaga TODOS os veículos do banco do site novo.\n' +
             'A planilha não é tocada — ela continua intacta.\n\n' +
             'Se é isso mesmo que você quer, mude lá em cima a linha\n' +
             '  var CONFIRMO_QUE_QUERO_APAGAR_TUDO = false;\n' +
             'para\n' +
             '  var CONFIRMO_QUE_QUERO_APAGAR_TUDO = true;\n' +
             'salve, e rode de novo.');
    return;
  }
  var resp = chamar_('limpar', null, null);
  mostrar_(resp.ok
    ? 'Banco limpo. Sobraram ' + resp.restaram + ' veículos.\n' +
      'Rode PASSO_2_enviar para importar de novo.\n\n' +
      'Agora volte a linha CONFIRMO_QUE_QUERO_APAGAR_TUDO para false,\n' +
      'para não apagar sem querer numa próxima vez.'
    : 'Não consegui limpar:\n' + descreverErro_(resp));
}

// =====================================================================
// Funções de apoio
// =====================================================================

/** Lê a aba Veiculos e descobre em que posição está cada coluna. */
function lerPlanilha_() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ABA);
  if (!sheet) throw new Error('Não achei a aba "' + ABA + '" nesta planilha.');

  var totalLinhas = sheet.getLastRow();
  var totalColunas = sheet.getLastColumn();
  if (totalLinhas < 2) {
    return { linhas: [], posicao: {}, faltando: [], primeiraLinhaDeDados: 2 };
  }

  var cabecalho = sheet.getRange(1, 1, 1, totalColunas).getValues()[0];
  var posicao = {};
  for (var i = 0; i < cabecalho.length; i++) {
    posicao[String(cabecalho[i]).trim()] = i;
  }

  var faltando = [];
  for (var c = 0; c < COLUNAS.length; c++) {
    if (posicao[COLUNAS[c][0]] === undefined) faltando.push(COLUNAS[c][0]);
  }

  var linhas = sheet.getRange(2, 1, totalLinhas - 1, totalColunas).getValues();

  // Descarta linhas totalmente em branco no fim da aba.
  var posId = posicao['ID'];
  var uteis = [];
  for (var j = 0; j < linhas.length; j++) {
    if (posId !== undefined && paraTexto_(linhas[j][posId])) uteis.push(linhas[j]);
  }

  return { linhas: uteis, posicao: posicao, faltando: faltando, primeiraLinhaDeDados: 2 };
}

/** Manda um pedido para o site e devolve a resposta já lida. */
function chamar_(acao, nomes, linhas) {
  var corpo = { acao: acao };
  if (nomes) { corpo.colunas = nomes; corpo.linhas = linhas; }

  var resposta = UrlFetchApp.fetch(
    ENDERECO_DO_SITE + '/api/importar?token=' + encodeURIComponent(CODIGO_DE_SEGURANCA),
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(corpo),
      muteHttpExceptions: true
    }
  );

  var texto = resposta.getContentText();
  try {
    return JSON.parse(texto);
  } catch (e) {
    return {
      ok: false,
      erro: 'O site respondeu algo que não consegui entender (código HTTP ' +
            resposta.getResponseCode() + '): ' + texto.substring(0, 400)
    };
  }
}

/** Transforma a resposta de erro do site em texto legível. */
function descreverErro_(resp) {
  if (resp.erro) return '      ' + resp.erro;
  if (!resp.problemas) return '      (o site não explicou o motivo)';

  var saida = ['      ' + resp.totalProblemas + ' problema(s). Os primeiros:'];
  for (var i = 0; i < resp.problemas.length && i < 20; i++) {
    var p = resp.problemas[i];
    saida.push('      linha ' + p.linhaPlanilha + ' (' + p.id + '), campo ' +
               p.campo + ': ' + p.motivo);
  }
  if (resp.totalProblemas > 20) {
    saida.push('      ... e mais ' + (resp.totalProblemas - 20) + '.');
  }
  return saida.join('\n');
}

function ehData_(valor) {
  return Object.prototype.toString.call(valor) === '[object Date]' &&
         !isNaN(valor.getTime());
}

/**
 * Converte para o texto de data que o banco espera: "AAAA-MM-DD HH:MM:SS".
 * Devolve '' quando não consegue — quem chama decide o que fazer com isso.
 */
function paraDataTexto_(valor, fuso) {
  if (valor === '' || valor === null || valor === undefined) return '';

  if (ehData_(valor)) {
    return Utilities.formatDate(valor, fuso, 'yyyy-MM-dd HH:mm:ss');
  }

  var texto = String(valor).trim();
  if (!texto) return '';

  // "30/07/2026" ou "30/07/2026 14:35" ou "30/07/2026 14:35:02"
  var br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(texto);
  if (br) {
    return doisDigitos_(br[3], 4) + '-' + doisDigitos_(br[2], 2) + '-' +
           doisDigitos_(br[1], 2) + ' ' + doisDigitos_(br[4] || 0, 2) + ':' +
           doisDigitos_(br[5] || 0, 2) + ':' + doisDigitos_(br[6] || 0, 2);
  }

  // Já veio em "AAAA-MM-DD" (com ou sem hora).
  var iso = /^(\d{4})-(\d{2})-(\d{2})(?:[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(texto);
  if (iso) {
    return iso[1] + '-' + iso[2] + '-' + iso[3] + ' ' +
           doisDigitos_(iso[4] || 0, 2) + ':' + doisDigitos_(iso[5] || 0, 2) + ':' +
           doisDigitos_(iso[6] || 0, 2);
  }

  return '';
}

/**
 * Como paraDataTexto_, mas quando não reconhece a data devolve o valor
 * original — assim o site consegue mostrar no relatório o que estava
 * escrito na célula, em vez de um campo misteriosamente vazio.
 */
function paraDataOuOriginal_(valor, fuso) {
  var convertida = paraDataTexto_(valor, fuso);
  if (convertida) return convertida;
  return paraTexto_(valor);
}

/**
 * Devolve o zero à esquerda que a planilha comeu, para os campos em que o
 * tamanho é fixo e conhecido. Se o valor já está certo, não muda nada.
 */
function restaurarZeros_(nomeCampo, texto) {
  if (!texto) return texto;
  // Só mexe quando é só dígito. Se tem hífen/barra, já veio formatado e
  // completo ("01310-100"), então não há zero perdido.
  if (!/^\d+$/.test(texto)) return texto;

  if (nomeCampo === 'CEP' && RESTAURAR_ZEROS_PERDIDOS) {
    if (texto.length < 8 && texto.length >= 5) return zerosAEsquerda_(texto, 8);
  }

  if (nomeCampo === 'CNPJDonataria' && RESTAURAR_ZEROS_PERDIDOS) {
    // 12 ou 13 dígitos só pode ser CNPJ encurtado. 11 fica quieto: pode ser
    // um CPF legítimo.
    if (texto.length === 12 || texto.length === 13) return zerosAEsquerda_(texto, 14);
  }

  if (nomeCampo === 'Renavam' && RESTAURAR_ZERO_DO_RENAVAM) {
    if (texto.length < 11 && texto.length >= 9) return zerosAEsquerda_(texto, 11);
  }

  return texto;
}

function zerosAEsquerda_(texto, tamanho) {
  var saida = String(texto);
  while (saida.length < tamanho) saida = '0' + saida;
  return saida;
}

/**
 * Converte o valor do veículo para um número simples ("196950.5").
 *
 * Aceita as duas formas que existem na planilha: número de verdade, e texto
 * no padrão brasileiro ("196.950,00"). É a mesma regra que o sistema atual
 * usa em normalizarValorMonetario_ — assim o valor que entra no banco é
 * exatamente o que as telas de hoje já mostram.
 */
function paraDinheiro_(valor) {
  if (valor === '' || valor === null || valor === undefined) return '';
  if (typeof valor === 'number') return String(valor);

  var texto = String(valor).trim();
  if (!texto) return '';

  // Tira "R$", espaços e qualquer outro enfeite; o ponto vira separador de
  // milhar (sai) e a vírgula vira separador decimal (vira ponto).
  var limpo = texto.replace(/\./g, '').replace(',', '.').replace(/[^\d.\-]/g, '');
  if (!limpo || isNaN(parseFloat(limpo))) return texto; // deixa o site reclamar
  return String(parseFloat(limpo));
}

function doisDigitos_(valor, casas) {
  var texto = String(valor);
  while (texto.length < casas) texto = '0' + texto;
  return texto;
}

/**
 * Texto limpo de uma célula. Números viram texto sem notação científica e
 * sem separador de milhar — senão um RENAVAM guardado como número viraria
 * "1.326.606.414" ou "1.3266e+9" no banco.
 */
function paraTexto_(valor) {
  if (valor === null || valor === undefined) return '';
  if (ehData_(valor)) return Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  if (typeof valor === 'number') {
    if (Math.floor(valor) === valor && Math.abs(valor) < 1e15) return String(valor);
    return String(valor);
  }
  if (typeof valor === 'boolean') return valor ? 'SIM' : 'NÃO';
  return String(valor).trim();
}

/**
 * Mostra o relatório. Aparece sempre no "Registro de execução" (embaixo do
 * editor) e, quando dá, também numa janelinha na planilha.
 */
function mostrar_(texto) {
  Logger.log(texto);
  try {
    SpreadsheetApp.getUi().alert(texto.length > 1400 ? texto.substring(0, 1400) +
      '\n\n[...] veja o restante no "Registro de execução", embaixo do editor.' : texto);
  } catch (e) {
    // Rodando pelo editor sem a planilha aberta: o registro já basta.
  }
}
