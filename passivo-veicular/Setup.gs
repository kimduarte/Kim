/**
 * Setup.gs
 * Estrutura da planilha própria do Passivo Veicular (separada da planilha
 * de Doações) — nomes de abas/cabeçalhos e a função que cria/repara tudo.
 *
 * Para reaproveitar a planilha do Passivo Veicular que já existe hoje (com
 * todos os veículos e infrações já cadastrados): antes de rodar
 * criarEstruturaPassivoVeicular(), abra Configurações do projeto >
 * Propriedades do script e crie a propriedade "PV_SPREADSHEET_ID" com o ID
 * dessa planilha (mesmo valor salvo na Script Property de mesmo nome no
 * projeto original). Se preferir começar do zero, não crie a propriedade —
 * a função cria uma planilha nova vazia e salva o ID sozinha.
 */

var PROP_PV_SPREADSHEET_ID = 'PV_SPREADSHEET_ID';

var SHEET_PV_VEICULOS = 'Veiculos';

// Sempre adicione campos novos SÓ NO FINAL desta lista — inserir um campo
// no meio desalinha a leitura das linhas já gravadas (ver
// corrigirCabecalhoVeiculosPassivo_).
var CABECALHO_PV_VEICULOS = [
  'ID', 'DataCadastro',
  'Marca', 'Modelo', 'Placa', 'Chassi', 'Renavam', 'AnoFabricacao', 'AnoModelo',
  'CNPJProprietario', 'SituacaoDetran', 'SituacaoTransferencia',
  'UF', 'Municipio', 'Instituicao', 'CNPJInstituicao', 'DataDoacao', 'NumeroTermoDoacao',
  'Observacoes', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor',
  'Excluido', 'ExcluidoPor', 'DataExclusao'
];

var PV_SITUACOES_TRANSFERENCIA = ['PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDA'];

// ---- Débitos > Infrações ----
var SHEET_PV_INFRACOES = 'Infracoes';
var SHEET_PV_INFRACOES_ENVIOS = 'InfracoesEnvios';
var SHEET_PV_TABELA_INFRACOES = 'TabelaInfracoes';
var SHEET_PV_ORGAOS_AUTUADORES = 'OrgaosAutuadores';

var CABECALHO_PV_INFRACOES = [
  'ID', 'DataCadastro',
  'Placa', 'OrgaoAutuador', 'AIT', 'Artigo', 'Codigo', 'DescricaoInfracao',
  'DataInfracao', 'StatusCancelamento',
  'Observacoes', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor'
];

var CABECALHO_PV_INFRACOES_ENVIOS = ['ID', 'IdInfracao', 'DataEnvio', 'RegistradoPor', 'Observacoes'];

var CABECALHO_PV_TABELA_INFRACOES = ['Artigo', 'Descricao', 'Codigo', 'Gravidade'];

var CABECALHO_PV_ORGAOS_AUTUADORES = ['UF', 'Orgao', 'Tipo'];

var PV_STATUS_CANCELAMENTO = ['PENDENTE', 'ENVIADO', 'RECEBIDO', 'CANCELADA', 'NEGADA'];

// Depois de quantos dias sem mudar de status (ainda ENVIADO) o painel
// sinaliza "sem resposta" — só um alerta visual, não bloqueia nada.
var PV_DIAS_SEM_RESPOSTA = 60;

function getSpreadsheetPassivo_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_PV_SPREADSHEET_ID);
  if (!id) {
    throw new Error('A planilha do Passivo Veicular ainda não foi criada. Peça a um administrador para abrir o editor do Apps Script, selecionar a função "criarEstruturaPassivoVeicular" e clicar em Executar.');
  }
  return SpreadsheetApp.openById(id);
}

function getOrCreateSheetPassivo_(nome, cabecalho) {
  var ss = getSpreadsheetPassivo_();
  var sheet = ss.getSheetByName(nome);
  if (!sheet) {
    sheet = ss.insertSheet(nome);
  }
  if (cabecalho && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#1451B4').setFontColor('#ffffff');
  } else if (nome === SHEET_PV_VEICULOS) {
    corrigirCabecalhoVeiculosPassivo_(sheet);
  }
  return sheet;
}

// Conserta o cabeçalho (linha 1) da aba Veiculos quando ele ficou
// desatualizado em relação a CABECALHO_PV_VEICULOS. Só reescreve os
// RÓTULOS da linha 1; não toca em nenhuma linha de dado — por isso é
// seguro rodar de novo sempre que a estrutura for atualizada (é chamada
// automaticamente dentro de criarEstruturaPassivoVeicular).
function corrigirCabecalhoVeiculosPassivo_(sheet) {
  var cabecalhoAtual = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), CABECALHO_PV_VEICULOS.length)).getValues()[0];
  var jaCorreto = CABECALHO_PV_VEICULOS.every(function (campo, i) { return cabecalhoAtual[i] === campo; });
  if (jaCorreto) return;
  sheet.getRange(1, 1, 1, CABECALHO_PV_VEICULOS.length).setValues([CABECALHO_PV_VEICULOS]);
  sheet.getRange(1, 1, 1, CABECALHO_PV_VEICULOS.length).setFontWeight('bold').setBackground('#1451B4').setFontColor('#ffffff');
  Logger.log('Cabeçalho da aba Veiculos (Passivo Veicular) corrigido.');
}

// Rode esta função uma vez pelo editor do Apps Script (selecione ela no
// menu de funções, ao lado do botão "Executar", e clique em Executar) pra
// criar/reparar a planilha do Passivo Veicular. Pode rodar de novo sem
// problema: se a planilha já existe (property PV_SPREADSHEET_ID já
// configurada), só garante que as abas/cabeçalhos estão certos.
function criarEstruturaPassivoVeicular() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_PV_SPREADSHEET_ID);
  var ss = null;
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (e) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('Passivo Veicular - SGP/COLOG');
    props.setProperty(PROP_PV_SPREADSHEET_ID, ss.getId());
  }
  var sheet = ss.getSheetByName(SHEET_PV_VEICULOS) || ss.insertSheet(SHEET_PV_VEICULOS);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, CABECALHO_PV_VEICULOS.length).setValues([CABECALHO_PV_VEICULOS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CABECALHO_PV_VEICULOS.length).setFontWeight('bold').setBackground('#1451B4').setFontColor('#ffffff');
    sheet.setColumnWidths(1, CABECALHO_PV_VEICULOS.length, 130);
  } else {
    corrigirCabecalhoVeiculosPassivo_(sheet);
  }

  [
    [SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES],
    [SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS],
    [SHEET_PV_TABELA_INFRACOES, CABECALHO_PV_TABELA_INFRACOES],
    [SHEET_PV_ORGAOS_AUTUADORES, CABECALHO_PV_ORGAOS_AUTUADORES]
  ].forEach(function (par) {
    var nomeAba = par[0], cabecalhoAba = par[1];
    var abaNova = ss.getSheetByName(nomeAba) || ss.insertSheet(nomeAba);
    if (abaNova.getLastRow() === 0) {
      abaNova.getRange(1, 1, 1, cabecalhoAba.length).setValues([cabecalhoAba]);
      abaNova.setFrozenRows(1);
      abaNova.getRange(1, 1, 1, cabecalhoAba.length).setFontWeight('bold').setBackground('#1451B4').setFontColor('#ffffff');
    }
  });
  pvFormatarColunaComoTexto_(ss.getSheetByName(SHEET_PV_INFRACOES), CABECALHO_PV_INFRACOES, 'Codigo');
  pvSeedTabelaInfracoesSeVazia_(ss);
  pvSeedOrgaosAutuadoresSeVazia_(ss);

  var abaPadrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1');
  if (abaPadrao && ss.getSheets().length > 1) {
    ss.deleteSheet(abaPadrao);
  }
  Logger.log('Planilha do Passivo Veicular pronta: ' + ss.getUrl());
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Planilha do Passivo Veicular pronta. Abra: ' + ss.getUrl(), 'Passivo Veicular', 15);
  } catch (e) {
    // Rodando sem UI ativa (ex.: direto pelo editor de scripts) — sem problema, a URL já foi gravada no Logger acima.
  }
  return ss.getUrl();
}

// Sheets converte sozinho valores tipo "5037-1" (código-desdobramento) pra
// data — mesmo escrevendo pela API. Trava a coluna inteira como texto puro
// ANTES de gravar; sem isso, o valor vira data e a leitura de volta traz um
// objeto Date em vez do código de verdade.
function pvFormatarColunaComoTexto_(sheet, cabecalho, nomeColuna) {
  if (!sheet) return;
  var idx = cabecalho.indexOf(nomeColuna);
  if (idx === -1) return;
  sheet.getRange(1, idx + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
}

function pvSeedTabelaInfracoesSeVazia_(ss) {
  var sheet = ss.getSheetByName(SHEET_PV_TABELA_INFRACOES);
  if (!sheet || sheet.getLastRow() > 1) return;
  pvFormatarColunaComoTexto_(sheet, CABECALHO_PV_TABELA_INFRACOES, 'Codigo');
  var linhas = pvDadosRenainf_();
  sheet.getRange(2, 1, linhas.length, CABECALHO_PV_TABELA_INFRACOES.length).setValues(linhas);
}

// Rode pelo editor do Apps Script se a planilha do Passivo já foi criada
// ANTES da tabela RENAINF existir — substitui o conteúdo da aba
// TabelaInfracoes pela tabela oficial completa (258 códigos). Limpa as
// linhas antigas primeiro, então rode de novo só se quiser mesmo repor a
// tabela do zero (perde edições manuais feitas direto na planilha).
function atualizarTabelaInfracoesRenainf_() {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_TABELA_INFRACOES, CABECALHO_PV_TABELA_INFRACOES);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha > 1) {
    sheet.getRange(2, 1, ultimaLinha - 1, CABECALHO_PV_TABELA_INFRACOES.length).clearContent();
  }
  pvFormatarColunaComoTexto_(sheet, CABECALHO_PV_TABELA_INFRACOES, 'Codigo');
  var linhas = pvDadosRenainf_();
  sheet.getRange(2, 1, linhas.length, CABECALHO_PV_TABELA_INFRACOES.length).setValues(linhas);
  var mensagem = 'Tabela de infrações atualizada com ' + linhas.length + ' códigos oficiais (RENAINF).';
  Logger.log(mensagem);
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Passivo Veicular', 10);
  } catch (e) {
    // Rodando sem UI ativa — sem problema, a mensagem já foi gravada no Logger acima.
  }
  return mensagem;
}

function pvSeedOrgaosAutuadoresSeVazia_(ss) {
  var sheet = ss.getSheetByName(SHEET_PV_ORGAOS_AUTUADORES);
  if (!sheet || sheet.getLastRow() > 1) return;
  var linhas = [
    ['', 'DNIT', 'Federal'],
    ['', 'PRF', 'Federal']
  ];
  UFS_VALIDAS.forEach(function (uf) {
    linhas.push([uf, 'DETRAN-' + uf, 'Estadual']);
  });
  // Órgãos estaduais extras, além do DETRAN — confirmados a partir de casos
  // reais. Adicione mais linhas direto na planilha (aba OrgaosAutuadores)
  // conforme for precisando de outros estados — não precisa mexer em código.
  linhas.push(['DF', 'DER-DF', 'Estadual']);
  linhas.push(['SP', 'DER-SP', 'Estadual']);
  linhas.push(['RS', 'DER-RS', 'Estadual']);
  linhas.push(['GO', 'AGETOP-GO', 'Estadual']);
  sheet.getRange(2, 1, linhas.length, CABECALHO_PV_ORGAOS_AUTUADORES.length).setValues(linhas);
}
