
// ======================================================================
// PASSIVO VEICULAR — Aba Veículos
// Banco separado (planilha própria, fora da planilha de Doações) para
// permitir no futuro compartilhamento de Drive independente entre os dois
// painéis. Login/perfis continuam sendo os mesmos (Usuarios fica na
// planilha de Doações, que é a planilha à qual este projeto está vinculado)
// — só os dados de veículos do passivo ficam na planilha separada.
// ======================================================================

var PROP_PV_SPREADSHEET_ID = 'PV_SPREADSHEET_ID';

var SHEET_PV_VEICULOS = 'Veiculos';

// Sempre adicione campos novos SÓ NO FINAL desta lista. A planilha do
// Passivo já existente não reescreve o cabeçalho sozinha quando esse array
// muda — inserir um campo no meio desalinha a leitura de todas as linhas
// já gravadas (ver corrigirCabecalhoVeiculosPassivo_, que existe
// justamente pra consertar isso quando acontece de novo).
var CABECALHO_PV_VEICULOS = [
  'ID', 'DataCadastro',
  'Marca', 'Modelo', 'Placa', 'Chassi', 'Renavam', 'AnoFabricacao', 'AnoModelo',
  // CNPJProprietario: quem ainda consta como dono no DETRAN (normalmente a
  // União/o ente doador) — a doação em si não transfere o registro no
  // DETRAN, só a posse; enquanto isso não é feito, o veículo é "passivo".
  // SituacaoDetran: texto livre copiado da consulta ao DETRAN (ex.: "EM
  // CIRCULAÇÃO COMUNICADO VENDA") — informativo, não confundir com
  // SituacaoTransferencia, que é o status de workflow controlado por nós.
  'CNPJProprietario', 'SituacaoDetran', 'SituacaoTransferencia',
  'UF', 'Municipio', 'Instituicao', 'CNPJInstituicao', 'DataDoacao', 'NumeroTermoDoacao',
  'Observacoes', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor'
];

var PV_SITUACOES_TRANSFERENCIA = ['PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDA'];

// ---- Débitos > Infrações ----
var SHEET_PV_INFRACOES = 'Infracoes';
var SHEET_PV_INFRACOES_ENVIOS = 'InfracoesEnvios';
// Tabela de referência Artigo (CTB) → Código de enquadramento — fica numa
// aba própria, editável direto na planilha por um administrador (não é
// preciso mexer em código pra corrigir ou completar). O cadastro de
// infração usa ela só pra sugerir/preencher automaticamente; o campo
// Código continua digitável, então nada fica travado nessa lista.
var SHEET_PV_TABELA_INFRACOES = 'TabelaInfracoes';
// Órgãos autuadores — igual à de cima, editável na planilha. Federais
// (DNIT, PRF) valem pra qualquer UF (linha com UF em branco); estaduais
// são por UF; municipais não entram aqui — ficam sempre como texto livre
// no cadastro, porque variam demais por prefeitura.
var SHEET_PV_ORGAOS_AUTUADORES = 'OrgaosAutuadores';

var CABECALHO_PV_INFRACOES = [
  'ID', 'DataCadastro',
  'Placa', 'OrgaoAutuador', 'AIT', 'Artigo', 'Codigo', 'DescricaoInfracao',
  'DataInfracao', 'StatusCancelamento',
  'Observacoes', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor'
];

// Um envio de pedido de cancelamento por linha (não um contador único) —
// assim dá pra mostrar "2ª via enviada em 12/03/2025" e sinalizar "sem
// resposta" automaticamente com base na data do envio mais recente.
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
  }
  return sheet;
}

// Conserta o cabeçalho (linha 1) da aba Veiculos quando ele ficou
// desatualizado em relação a CABECALHO_PV_VEICULOS — aconteceu quando um
// campo novo (AnoModelo, CNPJProprietario, SituacaoDetran, Municipio) foi
// inserido no meio do array em vez de só no final, e a planilha já criada
// antes disso continuou com os rótulos antigos na linha 1 enquanto os
// dados novos (import do DF) já eram gravados nas posições novas —
// resultado: leitura por nome de coluna vinha toda embaralhada (ex.: "UF"
// mostrando o texto de "Situação DETRAN"). Só reescreve os RÓTULOS da
// linha 1; não toca em nenhuma linha de dado — por isso é seguro rodar
// de novo sempre que a estrutura for atualizada (é chamada automaticamente
// dentro de criarEstruturaPassivoVeicular).
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
// criar a planilha do Passivo Veicular — separada da planilha de Doações,
// com compartilhamento de Drive próprio. Pode rodar de novo sem problema:
// se a planilha já existe, só garante que a aba/cabeçalho estão certos.
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

function pvProximoId_() {
  var props = PropertiesService.getScriptProperties();
  var seq = Number(props.getProperty('PV_SEQ_VEICULO') || '0');
  seq += 1;
  props.setProperty('PV_SEQ_VEICULO', String(seq));
  return 'PV-' + ('000000' + seq).slice(-6);
}

function pvValidarComuns_(dados) {
  if (!dados.uf) throw new Error('Informe a UF.');
  if (!dados.instituicao) throw new Error('Informe a instituição (donatária).');
  if (!dados.dataDoacao) throw new Error('Informe a data ou ano da doação.');
  if (!dados.numeroTermoDoacao) throw new Error('Informe o número do termo de doação.');
}

function pvValidarVeiculo_(dados) {
  if (!dados.marca) throw new Error('Informe a marca do veículo.');
  if (!dados.modelo) throw new Error('Informe o modelo do veículo.');
  if (!validarPlaca_(normalizarPlaca_(dados.placa))) throw new Error('Placa inválida: ' + dados.placa);
  if (!validarChassi_(normalizarChassi_(dados.chassi))) throw new Error('Chassi inválido: ' + dados.chassi);
  if (!validarRenavam_(dados.renavam)) throw new Error('Renavam inválido: ' + dados.renavam);
  if (!dados.anoFabricacao) throw new Error('Informe o ano de fabricação.');
}

function pvMontarRegistro_(dados, autor, existente) {
  var agora = new Date();
  return {
    ID: existente ? existente.ID : pvProximoId_(),
    DataCadastro: existente ? existente.DataCadastro : agora,
    Marca: normalizarMarca_(dados.marca),
    Modelo: normalizarTexto_(dados.modelo),
    Placa: normalizarPlaca_(dados.placa),
    Chassi: normalizarChassi_(dados.chassi),
    Renavam: normalizarTexto_(dados.renavam),
    AnoFabricacao: Number(dados.anoFabricacao) || dados.anoFabricacao,
    // Sem ano de modelo informado à parte, assume igual ao de fabricação
    // (a imensa maioria dos veículos não tem essa distinção relevante).
    AnoModelo: Number(dados.anoModelo) || Number(dados.anoFabricacao) || dados.anoFabricacao,
    CNPJProprietario: normalizarCnpjCpf_(dados.cnpjProprietario),
    SituacaoDetran: normalizarTexto_(dados.situacaoDetran),
    SituacaoTransferencia: dados.situacaoTransferencia || PV_SITUACOES_TRANSFERENCIA[0],
    UF: normalizarUF_(dados.uf),
    Municipio: normalizarTexto_(dados.municipio),
    Instituicao: normalizarTexto_(dados.instituicao),
    CNPJInstituicao: normalizarCnpjCpf_(dados.cnpjInstituicao),
    DataDoacao: normalizarTexto_(dados.dataDoacao),
    NumeroTermoDoacao: normalizarTexto_(dados.numeroTermoDoacao),
    Observacoes: normalizarTexto_(dados.observacoes),
    CadastradoPor: existente ? existente.CadastradoPor : autor,
    UltimaAtualizacao: agora,
    AtualizadoPor: autor
  };
}

function getListasPassivo() {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  return {
    uf: UFS_VALIDAS.concat(CODIGOS_ORGAO_FEDERAL),
    situacoes: PV_SITUACOES_TRANSFERENCIA
  };
}

function cadastrarVeiculoPassivo(dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarComuns_(dados);
  pvValidarVeiculo_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var registro = pvMontarRegistro_(dados, perfil.email);
  sheet.appendRow(CABECALHO_PV_VEICULOS.map(function (campo) { return registro[campo]; }));
  return { ok: true, id: registro.ID };
}

// dadosComuns: {uf, municipio, instituicao, cnpjInstituicao, dataDoacao, numeroTermoDoacao}
// veiculos: [{marca, modelo, placa, chassi, renavam, anoFabricacao, anoModelo, cnpjProprietario, situacaoDetran, situacaoTransferencia}, ...]
function cadastrarVeiculosPassivoLote(dadosComuns, veiculos) {
  var perfil = exigirPerfilEditor_();
  pvValidarComuns_(dadosComuns);
  if (!veiculos || !veiculos.length) throw new Error('Informe ao menos um veículo.');
  veiculos.forEach(pvValidarVeiculo_);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var linhas = veiculos.map(function (v) {
    var dados = {};
    Object.keys(dadosComuns).forEach(function (k) { dados[k] = dadosComuns[k]; });
    Object.keys(v).forEach(function (k) { dados[k] = v[k]; });
    var registro = pvMontarRegistro_(dados, perfil.email);
    return CABECALHO_PV_VEICULOS.map(function (campo) { return registro[campo]; });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, linhas.length, CABECALHO_PV_VEICULOS.length).setValues(linhas);
  return { ok: true, quantidade: linhas.length };
}

function listarVeiculosPassivo(filtros) {
  filtros = filtros || {};
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var busca = filtros.busca ? normalizarTexto_(filtros.busca).toUpperCase() : '';
  var resultado = [];

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);

    if (filtros.uf && registro.UF !== filtros.uf) continue;
    if (filtros.instituicao && registro.Instituicao !== filtros.instituicao) continue;
    if (filtros.situacao && registro.SituacaoTransferencia !== filtros.situacao) continue;
    if (busca) {
      var alvo = [registro.Placa, registro.Chassi, String(registro.Renavam), registro.Marca, registro.Modelo, registro.Instituicao, registro.NumeroTermoDoacao].join(' ').toUpperCase();
      if (alvo.indexOf(busca) === -1) continue;
    }

    // Datas viram texto simples antes de voltar ao cliente — evita o bug já
    // visto no google.script.run que devolve null pra listas grandes com
    // muitos objetos Date (ver histórico do painel de Doações).
    registro.DataCadastro = registro.DataCadastro ? Utilities.formatDate(new Date(registro.DataCadastro), 'GMT-3', 'dd/MM/yyyy') : '';
    registro.UltimaAtualizacao = registro.UltimaAtualizacao ? Utilities.formatDate(new Date(registro.UltimaAtualizacao), 'GMT-3', 'dd/MM/yyyy HH:mm') : '';
    resultado.push(registro);
  }

  resultado.sort(function (a, b) { return String(b.ID).localeCompare(String(a.ID)); });
  return resultado;
}

// Usado no cadastro de infração — devolve null (em vez de lançar erro)
// quando a placa ainda não está cadastrada na Aba Veículos, porque uma
// infração pode ser cadastrada antes do veículo em si estar completo.
function buscarVeiculoPassivoPorPlaca(placa) {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var placaNormalizada = normalizarPlaca_(placa);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxPlaca = cabecalho.indexOf('Placa');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxPlaca] === placaNormalizada) {
      var registro = linhaParaObjeto_(cabecalho, valores[i]);
      return { Marca: registro.Marca, Modelo: registro.Modelo, Chassi: registro.Chassi, Renavam: registro.Renavam, UF: registro.UF };
    }
  }
  return null;
}

function getPainelPassivo(filtros) {
  var lista = listarVeiculosPassivo(filtros);
  var painel = { total: lista.length, porSituacao: {}, porUF: {}, porInstituicao: {} };
  PV_SITUACOES_TRANSFERENCIA.forEach(function (s) { painel.porSituacao[s] = 0; });
  lista.forEach(function (v) {
    painel.porSituacao[v.SituacaoTransferencia] = (painel.porSituacao[v.SituacaoTransferencia] || 0) + 1;
    if (v.UF) painel.porUF[v.UF] = (painel.porUF[v.UF] || 0) + 1;
    if (v.Instituicao) painel.porInstituicao[v.Instituicao] = (painel.porInstituicao[v.Instituicao] || 0) + 1;
  });
  return painel;
}

function atualizarVeiculoPassivo(id, dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarComuns_(dados);
  pvValidarVeiculo_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      var existente = linhaParaObjeto_(cabecalho, valores[i]);
      var registro = pvMontarRegistro_(dados, perfil.email, existente);
      var linha = CABECALHO_PV_VEICULOS.map(function (campo) { return registro[campo]; });
      sheet.getRange(i + 1, 1, 1, CABECALHO_PV_VEICULOS.length).setValues([linha]);
      return { ok: true };
    }
  }
  throw new Error('Veículo não encontrado.');
}

function excluirVeiculoPassivo(id) {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var idxId = CABECALHO_PV_VEICULOS.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  throw new Error('Veículo não encontrado.');
}

// Importação única dos veículos do Distrito Federal, a partir da planilha
// "DISTRITO_FEDERAL.xlsx" (aba "SIMPLIFICADA") enviada pelo usuário —
// Marca/Modelo, Ano Fabricação/Modelo, CNPJ Proprietário, Situação DETRAN,
// Município e Instituição (resolvida a partir do CNPJ Origem/Possuidor,
// cruzado com ORGAOS_POR_UF['DF']) já vêm prontos. Data e número do termo
// de doação NÃO vinham na planilha original (o campo "Processo SEI" da
// origem estava em branco) — ficam marcados "A CONFIRMAR" e devem ser
// completados depois, editando cada veículo pelo próprio painel.
// Rode uma vez pelo editor do Apps Script (ou pelo menu "Base de
// Veículos" na planilha de Doações) — já ignora veículos cuja placa já
// exista na planilha do Passivo, então pode rodar de novo sem duplicar.
function importarVeiculosPassivoDF_() {
  var perfil = exigirPerfilEditor_();
  var veiculosDF = [
    { marca: 'GM', modelo: 'ASTRA SEDAN ADVANTAGE', placa: 'JFP2161', chassi: '9BGTR69W07B237917', renavam: '923894314', anoFabricacao: 2007, anoModelo: 2007, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'GM', modelo: 'BLAZER ADVANTAGE', placa: 'JJE4261', chassi: '9BG116GU07C422762', renavam: '927218291', anoFabricacao: 2007, anoModelo: 2007, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'MMC', modelo: 'L200 TRITON 3.2 D', placa: 'OVQ0953', chassi: '93XJNKB8TDCD69648', renavam: '595870511', anoFabricacao: 2013, anoModelo: 2013, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'MMC', modelo: 'L200 TRITON 3.2 D', placa: 'OVQ0963', chassi: '93XJNKB8TDCD69967', renavam: '595878571', anoFabricacao: 2013, anoModelo: 2013, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'MMC', modelo: 'L200 TRITON 3.2 D', placa: 'OVQ0973', chassi: '93XJNKB8TDCD69873', renavam: '595882030', anoFabricacao: 2013, anoModelo: 2013, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'MMC', modelo: 'L200 TRITON 3.2 D', placa: 'OVQ0983', chassi: '93XJNKB8TDCD69930', renavam: '595885560', anoFabricacao: 2013, anoModelo: 2013, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7556', chassi: '9BG148FK0GC400919', renavam: '1094496437', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7557', chassi: '9BG148FK0GC400623', renavam: '1094544040', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7558', chassi: '9BG148FK0GC414659', renavam: '1094496046', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7559', chassi: '9BG148FK0GC416863', renavam: '1094475120', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7560', chassi: '9BG148FK0GC400989', renavam: '1094495805', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7561', chassi: '9BG148FK0GC414776', renavam: '1094513234', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS8002', chassi: '9BG148FK0GC401045', renavam: '1094488396', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9063', chassi: '8AFAR23L0JJ047092', renavam: '1139257312', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9064', chassi: '8AFAR23L1JJ039437', renavam: '1139257347', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9068', chassi: '8AFAR23L1JJ042483', renavam: '1139257444', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9067', chassi: '8AFAR23L3JJ037768', renavam: '1139257428', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9062', chassi: '8AFAR23L5JJ047119', renavam: '1139257266', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9056', chassi: '8AFAR23L3JJ050908', renavam: '1139257185', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9055', chassi: '8AFAR23L4JJ047113', renavam: '1139257169', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9060', chassi: '8AFAR23L0JJ045133', renavam: '1139257231', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9065', chassi: '8AFAR23L2JJ054299', renavam: '1139257363', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9058', chassi: '8AFAR23L5JJ048819', renavam: '1139257207', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' }
  ];

  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var idxPlaca = CABECALHO_PV_VEICULOS.indexOf('Placa');
  var placasExistentes = {};
  for (var i = 1; i < valores.length; i++) {
    placasExistentes[valores[i][idxPlaca]] = true;
  }

  var observacaoImportacao = 'Importado da planilha "Bens Doados (PAN 2007 / Legado 2016) - DF" em ' +
    Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy') + '.';
  var linhas = [];
  var ignorados = [];
  veiculosDF.forEach(function (v) {
    var placaNormalizada = normalizarPlaca_(v.placa);
    if (placasExistentes[placaNormalizada]) {
      ignorados.push(v.placa);
      return;
    }
    pvValidarVeiculo_(v);
    var dados = {
      marca: v.marca, modelo: v.modelo, placa: v.placa, chassi: v.chassi, renavam: v.renavam,
      anoFabricacao: v.anoFabricacao, anoModelo: v.anoModelo,
      cnpjProprietario: v.cnpjProprietario, situacaoDetran: v.situacaoDetran,
      situacaoTransferencia: PV_SITUACOES_TRANSFERENCIA[0],
      uf: 'DF', municipio: v.municipio, instituicao: v.instituicao, cnpjInstituicao: v.cnpjInstituicao,
      dataDoacao: 'A CONFIRMAR', numeroTermoDoacao: 'A CONFIRMAR',
      observacoes: observacaoImportacao
    };
    var registro = pvMontarRegistro_(dados, perfil.email);
    linhas.push(CABECALHO_PV_VEICULOS.map(function (campo) { return registro[campo]; }));
  });

  if (linhas.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, linhas.length, CABECALHO_PV_VEICULOS.length).setValues(linhas);
  }

  var mensagem = 'Importação do DF concluída: ' + linhas.length + ' veículo(s) novo(s) cadastrado(s).' +
    (ignorados.length ? ' ' + ignorados.length + ' já existiam (placa já cadastrada) e foram ignorados: ' + ignorados.join(', ') + '.' : '') +
    ' Data e número do termo de doação ficaram como "A CONFIRMAR" — ajuste em cada veículo pela tela Veículos > clique na linha > Editar.';
  Logger.log(mensagem);
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Importação Passivo Veicular - DF', 20);
  } catch (e) {
    // Rodando sem UI ativa — sem problema, a mensagem já foi gravada no Logger acima.
  }
  return mensagem;
}
