
// ======================================================================
// COBRANÇA DE TRANSFERÊNCIA — e-mail de reiteração por PROCESSO (não por
// Donatária) pros processos com veículos ainda pendentes de transferência.
// Reproduz, com um clique, o e-mail que hoje é redigido manualmente e
// anexado ao processo no SEI. O envio em si continua manual (a pessoa vai
// até o SEI e manda de lá) — o sistema só guarda quando cada processo foi
// cobrado pela última vez, pra não cobrar duas vezes sem perceber.
// ======================================================================

var SHEET_COBRANCA_PROCESSOS = 'CobrancaProcessos';
var CABECALHO_COBRANCA_PROCESSOS = ['Chave', 'NumeroProcesso', 'Donataria', 'Email', 'DataEnvio', 'NumeroSeiEmail', 'EnviadoPor'];

function listarCobrancaProcessos_() {
  var sheet = getOrCreateSheet_(SHEET_COBRANCA_PROCESSOS, CABECALHO_COBRANCA_PROCESSOS);
  var valores = sheet.getDataRange().getValues();
  var mapa = {};
  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    mapa[linha[0]] = {
      numeroProcesso: linha[1] || '', donataria: linha[2] || '',
      email: linha[3] || '', dataEnvio: linha[4] || '', numeroSeiEmail: linha[5] || '', enviadoPor: linha[6] || ''
    };
  }
  return mapa;
}

/**
 * Veículos ainda não transferidos, agrupados por processo (mesma noção de
 * "processo" usada em listarProcessos: NumeroProcesso, ou Ano+SEI/Termo pra
 * registros antigos sem esse campo — ver chaveProcesso_). Devolve também um
 * resumo (total de veículos e de processos pendentes) calculado sobre a
 * base INTEIRA, sem os filtros de Ano/Mês — assim a tela mostra o panorama
 * geral mesmo que a lista abaixo esteja filtrada pra não ficar enorme.
 *
 * A parte cara (varrer a planilha inteira de veículos) fica cacheada em
 * getCobrancaBaseCache_ — os filtros de Ano/Mês/Ente são aplicados DEPOIS,
 * em cima do resultado já cacheado, então qualquer combinação de filtro
 * reaproveita a mesma varredura em vez de repeti-la a cada clique em
 * "Filtrar".
 */
function getCobrancaPorProcesso(filtros) {
  filtros = filtros || {};
  var base = getCobrancaBaseCache_();

  var processosFiltrados = base.processos.filter(function (p) {
    if (filtros.ano && String(p.ano) !== String(filtros.ano)) return false;
    if (filtros.mes && p.mes !== filtros.mes) return false;
    if (filtros.ente && p.ente !== filtros.ente) return false;
    return true;
  });

  return {
    totalVeiculosPendentes: base.totalVeiculosPendentes,
    totalProcessosPendentes: base.totalProcessosPendentes,
    processos: processosFiltrados
  };
}

/**
 * Base (sem filtro) usada por getCobrancaPorProcesso — é a parte cara de
 * verdade (varre TODA a planilha de veículos pra achar os pendentes de
 * transferência). Fica em cache por CACHE_DASHBOARD_SEGUNDOS, invalidado
 * automaticamente por invalidarCacheDashboard_() a cada gravação relevante
 * (inclui marcar/enviar cobrança — ver marcarCobrancaProcessoEnviada,
 * salvarEmailCobrancaProcesso e enviarEmailCobranca).
 */
function getCobrancaBaseCache_() {
  var cache = CacheService.getDocumentCache();
  var cacheado = cache.get('cobranca_base');
  if (cacheado) return JSON.parse(cacheado);

  var pendentesTotal = listarVeiculos({ transferido: 'NÃO' });
  var enviosPorChave = listarCobrancaProcessos_();

  var grupos = {};
  var ordem = [];
  pendentesTotal.forEach(function (v) {
    var chave = chaveProcesso_(v);
    if (!grupos[chave]) {
      var envio = enviosPorChave[chave];
      grupos[chave] = {
        chave: chave,
        numeroProcesso: v.NumeroProcesso || '',
        numeroSei: '',
        termoDoacao: v.TermoDoacao || '',
        donataria: v.Donataria || '(sem donatária)',
        uf: v.UF,
        ente: v.Ente,
        ano: v.Ano,
        mes: v.Mes,
        total: 0,
        email: (envio && envio.email) || '',
        dataEnvio: (envio && envio.dataEnvio) || '',
        numeroSeiEmail: (envio && envio.numeroSeiEmail) || ''
      };
      ordem.push(chave);
    }
    if (!grupos[chave].numeroSei && v.NumeroSei) grupos[chave].numeroSei = v.NumeroSei;
    grupos[chave].total++;
  });

  ordem.sort(function (a, b) {
    return grupos[a].donataria.localeCompare(grupos[b].donataria) || String(a).localeCompare(String(b));
  });

  var resultado = {
    totalVeiculosPendentes: pendentesTotal.length,
    totalProcessosPendentes: ordem.length,
    processos: ordem.map(function (chave) { return grupos[chave]; })
  };

  // CacheService recusa valores acima de 100KB — como esse limite só cresce
  // junto com a base, checa o tamanho antes de tentar gravar em vez de
  // confiar num try/catch genérico (que também engoliria, em silêncio,
  // qualquer outro erro real que acontecesse aqui).
  var json = JSON.stringify(resultado);
  if (json.length < 100 * 1024) {
    cache.put('cobranca_base', json, CACHE_DASHBOARD_SEGUNDOS);
  }
  return resultado;
}

/**
 * Monta o assunto e o corpo (já prontos pra revisão) do e-mail de cobrança
 * de UM processo específico. O destinatário vem do último e-mail salvo pra
 * esse processo (ver marcarCobrancaProcessoEnviada) ou, na falta desse, do
 * último e-mail usado em QUALQUER outro processo da mesma Donatária.
 */
function montarEmailCobrancaProcesso(chave) {
  var perfil = getPerfilUsuarioAtual_();
  var pendentes = listarVeiculos({ transferido: 'NÃO' }).filter(function (v) { return chaveProcesso_(v) === chave; });
  if (!pendentes.length) throw new Error('Não há veículos pendentes para este processo.');

  var primeiro = pendentes[0];
  var donataria = primeiro.Donataria || '(sem donatária)';
  var numeroProcesso = primeiro.NumeroProcesso || '';
  var numeroSei = pendentes.map(function (v) { return v.NumeroSei; }).filter(Boolean)[0] || '';
  var termoDoacao = primeiro.TermoDoacao || '';
  var referenciaBusca = numeroProcesso || numeroSei || termoDoacao || '(sem referência disponível)';

  // Contato de referência (base ContatosMunicipios) — só usado como
  // sugestão de saudação/destinatário quando ainda não existe um e-mail já
  // usado antes numa cobrança real deste processo/Donatária (ver abaixo).
  var contatoMunicipio = buscarContatoMunicipio_(primeiro.UF, donataria);
  var saudacao = contatoMunicipio && contatoMunicipio.autoridade
    ? 'Prezado(a) Senhor(a) ' + paraTitleCasePortugues_(contatoMunicipio.autoridade) + ','
    : 'Prezado(a) responsável,';

  var corpo = saudacao + '\n\n' +
    'Cumprimentando-o(a) cordialmente, venho por meio deste REITERAR a necessidade de adoção das devidas ' +
    'providências quanto à TRANSFERÊNCIA DE PROPRIEDADE dos veículos doados a esse Ente/órgão pelo Ministério ' +
    'da Justiça e Segurança Pública, por meio da Secretaria Nacional de Segurança Pública (SENASP), referentes ' +
    'ao Termo de Doação SENASP nº ' + (termoDoacao || '(não informado)') +
    (numeroSei ? ' (Processo SEI nº ' + numeroSei + ')' : '') +
    ', e que permanecem PENDENTES de efetivação:\n\n';

  pendentes.forEach(function (v, i) {
    var descricaoVeiculo = [v.Marca, v.Descricao].filter(Boolean).join(' ');
    corpo += '  ' + (i + 1) + '. Placa ' + (v.Placa || '—') + ' — Chassi ' + (v.Chassi || '—') +
      (v.Renavam ? ', Renavam ' + v.Renavam : '') +
      (descricaoVeiculo ? ' (' + descricaoVeiculo + ')' : '') + '\n';
  });

  corpo += '\nRessalto a necessidade de adoção das devidas providências quanto à transferência de propriedade ' +
    'dos veículos acima relacionados, ainda pendente de efetivação.\n\n' +
    'Certo(a) da atenção, renovo protestos de estima e consideração.\n\n' +
    'Atenciosamente,\n' +
    (perfil.nome || perfil.email) + '\n' +
    'Serviço de Gestão de Patrimônio\n' +
    'Coordenação de Logística\n' +
    'Diretoria de Gestão do Fundo Nacional de Segurança Pública\n' +
    'Secretaria Nacional de Segurança Pública\n' +
    'Ministério da Justiça e Segurança Pública';

  var envios = listarCobrancaProcessos_();
  var envioAtual = envios[chave];
  var emailSugerido = envioAtual && envioAtual.email;
  if (!emailSugerido) {
    // Nenhum envio registrado ainda pra ESTE processo — tenta reaproveitar o
    // e-mail de outro processo já cobrado da mesma Donatária.
    var chaveComMesmaDonataria = Object.keys(envios).filter(function (outraChave) {
      return envios[outraChave].donataria === donataria && envios[outraChave].email;
    })[0];
    if (chaveComMesmaDonataria) emailSugerido = envios[chaveComMesmaDonataria].email;
  }
  if (!emailSugerido && contatoMunicipio) {
    // Nem esse processo nem outro da mesma Donatária foram cobrados antes —
    // usa a sugestão da base de contatos (e-mail geral + pessoal juntos).
    emailSugerido = [contatoMunicipio.emailGerais, contatoMunicipio.emailPessoal].filter(Boolean).join('; ');
  }

  return {
    chave: chave,
    numeroProcesso: numeroProcesso,
    numeroSei: numeroSei,
    donataria: donataria,
    referenciaBusca: referenciaBusca,
    destinatario: emailSugerido || '',
    assunto: 'REITERAÇÃO Pertinente à Transferência de Propriedade de Veículos — ' + donataria +
      (numeroProcesso ? ' — Processo ' + numeroProcesso : ''),
    corpo: corpo,
    total: pendentes.length,
    jaEnviado: !!(envioAtual && envioAtual.dataEnvio),
    dataEnvioAnterior: (envioAtual && envioAtual.dataEnvio) || '',
    numeroSeiEmailAnterior: (envioAtual && envioAtual.numeroSeiEmail) || ''
  };
}

// Valida uma lista de e-mails separados por ";" — permite cobrar mais de um
// destinatário do mesmo processo (ex.: gabinete + secretaria de patrimônio).
// Devolve a lista já normalizada (sem espaços em volta de cada endereço).
function validarEmailsMultiplos_(texto) {
  var enderecos = String(texto || '').split(';').map(function (e) { return e.trim(); }).filter(Boolean);
  if (!enderecos.length) throw new Error('Informe ao menos um e-mail do destinatário.');
  var invalido = enderecos.filter(function (e) { return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); })[0];
  if (invalido) throw new Error('E-mail inválido: ' + invalido);
  return enderecos.join('; ');
}

/**
 * Cadastra/atualiza só o e-mail de contato de um processo, sem marcar nada
 * como enviado — usado pelo "Copiar texto" pra já guardar o(s) e-mail(s)
 * digitados em "Para" na hora, mesmo que o envio em si aconteça por fora do
 * sistema (Copilot/SEI). Preserva DataEnvio/NumeroSeiEmail já existentes, se
 * houver — só troca a coluna de e-mail.
 */
function salvarEmailCobrancaProcesso(chave, numeroProcesso, donataria, email) {
  exigirPerfilEditor_();
  var emailValidado = validarEmailsMultiplos_(email);

  var sheet = getOrCreateSheet_(SHEET_COBRANCA_PROCESSOS, CABECALHO_COBRANCA_PROCESSOS);
  var valores = sheet.getDataRange().getValues();

  for (var i = 1; i < valores.length; i++) {
    if (valores[i][0] === chave) {
      sheet.getRange(i + 1, 4).setValue(emailValidado); // coluna D = Email
      invalidarCacheDashboard_();
      return { mensagem: 'E-mail cadastrado.' };
    }
  }
  sheet.appendRow([chave, numeroProcesso || '', donataria || '', emailValidado, '', '', '']);
  invalidarCacheDashboard_();
  return { mensagem: 'E-mail cadastrado.' };
}

/**
 * Registra que o e-mail de cobrança de um processo foi enviado (por fora do
 * sistema, via Copilot/SEI) — pede o número SEI do próprio e-mail enviado,
 * pra manter rastreável dentro do processo. Usado tanto pelo botão "Marcar
 * como enviado" quanto pela confirmação que aparece ao fechar a janela sem
 * ter marcado nada ainda.
 */
function marcarCobrancaProcessoEnviada(chave, numeroProcesso, donataria, email, numeroSeiEmail) {
  var perfil = exigirPerfilEditor_();
  var emailValidado = validarEmailsMultiplos_(email);
  numeroSeiEmail = String(numeroSeiEmail || '').trim();
  if (!numeroSeiEmail) throw new Error('Informe o número SEI do e-mail enviado.');

  var sheet = getOrCreateSheet_(SHEET_COBRANCA_PROCESSOS, CABECALHO_COBRANCA_PROCESSOS);
  var valores = sheet.getDataRange().getValues();
  var agora = new Date();
  var linha = [chave, numeroProcesso || '', donataria || '', emailValidado, agora, numeroSeiEmail, perfil.email];

  for (var i = 1; i < valores.length; i++) {
    if (valores[i][0] === chave) {
      sheet.getRange(i + 1, 1, 1, CABECALHO_COBRANCA_PROCESSOS.length).setValues([linha]);
      registrarLog_('COBRANCA_ENVIADA', numeroProcesso || chave, 'E-mail de cobrança registrado como enviado (SEI ' + numeroSeiEmail + ').');
      invalidarCacheDashboard_();
      return { mensagem: 'Registrado — processo marcado como cobrado.' };
    }
  }
  sheet.appendRow(linha);
  registrarLog_('COBRANCA_ENVIADA', numeroProcesso || chave, 'E-mail de cobrança registrado como enviado (SEI ' + numeroSeiEmail + ').');
  invalidarCacheDashboard_();
  return { mensagem: 'Registrado — processo marcado como cobrado.' };
}

/**
 * Envio direto (sem passar pelo SEI) pra quem preferir — pela conta
 * institucional (Outlook/Microsoft 365) já autorizada em autorizarMicrosoft(),
 * ou pelo Gmail (MailApp) como alternativa se aquela não estiver disponível.
 * Como o envio é verificado pelo próprio sistema (não é um "confio que a
 * pessoa mandou"), não pede o número SEI do e-mail — grava o registro na
 * hora, automaticamente.
 */
function enviarEmailCobranca(chave, numeroProcesso, donataria, destinatario, assunto, corpo) {
  var perfil = exigirPerfilEditor_();
  var destinatarioValidado = validarEmailsMultiplos_(destinatario);
  if (!assunto || !corpo) throw new Error('Assunto e corpo do e-mail são obrigatórios.');

  var enviadoPeloOutlook = enviarEmailViaGraph_(destinatarioValidado, perfil.email, assunto, corpo);
  if (!enviadoPeloOutlook) {
    MailApp.sendEmail({ to: destinatarioValidado.split(';').join(','), cc: perfil.email, subject: assunto, body: corpo });
  }

  var sheet = getOrCreateSheet_(SHEET_COBRANCA_PROCESSOS, CABECALHO_COBRANCA_PROCESSOS);
  var valores = sheet.getDataRange().getValues();
  var agora = new Date();
  var origem = enviadoPeloOutlook ? 'Outlook institucional' : 'Gmail';
  var linha = [chave, numeroProcesso || '', donataria || '', destinatarioValidado, agora, 'Enviado automaticamente pelo sistema (' + origem + ')', perfil.email];
  var encontrado = false;
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][0] === chave) {
      sheet.getRange(i + 1, 1, 1, CABECALHO_COBRANCA_PROCESSOS.length).setValues([linha]);
      encontrado = true;
      break;
    }
  }
  if (!encontrado) sheet.appendRow(linha);

  registrarLog_('ENVIAR_COBRANCA', numeroProcesso || chave, 'E-mail de cobrança enviado para ' + destinatarioValidado + ' (via ' + origem + ')');
  invalidarCacheDashboard_();

  return { mensagem: 'E-mail enviado para ' + destinatarioValidado + ' pelo ' + origem + '.' };
}
