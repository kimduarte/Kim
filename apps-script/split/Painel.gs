
// ======================================================================
// PAINEL — agregações estatísticas (dashboard)
// ======================================================================

var CACHE_DASHBOARD_SEGUNDOS = 300;
var CACHE_ANOS_SEGUNDOS = 21600; // 6h (máximo do CacheService) — anos disponíveis raríssimo mudam

function invalidarCacheDashboard_() {
  CacheService.getDocumentCache().removeAll(['dash_admin', 'dash_geral', 'anos_disponiveis', 'cobranca_base', 'ultimos_transferidos']);
}

/**
 * Chamada pelo frontend uma única vez ao final de cada operação do usuário
 * (cadastrar processo, editar processo, excluir processo, marcar ATPVe) —
 * não a cada veículo salvo individualmente. Isso evita mandar um e-mail por
 * veículo quando uma operação mexe em vários de uma vez (ex.: cadastrar um
 * processo com 10 veículos manda 1 e-mail, não 10).
 */
function notificarAtualizacaoExterna() {
  notificarWebhookExterno_();
}

// DriveApp.getFileById(id).getAs(MimeType.MICROSOFT_EXCEL) não funciona para
// converter um Google Sheets em .xlsx (erro "Converting from
// application/vnd.google-apps.spreadsheet ... is not supported") — usa-se
// em vez disso a própria URL de exportação do Google Sheets, autenticada com
// o token OAuth do script.
function exportarPlanilhaComoXlsx_() {
  var id = SpreadsheetApp.getActiveSpreadsheet().getId();
  var url = 'https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx';
  var resposta = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  });
  var arquivo = resposta.getBlob();
  arquivo.setName('Base_Veiculos_ATUAL.xlsx');
  return arquivo;
}

/**
 * Mantém uma cópia da planilha em tempo real fora do Google (ex.: OneDrive
 * institucional), por duas vias independentes — cada uma só dispara se
 * estiver configurada, e uma falha em qualquer uma delas nunca deve impedir
 * o cadastro/edição do veículo em si (por isso o try/catch silencioso em
 * cada função):
 *
 * 1) enviarParaOneDriveViaGraph_(): envio direto pro OneDrive via Microsoft
 *    Graph, sem depender de nenhuma automação intermediária. Requer a
 *    biblioteca OAuth2 for Apps Script e as Propriedades do Script
 *    MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID (ver autorizarMicrosoft_()).
 * 2) notificarPorEmail_(): manda a planilha por e-mail, anexada — usado
 *    quando a sincronização é feita por uma automação externa (Power
 *    Automate/Make.com) reagindo ao e-mail. Requer a Propriedade do Script
 *    EMAIL_BACKUP_ONEDRIVE com o destinatário.
 */
function notificarWebhookExterno_() {
  enviarParaOneDriveViaGraph_();
  notificarPorEmail_();
}

function notificarPorEmail_() {
  var destinatario = PropertiesService.getScriptProperties().getProperty('EMAIL_BACKUP_ONEDRIVE');
  if (!destinatario) return;
  try {
    MailApp.sendEmail({
      to: destinatario,
      subject: 'Atualização automática da Base de Veículos',
      body: 'Cópia automática gerada pelo sistema — arquivo em anexo.',
      attachments: [exportarPlanilhaComoXlsx_()]
    });
  } catch (e) {
    // Intencional: notificação é best-effort, não deve travar a operação principal.
    Logger.log('notificarPorEmail_ falhou: ' + e);
  }
}

/**
 * Últimos veículos transferidos, do mais recente pro mais antigo — usado
 * pelo atalho "Ver transferidos" da tela Início. Limita a 50 pra não
 * pesar a tela (é uma lista de "atividade recente", não um relatório
 * completo). A parte cara (achar todos os transferidos) fica em cache,
 * mesma técnica de getCobrancaBaseCache_/getEstatisticas.
 */
function listarUltimosTransferidos() {
  var cache = CacheService.getDocumentCache();
  var cacheado = cache.get('ultimos_transferidos');
  if (cacheado) return JSON.parse(cacheado);

  var transferidos = listarVeiculos({ transferido: 'SIM' });
  transferidos.sort(function (a, b) {
    return new Date(b.DataTransferencia || 0) - new Date(a.DataTransferencia || 0);
  });

  var resultado = transferidos.slice(0, 50).map(function (v) {
    return {
      id: v.ID,
      placa: v.Placa,
      chassi: v.Chassi,
      marca: v.Marca,
      descricao: v.Descricao,
      donataria: v.Donataria,
      uf: v.UF,
      dataTransferencia: v.DataTransferencia,
      numeroProcesso: v.NumeroProcesso,
      termoDoacao: v.TermoDoacao
    };
  });

  var json = JSON.stringify(resultado);
  if (json.length < 100 * 1024) cache.put('ultimos_transferidos', json, CACHE_DASHBOARD_SEGUNDOS);
  return resultado;
}

function getEstatisticas() {
  var perfil = getPerfilUsuarioAtual_();
  // Todos os perfis com acesso enxergam a mesma base (sem recorte por UF),
  // então basta um cache geral — só admin tinha uma via separada antes por
  // não estar sujeito ao antigo filtro por UF.
  var chaveCache = perfil.perfil === PERFIL_ADMIN ? 'dash_admin' : 'dash_geral';

  var cache = CacheService.getDocumentCache();
  var cacheado = cache.get(chaveCache);
  if (cacheado) return JSON.parse(cacheado);

  var registros = listarVeiculos({});
  var stats = calcularEstatisticas_(registros);

  cache.put(chaveCache, JSON.stringify(stats), CACHE_DASHBOARD_SEGUNDOS);
  return stats;
}

/**
 * Distribuição de veículos por UF (ou por Ente, quando campo='Ente'),
 * opcionalmente restrita a um ou mais anos (array ou ano único) e/ou a um
 * status de transferência — usada pelo seletor "Como você deseja
 * visualizar?" (Por UF / Por Região / Por Ente) na tela de Estatísticas.
 * Cada item traz também a soma de ValorVeiculo do recorte, ao lado da
 * contagem. Sem cache: é uma consulta pontual (só quando o usuário troca
 * um filtro), diferente do painel geral que é recalculado toda hora que
 * alguém abre a tela.
 */
function getVeiculosPorUFAno(ano, transferido, campo, ente, uf) {
  var filtros = {};
  if (ano && ano.length) filtros.ano = ano;
  if (transferido) filtros.transferido = transferido;
  if (ente) filtros.ente = ente;
  if (uf) filtros.uf = uf;
  var registros = listarVeiculos(filtros);
  return contarESomarValorPor_(registros, campo || 'UF');
}

/**
 * "Como você deseja visualizar?" > Por Donatária — só faz sentido pedir
 * Ente = Estado ou União (Município tem centenas de nomes distintos, viraria
 * uma lista imprestável). Agrupa por Donatária + UF (não só Donatária)
 * porque, depois da unificação de nomenclatura, várias Donatárias de Estado
 * viraram nomes genéricos que se repetem entre estados (ex.: "Polícia
 * Militar" existe em vários — o nome sozinho não identifica o órgão, só
 * nome+UF identifica).
 */
function getVeiculosPorDonataria(ano, transferido, ente, uf) {
  var filtros = {};
  if (ano && ano.length) filtros.ano = ano;
  if (transferido) filtros.transferido = transferido;
  if (ente) filtros.ente = ente;
  if (uf) filtros.uf = uf;
  var registros = listarVeiculos(filtros);

  var mapa = {};
  var ordem = [];
  registros.forEach(function (r) {
    var nome = r.Donataria || '(não informado)';
    var chave = nome + '|' + (r.UF || '');
    if (!mapa[chave]) {
      mapa[chave] = { donataria: nome, uf: r.UF || '', total: 0, valorTotal: 0 };
      ordem.push(chave);
    }
    mapa[chave].total++;
    mapa[chave].valorTotal += Number(r.ValorVeiculo) || 0;
  });

  return ordem.map(function (chave) {
    var g = mapa[chave];
    return {
      chave: g.donataria + (g.uf ? ' — ' + g.uf : ''),
      donataria: g.donataria,
      uf: g.uf,
      total: g.total,
      valorTotal: g.valorTotal
    };
  }).sort(function (a, b) { return b.total - a.total; });
}

/**
 * Como contarPor_, mas devolve também a soma de ValorVeiculo de cada grupo
 * — usada só pelo painel "Como você deseja visualizar?", que mostra o
 * total em reais ao lado da contagem de veículos por UF/Região.
 */
function contarESomarValorPor_(registros, campo) {
  var mapa = {};
  registros.forEach(function (r) {
    var chave = r[campo] || '(não informado)';
    if (!mapa[chave]) mapa[chave] = { total: 0, valorTotal: 0 };
    mapa[chave].total++;
    mapa[chave].valorTotal += Number(r.ValorVeiculo) || 0;
  });
  return Object.keys(mapa).map(function (chave) {
    return { chave: chave, total: mapa[chave].total, valorTotal: mapa[chave].valorTotal };
  }).sort(function (a, b) { return b.total - a.total; });
}

/**
 * Lista detalhada de veículos de uma UF, respeitando os mesmos filtros de
 * Ano e Transferidos usados nos painéis "Veículos por UF" e "Veículos por
 * Região/Estado" — usada pelo painel de detalhamento que abre ao clicar num
 * desses cards, na tela de Estatísticas.
 */
/**
 * Lista "achatada" (uma linha por veículo) de uma UF, respeitando os
 * filtros de Ano/Transferidos — usada internamente por
 * getVeiculosPorUFDetalhado() (que agrupa por processo) e pelas
 * exportações CSV/XLSX do painel, que preferem o detalhe veículo a
 * veículo. Quando o veículo não tem Número de Processo, usa o Número SEI
 * do Termo de Doação como referência (dá pra achar o documento no SEI
 * mesmo sem o número do processo formal).
 */
// ufExtra restringe também por UF além do campoFiltro principal — usada só
// no drill-down "Por Donatária" (ver getVeiculosPorDonataria), porque
// depois da unificação de nomenclatura várias Donatárias de Estado viraram
// nomes genéricos iguais em UFs diferentes (ex.: "Polícia Militar" existe
// em vários estados) — sem essa UF extra, clicar numa linha misturaria
// veículos de estados diferentes que só coincidem no nome.
function listarVeiculosDetalhadosUF_(valor, ano, transferido, campoFiltro, ente, ufExtra) {
  var filtros = {};
  filtros[campoFiltro || 'uf'] = valor;
  if (ufExtra) filtros.uf = ufExtra;
  if (ano && ano.length) filtros.ano = ano;
  if (transferido) filtros.transferido = transferido;
  if (ente) filtros.ente = ente;
  var registros = listarVeiculos(filtros);

  // "Qtd" = quantos veículos do mesmo processo aparecem neste recorte (UF +
  // Ano + Transferidos) — contexto útil ao ver cada veículo isoladamente.
  var qtdPorProcesso = {};
  registros.forEach(function (r) {
    var chave = chaveProcesso_(r);
    qtdPorProcesso[chave] = (qtdPorProcesso[chave] || 0) + 1;
  });

  return registros.map(function (r) {
    var chave = chaveProcesso_(r);
    return {
      Processo: r.NumeroProcesso || r.NumeroSei || '',
      NumeroSei: r.NumeroSei,
      Donataria: r.Donataria,
      UF: r.UF,
      Ente: r.Ente,
      TermoDoacao: r.TermoDoacao,
      Qtd: qtdPorProcesso[chave],
      Descricao: r.Descricao,
      Marca: r.Marca,
      Chassi: r.Chassi,
      Renavam: r.Renavam,
      Placa: r.Placa,
      Ano: r.Ano,
      Mes: r.Mes,
      Transferido: r.Transferido,
      ValorVeiculo: r.ValorVeiculo
    };
  }).sort(function (a, b) {
    var chaveA = a.Processo || (a.Ano + ':' + (a.NumeroSei || a.TermoDoacao || ''));
    var chaveB = b.Processo || (b.Ano + ':' + (b.NumeroSei || b.TermoDoacao || ''));
    return chaveA < chaveB ? -1 : (chaveA > chaveB ? 1 : 0);
  });
}

/**
 * Versão agrupada por Processo/Termo de Doação da lista acima, usada pelo
 * painel de detalhamento de UF/Região na tela: cada grupo vira uma linha
 * clicável que expande pra mostrar os veículos daquele processo. "Qtd" no
 * grupo é o total de veículos; qtdTransferidos é quantos já estão
 * Transferido: SIM — a tela monta o "X/Y" a partir desses dois números.
 */
function getVeiculosPorUFDetalhado(valor, ano, transferido, campoFiltro, ente, ufExtra) {
  var registros = listarVeiculosDetalhadosUF_(valor, ano, transferido, campoFiltro, ente, ufExtra);
  var grupos = {};
  var ordem = [];

  registros.forEach(function (r) {
    // Ano+SEI (ou Termo, se não houver SEI) quando não há Processo — ver
    // chaveProcesso_ pro mesmo raciocínio (o SENASP reaproveita número de
    // termo por ano, e dois termos iguais no mesmo ano só o SEI separa).
    var chave = r.Processo || (r.Ano + ':' + (r.NumeroSei || r.TermoDoacao || ''));
    if (!grupos[chave]) {
      grupos[chave] = {
        processo: r.Processo,
        numeroSei: r.NumeroSei,
        termoDoacao: r.TermoDoacao,
        donataria: r.Donataria,
        uf: r.UF,
        ente: r.Ente,
        ano: r.Ano,
        mes: r.Mes,
        qtdTotal: 0,
        qtdTransferidos: 0,
        valorTotal: 0,
        veiculos: []
      };
      ordem.push(chave);
    }
    var grupo = grupos[chave];
    grupo.qtdTotal++;
    if (r.Transferido === 'SIM') grupo.qtdTransferidos++;
    grupo.valorTotal += Number(r.ValorVeiculo) || 0;
    grupo.veiculos.push(r);
  });

  return ordem.map(function (chave) { return grupos[chave]; });
}

/**
 * Gera um .xlsx (em base64) com os mesmos dados do painel de detalhamento
 * de UF/Região — cria uma planilha temporária só pra poder usar a URL de
 * exportação do Google Sheets (mesmo truque de exportarPlanilhaComoXlsx_),
 * e apaga a planilha temporária logo em seguida.
 */
function exportarDetalheUFXlsx(valor, ano, transferido, campoFiltro, ente, ufExtra) {
  var registros = listarVeiculosDetalhadosUF_(valor, ano, transferido, campoFiltro, ente, ufExtra);
  var cabecalho = ['Processo', 'Número SEI', 'Donatária', 'UF', 'Ente', 'Termo de Doação', 'Qtd', 'Descrição',
    'Marca', 'Chassi', 'Renavam', 'Placa', 'Ano', 'Mês', 'Transferência', 'Valor'];
  var linhas = registros.map(function (r) {
    return [r.Processo, r.NumeroSei, r.Donataria, r.UF, r.Ente, r.TermoDoacao, r.Qtd, r.Descricao,
      r.Marca, r.Chassi, r.Renavam, r.Placa, r.Ano, r.Mes, r.Transferido, Number(r.ValorVeiculo) || 0];
  });

  var planilhaTemp = SpreadsheetApp.create('tmp_export_detalhe_uf_' + new Date().getTime());
  try {
    var aba = planilhaTemp.getSheets()[0];
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
    if (linhas.length) {
      aba.getRange(2, 1, linhas.length, cabecalho.length).setValues(linhas);
    }
    SpreadsheetApp.flush();

    var url = 'https://docs.google.com/spreadsheets/d/' + planilhaTemp.getId() + '/export?format=xlsx';
    var resposta = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
    return { conteudoBase64: Utilities.base64Encode(resposta.getBlob().getBytes()) };
  } finally {
    DriveApp.getFileById(planilhaTemp.getId()).setTrashed(true);
  }
}

/**
 * Gera um .xlsx (em base64) com os veículos que respeitam os filtros da
 * tela de Processos (mesmos filtros de listarVeiculos — UF, Ente, Ano,
 * Transferido, busca) — ao contrário da listagem em tela, não tem limite
 * de linhas, então exporta tudo que bate com o filtro, não só a página
 * atual. Mesmo truque de planilha temporária de exportarPlanilhaComoXlsx_.
 */
function exportarListagemXlsx(filtros) {
  var registros = listarVeiculos(filtros);
  var cabecalho = ['Processo', 'Donatária', 'UF', 'Ente', 'Termo de Doação', 'Descrição',
    'Marca', 'Chassi', 'Renavam', 'Placa', 'Ano', 'Mês', 'Transferência', 'Valor'];
  var linhas = registros.map(function (r) {
    return [r.NumeroProcesso || r.NumeroSei || '', r.Donataria, r.UF, r.Ente, r.TermoDoacao, r.Descricao,
      r.Marca, r.Chassi, r.Renavam, r.Placa, r.Ano, r.Mes, r.Transferido, Number(r.ValorVeiculo) || 0];
  });

  var planilhaTemp = SpreadsheetApp.create('tmp_export_listagem_' + new Date().getTime());
  try {
    var aba = planilhaTemp.getSheets()[0];
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
    if (linhas.length) {
      aba.getRange(2, 1, linhas.length, cabecalho.length).setValues(linhas);
    }
    SpreadsheetApp.flush();

    var url = 'https://docs.google.com/spreadsheets/d/' + planilhaTemp.getId() + '/export?format=xlsx';
    var resposta = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() } });
    return { conteudoBase64: Utilities.base64Encode(resposta.getBlob().getBytes()) };
  } finally {
    DriveApp.getFileById(planilhaTemp.getId()).setTrashed(true);
  }
}

// Primeiro dia do mês/ano do PROCESSO (não da data de cadastro no sistema —
// que só diz quando o registro foi digitado aqui, útil pra auditoria, mas
// não pra saber há quanto tempo a doação em si está parada).
function dataInicioProcesso_(ano, mes) {
  var idxMes = MESES_VALIDOS.indexOf(mes);
  if (!ano || idxMes === -1) return null;
  return new Date(Number(ano), idxMes, 1);
}

function calcularEstatisticas_(registros) {
  var total = registros.length;
  var porTransferido = contarPor_(registros, 'Transferido');
  var porUF = contarESomarValorPor_(registros, 'UF');
  var porEnte = contarPor_(registros, 'Ente');
  var porAnoMes = {};
  var porDonataria = {};
  var pendentesAntigos = [];
  var agora = new Date();

  registros.forEach(function (r) {
    var chaveTempo = r.Ano + '-' + r.Mes;
    porAnoMes[chaveTempo] = (porAnoMes[chaveTempo] || 0) + 1;

    porDonataria[r.Donataria] = (porDonataria[r.Donataria] || 0) + 1;

    if (r.Transferido === 'NÃO') {
      var dataProcesso = dataInicioProcesso_(r.Ano, r.Mes);
      var dias = dataProcesso ? Math.floor((agora - dataProcesso) / 86400000) : null;
      pendentesAntigos.push({
        TermoDoacao: r.TermoDoacao, Donataria: r.Donataria, UF: r.UF, Placa: r.Placa,
        Chassi: r.Chassi, DiasEmAberto: dias
      });
    }
  });

  pendentesAntigos.sort(function (a, b) { return (b.DiasEmAberto || 0) - (a.DiasEmAberto || 0); });

  return {
    total: total,
    transferidos: porTransferido['SIM'] || 0,
    pendentes: porTransferido['NÃO'] || 0,
    percentualTransferido: total ? Math.round(((porTransferido['SIM'] || 0) / total) * 1000) / 10 : 0,
    porUF: porUF,
    porEnte: paraArrayOrdenado_(porEnte),
    porAnoMes: ordenarSerieTemporal_(porAnoMes),
    donatariasTop10: paraArrayOrdenado_(porDonataria).slice(0, 10),
    pendentesMaisAntigos: pendentesAntigos.slice(0, 15)
  };
}

function contarPor_(registros, campo) {
  var mapa = {};
  registros.forEach(function (r) {
    var chave = r[campo] || '(não informado)';
    mapa[chave] = (mapa[chave] || 0) + 1;
  });
  return mapa;
}

function paraArrayOrdenado_(mapa) {
  return Object.keys(mapa)
    .map(function (chave) { return { chave: chave, total: mapa[chave] }; })
    .sort(function (a, b) { return b.total - a.total; });
}

function ordenarSerieTemporal_(mapa) {
  return Object.keys(mapa)
    .map(function (chave) { return { chave: chave, total: mapa[chave] }; })
    .sort(function (a, b) {
      var pa = a.chave.split('-'), pb = b.chave.split('-');
      var anoA = parseInt(pa[0], 10), anoB = parseInt(pb[0], 10);
      if (anoA !== anoB) return anoA - anoB;
      return MESES_VALIDOS.indexOf(pa[1]) - MESES_VALIDOS.indexOf(pb[1]);
    });
}
