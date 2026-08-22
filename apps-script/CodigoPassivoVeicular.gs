/**
 * CodigoPassivoVeicular.gs
 * Módulo de Passivo Veicular — cadastro de veículos, débitos/infrações e
 * a Lixeira própria desse módulo. Usa uma planilha própria (separada da
 * planilha de Doações), mas o login/perfis de usuário continuam sendo os
 * mesmos de CodigoDoacaoVeicular.gs (aba "Usuarios" fica na planilha de
 * Doações). Cole este arquivo junto com CodigoDoacaoVeicular.gs no mesmo
 * projeto do Apps Script — funções/variáveis dos dois arquivos enxergam
 * umas às outras normalmente, é tudo um único escopo global.
 */

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
  'Observacoes', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor',
  // Exclusão lógica (soft delete), no mesmo padrão da aba Veiculos de
  // doações — sempre adicionado no FINAL do array (nunca no meio: foi
  // exatamente inserir um campo no meio que corrompeu esse cabeçalho uma
  // vez antes, ver corrigirCabecalhoVeiculosPassivo_).
  'Excluido', 'ExcluidoPor', 'DataExclusao'
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
  } else if (nome === SHEET_PV_VEICULOS) {
    // Sheet já existente — garante que o cabeçalho tem os rótulos mais
    // recentes (ex.: campos de exclusão lógica adicionados depois), sem
    // depender de alguém rodar criarEstruturaPassivoVeicular() de novo.
    corrigirCabecalhoVeiculosPassivo_(sheet);
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

    // Excluído (lixeira) some das telas normais por padrão — mesmo padrão
    // da aba Veiculos de doações (ver listarVeiculos/getVeiculosExcluidos).
    if (registro.Excluido === 'SIM' && !filtros.incluirExcluidos) continue;

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
    registro.DataCadastro = registro.DataCadastro ? Utilities.formatDate(new Date(registro.DataCadastro), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
    registro.UltimaAtualizacao = registro.UltimaAtualizacao ? Utilities.formatDate(new Date(registro.UltimaAtualizacao), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : '';
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

// Exclusão lógica — mesmo padrão de excluirVeiculo() na aba de doações:
// nunca apaga a linha de verdade, só marca Excluido/ExcluidoPor/
// DataExclusao e some das telas normais (listarVeiculosPassivo filtra por
// padrão). Um administrador pode restaurar em "Lixeira".
function excluirVeiculoPassivo(id) {
  var perfil = exigirPerfilAdmin_();
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var idxId = CABECALHO_PV_VEICULOS.indexOf('ID');
  var idxExcluido = CABECALHO_PV_VEICULOS.indexOf('Excluido');
  var idxExcluidoPor = CABECALHO_PV_VEICULOS.indexOf('ExcluidoPor');
  var idxDataExclusao = CABECALHO_PV_VEICULOS.indexOf('DataExclusao');
  var valores = sheet.getDataRange().getValues();
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      if (valores[i][idxExcluido] === 'SIM') {
        return { mensagem: 'Esse veículo já estava na lixeira.' };
      }
      var agora = new Date();
      sheet.getRange(i + 1, idxExcluido + 1).setValue('SIM');
      sheet.getRange(i + 1, idxExcluidoPor + 1).setValue(perfil.email);
      sheet.getRange(i + 1, idxDataExclusao + 1).setValue(agora);
      return { mensagem: 'Veículo movido para a lixeira — um administrador pode restaurar em "Lixeira".' };
    }
  }
  throw new Error('Veículo não encontrado.');
}

// Tira o veículo da lixeira do Passivo Veicular — some da tela Lixeira e
// volta a aparecer normalmente no resto do painel.
function restaurarVeiculoPassivo(id) {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var idxId = CABECALHO_PV_VEICULOS.indexOf('ID');
  var idxExcluido = CABECALHO_PV_VEICULOS.indexOf('Excluido');
  var idxExcluidoPor = CABECALHO_PV_VEICULOS.indexOf('ExcluidoPor');
  var idxDataExclusao = CABECALHO_PV_VEICULOS.indexOf('DataExclusao');
  var valores = sheet.getDataRange().getValues();
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      sheet.getRange(i + 1, idxExcluido + 1).setValue('NÃO');
      sheet.getRange(i + 1, idxExcluidoPor + 1).setValue('');
      sheet.getRange(i + 1, idxDataExclusao + 1).setValue('');
      return { mensagem: 'Veículo restaurado com sucesso.' };
    }
  }
  throw new Error('Veículo não encontrado.');
}

// Lista da tela "Lixeira" do Passivo Veicular — só os veículos excluídos,
// mais recentes primeiro. Só administradores.
function getVeiculosExcluidosPassivo() {
  exigirPerfilAdmin_();
  var registros = listarVeiculosPassivo({ incluirExcluidos: true });
  return registros
    .filter(function (r) { return r.Excluido === 'SIM'; })
    .map(function (r) {
      return {
        ID: r.ID,
        Placa: r.Placa,
        Chassi: r.Chassi,
        Marca: r.Marca,
        Modelo: r.Modelo,
        Instituicao: r.Instituicao,
        UF: r.UF,
        ExcluidoPor: r.ExcluidoPor,
        DataExclusao: r.DataExclusao ? new Date(r.DataExclusao).getTime() : 0
      };
    })
    .sort(function (a, b) { return b.DataExclusao - a.DataExclusao; });
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
    Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy') + '.';
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

// ======================================================================
// PASSIVO VEICULAR — Aba Débitos > Infrações
// ======================================================================

// Sheets converte sozinho valores tipo "5037-1" (código-desdobramento) pra
// data (interpreta como ano 5037, mês 1) — mesmo escrevendo pela API, não
// só pela interface. Trava a coluna inteira como texto puro ANTES de
// gravar; sem isso, o valor vira data e a leitura de volta traz um objeto
// Date em vez do código de verdade.
function pvFormatarColunaComoTexto_(sheet, cabecalho, nomeColuna) {
  if (!sheet) return;
  var idx = cabecalho.indexOf(nomeColuna);
  if (idx === -1) return;
  sheet.getRange(1, idx + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
}

// Tabela oficial de códigos de infração (RENAINF), enviada pelo usuário —
// Código da Infração, Desdobramento (quando houver, já concatenado no
// Código como "código-desdobramento"), Descrição da Infração e Amparo
// Legal (artigo/inciso do CTB). Coluna Gravidade não veio nessa planilha
// de origem, por isso fica em branco (não estou inventando classificação
// que não veio da fonte oficial).
function pvDadosRenainf_() {
  return [
    ['257, § 8º', 'Multa, por não identificação do condutor infrator, imposta à pessoa jurídica', '5002', ''],
    ['162, I', 'Dirigir veículo sem possuir CNH ou Permissão para Dirigir', '5010', ''],
    ['162, II', 'Dirigir veículo com CNH ou PPD cassada', '5029-1', ''],
    ['162, II', 'Dirigir veículo com CNH ou PPD com suspensão do direito de dirigir', '5029-2', ''],
    ['162, III', 'Dirigir veículo com CNH de categoria diferente da do veículo e Dirigir veículo com CNH ou PPD com suspensão do direito de dirigir', '5037-1', ''],
    ['162, V', 'Dirigir veículo com validade de CNH/PPD vencida há mais de 30 dias', '5045', ''],
    ['162, VI', 'Dirigir veículo sem usar lentes corretoras de visão e Dirigir veículo sem usar aparelho auxiliar de audição e Dirigir veículo sem usar aparelho auxiliar de prótese física e Dirigir veículo s/ adaptações impostas na concessão/renovação licença conduzir', '5053-1', ''],
    ['163 c/c 162, I', 'Entregar veículo a pessoa sem CNH ou Permissão para Dirigir', '5061', ''],
    ['163 c/c 162, II', 'Entregar veículo a pessoa com CNH ou PPD cassada e Entregar veículo a pessoa com CNH ou PPD com suspensão do direito de dirigir', '5070-1', ''],
    ['163 c/c 162, III', 'Entregar veículo a pessoa com CNH de categoria diferente da do veículo e Entregar veículo a pessoa com PPD de categoria diferente da do veículo', '5088-1', ''],
    ['163 c/c 162, V', 'Entregar veículo a pessoa com CNH/PPD vencida há mais de 30 dias', '5096', ''],
    ['163 c/c 162, VI', 'Entregar o veículo a pessoa sem usar lentes corretoras de visão e Entregar o veículo a pessoa sem usar aparelho auxiliar de audição e Entregar o veículo a pessoa sem aparelho de prótese física e Entregar veíc pessoa s/ adaptações impostas concessão/renovação licença conduzir', '5100-1', ''],
    ['164 c/c 162, I', 'Permitir posse/condução do veículo a pessoa sem CNH ou PPD', '5118', ''],
    ['164 c/c 162, II', 'Permitir posse/condução do veículo a pessoa com CNH ou PPD cassada e Permitir posse/condução veíc pessoa com CNH/PPD c/ suspensão direito de dirigir', '5126-1', ''],
    ['164 c/c 162, III', 'Permitir posse/condução veíc a pessoa com CNH categoria diferente da do veículo e Permitir posse/condução veíc a pessoa com PPD categoria diferente da do veículo', '5134-1', ''],
    ['164 c/c 162, V', 'Permitir posse/condução do veíc a pessoa com CNH/PPD vencida há mais de 30 dias', '5142', ''],
    ['164 c/c 162, VI', 'Permitir posse/condução do veículo a pessoa sem usar lentes corretoras de visão e Permitir posse/condução do veículo a pessoa s/ usar aparelho auxiliar de audição e Permitir posse/condução do veículo a pessoa sem usar aparelho de prótese física e Permitir posse/cond veíc s/ adaptações impostas concessão/renovação licença cond', '5150-1', ''],
    ['165', 'Dirigir sob a influência de álcool e Dirigir sob a influência de qquer substância psicoativa que deter. Dependência', '5169-1', ''],
    ['166', 'Confiar/entregar veíc pess c/ estado físico/psíquico s/ condições dirigir segur', '5177', ''],
    ['167', 'Deixar o condutor de usar o cinto segurança e Deixar o passageiro de usar o cinto segurança', '5185-1', ''],
    ['168', 'Transportar criança sem observância das normas de segurança estabelecidas p/ CTB', '5193', ''],
    ['169', 'Dirigir sem atenção ou sem os cuidados indispensáveis à segurança', '5207', ''],
    ['170', 'Dirigir ameaçando os pedestres que estejam atravessando a via pública e Dirigir ameaçando os demais veículos', '5215-1', ''],
    ['171', 'Usar veículo para arremessar sobre os pedestres água ou detritos e Usar veículo para arremessar sobre os veículos água ou detritos', '5223-1', ''],
    ['172', 'Atirar do veículo objetos ou substâncias e Abandonar na via objetos ou substâncias', '5231-1', ''],
    ['173', 'Disputar corrida', '5240', ''],
    ['174', 'Promover na via competição sem permissão e Promover na via eventos organizados sem permissão e Promover na via exibição e demonstração de perícia em manobra de veículo s/perm', '5258-1', ''],
    ['174', 'Participar na via como condutor em competição sem permissão e Participar na via como condutor em eventos organizados sem permissão e Participar como condutor exib/demonst perícia em manobra de veic s/ permissão', '5266-1', ''],
    ['175', 'Utiliz veíc demonst/exibir manobra perigosa mediante arrancada brusca e Utiliz veíc dem/exibir manob perig med derrap/frenag c/desliz/arrast pneus', '5274-1', ''],
    ['176, I', 'Deixar o cond envolvido em acidente, de prestar ou providenciar socorro a vítima', '5282', ''],
    ['176, II', 'Deixar o cond envolvido em acid, de adotar provid p/ evitar perigo p/o trânsito', '5290', ''],
    ['176, III', 'Deixar o cond envolvido em acidente, de preservar local p/ trab policia/pericia', '5304', ''],
    ['176, IV', 'Deixar o cond envolvido em acid, de remover o veíc local qdo determ polic/agente', '5312', ''],
    ['176, V', 'Deixar o cond envolvido em acid, de identificar-se policial e prestar inf p/o BO', '5320', ''],
    ['177', 'Deixar o cond de prestar socorro vítima acid de trânsito, qdo solicit p/ agente', '5339', ''],
    ['178', 'Deixar o condutor envolvido em acidente s/ vítima, de remover o veículo do local', '5347', ''],
    ['179, I', 'Fazer ou deixar que se faça reparo em veíc, em rodovia e via de trânsito rápido', '5355', ''],
    ['179, II', 'Fazer/deixar que se faça reparo em veíc nas vias (q não rodovia/transito rapido)', '5363', ''],
    ['180', 'Ter seu veículo imobilizado na via por falta de combustível', '5371', ''],
    ['181, I', 'Estacionar nas esquinas e a menos de 5m do alinhamento da via transversal', '5380', ''],
    ['181, II', 'Estacionar afastado da guia da calçada (meio-fio) de 50cm a 1m', '5398', ''],
    ['181, III', 'Estacionar afastado da guia da calçada (meio-fio) a mais de 1m', '5401', ''],
    ['181, IV', 'Estacionar em desacordo com as posições estabelecidas no CTB', '5410', ''],
    ['181, V', 'Estacionar na pista de rolamento das estradas e Estacionar na pista de rolamento das rodovias e Estacionar na pista de rolamento das vias de trânsito rápido e Estacionar na pista de rolamento das vias dotadas de acostamento', '5428-1', ''],
    ['181, VI', 'Estacionar junto/sobre hidr de incêndio, reg de água/tampa de poço visit gal sub', '5436', ''],
    ['181, VII', 'Estacionar nos acostamentos', '5444', ''],
    ['181, VIII', 'Estacionar no passeio, Estacionar sobre faixa destinada a pedestre, Estacionar sobre ciclovia ou ciclofaixa, Estacionar nas ilhas ou refúgios, Estacionar ao lado ou sobre canteiro central/divisores de pista de rolamento, Estacionar ao lado ou sobre marcas de canalização, Estacionar ao lado ou sobre gramado ou jardim público', '5452-1', ''],
    ['181, IX', 'Estacionar em guia de calçada rebaixada destinada à entrada/saída de veículos', '5460', ''],
    ['181, X', 'Estacionar impedindo a movimentação de outro veículo', '5479', ''],
    ['181, XI', 'Estacionar ao lado de outro veículo em fila dupla', '5487', ''],
    ['181, XII', 'Estacionar na área de cruzamento de vias', '5495', ''],
    ['181, XIII', 'Estacionar no ponto de embarque/desembarque de passageiros transporte coletivo', '5509', ''],
    ['181, XIV', 'Estacionar nos viadutos, Estacionar nas pontes, Estacionar nos túneis', '5517-1', ''],
    ['181, XV', 'Estacionar na contramão de direção', '5525', ''],
    ['181, XVI', 'Estacionar aclive/declive ñ freado e sem calço segurança, PBT superior a 3500kg', '5533', ''],
    ['181, XVII', 'Estacionar em desacordo com a regulamentação especificada pela sinalização, estacionamento rotativo, ponto ou vaga de táxi, vaga de carga/descarga, vaga portador necessid especiais, vaga idoso, vaga de curta duração', '5541-1', ''],
    ['181, XVIII', 'Estacionar em local/horário proibido especificamente pela sinalização', '5550', ''],
    ['181, XIX', 'Estacionar local/horário de estacionamento e parada proibidos pela sinalização', '5568', ''],
    ['182, I', 'Parar nas esquinas e a menos 5m do bordo do alinhamento da via transversal', '5576', ''],
    ['182, II', 'Parar afastado da guia da calçada (meio-fio) de 50cm a 1m', '5584', ''],
    ['182, III', 'Parar afastado da guia da calçada (meio-fio) a mais de 1m', '5592', ''],
    ['182, IV', 'Parar em desacordo com as posições estabelecidas no CTB', '5606', ''],
    ['182, V', 'Parar na pista de rolamento das estradas, Parar na pista de rolamento das rodovias, Parar na pista de rolamento das vias de trânsito rápido, Parar na pista de rolamento das demais vias dotadas de acostamento', '5614-1', ''],
    ['182, VI', 'Parar no passeio, Parar sobre faixa destinada a pedestres, Parar nas ilhas ou refúgios, Parar nos canteiros centrais/divisores de pista de rolamento, Parar nas marcas de canalização', '5622-1', ''],
    ['182, VII', 'Parar na área de cruzamento de vias', '5630', ''],
    ['182, VIII', 'Parar nos viadutos, Parar nas pontes, Parar nos túneis', '5649-1', ''],
    ['182, IX', 'Parar na contramão de direção', '5657', ''],
    ['182, X', 'Parar em local/horário proibidos especificamente pela sinalização', '5665', ''],
    ['183', 'Parar sobre faixa de pedestres na mudança de sinal luminoso, e (fisc eletrônica)', '5673-1', ''],
    ['184, I', 'Transitar na faixa/pista da direita regul circulação exclusiva determ veículo', '5681', ''],
    ['184, II', 'Transitar na faixa/pista da esquerda regul circulação exclusiva determ veículo', '5690', ''],
    ['185, I', 'Deixar de conservar o veículo na faixa a ele destinada pela sinalização de regul', '5703', ''],
    ['185, II', 'Deixar de conservar nas faixas da direita o veículo lento e de maior porte', '5711', ''],
    ['186, I', 'Transitar pela contramão de direção em via com duplo sentido de circulação', '5720', ''],
    ['186, II', 'Transitar pela contramão de direção em via c/ sinalização de regul sentido único', '5738', ''],
    ['187, I', 'Transitar em local/horário não permitido pela regul estabelecida p/ autoridade, rodízio, caminhão', '5746-1', ''],
    ['188', 'Transitar ao lado de outro veículo, interrompendo ou perturbando o trânsito', '5762', ''],
    ['189', 'Deixar de dar passagem a veíc precedido de batedores devidamente identificados, Deixar de dar passagem a veíc socorro incêndio/salv serv urgência devid identif, Deixar de dar passagem a veíc de polícia em serviço de urgência devid identif, Deixar de dar passagem a veíc de operação e fiscalização de trânsito devid ident, Deixar de dar passagem a ambulância em serviço de urgência devid identificada', '5770-1', ''],
    ['190', 'Seguir veículo em serv urgência devid identific p/ alarme sonoro/ilum vermelha', '5789', ''],
    ['191', 'Forçar passagem entre veícs trans sent opostos na iminência realiz ultrapassagem', '5797', ''],
    ['192', 'Deixar guardar dist segurança lat/front entre seu veíc e demais e ao bordo pista', '5800', ''],
    ['193', 'Transitar com o veículo em calçadas, passeios, Transitar com o veículo em ciclovias, ciclofaixas - Transitar com o veículo em ajardinamentos, gramados, jardins públicos - Transitar com o veículo em canteiros centrais/divisores de pista de rolamento - Transitar com o veículo em ilhas, refúgios - Transitar com o veículo em marcas de canalização - Transitar com o veículo em acostamentos - Transitar com o veículo em passarelas', '5819-1', ''],
    ['194', 'Transitar em marcha ré, salvo na distância necessária a pequenas manobras', '5827', ''],
    ['195', 'Desobedecer às ordens emanadas da autorid compet de trânsito ou de seus agentes', '5835', ''],
    ['196', 'Deixar de indicar c/ antec, med gesto de braço/luz indicadora, início da marcha - Deixar de indicar c/ antec, med gesto de braço/luz indicadora, manobra de parar - Deixar de indicar c/ antec, med gesto de braço/luz indicadora, mudança direção - Deixar de indicar c/ antec, med gesto de braço/luz indicadora, mudança de faixa', '5843-1', ''],
    ['197', 'Deixar de deslocar c/antecedência veíc p/ faixa mais à esquerda qdo for manobrar - Deixar de deslocar c/antecedência veíc p/ faixa mais à direita qdo for manobrar', '5851-1', ''],
    ['198', 'Deixar de dar passagem pela esquerda quando solicitado', '5860', ''],
    ['199', 'Ultrapassar pela direita, salvo qdo veíc da frente der sinal p/ entrar esquerda', '5878', ''],
    ['200', 'Ultrap pela direita veíc transp colet/escolar parado para emb/desemb passageiros', '5886', ''],
    ['201', 'Deixar de guardar a distância lateral de 1,50m ao passar/ultrapassar bicicleta', '5894', ''],
    ['202, I', 'Ultrapassar pelo acostamento', '5908', ''],
    ['202, II', 'Ultrapassar em interseções - Ultrapassar em passagem de nível', '5916-1', ''],
    ['203, I', 'Ultrapassar pela contramão nas curvas sem visibilidade suficiente - Ultrapassar pela contramão nos aclives ou declives, sem visibilidade suficiente', '5924-1', ''],
    ['203, II', 'Ultrapassar pela contramão nas faixas de pedestre', '5932', ''],
    ['203, III', 'Ultrapassar pela contramão nas pontes - Ultrapassar pela contramão nos viadutos - Ultrapassar pela contramão nos túneis', '5940-1', ''],
    ['203, IV', 'Ultrapassar pela contramão veículo parado em fila junto sinal luminoso - Ultrapassar pela contramão veículo parado em fila junto a cancela/porteira - Ultrapassar pela contramão veículo parado em fila junto a cruzamento - Ultrapassar pela contramão veíc parado em fila junto qq impedimento à circulação', '5959-1', ''],
    ['203, V', 'Ultrapassar pela contramão linha de divisão de fluxos opostos, contínua amarela', '5967', ''],
    ['204', 'Deixar de parar no acostamento à direita, p/ cruzar pista ou entrar à esquerda', '5975', ''],
    ['205', 'Ultrapassar veículo em movimento que integre cortejo/desfile/formação militar', '5983', ''],
    ['206, I', 'Executar operação de retorno em locais proibidos pela sinalização', '5991', ''],
    ['206, II', 'Executar operação de retorno nas curvas - Executar operação de retorno nos aclives ou declives - Executar operação de retorno nas pontes - Executar operação de retorno nos viadutos - Executar operação de retorno nos túneis', '6009-1', ''],
    ['206, III', 'Executar operação de retorno passando por cima de calçada, passeio - Executar operação de retorno passando por cima de ilha, refúgio - Executar operação de retorno passando por cima de ajardinamento - Executar operação de retorno passando por cima de canteiro de divisor de pista - Executar operação de retorno passando por cima de faixa de pedestres - Executar operação de retorno passando por cima de faixa de veíc não motorizados', '6017-1', ''],
    ['206, IV', 'Executar retorno nas interseções, entrando na contramão da via transversal', '6025', ''],
    ['206, V', 'Executar retorno c/prejuízo da circulação/segurança ainda que em local permitido', '6033', ''],
    ['207', 'Executar operação de conversão à direita em local proibido pela sinalização - Executar operação de conversão à esquerda em local proibido pela sinalização', '6041-1', ''],
    ['208', 'Avançar o sinal vermelho do semáforo - Avançar o sinal de parada obrigatória - Avançar o sinal vermelho do semáforo - fiscalização eletrônica', '6050-1', ''],
    ['209', 'Transpor bloqueio viário com ou sem sinalização ou dispositivos auxiliares - Deixar de adentrar às áreas destinadas à pesagem de veículos - Evadir-se para não efetuar o pagamento do pedágio', '6068-1', ''],
    ['210', 'Transpor bloqueio viário policial', '6076', ''],
    ['211', 'Ultrapassar veículos motorizados em fila, parados em razão de sinal luminoso - Ultrapassar veículos motorizados em fila, parados em razão de cancela - Ultrapassar veíc motorizados em fila parados em razão de bloqueio viário parcial - Ultrapassar veículos motorizados em fila, parados em razão de qualquer obstáculo', '6084-1', ''],
    ['212', 'Deixar de parar o veículo antes de transpor linha férrea', '6092', ''],
    ['213, I', 'Deixar de parar sempre que a marcha for interceptada por agrupamento de pessoas', '6106', ''],
    ['213, II', 'Deixar de parar sempre que a marcha for interceptada por agrupamento de veículos', '6114', ''],
    ['214, I', 'Deixar de dar preferência a pedestre/veic ñ motorizado na faixa a ele destinada', '6122', ''],
    ['214, II', 'Deixar de dar preferência a pedestre/veic ñ mot que ñ haja concluído a travessia', '6130', ''],
    ['214, III', 'Deixar de dar preferência a pedestre port deficiência fís/criança/idoso/gestante', '6149', ''],
    ['214, IV', 'Deixar de dar preferência a pedestre/veic ñ mot qdo iniciada travessia s/sinaliz', '6157', ''],
    ['214, V', 'Deixar de dar preferência a pedestre/veic não mot atravessando a via transversal', '6165', ''],
    ['215, I, a', 'Deixar de dar preferência em interseção ñ sinaliz, a veíc circulando por rodovia - Deixar de dar preferência em interseção ñ sinaliz, veíc circulando por rotatória - Deixar de dar prefer em interseção não sinalizada, a veículo que vier da direita', '6173-1', ''],
    ['215, II', 'Deixar de dar preferência nas interseções com sinalização de Dê a Preferência', '6181', ''],
    ['216', 'Entrar/sair área lindeira sem precaução com a segurança de pedestres e veículos', '6190', ''],
    ['217', 'Entrar/sair de fila de veículos estacionados sem dar pref a pedestres/veículos', '6203', ''],
    ['219', 'Transitar em velocidade inferior à metade da máxima da via, salvo faixa direita', '6254', ''],
    ['220, I', 'Deixar de reduzir a veloc qdo se aproximar de passeata/aglomeração/desfile/etc', '6262', ''],
    ['220, II', 'Deixar de reduzir a veloc onde o trânsito esteja sendo controlado pelo agente', '6270', ''],
    ['220, III', 'Deixar de reduzir a velocidade do veículo ao aproximar-se da guia da calçada - Deixar de reduzir a velocidade do veículo ao aproximar-se do acostamento', '6289-1', ''],
    ['220, IV', 'Deixar de reduzir velocidade do veículo ao aproximar-se interseção ñ sinalizada', '6297', ''],
    ['220, V', 'Deixar reduzir velocidade nas vias rurais cuja faixa domínio não esteja cercada', '6300', ''],
    ['220, VI', 'Deixar de reduzir a velocidade nos trechos em curva de pequeno raio', '6319', ''],
    ['220, VII', 'Deixar de reduzir veloc ao aproximar local sinaliz advert de obras/trabalhadores', '6327', ''],
    ['220, VIII', 'Deixar de reduzir a velocidade sob chuva/neblina/cerração/ventos fortes', '6335', ''],
    ['220, IX', 'Deixar de reduzir a velocidade quando houver má visibilidade', '6343', ''],
    ['220, X', 'Deixar de reduzir veloc qdo pavimento se apresentar escorreg/defeituoso/avariado', '6351', ''],
    ['220, XI', 'Deixar de reduzir a velocidade à aproximação de animais na pista', '6360', ''],
    ['220, XII', 'Deixar de reduzir a velocidade de forma compatível com a segurança, em declive', '6378', ''],
    ['220, XIII', 'Deixar de reduzir veloc de forma compatível c/ segurança ao ultrapassar ciclista', '6386', ''],
    ['220, XIV', 'Deixar de reduzir a velocidade nas proximidades de escolas - Deixar de reduzir a velocidade nas proximidades de hospitais - Deixar de reduzir veloc na proxim estação embarque/desembarque passageiros - Deixar de reduzir veloc onde haja intensa movimentação de pedestres', '6394-1', ''],
    ['221', 'Portar no veículo placas de identificação em desacordo c/ especif/modelo Contran', '6408', ''],
    ['221, § único', 'Confec/distribuir/colocar veíc próprio/terceiro placa identif desacordo Contran', '6416', ''],
    ['222', 'Deixar de manter ligado em emerg sist ilum vermelha intermitente ainda q parado', '6424', ''],
    ['223', 'Transitar com farol desregulado perturbando visão outro condutor - Transitar com o facho de luz alta perturbando visão outro condutor', '6432-1', ''],
    ['224', 'Fazer uso do facho de luz alta dos faróis em vias providas de iluminação pública', '6440', ''],
    ['225, I', 'Deixar de sinalizar via p/ tornar visível local qdo tiver remover veíc da pista - Deixar de sinalizar a via p/ tornar visível o local qdo permanecer acostamento', '6459-1', ''],
    ['225, II', 'Deixar de sinalizar a via p/ tornar visível o local qdo a carga for derramada', '6467', ''],
    ['226', 'Deixar de retirar qualquer objeto utilizado para sinalização temporária da via', '6475', ''],
    ['227, I', 'Usar buzina que não a de toque breve como advertência a pedestre ou condutores', '6483', ''],
    ['227, II', 'Usar buzina prolongada e sucessivamente a qualquer pretexto', '6491', ''],
    ['227, III', 'Usar buzina entre as vinte e duas e as seis horas', '6505', ''],
    ['227, IV', 'Usar buzina em locais e horários proibidos pela sinalização', '6513', ''],
    ['227, V', 'Usar buzina em desacordo c/ os padrões e freqüências estabelecidas pelo Contran', '6521', ''],
    ['228', 'Usar no veículo equip c/ som em volume/freqüência não autorizados pelo Contran', '6530', ''],
    ['229', 'Usar no veíc alarme/aparelho produz som perturbe sossego púb desac norma Contran', '6548', ''],
    ['230, I', 'Conduzir o veículo com o lacre de identificação violado/falsificado - Conduzir o veículo com a inscrição do chassi violada/falsificada - Conduzir o veículo com o selo violado/falsificado - Conduzir o veículo com a placa violada/falsificada - Conduzir o veículo com qualquer outro elem de identificação violado/falsificado', '6556-1', ''],
    ['230, II', 'Conduzir o veículo transportando passageiros em compartimento de carga', '6564', ''],
    ['230, III', 'Conduzir o veículo com dispositivo antirradar', '6572', ''],
    ['230, IV', 'Conduzir o veículo sem qualquer uma das placas de identificação', '6580', ''],
    ['230, V', 'Conduzir o veículo que não esteja registrado - Conduzir o veículo registrado que não esteja devidamente licenciado', '6599-1', ''],
    ['230, VI', 'Conduzir o veículo com qualquer uma das placas sem legibilidade e visibilidade', '6602', ''],
    ['230, VII', 'Conduzir o veículo com a cor alterada - Conduzir o veículo com característica alterada', '6610-1', ''],
    ['230, VIII', 'Conduzir veículo s/ ter sido submetido à inspeção seg veicular, qdo obrigatória', '6629', ''],
    ['230, IX', 'Conduzir o veículo sem equipamento obrigatório - Conduzir o veículo com equipamento obrigatório ineficiente/inoperante', '6637-1', ''],
    ['230, X', 'Conduzir o veículo com equip obrigatório em desacordo com o estab pelo Contran', '6645', ''],
    ['230, XI', 'Conduzir o veículo com descarga livre - Conduzir o veículo com silenciador de motor defeituoso/deficiente/inoperante', '6653-1', ''],
    ['230, XII', 'Conduzir o veículo com equipamento ou acessório proibido', '6661', ''],
    ['230, XIII', 'Conduzir o veículo c/ equip do sistema de iluminação e de sinalização alterados', '6670', ''],
    ['230, XIV', 'Conduzir veíc c/ registrador instan inalt de velocidade/tempo viciado/defeituoso', '6688', ''],
    ['230, XV', 'Conduzir c/ inscr/adesivo/legenda/símbolo afixado pára-brisa e extensão traseira - Conduzir c/ inscr/adesivo/legenda/símbolo pintado pára-brisa e extensão traseira', '6696-1', ''],
    ['230, XVI', 'Conduzir veíc com vidro total/parcialmente coberto por película, painéis/pintura', '6700', ''],
    ['230, XVII', 'Conduzir o veículo com cortinas ou persianas fechadas', '6718', ''],
    ['230, XVIII', 'Conduzir o veículo em mau estado de conservação, comprometendo a segurança - Conduzir o veículo reprovado na avaliação de inspeção de segurança - Conduzir o veículo reprovado na avaliação de emissão de poluentes e ruído', '6726-1', ''],
    ['230, XIX', 'Conduzir o veículo sem acionar o limpador de pára-brisa sob chuva', '6734', ''],
    ['230, XX', 'Conduzir o veículo sem portar a autorização para condução de escolares', '6742', ''],
    ['230, XXI', 'Conduzir o veíc de carga c/ falta inscrição da tara e demais previstas no CTB', '6750', ''],
    ['230, XXII', 'Conduzir o veículo com defeito no sistema de iluminação/lâmpada queimada - Conduzir o veículo com defeito no sistema de sinalização/lâmpada queimada', '6769-1', ''],
    ['231, I', 'Transitar com o veículo danificando a via, suas instalações e equipamentos', '6777', ''],
    ['231, II, a', 'Transitar com veículo derramando a carga que esteja transportando - Transitar com veículo lançando a carga que esteja transportando - Transitar com veículo arrastando a carga que esteja transportando', '6785-1', ''],
    ['231, II, b', 'Transitar com veíc derramando/lançando combustível/lubrif que esteja utilizando', '6793', ''],
    ['231, II, c', 'Transitar c/veíc derraman/lançando/arrastando objeto possa acarretar risco acid', '6807', ''],
    ['231, III', 'Transitar com veículo produzindo fumaça, gases ou partículas em desac c/ Contran', '6815', ''],
    ['231, IV', 'Transitar c/ veíc e/ou carga c/ dimensões superiores limite legal s/ autorização - Transitar c/ veíc e/ou carga c/ dimensões superiores est p/sinalização s/autoriz', '6823-1', ''],
    ['231, V', 'Transitar com o veículo com excesso de peso PBT/PBTC - Transitar com o veículo com excesso de peso - Por Eixo - Transitar com o veículo com excesso de peso - PBT/PBTC e Por Eixo', '6831-1', ''],
    ['231, VI', 'Transitar em desacordo c/ autorização expedida p/veículo c/ dimensões excedentes - Transitar com autorização vencida, expedida p/ veículo c/ dimensões excedentes', '6840-1', ''],
    ['231, VII', 'Transitar com o veículo com lotação excedente', '6858', ''],
    ['231, VIII', 'Transitar efetuando transporte remunerado de pessoas qdo ñ licenciado p/esse fim - Transitar efetuando transporte remunerado de bens qdo não licenciado p/ esse fim', '6866-1', ''],
    ['231, IX', 'Transitar com o veículo desligado em declive - Transitar com o veículo desengrenado em declive', '6874-1', ''],
    ['231, X', 'Transitar com o veículo excedendo a CMT em até 600 kg', '6882', ''],
    ['231, X', 'Transitar com o veículo excedendo a CMT entre 601 e 1.000 kg', '6890', ''],
    ['231, X', 'Transitar com o veículo excedendo a CMT acima de 1.000 kg', '6904', ''],
    ['232', 'Conduzir veículo sem os documentos de porte obrigatório referidos no CTB', '6912', ''],
    ['233 c/c 123, I, II, III, IV', 'Deixar de efetuar registro do veículo em 30 dias, qdo for transf a propriedade - Deixar de efetuar reg do veíc em 30 dias, qdo mudar o munic de domicilio/resid - Deixar de efetuar reg de veíc em 30 dias, qdo for alterada qquer caract do veic - Deixar de efetuar registro de veículo em 30 dias, qdo houver mudança de categoria', '6920-1', ''],
    ['234', 'Falsificar ou adulterar documento de habilitação - Falsificar ou adulterar documento de identificação do veículo', '6939-1', ''],
    ['235', 'Conduzir pessoas nas partes externas do veículo - Conduzir animais nas partes externas do veículo - Conduzir carga nas partes externas do veículo', '6947-1', ''],
    ['236', 'Rebocar outro veículo com cabo flexível ou corda', '6955', ''],
    ['237', 'Trans c/veíc desac c/especificação/falta de inscr/simbologia necessária identif', '6963', ''],
    ['238', 'Recusar-se a entregar CNH/CRV/CRLV/ outros documentos', '6971', ''],
    ['239', 'Retirar do local veículo legalmente retido para regularização, sem permissão', '6980', ''],
    ['240', 'Deixar responsável de promover baixa registro de veíc irrecuperável/desmontado', '6998', ''],
    ['241', 'Deixar de atualizar o cadastro de registro do veículo - Deixar de atualizar o cadastro de habilitação do condutor', '7005-1', ''],
    ['242', 'Fazer falsa declaração de domicílio para fins de registro/licenciamento - Fazer falsa declaração de domicílio para fins de habilitação', '7013-1', ''],
    ['243', 'Deixar seguradora de comunicar ocorrência perda total veíc e devolver placas/doc', '7021', ''],
    ['244, I', 'Conduzir motocicleta, motoneta e ciclomotor sem capacete de segurança - Conduzir motocicleta, motoneta e ciclomotor sem vestuário aprovado pelo Contran', '7030-1', ''],
    ['244, II', 'Conduzir motocicleta, motoneta e ciclomotor transportando passageiro s/ capacete - Conduzir motocicleta/motoneta/ciclomotor transportando pas. fora do assento', '7048-1', ''],
    ['244, III', 'Conduzir motoc/moton/ciclomotor fazendo malabarismo/equilibrando-se em uma roda - Conduzir ciclo fazendo malabarismo ou equilibrando-se em uma roda', '7056-1', ''],
    ['244, IV', 'Conduzir motocicleta, motoneta e ciclomotor com os faróis apagados', '7064', ''],
    ['244, V', 'Conduzir motocicleta/motoneta/ciclomotor transportando criança menor de 7 anos - Conduzir motoc/moton/ciclom transp criança s/ condição cuidar própria segurança', '7072-1', ''],
    ['244, VI', 'Conduzir motocicleta, motoneta e ciclomotor rebocando outro veículo', '7080', ''],
    ['244, VII', 'Conduzir motocicleta/motoneta/ciclomotor sem segurar o guidom com ambas as mãos', '7099-1', ''],
    ['244, VIII', 'Conduzir motocicleta, motoneta e ciclomotor transportando carga incompatível - Conduzir motoc/moton/ transportando carga em desacordo c/ § 2º do Art 139-A CTB', '7102-1', ''],
    ['244, § 1º, a', 'Conduzir ciclo transportando passageiro fora da garupa/assento a ele destinado', '7110', ''],
    ['244, § 1º, b', 'Conduzir ciclo via de trâns rápido ou rodovia salvo se houver acostam/fx própria - Conduzir ciclomotor em via de trânsito rápido - Conduzir ciclomotor em rodovia salvo se houver acostamento ou faixa própria', '7129-1', ''],
    ['244, § 1º, c', 'Conduzir ciclo transportando criança s/ condição de cuidar própria segurança', '7137', ''],
    ['245', 'Utilizar a via para depósito de mercadorias, materiais ou equipamentos', '7145', ''],
    ['246', 'Deixar de sinalizar obstáculo à circulação/segurança calçada/pista-s/agravamento - Obstaculizar a via indevidamente-s/agravamento', '7153-1', ''],
    ['246', 'Deixar de sinalizar obstáculo circulação/segurança calçada/pista-agravamento 2X - Obstaculizar a via indevidamente-agravamento 2X', '7161-1', ''],
    ['246', 'Deixar de sinalizar obstáculo circulação/segurança calçada/pista-agravamento 3X - Obstaculizar a via indevidamente-agravamento 3X', '7170-1', ''],
    ['246', 'Deixar de sinalizar obstáculo circulação/segurança calçada/pista-agravamento 4X - Obstaculizar a via indevidamente-agravamento 4X', '7188-1', ''],
    ['246', 'Obstaculizar a via indevidamente-agravamento 5X', '7196-2', ''],
    ['247', 'Deixar de conduzir pelo bordo pista em fila única veíc tração/propulsão humana - Deixar de conduzir pelo bordo da pista em fila única veículo de tração animal', '7200-1', ''],
    ['248', 'Transportar em veíc destinado transp passageiros carga excedente desac art.109', '7218', ''],
    ['249', 'Deixar de manter acesas à noite as luzes posição qdo o veículo estiver parado - Deixar de manter acesas à noite as luzes de posição veic fazendo carga/descarg a', '7226-1', ''],
    ['250, I, a', 'Em movimento, deixar de manter acesa a luz baixa durante à noite', '7234', ''],
    ['250, I, b', 'Em movimento de dia, deixar de manter acesa luz baixa túnel com iluminação pública', '7242', ''],
    ['250, I, c', 'Em mov, deixar de manter acesa luz baixa veíc transp coletivo faixa/pista excl', '7250', ''],
    ['250, I, d', 'Em movimento, deixar de manter acesa luz baixa do ciclomotor', '7269', ''],
    ['250, II', 'Em mov deixar de manter acesas luzes de posição sob chuva forte/neblina/cerração', '7277', ''],
    ['250, III', 'Em movimento, deixar de manter a placa traseira iluminada à noite', '7285', ''],
    ['251, I', 'Utilizar o pisca-alerta, exceto em imobilizações ou situações de emergência', '7293', ''],
    ['251, II', 'Utilizar luz alta e baixa intermitente, exceto quando permitido pelo CTB', '7307', ''],
    ['252, I', 'Dirigir o veículo com o braço do lado de fora', '7315', ''],
    ['252, II', 'Dirigir o veículo transport pessoas à sua esquerda ou entre os braços e pernas - Dirigir o veículo transport animais à sua esquerda ou entre os braços e pernas - Dirigir o veículo transport volume à sua esquerda ou entre os braços e pernas', '7323-1', ''],
    ['252, III', 'Dirigir o veículo com incapacidade física ou mental temporária', '7331', ''],
    ['252, IV', 'Dirigir o veíc usando calçado que ñ se firme nos pés/comprometa utiliz pedais', '7340', ''],
    ['252, V', 'Dirigir o veículo com apenas uma das mãos, exceto quando permitido pelo CTB', '7358', ''],
    ['252, VI', 'Dirigir o veículo utilizando-se de fones nos ouvidos conec a aparelhagem sonora - Dirigir veículo utilizando-se de telefone celular', '7366-1', ''],
    ['253', 'Bloquear a via com veículo', '7374', ''],
    ['254, I', 'É proib ao pedestre permanecer/andar pista, exceto p/ cruzá-las onde permitido', '7382', ''],
    ['254, II', 'É proibido ao pedestre cruzar pista de rolamento de viaduto exc onde permitido - de ponte exceto onde permitido - de túneis exceto onde permitido', '7390-1', ''],
    ['254, III', 'É proib ao pedestre atravessar via área cruzamento exc onde permitido p/ sinaliz', '7404', ''],
    ['254, IV', 'É proib pedestre utilizar via em agrupam que perturbe trâns/prát esporte/desfile', '7412', ''],
    ['254, V', 'É proibido ao pedestre andar fora da faixa própria - andar fora da passarela - andar fora da passagem aérea - andar fora da passagem subterrânea', '7420-1', ''],
    ['254, VI', 'É proibido ao pedestre desobedecer a sinalização de trânsito específica', '7439', ''],
    ['255', 'Conduzir bicicleta em passeios onde não seja permitida a circulação desta - Conduzir bicicleta de forma agressiva', '7447-1', ''],
    ['218, I', 'Transitar em velocidade superior à máxima permitida em até 20%', '7455', ''],
    ['218, II', 'Transitar em velocidade superior à máxima permitida em mais de 20% até 50%', '7463', ''],
    ['218, III', 'Transitar em velocidade superior à máxima permitida em mais de 50%', '7471', ''],
    ['93 c/c 95, § 4º', 'Aprovar proj edificação pólo atrativo trânsito s/ anuência órgão/entid trânsito e Aprovar proj edificação pólo atrativo trâns s/ estacion/indicação vias de acesso', '7480-1', ''],
    ['94', 'Ñ sinalizar devida/imed obstáculo à circul/segurança veíc/pedestre pista/calçada', '7498', ''],
    ['94, § único', 'Utilizar ondulação transversal/sonorizador fora padrão/critério estab p/ Contran', '7501', ''],
    ['95', 'Iniciar obra perturbe/interrompa circulação/segurança veíc/pedestres s/permissão e Iniciar evento perturbe/interrompa circulaç/segurança veíc/pedestres s/permissão', '7510-1', ''],
    ['95, § 1º', 'Não sinalizar a execução ou manutenção da obra e Não sinalizar a execução ou manutenção do evento', '7528-1', ''],
    ['95, § 2º', 'Não avisar comunidade c/ 48h antec interdição via indicando caminho alternativo', '7536', ''],
    ['330, § 5º', 'Falta de escrituração livro registro entrada/saída e de uso placa de experiência - Atraso escrituração livro registro entrada/saída e de uso placa de experiência - Fraude escrituração livro registro entrada/saída e de uso placa de experiência - Recusa da exibição do livro registro entrada/saída e de uso placa de experiência', '7544-1', ''],
    ['244, IX', 'Conduzir motoc/moton/ efetuando transp remun mercadoria desac c/ art 139-A CTB - Conduzir motoc/moton/ efet transp remun desac normas ativid profic mototaxistas', '7552-1', ''],
    ['230, XXIII', 'Conduzir veíc de transp passag ou carga em desacordo c/ as cond do art 67-C CTB', '7560', ''],
    ['277, § 3º, c/c 165', 'Cond que se recusar a se submeter a qq dos proc prev no art. 277 do CTB', '7579', ''],
    ['184, III', 'Transitar na faixa ou via exclusiva regulam. p/ transp. públ. coletivo passag.', '7587', ''],
    ['252, VII', 'Dirigir veículo realizando cobrança de tarifa com veículo em movimento', '7595', ''],
    ['253-A, § 1º', 'Organizar as condutas previstas no caput do art. 253-A', '7609', ''],
    ['253-A', 'Usar veículo para, deliberadamente, interromper a circulação na via - restringir a circulação na via - perturbar a circulação na via', '7617-1', ''],
  ];
}

function pvSeedTabelaInfracoesSeVazia_(ss) {
  var sheet = ss.getSheetByName(SHEET_PV_TABELA_INFRACOES);
  if (!sheet || sheet.getLastRow() > 1) return;
  pvFormatarColunaComoTexto_(sheet, CABECALHO_PV_TABELA_INFRACOES, 'Codigo');
  var linhas = pvDadosRenainf_();
  sheet.getRange(2, 1, linhas.length, CABECALHO_PV_TABELA_INFRACOES.length).setValues(linhas);
}

// Rode pelo editor do Apps Script (ou pelo menu "Base de Veículos") se a
// planilha do Passivo já foi criada ANTES da tabela RENAINF existir —
// substitui o conteúdo da aba TabelaInfracoes pela tabela oficial
// completa (258 códigos). Limpa as linhas antigas primeiro, então rode
// de novo só se quiser mesmo repor a tabela do zero (perde edições
// manuais feitas direto na planilha).
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
  // Órgãos estaduais extras, além do DETRAN — confirmados a partir de
  // casos reais (planilha do DF). Adicione mais linhas direto na planilha
  // (aba OrgaosAutuadores) conforme for precisando de outros estados —
  // não precisa mexer em código pra isso.
  linhas.push(['DF', 'DER-DF', 'Estadual']);
  linhas.push(['SP', 'DER-SP', 'Estadual']);
  linhas.push(['RS', 'DER-RS', 'Estadual']);
  linhas.push(['GO', 'AGETOP-GO', 'Estadual']);
  sheet.getRange(2, 1, linhas.length, CABECALHO_PV_ORGAOS_AUTUADORES.length).setValues(linhas);
}

function pvInfracaoProximoId_() {
  var props = PropertiesService.getScriptProperties();
  var seq = Number(props.getProperty('PV_SEQ_INFRACAO') || '0');
  seq += 1;
  props.setProperty('PV_SEQ_INFRACAO', String(seq));
  return 'PVI-' + ('000000' + seq).slice(-6);
}

function pvEnvioProximoId_() {
  var props = PropertiesService.getScriptProperties();
  var seq = Number(props.getProperty('PV_SEQ_ENVIO') || '0');
  seq += 1;
  props.setProperty('PV_SEQ_ENVIO', String(seq));
  return 'PVE-' + ('000000' + seq).slice(-6);
}

function pvValidarInfracao_(dados) {
  if (!dados.placa) throw new Error('Informe a placa do veículo.');
  if (!validarPlaca_(normalizarPlaca_(dados.placa))) throw new Error('Placa inválida: ' + dados.placa);
  if (!dados.orgaoAutuador) throw new Error('Informe o órgão autuador.');
  if (!dados.ait) throw new Error('Informe o número do AIT (auto de infração).');
}

function pvMontarRegistroInfracao_(dados, autor, existente) {
  var agora = new Date();
  return {
    ID: existente ? existente.ID : pvInfracaoProximoId_(),
    DataCadastro: existente ? existente.DataCadastro : agora,
    Placa: normalizarPlaca_(dados.placa),
    OrgaoAutuador: normalizarTexto_(dados.orgaoAutuador),
    AIT: normalizarTexto_(dados.ait),
    Artigo: normalizarTexto_(dados.artigo),
    Codigo: normalizarTexto_(dados.codigo),
    DescricaoInfracao: normalizarTexto_(dados.descricaoInfracao),
    DataInfracao: normalizarTexto_(dados.dataInfracao),
    StatusCancelamento: dados.statusCancelamento || PV_STATUS_CANCELAMENTO[0],
    Observacoes: normalizarTexto_(dados.observacoes),
    CadastradoPor: existente ? existente.CadastradoPor : autor,
    UltimaAtualizacao: agora,
    AtualizadoPor: autor
  };
}

function pvMapaVeiculosPorPlaca_() {
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var mapa = {};
  for (var i = 1; i < valores.length; i++) {
    var registro = linhaParaObjeto_(cabecalho, valores[i]);
    if (registro.Placa) mapa[registro.Placa] = registro;
  }
  return mapa;
}

function getListasDebitosPassivo() {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');

  // Devolve como array de arrays [Artigo, Descricao, Codigo] em vez de 258
  // objetos com chave repetida — google.script.run trava (nunca chama nem
  // sucesso nem erro) com respostas grandes cheias de objetos, o mesmo bug
  // que já tinha acontecido antes na aba TEP. Array simples é bem mais
  // leve pra serializar/enviar. Gravidade não vai porque não é usada em
  // lugar nenhum do cliente.
  var sheetTabela = getOrCreateSheetPassivo_(SHEET_PV_TABELA_INFRACOES, CABECALHO_PV_TABELA_INFRACOES);
  var valoresTabela = sheetTabela.getDataRange().getValues();
  var tabelaInfracoes = [];
  for (var i = 1; i < valoresTabela.length; i++) {
    if (!valoresTabela[i][0]) continue;
    tabelaInfracoes.push([
      String(valoresTabela[i][0] || ''),
      String(valoresTabela[i][1] || ''),
      String(valoresTabela[i][2] || '')
    ]);
  }

  var sheetOrgaos = getOrCreateSheetPassivo_(SHEET_PV_ORGAOS_AUTUADORES, CABECALHO_PV_ORGAOS_AUTUADORES);
  var valoresOrgaos = sheetOrgaos.getDataRange().getValues();
  var orgaosFederais = [];
  var orgaosPorUF = {};
  for (var j = 1; j < valoresOrgaos.length; j++) {
    var linha = valoresOrgaos[j];
    if (!linha[1]) continue;
    var uf = normalizarUF_(linha[0]);
    if (!uf) {
      orgaosFederais.push(linha[1]);
    } else {
      if (!orgaosPorUF[uf]) orgaosPorUF[uf] = [];
      orgaosPorUF[uf].push(linha[1]);
    }
  }

  return {
    statusCancelamento: PV_STATUS_CANCELAMENTO,
    tabelaInfracoes: tabelaInfracoes,
    orgaosFederais: orgaosFederais,
    orgaosPorUF: orgaosPorUF
  };
}

function cadastrarInfracaoPassivo(dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarInfracao_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var registro = pvMontarRegistroInfracao_(dados, perfil.email);
  sheet.appendRow(CABECALHO_PV_INFRACOES.map(function (campo) { return registro[campo]; }));
  return { ok: true, id: registro.ID };
}

function listarInfracoesPassivo(filtros) {
  filtros = filtros || {};
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];

  var sheetEnvios = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var valoresEnvios = sheetEnvios.getDataRange().getValues();
  var enviosPorInfracao = {};
  for (var e = 1; e < valoresEnvios.length; e++) {
    var idInf = valoresEnvios[e][1];
    if (!idInf) continue;
    if (!enviosPorInfracao[idInf]) enviosPorInfracao[idInf] = [];
    enviosPorInfracao[idInf].push(valoresEnvios[e][2]);
  }

  var mapaVeiculos = pvMapaVeiculosPorPlaca_();
  var busca = filtros.busca ? normalizarTexto_(filtros.busca).toUpperCase() : '';
  var resultado = [];
  var agora = new Date();

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);

    if (filtros.placa && normalizarPlaca_(registro.Placa) !== normalizarPlaca_(filtros.placa)) continue;
    if (filtros.orgaoAutuador && registro.OrgaoAutuador !== filtros.orgaoAutuador) continue;
    if (filtros.status && registro.StatusCancelamento !== filtros.status) continue;
    if (busca) {
      var alvo = [registro.Placa, registro.AIT, registro.Artigo, registro.Codigo, registro.OrgaoAutuador].join(' ').toUpperCase();
      if (alvo.indexOf(busca) === -1) continue;
    }

    var datasEnvio = (enviosPorInfracao[registro.ID] || []).map(function (d) { return new Date(d); });
    var qtdEnvios = datasEnvio.length;
    var dataUltimoEnvio = qtdEnvios ? new Date(Math.max.apply(null, datasEnvio)) : null;
    var diasSemResposta = dataUltimoEnvio ? Math.floor((agora - dataUltimoEnvio) / 86400000) : null;
    registro.QtdEnvios = qtdEnvios;
    registro.DataUltimoEnvio = dataUltimoEnvio ? Utilities.formatDate(dataUltimoEnvio, Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
    registro.SemResposta = registro.StatusCancelamento === 'ENVIADO' && diasSemResposta !== null && diasSemResposta >= PV_DIAS_SEM_RESPOSTA;

    var veiculo = mapaVeiculos[registro.Placa];
    registro.MarcaVeiculo = veiculo ? veiculo.Marca : '';
    registro.ModeloVeiculo = veiculo ? veiculo.Modelo : '';
    registro.ChassiVeiculo = veiculo ? veiculo.Chassi : '';
    registro.RenavamVeiculo = veiculo ? veiculo.Renavam : '';
    registro.AnoVeiculo = veiculo ? (veiculo.AnoFabricacao + '/' + veiculo.AnoModelo) : '';

    registro.DataCadastro = registro.DataCadastro ? Utilities.formatDate(new Date(registro.DataCadastro), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
    registro.UltimaAtualizacao = registro.UltimaAtualizacao ? Utilities.formatDate(new Date(registro.UltimaAtualizacao), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : '';
    resultado.push(registro);
  }

  resultado.sort(function (a, b) { return String(b.ID).localeCompare(String(a.ID)); });
  return resultado;
}

function atualizarInfracaoPassivo(id, dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarInfracao_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      var existente = linhaParaObjeto_(cabecalho, valores[i]);
      var registro = pvMontarRegistroInfracao_(dados, perfil.email, existente);
      var linha = CABECALHO_PV_INFRACOES.map(function (campo) { return registro[campo]; });
      sheet.getRange(i + 1, 1, 1, CABECALHO_PV_INFRACOES.length).setValues([linha]);
      return { ok: true };
    }
  }
  throw new Error('Infração não encontrada.');
}

function excluirInfracaoPassivo(id) {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheet.getDataRange().getValues();
  var idxId = CABECALHO_PV_INFRACOES.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  throw new Error('Infração não encontrada.');
}

// Cada clique em "Registrar envio" grava uma linha nova (data + quem
// enviou) em vez de só incrementar um contador — assim dá pra mostrar
// "2ª via enviada em 12/03/2025" e sinalizar "sem resposta" sozinho
// (ver PV_DIAS_SEM_RESPOSTA) sem a pessoa ter que lembrar de marcar isso
// manualmente.
function registrarEnvioCancelamentoPassivo(idInfracao, observacoes) {
  var perfil = exigirPerfilEditor_();
  var sheetInfracoes = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheetInfracoes.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  var idxStatus = cabecalho.indexOf('StatusCancelamento');
  var idxAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');
  var linhaEncontrada = -1;
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === idInfracao) { linhaEncontrada = i; break; }
  }
  if (linhaEncontrada === -1) throw new Error('Infração não encontrada.');

  var sheetEnvios = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var agora = new Date();
  sheetEnvios.appendRow([pvEnvioProximoId_(), idInfracao, agora, perfil.email, normalizarTexto_(observacoes)]);

  // Só o primeiro envio empurra o status de PENDENTE pra ENVIADO
  // automaticamente — os demais (2º, 3º...) ficam só no histórico, porque
  // a partir daí quem decide se já foi recebida, cancelada ou negada é a
  // pessoa, mudando o status manualmente pela tela de edição.
  if (valores[linhaEncontrada][idxStatus] === 'PENDENTE') {
    sheetInfracoes.getRange(linhaEncontrada + 1, idxStatus + 1).setValue('ENVIADO');
  }
  sheetInfracoes.getRange(linhaEncontrada + 1, idxAtualizacao + 1).setValue(agora);
  sheetInfracoes.getRange(linhaEncontrada + 1, idxAtualizadoPor + 1).setValue(perfil.email);

  return { ok: true };
}

function listarEnviosDaInfracaoPassivo(idInfracao) {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var envios = [];
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][1] === idInfracao) {
      var e = linhaParaObjeto_(cabecalho, valores[i]);
      envios.push({
        ID: e.ID,
        DataEnvio: e.DataEnvio ? Utilities.formatDate(new Date(e.DataEnvio), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : '',
        RegistradoPor: e.RegistradoPor,
        Observacoes: e.Observacoes
      });
    }
  }
  envios.sort(function (a, b) { return b.ID.localeCompare(a.ID); });
  return envios;
}

