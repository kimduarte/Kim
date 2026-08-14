/**
 * CodigoCompleto.gs — Controle Financeiro & Quitação de Empréstimos
 *
 * Instalação: crie uma planilha Google nova, abra Extensões > Apps Script,
 * apague o conteúdo de "Código.gs" e cole este arquivo inteiro no lugar.
 * Depois crie um arquivo HTML chamado "PaginaCompleta" (Arquivo > Novo >
 * Arquivo HTML) e cole o conteúdo de PaginaCompleta.html nele. Salve, volte
 * para a planilha, recarregue a página e use o menu
 * "Controle Financeiro > Criar estrutura inicial". Depois publique como
 * app da Web (Implantar > Nova implantação > App da Web) para acessar pelo
 * celular também.
 *
 * Ferramenta de uso pessoal (não tem controle de múltiplos perfis de
 * acesso como o sistema de veículos deste mesmo repositório).
 */

// ======================================================================
// CONSTANTES — nomes de abas, cabeçalhos e listas de domínio
// ======================================================================

var SHEET_LANCAMENTOS = 'Lancamentos';
var SHEET_EMPRESTIMOS = 'Emprestimos';
var SHEET_PAGAMENTOS = 'PagamentosEmprestimo';
var SHEET_CONFIG = 'Config';

var CABECALHO_LANCAMENTOS = ['ID', 'Data', 'Tipo', 'Categoria', 'Descricao', 'Valor', 'FormaPagamento', 'Observacoes', 'CriadoEm'];
var CABECALHO_EMPRESTIMOS = ['ID', 'Nome', 'Credor', 'ValorOriginal', 'SaldoDevedor', 'TaxaJurosMensal', 'ParcelaMinima', 'DiaVencimento', 'DataInicio', 'Status', 'Observacoes', 'CriadoEm', 'AtualizadoEm'];
var CABECALHO_PAGAMENTOS = ['ID', 'EmprestimoID', 'Data', 'ValorPago', 'ValorJuros', 'ValorAmortizado', 'SaldoApos', 'Observacoes', 'CriadoEm'];
var CABECALHO_CONFIG = ['Chave', 'Valor'];

var TIPO_ENTRADA = 'Entrada';
var TIPO_SAIDA = 'Saída';
var TIPOS_LANCAMENTO = [TIPO_ENTRADA, TIPO_SAIDA];

var CATEGORIAS_ENTRADA = ['Salário', 'Freelance/Renda extra', 'Rendimentos', 'Reembolso', 'Outros'];
var CATEGORIAS_SAIDA = ['Moradia', 'Contas (água/luz/internet)', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Assinaturas', 'Cuidado pessoal', 'Outros'];

var FORMAS_PAGAMENTO = ['Dinheiro', 'Débito', 'Crédito', 'Pix', 'Transferência', 'Boleto'];

var STATUS_EMPRESTIMO_ATIVO = 'Ativo';
var STATUS_EMPRESTIMO_QUITADO = 'Quitado';
var STATUS_EMPRESTIMO = [STATUS_EMPRESTIMO_ATIVO, STATUS_EMPRESTIMO_QUITADO];

var CHAVE_APORTE_MANUAL = 'AporteExtraManual';
var CHAVE_MESES_HISTORICO = 'MesesHistoricoMedia';
var MESES_HISTORICO_PADRAO = 3;

// Trava de segurança da simulação: nenhum plano de quitação realista passa
// disso — evita loop infinito se o aporte informado for pequeno demais
// perto dos juros (dívida que só cresce).
var LIMITE_MESES_SIMULACAO = 600;

var TOLERANCIA_CENTAVOS = 0.005;

// ======================================================================
// UTILS
// ======================================================================

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(nome, cabecalho) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(nome);
  if (!sheet) {
    sheet = ss.insertSheet(nome);
  }
  if (cabecalho && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#4f46e5').setFontColor('#ffffff');
  }
  return sheet;
}

function normalizarTexto_(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/\s+/g, ' ').trim();
}

function paraNumero_(valor) {
  if (typeof valor === 'number') return valor;
  var texto = normalizarTexto_(valor).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  var n = parseFloat(texto);
  return isNaN(n) ? 0 : n;
}

function paraData_(valor) {
  if (valor instanceof Date) return valor;
  var d = new Date(valor);
  return isNaN(d.getTime()) ? new Date() : d;
}

function formatarChaveMesAno_(data) {
  return data.getFullYear() + '-' + ('0' + (data.getMonth() + 1)).slice(-2);
}

function somarMeses_(data, quantidade) {
  var d = new Date(data.getTime());
  d.setMonth(d.getMonth() + quantidade);
  return d;
}

function gerarId_(prefixo) {
  return prefixo + '-' + Utilities.getUuid().slice(0, 8);
}

function linhaParaObjeto_(cabecalho, linha) {
  var obj = {};
  cabecalho.forEach(function (campo, i) { obj[campo] = linha[i]; });
  return obj;
}

function encontrarLinhaPorId_(sheet, id) {
  var valores = sheet.getDataRange().getValues();
  for (var i = 1; i < valores.length; i++) {
    if (String(valores[i][0]) === String(id)) return i + 1;
  }
  return null;
}

// ======================================================================
// SETUP — cria a estrutura da planilha
// ======================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Controle Financeiro')
    .addItem('1) Criar estrutura inicial', 'criarEstruturaInicial')
    .addToUi();
}

function criarEstruturaInicial() {
  criarAbaLancamentos_();
  criarAbaEmprestimos_();
  getOrCreateSheet_(SHEET_PAGAMENTOS, CABECALHO_PAGAMENTOS);
  criarAbaConfig_();
  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast('Estrutura criada com sucesso.', 'Controle Financeiro');
}

function criarAbaLancamentos_() {
  var sheet = getOrCreateSheet_(SHEET_LANCAMENTOS, CABECALHO_LANCAMENTOS);
  sheet.setColumnWidths(1, CABECALHO_LANCAMENTOS.length, 130);
  sheet.setColumnWidth(CABECALHO_LANCAMENTOS.indexOf('Descricao') + 1, 240);
  sheet.setColumnWidth(CABECALHO_LANCAMENTOS.indexOf('Observacoes') + 1, 240);
  return sheet;
}

function criarAbaEmprestimos_() {
  var sheet = getOrCreateSheet_(SHEET_EMPRESTIMOS, CABECALHO_EMPRESTIMOS);
  sheet.setColumnWidths(1, CABECALHO_EMPRESTIMOS.length, 130);
  sheet.setColumnWidth(CABECALHO_EMPRESTIMOS.indexOf('Nome') + 1, 200);
  sheet.setColumnWidth(CABECALHO_EMPRESTIMOS.indexOf('Observacoes') + 1, 240);
  return sheet;
}

function criarAbaConfig_() {
  var sheet = getOrCreateSheet_(SHEET_CONFIG, CABECALHO_CONFIG);
  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, 2, 2).setValues([
      [CHAVE_APORTE_MANUAL, ''],
      [CHAVE_MESES_HISTORICO, MESES_HISTORICO_PADRAO]
    ]);
  }
  return sheet;
}

function getConfigMap_() {
  var sheet = getOrCreateSheet_(SHEET_CONFIG, CABECALHO_CONFIG);
  var valores = sheet.getDataRange().getValues();
  var mapa = {};
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][0]) mapa[normalizarTexto_(valores[i][0])] = valores[i][1];
  }
  return mapa;
}

function setConfigValor_(chave, valor) {
  var sheet = getOrCreateSheet_(SHEET_CONFIG, CABECALHO_CONFIG);
  var valores = sheet.getDataRange().getValues();
  for (var i = 1; i < valores.length; i++) {
    if (normalizarTexto_(valores[i][0]) === chave) {
      sheet.getRange(i + 1, 2).setValue(valor);
      return;
    }
  }
  sheet.appendRow([chave, valor]);
}

/**
 * Salva as preferências editáveis pela tela (aporte extra manual e quantos
 * meses de histórico usar na média de renda/despesa). Envie '' em
 * aporteExtraManual para voltar ao cálculo automático.
 */
function salvarConfiguracoes(dados) {
  var aporte = normalizarTexto_(dados.aporteExtraManual);
  setConfigValor_(CHAVE_APORTE_MANUAL, aporte === '' ? '' : paraNumero_(aporte));
  var meses = parseInt(dados.mesesHistorico, 10);
  setConfigValor_(CHAVE_MESES_HISTORICO, meses > 0 ? meses : MESES_HISTORICO_PADRAO);
  return getPainel();
}

// ======================================================================
// WEB APP
// ======================================================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('PaginaCompleta')
    .setTitle('Controle Financeiro & Quitação de Empréstimos')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getContextoInicial() {
  var config = getConfigMap_();
  return {
    listas: {
      tipo: TIPOS_LANCAMENTO,
      categoriaEntrada: CATEGORIAS_ENTRADA,
      categoriaSaida: CATEGORIAS_SAIDA,
      formaPagamento: FORMAS_PAGAMENTO,
      statusEmprestimo: STATUS_EMPRESTIMO
    },
    configuracoes: {
      aporteExtraManual: config[CHAVE_APORTE_MANUAL] || '',
      mesesHistorico: Number(config[CHAVE_MESES_HISTORICO]) || MESES_HISTORICO_PADRAO
    }
  };
}

// ======================================================================
// LANÇAMENTOS (entradas/saídas do dia a dia)
// ======================================================================

function listarLancamentos(filtros) {
  filtros = filtros || {};
  var sheet = getOrCreateSheet_(SHEET_LANCAMENTOS, CABECALHO_LANCAMENTOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var resultado = [];

  var busca = filtros.busca ? normalizarTexto_(filtros.busca).toUpperCase() : '';

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);
    var data = paraData_(registro.Data);
    var chaveMes = formatarChaveMesAno_(data);

    if (filtros.mesAno && chaveMes !== filtros.mesAno) continue;
    if (filtros.tipo && registro.Tipo !== filtros.tipo) continue;
    if (filtros.categoria && registro.Categoria !== filtros.categoria) continue;
    if (busca) {
      var alvo = [registro.Descricao, registro.Categoria, registro.Observacoes].join(' ').toUpperCase();
      if (alvo.indexOf(busca) === -1) continue;
    }

    registro.Data = data.getTime();
    registro.Valor = paraNumero_(registro.Valor);
    resultado.push(registro);
  }

  resultado.sort(function (a, b) { return b.Data - a.Data; });
  return resultado;
}

function salvarLancamento(dados) {
  var erros = [];
  var tipo = normalizarTexto_(dados.Tipo);
  var categoria = normalizarTexto_(dados.Categoria);
  var descricao = normalizarTexto_(dados.Descricao);
  var valor = paraNumero_(dados.Valor);
  var data = paraData_(dados.Data);

  if (TIPOS_LANCAMENTO.indexOf(tipo) === -1) erros.push('Tipo inválido: ' + dados.Tipo);
  if (!categoria) erros.push('Categoria é obrigatória.');
  if (!descricao) erros.push('Descrição é obrigatória.');
  if (!valor || valor <= 0) erros.push('Valor precisa ser maior que zero.');
  if (erros.length) throw new Error(erros.join('\n'));

  var sheet = getOrCreateSheet_(SHEET_LANCAMENTOS, CABECALHO_LANCAMENTOS);
  var registro = {
    Data: data,
    Tipo: tipo,
    Categoria: categoria,
    Descricao: descricao,
    Valor: valor,
    FormaPagamento: normalizarTexto_(dados.FormaPagamento),
    Observacoes: normalizarTexto_(dados.Observacoes)
  };

  if (dados.ID) {
    var linhaIdx = encontrarLinhaPorId_(sheet, dados.ID);
    if (!linhaIdx) throw new Error('Lançamento não encontrado: ' + dados.ID);
    CABECALHO_LANCAMENTOS.forEach(function (campo) {
      if (['ID', 'CriadoEm'].indexOf(campo) !== -1) return;
      sheet.getRange(linhaIdx, CABECALHO_LANCAMENTOS.indexOf(campo) + 1).setValue(registro[campo]);
    });
    return { ID: dados.ID, mensagem: 'Lançamento atualizado.' };
  }

  var id = gerarId_('LC');
  var linha = CABECALHO_LANCAMENTOS.map(function (campo) {
    if (campo === 'ID') return id;
    if (campo === 'CriadoEm') return new Date();
    return registro[campo];
  });
  sheet.appendRow(linha);
  return { ID: id, mensagem: 'Lançamento adicionado.' };
}

function excluirLancamento(id) {
  var sheet = getOrCreateSheet_(SHEET_LANCAMENTOS, CABECALHO_LANCAMENTOS);
  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Lançamento não encontrado: ' + id);
  sheet.deleteRow(linhaIdx);
  return { mensagem: 'Lançamento excluído.' };
}

// ======================================================================
// EMPRÉSTIMOS
// ======================================================================

function listarEmprestimos() {
  var sheet = getOrCreateSheet_(SHEET_EMPRESTIMOS, CABECALHO_EMPRESTIMOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var resultado = [];

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);
    registro.ValorOriginal = paraNumero_(registro.ValorOriginal);
    registro.SaldoDevedor = paraNumero_(registro.SaldoDevedor);
    registro.TaxaJurosMensal = paraNumero_(registro.TaxaJurosMensal);
    registro.ParcelaMinima = paraNumero_(registro.ParcelaMinima);
    registro.PercentualQuitado = registro.ValorOriginal > 0
      ? Math.max(0, Math.min(100, (1 - registro.SaldoDevedor / registro.ValorOriginal) * 100))
      : 0;
    registro.DataInicio = registro.DataInicio ? paraData_(registro.DataInicio).getTime() : null;
    resultado.push(registro);
  }

  resultado.sort(function (a, b) { return b.SaldoDevedor - a.SaldoDevedor; });
  return resultado;
}

function salvarEmprestimo(dados) {
  var erros = [];
  var nome = normalizarTexto_(dados.Nome);
  var valorOriginal = paraNumero_(dados.ValorOriginal);
  var taxaJuros = paraNumero_(dados.TaxaJurosMensal);
  var parcelaMinima = paraNumero_(dados.ParcelaMinima);
  var status = normalizarTexto_(dados.Status) || STATUS_EMPRESTIMO_ATIVO;

  if (!nome) erros.push('Nome do empréstimo é obrigatório.');
  if (!valorOriginal || valorOriginal <= 0) erros.push('Valor original precisa ser maior que zero.');
  if (taxaJuros < 0) erros.push('Taxa de juros não pode ser negativa.');
  if (!parcelaMinima || parcelaMinima <= 0) erros.push('Parcela mínima precisa ser maior que zero.');
  if (STATUS_EMPRESTIMO.indexOf(status) === -1) erros.push('Status inválido: ' + status);
  if (erros.length) throw new Error(erros.join('\n'));

  var sheet = getOrCreateSheet_(SHEET_EMPRESTIMOS, CABECALHO_EMPRESTIMOS);
  var agora = new Date();

  if (dados.ID) {
    var linhaIdx = encontrarLinhaPorId_(sheet, dados.ID);
    if (!linhaIdx) throw new Error('Empréstimo não encontrado: ' + dados.ID);
    var saldoAtual = dados.SaldoDevedor !== undefined && dados.SaldoDevedor !== ''
      ? paraNumero_(dados.SaldoDevedor) : paraNumero_(sheet.getRange(linhaIdx, CABECALHO_EMPRESTIMOS.indexOf('SaldoDevedor') + 1).getValue());
    var registro = {
      Nome: nome, Credor: normalizarTexto_(dados.Credor), ValorOriginal: valorOriginal,
      SaldoDevedor: saldoAtual, TaxaJurosMensal: taxaJuros, ParcelaMinima: parcelaMinima,
      DiaVencimento: normalizarTexto_(dados.DiaVencimento),
      DataInicio: dados.DataInicio ? paraData_(dados.DataInicio) : sheet.getRange(linhaIdx, CABECALHO_EMPRESTIMOS.indexOf('DataInicio') + 1).getValue(),
      Status: saldoAtual <= TOLERANCIA_CENTAVOS ? STATUS_EMPRESTIMO_QUITADO : status,
      Observacoes: normalizarTexto_(dados.Observacoes), AtualizadoEm: agora
    };
    Object.keys(registro).forEach(function (campo) {
      sheet.getRange(linhaIdx, CABECALHO_EMPRESTIMOS.indexOf(campo) + 1).setValue(registro[campo]);
    });
    return { ID: dados.ID, mensagem: 'Empréstimo atualizado.' };
  }

  var id = gerarId_('EMP');
  var saldoInicial = dados.SaldoDevedor !== undefined && dados.SaldoDevedor !== '' ? paraNumero_(dados.SaldoDevedor) : valorOriginal;
  var linha = CABECALHO_EMPRESTIMOS.map(function (campo) {
    switch (campo) {
      case 'ID': return id;
      case 'Nome': return nome;
      case 'Credor': return normalizarTexto_(dados.Credor);
      case 'ValorOriginal': return valorOriginal;
      case 'SaldoDevedor': return saldoInicial;
      case 'TaxaJurosMensal': return taxaJuros;
      case 'ParcelaMinima': return parcelaMinima;
      case 'DiaVencimento': return normalizarTexto_(dados.DiaVencimento);
      case 'DataInicio': return dados.DataInicio ? paraData_(dados.DataInicio) : agora;
      case 'Status': return saldoInicial <= TOLERANCIA_CENTAVOS ? STATUS_EMPRESTIMO_QUITADO : status;
      case 'Observacoes': return normalizarTexto_(dados.Observacoes);
      case 'CriadoEm': return agora;
      case 'AtualizadoEm': return agora;
      default: return '';
    }
  });
  sheet.appendRow(linha);
  return { ID: id, mensagem: 'Empréstimo cadastrado.' };
}

function excluirEmprestimo(id) {
  var sheet = getOrCreateSheet_(SHEET_EMPRESTIMOS, CABECALHO_EMPRESTIMOS);
  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Empréstimo não encontrado: ' + id);
  sheet.deleteRow(linhaIdx);
  return { mensagem: 'Empréstimo excluído.' };
}

/**
 * Registra um pagamento feito num empréstimo e atualiza o saldo devedor.
 * Assume um único período de juros desde o último pagamento (a taxa mensal
 * cadastrada é aplicada uma vez sobre o saldo atual) — é uma estimativa,
 * não uma tabela de amortização exata do contrato.
 */
function registrarPagamentoEmprestimo(dados) {
  var emprestimoId = dados.EmprestimoID;
  var valorPago = paraNumero_(dados.ValorPago);
  if (!emprestimoId) throw new Error('Empréstimo não informado.');
  if (!valorPago || valorPago <= 0) throw new Error('Valor pago precisa ser maior que zero.');

  var sheetEmp = getOrCreateSheet_(SHEET_EMPRESTIMOS, CABECALHO_EMPRESTIMOS);
  var linhaIdx = encontrarLinhaPorId_(sheetEmp, emprestimoId);
  if (!linhaIdx) throw new Error('Empréstimo não encontrado: ' + emprestimoId);

  var colSaldo = CABECALHO_EMPRESTIMOS.indexOf('SaldoDevedor') + 1;
  var colTaxa = CABECALHO_EMPRESTIMOS.indexOf('TaxaJurosMensal') + 1;
  var colStatus = CABECALHO_EMPRESTIMOS.indexOf('Status') + 1;
  var colAtualizadoEm = CABECALHO_EMPRESTIMOS.indexOf('AtualizadoEm') + 1;
  var colNome = CABECALHO_EMPRESTIMOS.indexOf('Nome') + 1;

  var saldoAtual = paraNumero_(sheetEmp.getRange(linhaIdx, colSaldo).getValue());
  var taxaMensal = paraNumero_(sheetEmp.getRange(linhaIdx, colTaxa).getValue()) / 100;
  var nomeEmprestimo = sheetEmp.getRange(linhaIdx, colNome).getValue();

  var valorJuros = Math.round(saldoAtual * taxaMensal * 100) / 100;
  var valorAmortizado = valorPago - valorJuros;
  var novoSaldo = Math.max(0, Math.round((saldoAtual - valorAmortizado) * 100) / 100);

  sheetEmp.getRange(linhaIdx, colSaldo).setValue(novoSaldo);
  sheetEmp.getRange(linhaIdx, colAtualizadoEm).setValue(new Date());
  if (novoSaldo <= TOLERANCIA_CENTAVOS) {
    sheetEmp.getRange(linhaIdx, colStatus).setValue(STATUS_EMPRESTIMO_QUITADO);
  }

  var sheetPag = getOrCreateSheet_(SHEET_PAGAMENTOS, CABECALHO_PAGAMENTOS);
  var id = gerarId_('PAG');
  sheetPag.appendRow([
    id, emprestimoId, paraData_(dados.Data), valorPago, valorJuros, valorAmortizado, novoSaldo,
    normalizarTexto_(dados.Observacoes), new Date()
  ]);

  var mensagem = novoSaldo <= TOLERANCIA_CENTAVOS
    ? 'Pagamento registrado — "' + nomeEmprestimo + '" foi quitado! 🎉'
    : 'Pagamento registrado. Novo saldo devedor: ' + novoSaldo.toFixed(2);

  return { ID: id, saldoApos: novoSaldo, valorJuros: valorJuros, valorAmortizado: valorAmortizado, mensagem: mensagem };
}

function listarPagamentos(emprestimoId) {
  var sheet = getOrCreateSheet_(SHEET_PAGAMENTOS, CABECALHO_PAGAMENTOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var resultado = [];
  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    if (emprestimoId && String(linha[1]) !== String(emprestimoId)) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);
    registro.Data = paraData_(registro.Data).getTime();
    resultado.push(registro);
  }
  resultado.sort(function (a, b) { return b.Data - a.Data; });
  return resultado;
}

// ======================================================================
// PAINEL — resumo do mês, aporte extra disponível e simulação de quitação
// ======================================================================

/**
 * Calcula quanto sobra por mês, além das parcelas mínimas, para acelerar a
 * quitação — a partir da média de entradas/saídas dos últimos N meses
 * fechados (não conta o mês atual, que ainda está incompleto). Pode ser
 * substituído por um valor manual, definido na tela de configurações.
 */
function calcularAporteExtra_(emprestimosAtivos) {
  var config = getConfigMap_();
  var manual = config[CHAVE_APORTE_MANUAL];
  if (manual !== undefined && manual !== '' && !isNaN(Number(manual)) && Number(manual) >= 0) {
    return { valor: Number(manual), origem: 'manual' };
  }

  var mesesHistorico = Number(config[CHAVE_MESES_HISTORICO]) || MESES_HISTORICO_PADRAO;
  var sheet = getOrCreateSheet_(SHEET_LANCAMENTOS, CABECALHO_LANCAMENTOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];

  var hoje = new Date();
  var inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  var totaisPorMes = {};

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);
    var data = paraData_(registro.Data);
    if (data >= inicioMesAtual) continue; // ignora o mês corrente (incompleto)

    var chave = formatarChaveMesAno_(data);
    if (!totaisPorMes[chave]) totaisPorMes[chave] = { entradas: 0, saidas: 0 };
    var valor = paraNumero_(registro.Valor);
    if (registro.Tipo === TIPO_ENTRADA) totaisPorMes[chave].entradas += valor;
    else if (registro.Tipo === TIPO_SAIDA) totaisPorMes[chave].saidas += valor;
  }

  var chaves = Object.keys(totaisPorMes).sort().reverse().slice(0, mesesHistorico);
  var totalEntradas = 0, totalSaidas = 0;
  chaves.forEach(function (chave) {
    totalEntradas += totaisPorMes[chave].entradas;
    totalSaidas += totaisPorMes[chave].saidas;
  });

  var mesesComDados = chaves.length || 1;
  var rendaMedia = totalEntradas / mesesComDados;
  var despesaMedia = totalSaidas / mesesComDados;
  var somaParcelasMinimas = emprestimosAtivos.reduce(function (soma, e) { return soma + e.ParcelaMinima; }, 0);
  var aporte = Math.max(0, rendaMedia - despesaMedia - somaParcelasMinimas);

  return {
    valor: Math.round(aporte * 100) / 100,
    origem: chaves.length ? 'automatico' : 'sem_historico',
    detalhes: {
      rendaMedia: Math.round(rendaMedia * 100) / 100,
      despesaMedia: Math.round(despesaMedia * 100) / 100,
      somaParcelasMinimas: Math.round(somaParcelasMinimas * 100) / 100,
      mesesComDados: chaves.length
    }
  };
}

/**
 * Simula, mês a mês, a quitação de uma lista de empréstimos ativos dado um
 * aporte extra mensal fixo (além das parcelas mínimas de todos), seguindo
 * uma estratégia de priorização:
 *  - 'avalanche': todo aporte extra vai para o empréstimo de MAIOR taxa de
 *    juros entre os ainda ativos — minimiza juros totais pagos e o tempo
 *    total de quitação.
 *  - 'bola-de-neve': todo aporte extra vai para o empréstimo de MENOR saldo
 *    devedor entre os ainda ativos — quita dívidas individuais mais rápido
 *    (vitórias rápidas), à custa de mais juros/tempo no total.
 * Em ambas, ao quitar um empréstimo o valor que ele consumia (mínimo +
 * excedente) rola automaticamente para o próximo da fila no mesmo mês.
 */
function simularQuitacao_(emprestimos, aporteExtraMensal, estrategia) {
  var estado = emprestimos.map(function (e) {
    return { id: e.ID, nome: e.Nome, saldo: e.SaldoDevedor, taxaMensal: e.TaxaJurosMensal / 100, parcelaMinima: e.ParcelaMinima, quitadoNoMes: null };
  });

  var totalJuros = 0;
  var mes = 0;
  var ordemQuitacao = [];

  function algumAtivo() {
    return estado.some(function (e) { return e.saldo > TOLERANCIA_CENTAVOS; });
  }

  while (algumAtivo() && mes < LIMITE_MESES_SIMULACAO) {
    mes++;

    estado.forEach(function (e) {
      if (e.saldo > TOLERANCIA_CENTAVOS) {
        var juros = e.saldo * e.taxaMensal;
        e.saldo += juros;
        totalJuros += juros;
      }
    });

    estado.forEach(function (e) {
      if (e.saldo > TOLERANCIA_CENTAVOS) {
        var pagamento = Math.min(e.parcelaMinima, e.saldo);
        e.saldo -= pagamento;
      }
    });

    var candidatos = estado.filter(function (e) { return e.saldo > TOLERANCIA_CENTAVOS; });
    candidatos.sort(function (a, b) {
      return estrategia === 'avalanche' ? (b.taxaMensal - a.taxaMensal) : (a.saldo - b.saldo);
    });

    var extra = aporteExtraMensal;
    for (var i = 0; i < candidatos.length && extra > TOLERANCIA_CENTAVOS; i++) {
      var abate = Math.min(extra, candidatos[i].saldo);
      candidatos[i].saldo -= abate;
      extra -= abate;
    }

    estado.forEach(function (e) {
      if (e.saldo <= TOLERANCIA_CENTAVOS && e.quitadoNoMes === null) {
        e.quitadoNoMes = mes;
        ordemQuitacao.push({ nome: e.nome, mes: mes });
      }
    });
  }

  var quitouTudo = !algumAtivo();
  var hoje = new Date();

  return {
    estrategia: estrategia,
    aporteExtraMensal: aporteExtraMensal,
    meses: mes,
    quitouTudo: quitouTudo,
    totalJurosPago: Math.round(totalJuros * 100) / 100,
    dataQuitacaoEstimada: quitouTudo ? somarMeses_(hoje, mes).getTime() : null,
    ordemQuitacao: ordemQuitacao.map(function (o) {
      return { nome: o.nome, mes: o.mes, dataEstimada: somarMeses_(hoje, o.mes).getTime() };
    })
  };
}

/**
 * Monta os dados do painel: resumo do mês atual, situação da dívida e as
 * duas simulações (avalanche e bola de neve) lado a lado para comparação.
 */
function getPainel() {
  var lancamentos = listarLancamentos({});
  var hoje = new Date();
  var chaveMesAtual = formatarChaveMesAno_(hoje);

  var entradasMes = 0, saidasMes = 0;
  lancamentos.forEach(function (l) {
    if (formatarChaveMesAno_(new Date(l.Data)) !== chaveMesAtual) return;
    if (l.Tipo === TIPO_ENTRADA) entradasMes += l.Valor;
    else if (l.Tipo === TIPO_SAIDA) saidasMes += l.Valor;
  });

  var todosEmprestimos = listarEmprestimos();
  var emprestimosAtivos = todosEmprestimos.filter(function (e) { return e.Status === STATUS_EMPRESTIMO_ATIVO && e.SaldoDevedor > TOLERANCIA_CENTAVOS; });

  var totalOriginal = todosEmprestimos.reduce(function (s, e) { return s + e.ValorOriginal; }, 0);
  var totalSaldoDevedor = emprestimosAtivos.reduce(function (s, e) { return s + e.SaldoDevedor; }, 0);
  var somaParcelasMinimas = emprestimosAtivos.reduce(function (s, e) { return s + e.ParcelaMinima; }, 0);

  var aporte = calcularAporteExtra_(emprestimosAtivos);

  var comparacao = null;
  if (emprestimosAtivos.length > 0) {
    var avalanche = simularQuitacao_(emprestimosAtivos, aporte.valor, 'avalanche');
    var bolaDeNeve = simularQuitacao_(emprestimosAtivos, aporte.valor, 'bola-de-neve');
    var somenteMinimos = simularQuitacao_(emprestimosAtivos, 0, 'avalanche');
    comparacao = {
      avalanche: avalanche,
      bolaDeNeve: bolaDeNeve,
      somenteMinimos: somenteMinimos,
      recomendada: avalanche.totalJurosPago <= bolaDeNeve.totalJurosPago ? 'avalanche' : 'bola-de-neve'
    };
  }

  return {
    resumoMes: { entradas: entradasMes, saidas: saidasMes, saldo: entradasMes - saidasMes, mesAno: chaveMesAtual },
    dividas: {
      totalOriginal: totalOriginal,
      totalSaldoDevedor: totalSaldoDevedor,
      totalPago: totalOriginal - totalSaldoDevedor,
      somaParcelasMinimas: somaParcelasMinimas,
      quantidadeAtiva: emprestimosAtivos.length,
      quantidadeQuitada: todosEmprestimos.length - emprestimosAtivos.length
    },
    aporteExtra: aporte,
    emprestimosAtivos: emprestimosAtivos,
    comparacao: comparacao
  };
}

/**
 * Recalcula as simulações com um aporte extra "e se" informado na hora
 * (sem salvar nada), para o usuário testar cenários na tela de comparação.
 */
function simularComparacao(aporteExtraOverride) {
  var emprestimosAtivos = listarEmprestimos().filter(function (e) { return e.Status === STATUS_EMPRESTIMO_ATIVO && e.SaldoDevedor > TOLERANCIA_CENTAVOS; });
  var aporte = Math.max(0, paraNumero_(aporteExtraOverride));
  if (emprestimosAtivos.length === 0) return null;

  var avalanche = simularQuitacao_(emprestimosAtivos, aporte, 'avalanche');
  var bolaDeNeve = simularQuitacao_(emprestimosAtivos, aporte, 'bola-de-neve');
  return {
    avalanche: avalanche,
    bolaDeNeve: bolaDeNeve,
    recomendada: avalanche.totalJurosPago <= bolaDeNeve.totalJurosPago ? 'avalanche' : 'bola-de-neve'
  };
}
