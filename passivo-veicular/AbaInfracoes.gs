/**
 * AbaInfracoes.gs
 * Tudo relacionado às abas "Infracoes" e "InfracoesEnvios" da planilha do
 * Passivo — que agora guardam débitos de qualquer tipo (Infração, IPVA,
 * Licenciamento, Outra), diferenciados pela coluna "Tipo". O tipo INFRACAO
 * usa os campos/fluxo que já existiam (AIT, Artigo, Órgão autuador,
 * StatusCancelamento); os demais tipos usam os campos genéricos (Valor,
 * DataVencimento, Exercicio, StatusPagamento) — ver PV_TIPOS_DEBITO em
 * Setup.gs. Os nomes de aba/planilha continuam "Infracoes"/"InfracoesEnvios"
 * por serem os nomes já criados na planilha existente.
 */

function pvDebitoProximoId_() {
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

function pvValidarDebito_(dados) {
  var tipo = dados.tipo || 'INFRACAO';
  if (PV_TIPOS_DEBITO.indexOf(tipo) === -1) throw new Error('Tipo de débito inválido: ' + tipo);
  if (!dados.placa) throw new Error('Informe a placa do veículo.');
  if (!validarPlaca_(normalizarPlaca_(dados.placa))) throw new Error('Placa inválida: ' + dados.placa);
  if (tipo === 'INFRACAO') {
    if (!dados.orgaoAutuador) throw new Error('Informe o órgão autuador.');
    if (!dados.ait) throw new Error('Informe o número do AIT (auto de infração).');
  } else {
    if (dados.valor === undefined || dados.valor === null || dados.valor === '') throw new Error('Informe o valor do débito.');
    if (isNaN(Number(dados.valor))) throw new Error('Valor inválido: ' + dados.valor);
  }
}

// Monta o registro completo da linha. Os campos específicos de Infração
// (AIT/Artigo/Codigo/DescricaoInfracao/DataInfracao/StatusCancelamento) só
// são atualizados quando o tipo é INFRACAO — nos demais tipos, mantêm o
// valor que já existia (relevante ao trocar de tipo numa edição) ou ficam
// em branco num cadastro novo. Mesma lógica, espelhada, pros campos
// genéricos de débito (Valor/DataVencimento/Exercicio/StatusPagamento).
function pvMontarRegistroDebito_(dados, autor, existente) {
  var agora = new Date();
  var tipo = dados.tipo || (existente ? existente.Tipo : '') || 'INFRACAO';
  var ehInfracao = tipo === 'INFRACAO';
  return {
    ID: existente ? existente.ID : pvDebitoProximoId_(),
    DataCadastro: existente ? existente.DataCadastro : agora,
    Placa: normalizarPlaca_(dados.placa),
    OrgaoAutuador: normalizarTexto_(dados.orgaoAutuador),
    AIT: ehInfracao ? normalizarTexto_(dados.ait) : (existente ? existente.AIT : ''),
    Artigo: ehInfracao ? normalizarTexto_(dados.artigo) : (existente ? existente.Artigo : ''),
    Codigo: ehInfracao ? normalizarTexto_(dados.codigo) : (existente ? existente.Codigo : ''),
    DescricaoInfracao: ehInfracao ? normalizarTexto_(dados.descricaoInfracao) : (existente ? existente.DescricaoInfracao : ''),
    DataInfracao: ehInfracao ? normalizarTexto_(dados.dataInfracao) : (existente ? existente.DataInfracao : ''),
    StatusCancelamento: ehInfracao ? (dados.statusCancelamento || PV_STATUS_CANCELAMENTO[0]) : (existente ? existente.StatusCancelamento : ''),
    Tipo: tipo,
    Valor: ehInfracao ? (dados.valor ? Number(dados.valor) : (existente ? existente.Valor : '')) : Number(dados.valor) || 0,
    DataVencimento: normalizarTexto_(dados.dataVencimento),
    Exercicio: normalizarTexto_(dados.exercicio),
    StatusPagamento: ehInfracao ? (existente ? existente.StatusPagamento : '') : (dados.statusPagamento || PV_STATUS_PAGAMENTO[0]),
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

  // Devolve como array de arrays [Artigo, Descricao, Codigo, Valor] em vez
  // de centenas de objetos com chave repetida — google.script.run trava com
  // respostas grandes cheias de objetos; array simples é bem mais leve pra
  // serializar/enviar. Gravidade não vai porque não é usada no cliente.
  var sheetTabela = getOrCreateSheetPassivo_(SHEET_PV_TABELA_INFRACOES, CABECALHO_PV_TABELA_INFRACOES);
  var valoresTabela = sheetTabela.getDataRange().getValues();
  var tabelaInfracoes = [];
  for (var i = 1; i < valoresTabela.length; i++) {
    if (!valoresTabela[i][0]) continue;
    tabelaInfracoes.push([
      String(valoresTabela[i][0] || ''),
      String(valoresTabela[i][1] || ''),
      String(valoresTabela[i][2] || ''),
      valoresTabela[i][4] === '' || valoresTabela[i][4] === null || valoresTabela[i][4] === undefined ? '' : Number(valoresTabela[i][4])
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
    statusPagamento: PV_STATUS_PAGAMENTO,
    tipos: PV_TIPOS_DEBITO,
    rotulosTipo: PV_ROTULOS_TIPO_DEBITO,
    tabelaInfracoes: tabelaInfracoes,
    orgaosFederais: orgaosFederais,
    orgaosPorUF: orgaosPorUF
  };
}

function cadastrarDebitoPassivo(dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarDebito_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var registro = pvMontarRegistroDebito_(dados, perfil.email);
  sheet.appendRow(CABECALHO_PV_INFRACOES.map(function (campo) { return registro[campo]; }));
  return { ok: true, id: registro.ID };
}

function listarDebitosPassivo(filtros) {
  filtros = filtros || {};
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];

  var sheetEnvios = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var valoresEnvios = sheetEnvios.getDataRange().getValues();
  var enviosPorDebito = {};
  for (var e = 1; e < valoresEnvios.length; e++) {
    var idDeb = valoresEnvios[e][1];
    if (!idDeb) continue;
    if (!enviosPorDebito[idDeb]) enviosPorDebito[idDeb] = [];
    enviosPorDebito[idDeb].push(valoresEnvios[e][2]);
  }

  var mapaVeiculos = pvMapaVeiculosPorPlaca_();
  var busca = filtros.busca ? normalizarTexto_(filtros.busca).toUpperCase() : '';
  var resultado = [];
  var agora = new Date();

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);
    // Linhas gravadas antes da coluna Tipo existir não têm valor nela —
    // eram todas infração (o único tipo que existia até então).
    if (!registro.Tipo) registro.Tipo = 'INFRACAO';

    if (filtros.tipo && registro.Tipo !== filtros.tipo) continue;
    if (filtros.placa && normalizarPlaca_(registro.Placa) !== normalizarPlaca_(filtros.placa)) continue;
    if (filtros.orgaoAutuador && registro.OrgaoAutuador !== filtros.orgaoAutuador) continue;
    if (filtros.status) {
      var statusAtual = registro.Tipo === 'INFRACAO' ? registro.StatusCancelamento : registro.StatusPagamento;
      if (statusAtual !== filtros.status) continue;
    }
    if (busca) {
      var alvo = [registro.Placa, registro.AIT, registro.Artigo, registro.Codigo, registro.OrgaoAutuador, registro.Observacoes].join(' ').toUpperCase();
      if (alvo.indexOf(busca) === -1) continue;
    }

    var datasEnvio = (enviosPorDebito[registro.ID] || []).map(function (d) { return new Date(d); });
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
    registro.UFVeiculo = veiculo ? veiculo.UF : '';
    registro.InstituicaoVeiculo = veiculo ? veiculo.Instituicao : '';

    registro.Valor = Number(registro.Valor) || 0;
    registro.DataCadastro = registro.DataCadastro ? Utilities.formatDate(new Date(registro.DataCadastro), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
    registro.UltimaAtualizacao = registro.UltimaAtualizacao ? Utilities.formatDate(new Date(registro.UltimaAtualizacao), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') : '';
    resultado.push(registro);
  }

  resultado.sort(function (a, b) { return String(b.ID).localeCompare(String(a.ID)); });
  return resultado;
}

// Soma valores em R$ dos débitos (pendentes x pagos/resolvidos), por UF e
// Instituição do veículo, e por Tipo — alimenta os cards novos do Painel
// Geral. "Resolvido" pra Infração é StatusCancelamento CANCELADA/NEGADA
// (não se deve mais nada); pra IPVA/Licenciamento/Outra é StatusPagamento
// PAGO.
function getPainelDebitosPassivo(filtros) {
  var lista = listarDebitosPassivo(filtros);
  var painel = {
    totalPendente: 0, totalPago: 0,
    porUFPendente: {}, porInstituicaoPendente: {}, porTipoPendente: {}
  };
  lista.forEach(function (d) {
    var valor = Number(d.Valor) || 0;
    var resolvido = d.Tipo === 'INFRACAO'
      ? (d.StatusCancelamento === 'CANCELADA' || d.StatusCancelamento === 'NEGADA')
      : (d.StatusPagamento === 'PAGO');
    if (resolvido) {
      painel.totalPago += valor;
      return;
    }
    painel.totalPendente += valor;
    if (!valor) return;
    if (d.UFVeiculo) painel.porUFPendente[d.UFVeiculo] = (painel.porUFPendente[d.UFVeiculo] || 0) + valor;
    if (d.InstituicaoVeiculo) painel.porInstituicaoPendente[d.InstituicaoVeiculo] = (painel.porInstituicaoPendente[d.InstituicaoVeiculo] || 0) + valor;
    painel.porTipoPendente[d.Tipo] = (painel.porTipoPendente[d.Tipo] || 0) + valor;
  });
  return painel;
}

function atualizarDebitoPassivo(id, dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarDebito_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      var existente = linhaParaObjeto_(cabecalho, valores[i]);
      var registro = pvMontarRegistroDebito_(dados, perfil.email, existente);
      var linha = CABECALHO_PV_INFRACOES.map(function (campo) { return registro[campo]; });
      sheet.getRange(i + 1, 1, 1, CABECALHO_PV_INFRACOES.length).setValues([linha]);
      return { ok: true };
    }
  }
  throw new Error('Débito não encontrado.');
}

function excluirDebitoPassivo(id) {
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
  throw new Error('Débito não encontrado.');
}

// Cada clique em "Registrar envio" grava uma linha nova (data + quem
// enviou) em vez de só incrementar um contador — assim dá pra mostrar
// "2ª via enviada em 12/03/2025" e sinalizar "sem resposta" sozinho (ver
// PV_DIAS_SEM_RESPOSTA) sem a pessoa ter que lembrar de marcar isso
// manualmente. Vale para qualquer tipo de débito (Infração, IPVA,
// Licenciamento, Outra) — o "envio" aqui é genérico (qualquer contato
// registrado com o órgão/instituição sobre aquele débito), só o efeito
// automático de empurrar PENDENTE→ENVIADO é específico de Infração.
function registrarEnvioCancelamentoPassivo(idDebito, observacoes) {
  var perfil = exigirPerfilEditor_();
  var sheetDebitos = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheetDebitos.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  var idxTipo = cabecalho.indexOf('Tipo');
  var idxStatus = cabecalho.indexOf('StatusCancelamento');
  var idxAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');
  var linhaEncontrada = -1;
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === idDebito) { linhaEncontrada = i; break; }
  }
  if (linhaEncontrada === -1) throw new Error('Débito não encontrado.');

  var sheetEnvios = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var agora = new Date();
  sheetEnvios.appendRow([pvEnvioProximoId_(), idDebito, agora, perfil.email, normalizarTexto_(observacoes)]);

  // Só o primeiro envio empurra o status de PENDENTE pra ENVIADO
  // automaticamente — os demais (2º, 3º...) ficam só no histórico, porque
  // a partir daí quem decide se já foi recebida, cancelada ou negada é a
  // pessoa, mudando o status manualmente pela tela de edição. Só se aplica
  // a Infração — os outros tipos usam StatusPagamento, que não muda
  // sozinho com um envio.
  var tipo = valores[linhaEncontrada][idxTipo] || 'INFRACAO';
  if (tipo === 'INFRACAO' && valores[linhaEncontrada][idxStatus] === 'PENDENTE') {
    sheetDebitos.getRange(linhaEncontrada + 1, idxStatus + 1).setValue('ENVIADO');
  }
  sheetDebitos.getRange(linhaEncontrada + 1, idxAtualizacao + 1).setValue(agora);
  sheetDebitos.getRange(linhaEncontrada + 1, idxAtualizadoPor + 1).setValue(perfil.email);

  return { ok: true };
}

function listarEnviosDaInfracaoPassivo(idDebito) {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var envios = [];
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][1] === idDebito) {
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
