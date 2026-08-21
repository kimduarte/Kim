
// ======================================================================
// PRODUTIVIDADE — MODELO 2 ("clique e conte")
//
// Alternativa ao Relatório de Produtividade original (Modelo 1, baseado em
// emissão de 2ª via de ATPVe) — nenhum dos dois substitui o outro, os dois
// continuam existindo em paralelo (ver abrirEscolhaModeloProdutividade_ no
// cliente). Cada clique em "+1" grava UMA linha aqui (não soma um contador
// corrente) — dá pra somar por qualquer período depois (dia, semana, mês)
// na hora de prestar contas, e também saber exatamente quando cada ação
// aconteceu. A observação é sempre opcional — a ideia central é o clique
// rápido, sem travar quem só quer contar.
// ======================================================================

var SHEET_PRODUTIVIDADE_CLIQUES = 'ProdutividadeCliques';
var CABECALHO_PRODUTIVIDADE_CLIQUES = ['DataHora', 'Usuario', 'Variavel', 'Observacao'];

// Precisa bater exatamente com VARIAVEIS_PRODUTIVIDADE_CLIQUE_ no cliente
// (PaginaCompleta.html) — os rótulos ficam só lá; aqui só valida a chave.
var VARIAVEIS_PRODUTIVIDADE_CLIQUE_VALIDAS_ = [
  'OficiosDetran', 'OficiosExclusaoBeneficio', 'AutorizacoesRepresentacao', 'ReconhecimentoFirma',
  'TratativasEstampagem', 'TratativasDebitos', 'EmailTransferencia', 'EmailExclusaoBeneficio',
  'ExpedEnviado', 'BaixaEnviada', 'TermoEncerramento', 'IpvaOficio', 'PagamentoCartorio'
];

function registrarCliqueProdutividade(variavel, observacao) {
  var perfil = exigirAcessoProdutividade_();
  if (VARIAVEIS_PRODUTIVIDADE_CLIQUE_VALIDAS_.indexOf(variavel) === -1) {
    throw new Error('Variável de produtividade inválida: ' + variavel);
  }
  var sheet = getOrCreateSheet_(SHEET_PRODUTIVIDADE_CLIQUES, CABECALHO_PRODUTIVIDADE_CLIQUES);
  sheet.appendRow([new Date(), perfil.email, variavel, normalizarTexto_(observacao)]);
  return { ok: true };
}

/**
 * Contagem de hoje (fuso do script) por variável, só do usuário logado —
 * alimenta o "Hoje: N" ao lado de cada botão "+1" na tela de clique.
 */
function getContagemCliquesHoje() {
  var perfil = exigirAcessoProdutividade_();
  var sheet = getOrCreateSheet_(SHEET_PRODUTIVIDADE_CLIQUES, CABECALHO_PRODUTIVIDADE_CLIQUES);
  var dados = sheet.getDataRange().getValues();
  var hojeChave = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var emailAtual = perfil.email.trim().toLowerCase();

  var contagens = {};
  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (!linha[0]) continue;
    if (String(linha[1] || '').trim().toLowerCase() !== emailAtual) continue;
    var chaveData = Utilities.formatDate(new Date(linha[0]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (chaveData !== hojeChave) continue;
    contagens[linha[2]] = (contagens[linha[2]] || 0) + 1;
  }
  return contagens;
}

/**
 * Relatório agregado do Modelo 2 pra um período — usado tanto por quem só
 * quer ver a própria produtividade quanto (mais importante) por quem junta
 * a produtividade de todo mundo pra prestação de contas. Agrupa por
 * usuário (nome, quando cadastrado em Usuarios) e por variável.
 */
function getRelatorioCliquesProdutividade(dataInicio, dataFim) {
  exigirAcessoProdutividade_();
  if (!dataInicio || !dataFim) throw new Error('Informe o período (data de início e de fim).');

  var sheetUsuarios = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  var nomesPorEmail = {};
  sheetUsuarios.getDataRange().getValues().slice(1).forEach(function (linha) {
    if (linha[0]) nomesPorEmail[String(linha[0]).trim().toLowerCase()] = linha[3] || linha[0];
  });

  var sheet = getOrCreateSheet_(SHEET_PRODUTIVIDADE_CLIQUES, CABECALHO_PRODUTIVIDADE_CLIQUES);
  var dados = sheet.getDataRange().getValues();

  var porUsuario = {};
  var totalPorVariavel = {};
  var totalGeral = 0;

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (!linha[0]) continue;
    if (!dataDentroDoIntervalo_(linha[0], dataInicio, dataFim)) continue;

    var email = String(linha[1] || '').trim().toLowerCase();
    var nome = nomesPorEmail[email] || email || 'Desconhecido';
    var variavel = linha[2];

    if (!porUsuario[nome]) porUsuario[nome] = { usuario: nome, porVariavel: {}, total: 0 };
    porUsuario[nome].porVariavel[variavel] = (porUsuario[nome].porVariavel[variavel] || 0) + 1;
    porUsuario[nome].total++;
    totalPorVariavel[variavel] = (totalPorVariavel[variavel] || 0) + 1;
    totalGeral++;
  }

  var usuarios = Object.keys(porUsuario).map(function (nome) { return porUsuario[nome]; })
    .sort(function (a, b) { return b.total - a.total || a.usuario.localeCompare(b.usuario); });

  return { usuarios: usuarios, totalPorVariavel: totalPorVariavel, totalGeral: totalGeral };
}

/**
 * Só os cliques do próprio usuário logado, num período — alimenta o "Meu
 * relatório em texto" (mesmo estilo redigido do Relatório de Atividades
 * original), sem misturar com os números de outras pessoas.
 */
function getMeuRelatorioCliquesProdutividade(dataInicio, dataFim) {
  var perfil = exigirAcessoProdutividade_();
  if (!dataInicio || !dataFim) throw new Error('Informe o período (data de início e de fim).');

  var sheet = getOrCreateSheet_(SHEET_PRODUTIVIDADE_CLIQUES, CABECALHO_PRODUTIVIDADE_CLIQUES);
  var dados = sheet.getDataRange().getValues();
  var emailAtual = perfil.email.trim().toLowerCase();

  var porVariavel = {};
  var observacoesPorVariavel = {};
  var total = 0;

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (!linha[0]) continue;
    if (String(linha[1] || '').trim().toLowerCase() !== emailAtual) continue;
    if (!dataDentroDoIntervalo_(linha[0], dataInicio, dataFim)) continue;

    var variavel = linha[2];
    porVariavel[variavel] = (porVariavel[variavel] || 0) + 1;
    total++;
    if (linha[3]) {
      if (!observacoesPorVariavel[variavel]) observacoesPorVariavel[variavel] = [];
      observacoesPorVariavel[variavel].push(String(linha[3]));
    }
  }

  return { porVariavel: porVariavel, observacoesPorVariavel: observacoesPorVariavel, total: total };
}

/**
 * Cliques de HOJE do próprio usuário logado, mais recente primeiro — usado
 * pra montar a lista "Meus registros de hoje", com a opção de desfazer um
 * clique feito por engano.
 */
function listarMeusCliquesHoje() {
  var perfil = exigirAcessoProdutividade_();
  var sheet = getOrCreateSheet_(SHEET_PRODUTIVIDADE_CLIQUES, CABECALHO_PRODUTIVIDADE_CLIQUES);
  var dados = sheet.getDataRange().getValues();
  var hojeChave = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var emailAtual = perfil.email.trim().toLowerCase();
  var fuso = Session.getScriptTimeZone();

  var itens = [];
  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (!linha[0]) continue;
    if (String(linha[1] || '').trim().toLowerCase() !== emailAtual) continue;
    var chaveData = Utilities.formatDate(new Date(linha[0]), fuso, 'yyyy-MM-dd');
    if (chaveData !== hojeChave) continue;
    itens.push({
      dataHoraOrdenacao: new Date(linha[0]).getTime(),
      dataHoraIso: new Date(linha[0]).toISOString(),
      dataHora: Utilities.formatDate(new Date(linha[0]), fuso, 'HH:mm'),
      variavel: linha[2],
      observacao: linha[3] || ''
    });
  }
  itens.sort(function (a, b) { return b.dataHoraOrdenacao - a.dataHoraOrdenacao; });
  itens.forEach(function (item) { delete item.dataHoraOrdenacao; });
  return itens;
}

/**
 * Desfaz um clique feito por engano — só o dono do clique pode apagar o
 * próprio registro (identificado pelo par variável + data/hora exata, já
 * que não há um ID próprio por linha). Sem restrição de admin: a ideia é
 * corrigir um clique errado na hora, não reabrir período já fechado —
 * quem precisar mexer em registros antigos pode editar a aba
 * "ProdutividadeCliques" direto na planilha.
 */
function excluirCliqueProdutividade(dataHoraIso, variavel) {
  var perfil = exigirAcessoProdutividade_();
  if (!dataHoraIso || !variavel) throw new Error('Registro inválido.');
  var alvo = new Date(dataHoraIso).getTime();
  var emailAtual = perfil.email.trim().toLowerCase();

  var sheet = getOrCreateSheet_(SHEET_PRODUTIVIDADE_CLIQUES, CABECALHO_PRODUTIVIDADE_CLIQUES);
  var dados = sheet.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (!linha[0]) continue;
    if (String(linha[1] || '').trim().toLowerCase() !== emailAtual) continue;
    if (linha[2] !== variavel) continue;
    if (new Date(linha[0]).getTime() !== alvo) continue;
    sheet.deleteRow(i + 1);
    return { mensagem: 'Registro desfeito com sucesso.' };
  }
  throw new Error('Registro não encontrado — pode já ter sido desfeito.');
}
