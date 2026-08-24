/**
 * AbaVeiculos.gs
 * Tudo relacionado à aba "Veiculos" da planilha do Passivo: cadastro
 * (individual/lote), listagem, painel geral, edição, exclusão lógica e
 * lixeira.
 */

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

    // Excluído (lixeira) some das telas normais por padrão.
    if (registro.Excluido === 'SIM' && !filtros.incluirExcluidos) continue;

    if (filtros.uf && registro.UF !== filtros.uf) continue;
    if (filtros.instituicao && registro.Instituicao !== filtros.instituicao) continue;
    if (filtros.situacao && registro.SituacaoTransferencia !== filtros.situacao) continue;
    if (busca) {
      var alvo = [registro.Placa, registro.Chassi, String(registro.Renavam), registro.Marca, registro.Modelo, registro.Instituicao, registro.NumeroTermoDoacao].join(' ').toUpperCase();
      if (alvo.indexOf(busca) === -1) continue;
    }

    // Datas viram texto simples antes de voltar ao cliente — evita respostas
    // grandes com objetos Date que travam o google.script.run.
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

// Exclusão lógica — nunca apaga a linha de verdade, só marca Excluido/
// ExcluidoPor/DataExclusao e some das telas normais (listarVeiculosPassivo
// filtra por padrão). Um administrador pode restaurar em "Lixeira".
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

// Tira o veículo da lixeira do Passivo Veicular.
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
