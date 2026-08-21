
/**
 * Processos com todos os veículos já transferidos (100%) que ainda não
 * tiveram o Termo de Encerramento de Processo (TEP) registrado como
 * finalizado — recalculado na hora a partir da base atual, sem guardar
 * nenhum estado além de "quais chaves já foram finalizadas"
 * (SHEET_TEP_FINALIZADOS). Se novos veículos entrarem depois num processo
 * já concluído (deixando de ser 100%), ele some sozinho dessa lista.
 */
function getProcessosPendentesTep_() {
  var registros = listarVeiculos({});
  var grupos = {};
  var ordem = [];

  registros.forEach(function (r) {
    var chave = chaveProcesso_(r);
    if (!chave) return; // sem Processo nem Termo de Doação — não dá pra rastrear TEP
    if (!grupos[chave]) {
      grupos[chave] = {
        chave: chave, processo: r.NumeroProcesso, termoDoacao: r.TermoDoacao,
        numeroSei: r.NumeroSei,
        donataria: r.Donataria, uf: r.UF, ente: r.Ente, ano: r.Ano, mes: r.Mes,
        qtdTotal: 0, qtdTransferidos: 0, dataConclusao: null
      };
      ordem.push(chave);
    }
    var grupo = grupos[chave];
    grupo.qtdTotal++;
    if (r.Transferido === 'SIM') {
      grupo.qtdTransferidos++;
      // O processo "conclui" no momento em que o último veículo dele é
      // transferido — a maior DataTransferencia do grupo é essa data.
      if (r.DataTransferencia) {
        var dataTransf = new Date(r.DataTransferencia);
        if (!grupo.dataConclusao || dataTransf > grupo.dataConclusao) grupo.dataConclusao = dataTransf;
      }
    }
  });

  var concluidos = ordem
    .map(function (chave) { return grupos[chave]; })
    .filter(function (g) { return g.qtdTotal > 0 && g.qtdTotal === g.qtdTransferidos; });

  var finalizados = {};
  getOrCreateSheet_(SHEET_TEP_FINALIZADOS, CABECALHO_TEP_FINALIZADOS).getDataRange().getValues().slice(1)
    .forEach(function (l) { if (l[0]) finalizados[l[0]] = true; });

  return concluidos.filter(function (g) { return !finalizados[g.chave]; });
}

/**
 * Lista os processos pendentes de TEP — usada pela tela "TEP" pra mostrar
 * o aviso e permitir finalizar. Visível a qualquer usuário logado (só
 * marcar como finalizado exige permissão de edição).
 */
/**
 * apenasNovos=true (padrão da tela): só os processos concluídos depois da
 * última visualização — o normal do dia a dia. apenasNovos=false: TODOS os
 * pendentes, novos ou não (usado pelo link "Ver todos os pendentes", pra
 * nunca perder de vista processos antigos que nunca tiveram TEP feito).
 * Nenhum dos dois marca nada como finalizado — só quem clica em "TEP
 * Finalizado" tira um processo dessa lista de vez.
 *
 * Só devolve os campos que a tela realmente usa, sem o objeto Date de
 * dataConclusao — com centenas de processos acumulados, mandar um Date por
 * item pro navegador via google.script.run vinha falhando (a resposta
 * chegava como null do lado do cliente, apesar de calcular certo aqui no
 * servidor).
 */
function listarTepPendentes(apenasNovos) {
  var perfil = getPerfilUsuarioAtual_();
  var ultimaVisualizacao = getUltimaVisualizacaoTep_(perfil.email);
  var observacoes = getObservacoesTep_();
  var pendentes = getProcessosPendentesTep_().map(function (p) {
    return {
      chave: p.chave,
      processo: p.processo,
      termoDoacao: p.termoDoacao,
      numeroSei: p.numeroSei,
      donataria: p.donataria,
      uf: p.uf,
      ano: p.ano,
      qtdTotal: p.qtdTotal,
      observacao: observacoes[p.chave] || '',
      novo: !ultimaVisualizacao || (!!p.dataConclusao && p.dataConclusao > ultimaVisualizacao)
    };
  });
  return apenasNovos ? pendentes.filter(function (p) { return p.novo; }) : pendentes;
}

/**
 * Processos pendentes de TEP concluídos depois da última vez que esse
 * e-mail visualizou a aba (ou todos, se nunca visualizou).
 */
function getTepNovosParaEmail_(email) {
  var ultimaVisualizacao = getUltimaVisualizacaoTep_(email);
  return getProcessosPendentesTep_().filter(function (p) {
    return !ultimaVisualizacao || (!!p.dataConclusao && p.dataConclusao > ultimaVisualizacao);
  });
}

/**
 * Busca a data/hora gravada como corte de "última visualização" desse
 * e-mail (usada só pra saber o que conta como "novo"), ou null se nunca
 * teve uma gravada. Hoje nada mais escreve nessa aba automaticamente — o
 * aviso de TEP precisa ficar aceso até o processo ser finalizado, não só
 * até a aba ser aberta uma vez.
 */
function getUltimaVisualizacaoTep_(email) {
  var sheet = getOrCreateSheet_(SHEET_TEP_VISUALIZACOES, CABECALHO_TEP_VISUALIZACOES);
  var dados = sheet.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (String(dados[i][0]).trim().toLowerCase() === email.toLowerCase()) {
      return dados[i][1] ? new Date(dados[i][1]) : null;
    }
  }
  return null;
}

/**
 * Quantos processos pendentes de TEP são "novos" (concluíram depois do
 * corte de última visualização gravado pra esse e-mail) — usado pro aviso
 * vermelho do menu e pela visão padrão da aba TEP. Fica assim até o
 * processo ser finalizado (não só até a aba ser aberta).
 */
function contarTepNovos_(email) {
  return getTepNovosParaEmail_(email).length;
}

/**
 * Marca o Termo de Encerramento de Processo (TEP) de um processo como
 * finalizado — some da lista de pendentes e passa a contar
 * automaticamente na produtividade (Relatório de Atividades soma junto
 * com o que for digitado manualmente na linha de "Termo de encerramento
 * de processo administrativo").
 */
// Trava a coluna Chave como texto puro ANTES de gravar, como defesa extra
// contra o autoparser de data/hora do Sheets (motivo pelo qual a chave usa
// '_' e não ':' — ver comentário de chaveProcesso_).
function garantirColunaChaveTepComoTexto_(sheet) {
  var idxChave = CABECALHO_TEP_FINALIZADOS.indexOf('Chave') + 1;
  sheet.getRange(1, idxChave, sheet.getMaxRows(), 1).setNumberFormat('@');
}

function marcarTepFinalizado(chaveProcesso) {
  var perfil = exigirPerfilEditor_();
  chaveProcesso = normalizarTexto_(chaveProcesso);
  if (!chaveProcesso) throw new Error('Processo inválido.');

  var sheet = getOrCreateSheet_(SHEET_TEP_FINALIZADOS, CABECALHO_TEP_FINALIZADOS);
  garantirColunaChaveTepComoTexto_(sheet);
  var dados = sheet.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0] === chaveProcesso) {
      return { mensagem: 'Esse processo já tinha o TEP finalizado.' };
    }
  }
  sheet.appendRow([chaveProcesso, new Date(), perfil.email]);
  registrarLog_('TEP_FINALIZADO', chaveProcesso, 'Termo de Encerramento de Processo finalizado');
  return { mensagem: 'TEP finalizado com sucesso — já computado na produtividade.' };
}

/**
 * Chave -> texto de observação, pra "juntar" com getProcessosPendentesTep_()
 * em listarTepPendentes. Uma linha por processo (ver CABECALHO_TEP_OBSERVACOES).
 */
function getObservacoesTep_() {
  var sheet = getOrCreateSheet_(SHEET_TEP_OBSERVACOES, CABECALHO_TEP_OBSERVACOES);
  var dados = sheet.getDataRange().getValues();
  var mapa = {};
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0]) mapa[dados[i][0]] = dados[i][1];
  }
  return mapa;
}

/**
 * Grava (ou atualiza) a observação de um processo pendente de TEP — motivo
 * pelo qual ele ainda não foi encerrado, anotação livre de quem estiver
 * acompanhando. Upsert por Chave: se já existe linha pra essa chave,
 * atualiza; senão, adiciona uma nova.
 */
function salvarObservacaoTep(chaveProcesso, observacao) {
  var perfil = exigirPerfilEditor_();
  chaveProcesso = normalizarTexto_(chaveProcesso);
  if (!chaveProcesso) throw new Error('Processo inválido.');
  observacao = normalizarTexto_(observacao);

  var sheet = getOrCreateSheet_(SHEET_TEP_OBSERVACOES, CABECALHO_TEP_OBSERVACOES);
  // Mesma defesa usada em garantirColunaChaveTepComoTexto_: trava a coluna
  // Chave como texto puro antes de gravar, pra evitar que o autoparser do
  // Sheets corrompa chaves que pareçam data/hora.
  sheet.getRange(1, 1, sheet.getMaxRows(), 1).setNumberFormat('@');

  var dados = sheet.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0] === chaveProcesso) {
      sheet.getRange(i + 1, 2, 1, 3).setValues([[observacao, perfil.email, new Date()]]);
      registrarLog_('TEP_OBSERVACAO', chaveProcesso, observacao);
      return { mensagem: 'Observação salva com sucesso.' };
    }
  }
  sheet.appendRow([chaveProcesso, observacao, perfil.email, new Date()]);
  registrarLog_('TEP_OBSERVACAO', chaveProcesso, observacao);
  return { mensagem: 'Observação salva com sucesso.' };
}
