
/**
 * Resumo automático do Relatório de Atividades pra um período: emissões de
 * ATPVe (primeira emissão + 2ª via) e veículos transferidos dentro do
 * período, agrupados por Ano. Restrito a quem tem acesso à aba
 * Produtividade (admins sempre têm; outros usuários, se liberados).
 */
function getResumoAutomaticoPeriodo(dataInicio, dataFim) {
  exigirAcessoProdutividade_();
  if (!dataInicio || !dataFim) throw new Error('Informe o período (data de início e de fim).');

  var registros = listarVeiculos({});
  var emissoesAtpve = 0;
  var transferenciasPorAno = {};

  registros.forEach(function (r) {
    if (dataDentroDoIntervalo_(r.DataEmissaoATPVe, dataInicio, dataFim)) emissoesAtpve++;
    if (dataDentroDoIntervalo_(r.DataEmissaoSegundaViaATPVe, dataInicio, dataFim)) emissoesAtpve++;
    if (dataDentroDoIntervalo_(r.DataTransferencia, dataInicio, dataFim)) {
      var ano = String(r.Ano);
      transferenciasPorAno[ano] = (transferenciasPorAno[ano] || 0) + 1;
    }
  });

  var porAno = Object.keys(transferenciasPorAno).sort().map(function (ano) {
    return { ano: ano, quantidade: transferenciasPorAno[ano] };
  });

  var tepFinalizados = 0;
  getOrCreateSheet_(SHEET_LOG, CABECALHO_LOG).getDataRange().getValues().slice(1).forEach(function (linha) {
    if (linha[2] === 'TEP_FINALIZADO' && dataDentroDoIntervalo_(linha[0], dataInicio, dataFim)) tepFinalizados++;
  });

  return { emissoesAtpve: emissoesAtpve, transferenciasPorAno: porAno, tepFinalizados: tepFinalizados };
}

function chaveRelatorioItens_(dataInicio, dataFim) {
  return dataInicio + '|' + dataFim;
}

/**
 * Devolve os dados manuais (ofícios, e-mails, reconhecimentos de firma
 * etc.) já salvos pra esse período, ou {} se nunca foi salvo antes.
 * Restrito a quem tem acesso à aba Produtividade.
 */
function getDadosManuaisRelatorio(dataInicio, dataFim) {
  exigirAcessoProdutividade_();
  var sheet = getOrCreateSheet_(SHEET_RELATORIO_ITENS, CABECALHO_RELATORIO_ITENS);
  var chave = chaveRelatorioItens_(dataInicio, dataFim);
  var dados = sheet.getDataRange().getValues();
  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0] === chave) {
      try {
        return JSON.parse(dados[i][3] || '{}');
      } catch (e) {
        return {};
      }
    }
  }
  return {};
}

/**
 * Salva (substitui) os dados manuais desse período — objeto livre com os
 * campos preenchidos no formulário (ofícios, e-mails, reconhecimentos de
 * firma etc.). Restrito a quem tem acesso à aba Produtividade.
 */
function salvarDadosManuaisRelatorio(dataInicio, dataFim, dadosManuais) {
  var perfil = exigirAcessoProdutividade_();
  if (!dataInicio || !dataFim) throw new Error('Informe o período (data de início e de fim).');

  var sheet = getOrCreateSheet_(SHEET_RELATORIO_ITENS, CABECALHO_RELATORIO_ITENS);
  var chave = chaveRelatorioItens_(dataInicio, dataFim);
  var dados = sheet.getDataRange().getValues();
  var linha = [chave, dataInicio, dataFim, JSON.stringify(dadosManuais || {}), perfil.email, new Date()];

  for (var i = 1; i < dados.length; i++) {
    if (dados[i][0] === chave) {
      sheet.getRange(i + 1, 1, 1, linha.length).setValues([linha]);
      return { mensagem: 'Dados salvos com sucesso.' };
    }
  }
  sheet.appendRow(linha);
  return { mensagem: 'Dados salvos com sucesso.' };
}
