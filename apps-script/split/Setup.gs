
// ======================================================================
// SETUP — cria a estrutura da planilha (abas, cabeçalhos, validações)
// ======================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Base de Veículos')
    .addItem('1) Criar estrutura inicial', 'criarEstruturaInicial')
    .addItem('2) Migrar dados originais (BDADOS2024/2025/2026)', 'migrarBaseOriginal')
    .addItem('3) Reconciliar Veiculos com BDADOS2024/2025/2026 atualizadas', 'reconciliarBaseOrigem')
    .addItem('4) ATENÇÃO: apagar tudo e remigrar do zero', 'zerarVeiculosERemigrar')
    .addItem('5) Importar Contrato (coluna O) da origem', 'importarContratoDaOrigem')
    .addItem('5b) Corrigir Contratos corrompidos (viraram data)', 'corrigirContratosCorrompidos_')
    .addItem('6) Importar Valor de veículos (base legado)', 'importarValorLegado')
    .addSeparator()
    .addItem('Recalcular painel', 'invalidarCacheDashboard_')
    .addItem('Corrigir tamanho da aba (desempenho)', 'corrigirTamanhoDaAba')
    .addItem('Extrair Número SEI do Termo de Doação (dados antigos)', 'corrigirNumeroSeiDoTermo')
    .addSeparator()
    .addItem('Passivo Veicular: criar planilha separada', 'criarEstruturaPassivoVeicular')
    .addItem('Passivo Veicular: importar dados do DF', 'importarVeiculosPassivoDF_')
    .addItem('Passivo Veicular: atualizar tabela de infrações (RENAINF)', 'atualizarTabelaInfracoesRenainf_')
    .addToUi();
}

function criarEstruturaInicial() {
  criarAbaVeiculos_();
  criarAbaConfig_();
  criarAbaUsuarios_();
  getOrCreateSheet_(SHEET_LOG, CABECALHO_LOG);
  getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  getOrCreateSheet_(SHEET_RELATORIO_ITENS, CABECALHO_RELATORIO_ITENS);
  getOrCreateSheet_(SHEET_TEP_FINALIZADOS, CABECALHO_TEP_FINALIZADOS);
  getOrCreateSheet_(SHEET_TEP_VISUALIZACOES, CABECALHO_TEP_VISUALIZACOES);
  getOrCreateSheet_(SHEET_TEP_OBSERVACOES, CABECALHO_TEP_OBSERVACOES);
  garantirColunasVeiculos_();
  SpreadsheetApp.flush();
  SpreadsheetApp.getActiveSpreadsheet().toast('Estrutura criada com sucesso.', 'Base de Veículos');
}

/**
 * Adiciona ao final da aba Veiculos qualquer coluna de CABECALHO_VEICULOS
 * que ainda não exista nela (planilhas criadas antes de um novo campo ser
 * introduzido, como CNPJDonataria, o endereço de envio ou os status de
 * ATPVe). Idempotente: pode ser chamada quantas vezes quiser.
 */
function garantirColunasVeiculos_() {
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var largura = Math.max(sheet.getLastColumn(), CABECALHO_VEICULOS.length);
  if (largura === 0) return;
  var linhaCabecalho = sheet.getRange(1, 1, 1, largura).getValues()[0];

  // Considera só as células do cabeçalho que têm texto de fato — dados soltos
  // gravados por engano em colunas à direita do último cabeçalho real (ex.:
  // por um bug já corrigido) não podem ser confundidos com "coluna já
  // existe", senão o cabeçalho novo é criado numa coluna errada, e o valor
  // gravado nunca mais é reconhecido de volta como esse campo.
  var ultimaColComCabecalho = 0;
  for (var i = linhaCabecalho.length - 1; i >= 0; i--) {
    if (linhaCabecalho[i]) { ultimaColComCabecalho = i + 1; break; }
  }
  var cabecalhoAtual = linhaCabecalho.slice(0, ultimaColComCabecalho);
  var proximaCol = ultimaColComCabecalho;

  CABECALHO_VEICULOS.forEach(function (nomeCampo) {
    if (cabecalhoAtual.indexOf(nomeCampo) !== -1) return;
    proximaCol++;
    sheet.getRange(1, proximaCol).setValue(nomeCampo)
      .setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
    sheet.setColumnWidth(proximaCol, 180);
    cabecalhoAtual.push(nomeCampo);
  });
}

function criarAbaVeiculos_() {
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);

  var ufCol = colunaParaIndice_('UF') + 1;
  var enteCol = colunaParaIndice_('Ente') + 1;
  var mesCol = colunaParaIndice_('Mes') + 1;
  var transfCol = colunaParaIndice_('Transferido') + 1;

  // Não aplique validação a milhares de linhas vazias "por segurança": no
  // Google Sheets, uma validação (ou qualquer formatação) em uma célula
  // conta como "conteúdo" para fins de getDataRange()/getLastRow(). Se a
  // validação for aplicada bem além do que existe de dado real, toda
  // leitura da aba (listagem, painel, migração) passa a trafegar milhares
  // de linhas vazias e fica muito mais lenta. Use uma margem pequena e
  // reaplique com corrigirTamanhoDaAba() conforme a base crescer.
  var margem = MARGEM_VALIDACAO_LINHAS;
  aplicarListaValidacao_(sheet, 2, margem, ufCol, UFS_PARA_VALIDACAO_PLANILHA);
  aplicarListaValidacao_(sheet, 2, margem, enteCol, ENTES_VALIDOS);
  aplicarListaValidacao_(sheet, 2, margem, mesCol, MESES_VALIDOS);
  aplicarListaValidacao_(sheet, 2, margem, transfCol, STATUS_TRANSFERIDO);

  sheet.setColumnWidths(1, CABECALHO_VEICULOS.length, 130);
  sheet.setColumnWidth(colunaParaIndice_('Donataria') + 1, 280);
  return sheet;
}

function aplicarListaValidacao_(sheet, linhaInicio, ultimaLinha, coluna, lista) {
  var regra = SpreadsheetApp.newDataValidation()
    .requireValueInList(lista, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(linhaInicio, coluna, ultimaLinha - linhaInicio + 1, 1).setDataValidation(regra);
}

/**
 * Corrige o problema de desempenho em que a aba "Veiculos" fica com
 * milhares de linhas vazias "marcadas" (por causa das listas suspensas
 * aplicadas além do necessário), fazendo toda leitura da planilha demorar
 * minutos. Apara o excesso de linhas vazias e reaplica a validação numa
 * faixa razoável (dados atuais + margem para novos cadastros). Pode ser
 * rodada quantas vezes quiser, inclusive periodicamente conforme a base
 * cresce.
 */
function corrigirTamanhoDaAba() {
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var idCol = colunaParaIndice_('ID') + 1;
  var totalLinhas = sheet.getMaxRows();

  var valoresId = sheet.getRange(1, idCol, totalLinhas, 1).getValues();
  var ultimaComDado = 1;
  for (var i = valoresId.length - 1; i >= 1; i--) {
    if (valoresId[i][0]) { ultimaComDado = i + 1; break; }
  }

  var novaUltima = Math.min(totalLinhas, ultimaComDado + MARGEM_VALIDACAO_LINHAS);

  if (totalLinhas > novaUltima) {
    sheet.deleteRows(novaUltima + 1, totalLinhas - novaUltima);
  }

  var ufCol = colunaParaIndice_('UF') + 1;
  var enteCol = colunaParaIndice_('Ente') + 1;
  var mesCol = colunaParaIndice_('Mes') + 1;
  var transfCol = colunaParaIndice_('Transferido') + 1;

  aplicarListaValidacao_(sheet, 2, novaUltima, ufCol, UFS_PARA_VALIDACAO_PLANILHA);
  aplicarListaValidacao_(sheet, 2, novaUltima, enteCol, ENTES_VALIDOS);
  aplicarListaValidacao_(sheet, 2, novaUltima, mesCol, MESES_VALIDOS);
  aplicarListaValidacao_(sheet, 2, novaUltima, transfCol, STATUS_TRANSFERIDO);

  invalidarCacheDashboard_();

  var mensagem = 'Última linha com dado: ' + ultimaComDado + '. Aba ajustada para ' + novaUltima + ' linhas.';
  SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Ajuste de desempenho', 8);
  return mensagem;
}

// Casa "Termo de Doação SENASP 144/2023 (24452932)" capturando em [1] o texto
// antes do parêntese e em [2] só os dígitos do Número SEI.
var REGEX_SEI_NO_TERMO = /^(.*?)\s*\((\d+)\)\s*$/;

// Separa o Número SEI embutido entre parênteses no texto do Termo de
// Doação (ex.: "Termo de Doação 165/2023 (24860169)") — usada tanto na
// migração/reconciliação (pra já gravar TermoDoacao e NumeroSei em campos
// separados, sem precisar rodar corrigirNumeroSeiDoTermo depois) quanto por
// essa própria função de correção retroativa. Se não achar parêntese com
// números, devolve numeroSei null (o chamador decide se troca ou preserva
// o que já estava gravado).
function separarNumeroSeiDoTermo_(termoBruto) {
  var termo = String(termoBruto || '').trim();
  var match = REGEX_SEI_NO_TERMO.exec(termo);
  if (!match) return { termo: termo, numeroSei: null };
  return { termo: match[1].trim(), numeroSei: match[2] };
}

/**
 * Corrige registros antigos em que o Número SEI foi digitado junto do Termo
 * de Doação, entre parênteses no final (ex.: "Termo de Doação SENASP
 * 144/2023 (24452932)"), de antes da coluna NumeroSei existir. Extrai o
 * número para a coluna NumeroSei e remove o parêntese do Termo de Doação.
 * Só mexe em linhas cujo NumeroSei ainda está vazio — não sobrescreve o que
 * já tiver sido preenchido (pela tela ou por uma execução anterior desta
 * mesma correção). Idempotente: pode ser rodada quantas vezes quiser.
 */
function corrigirNumeroSeiDoTermo() {
  exigirPerfilAdmin_();
  garantirColunasVeiculos_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var totalLinhas = sheet.getLastRow() - 1;
  if (totalLinhas < 1) {
    return 'Nenhum veículo cadastrado.';
  }

  var termoCol = colunaParaIndice_('TermoDoacao') + 1;
  var seiCol = colunaParaIndice_('NumeroSei') + 1;

  var termos = sheet.getRange(2, termoCol, totalLinhas, 1).getValues();
  var seis = sheet.getRange(2, seiCol, totalLinhas, 1).getValues();

  var corrigidos = 0;
  for (var i = 0; i < totalLinhas; i++) {
    if (normalizarTexto_(seis[i][0])) continue; // já tem Número SEI — não mexe

    var separado = separarNumeroSeiDoTermo_(termos[i][0]);
    if (!separado.numeroSei) continue;

    termos[i][0] = separado.termo;
    seis[i][0] = separado.numeroSei;
    corrigidos++;
  }

  if (corrigidos > 0) {
    sheet.getRange(2, termoCol, totalLinhas, 1).setValues(termos);
    sheet.getRange(2, seiCol, totalLinhas, 1).setValues(seis);
  }

  var mensagem = corrigidos + ' registro(s) corrigido(s): Número SEI extraído do Termo de Doação.';
  SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Correção Número SEI', 8);
  return mensagem;
}

function criarAbaConfig_() {
  var sheet = getOrCreateSheet_(SHEET_CONFIG, ['Lista', 'Valor']);
  var dados = [];
  UFS_VALIDAS.forEach(function (uf) { dados.push(['UF', uf]); });
  CODIGOS_ORGAO_FEDERAL.forEach(function (cod) { dados.push(['UF (órgão federal)', cod]); });
  ENTES_VALIDOS.forEach(function (e) { dados.push(['Ente', e]); });
  MESES_VALIDOS.forEach(function (m) { dados.push(['Mes', m]); });
  STATUS_TRANSFERIDO.forEach(function (s) { dados.push(['Transferido', s]); });

  if (sheet.getLastRow() <= 1) {
    sheet.getRange(2, 1, dados.length, 2).setValues(dados);
  }
  return sheet;
}

function criarAbaUsuarios_() {
  var sheet = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  if (sheet.getLastRow() <= 1) {
    var email = getEmailUsuarioAtual_();
    sheet.getRange(2, 1, 1, 6).setValues([[email, PERFIL_ADMIN, '', 'Administrador inicial', '', '']]);
  }
  return sheet;
}

/**
 * Garante que a aba Usuários tem todas as colunas de CABECALHO_USUARIOS —
 * instalações antigas só têm Email/Perfil/UF/Nome fisicamente; anexa as
 * colunas novas (AcessoProdutividade/AcessoPlanilha) no fim, sem mexer nas
 * já existentes. Mesmo padrão de garantirColunasVeiculos_.
 */
function garantirColunasUsuarios_() {
  var sheet = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  var largura = Math.max(sheet.getLastColumn(), CABECALHO_USUARIOS.length);
  if (largura === 0) return sheet;
  var cabecalhoAtual = sheet.getRange(1, 1, 1, largura).getValues()[0];
  var proximaCol = cabecalhoAtual.length;
  CABECALHO_USUARIOS.forEach(function (nomeCampo) {
    if (cabecalhoAtual.indexOf(nomeCampo) !== -1) return;
    proximaCol++;
    sheet.getRange(1, proximaCol).setValue(nomeCampo).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  });
  return sheet;
}

/**
 * Dá acesso ao sistema para uma pessoa nova (ou atualiza os dados dela, se
 * o e-mail já estiver cadastrado) — usado pela tela "Usuários" tanto pra
 * cadastrar quanto pra editar. Só administradores podem cadastrar/editar
 * outros usuários.
 */
function cadastrarUsuario(dados) {
  exigirPerfilAdmin_();
  garantirColunasUsuarios_();

  var email = normalizarTexto_(dados.Email).toLowerCase();
  var perfil = normalizarTexto_(dados.Perfil).toLowerCase();
  var nome = normalizarTexto_(dados.Nome);
  var acessoProdutividade = normalizarTexto_(dados.AcessoProdutividade).toUpperCase() === 'SIM' ? 'SIM' : 'NÃO';
  var acessoPlanilhaBruto = normalizarTexto_(dados.AcessoPlanilha).toUpperCase();
  var acessoPlanilha = ['LEITOR', 'EDITOR'].indexOf(acessoPlanilhaBruto) !== -1 ? acessoPlanilhaBruto : 'NENHUM';

  var erros = [];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.push('E-mail inválido: ' + dados.Email);
  if ([PERFIL_ADMIN, PERFIL_USUARIO, PERFIL_VISITANTE].indexOf(perfil) === -1) {
    erros.push('Perfil inválido — escolha Administrador, Usuário ou Visitante.');
  }
  if (!nome) erros.push('Nome é obrigatório.');
  if (erros.length) throw new Error(erros.join('\n'));

  var sheet = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  var dadosAtuais = sheet.getDataRange().getValues();
  var linhaExistente = null;
  for (var i = 1; i < dadosAtuais.length; i++) {
    if (String(dadosAtuais[i][0]).trim().toLowerCase() === email) { linhaExistente = i + 1; break; }
  }

  var linha = [email, perfil, '', nome, acessoProdutividade, acessoPlanilha];
  var mensagem;
  if (linhaExistente) {
    sheet.getRange(linhaExistente, 1, 1, linha.length).setValues([linha]);
    registrarLog_('ATUALIZAR_USUARIO', email, JSON.stringify(linha));
    mensagem = 'Usuário "' + email + '" atualizado com sucesso.';
  } else {
    sheet.appendRow(linha);
    registrarLog_('CRIAR_USUARIO', email, JSON.stringify(linha));
    mensagem = 'Usuário "' + email + '" cadastrado com sucesso. Ele já pode acessar o sistema pelo mesmo link.';
  }
  aplicarAcessoPlanilha_(email, acessoPlanilha);
  return { mensagem: mensagem };
}

/**
 * Compartilha (ou revoga) o acesso à planilha do Drive em si, conforme o
 * nível escolhido pro usuário — independente do Perfil dele no sistema
 * (editar a planilha direto pula todas as validações do site, então isso é
 * uma escolha à parte). Melhor esforço: se o compartilhamento falhar
 * (e-mail sem conta Google, cota do Drive etc.), não impede o cadastro do
 * usuário em si — só fica registrado no log de execução.
 */
function aplicarAcessoPlanilha_(email, nivel) {
  try {
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    if (nivel === 'EDITOR') {
      planilha.addEditor(email);
    } else if (nivel === 'LEITOR') {
      try { planilha.removeEditor(email); } catch (e) { /* pode nunca ter sido editor */ }
      planilha.addViewer(email);
    } else {
      try { planilha.removeEditor(email); } catch (e) { /* pode nunca ter sido editor */ }
      try { planilha.removeViewer(email); } catch (e) { /* pode nunca ter sido leitor */ }
    }
  } catch (e) {
    Logger.log('aplicarAcessoPlanilha_ falhou para ' + email + ': ' + e);
  }
}

/**
 * Lista todos os usuários cadastrados, pra tela "Usuários" listar e
 * permitir editar quem já tem acesso. Restrito a administradores.
 */
function listarUsuarios() {
  exigirPerfilAdmin_();
  garantirColunasUsuarios_();
  var sheet = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  var dados = sheet.getDataRange().getValues();
  var linhas = [];
  for (var i = 1; i < dados.length; i++) {
    var l = dados[i];
    if (!l[0]) continue;
    linhas.push({
      Email: l[0],
      Perfil: l[1],
      Nome: l[3] || '',
      AcessoProdutividade: String(l[4] || '').toUpperCase() === 'SIM' ? 'SIM' : 'NÃO',
      AcessoPlanilha: ['LEITOR', 'EDITOR'].indexOf(String(l[5] || '').toUpperCase()) !== -1 ? String(l[5]).toUpperCase() : 'NENHUM'
    });
  }
  linhas.sort(function (a, b) { return a.Email.localeCompare(b.Email); });
  return linhas;
}
