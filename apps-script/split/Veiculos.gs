
// ======================================================================
// WEB APP + CRUD — página do sistema e operações sobre a aba "Veiculos"
// ======================================================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('PaginaCompleta')
    .setTitle('Base de Veículos Doados')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getContextoInicial() {
  var perfil = getPerfilUsuarioAtual_();
  return {
    usuario: perfil,
    listas: {
      uf: UFS_VALIDAS.concat(CODIGOS_ORGAO_FEDERAL),
      ente: ENTES_VALIDOS,
      mes: MESES_VALIDOS,
      transferido: STATUS_TRANSFERIDO
    },
    orgaosPorUF: ORGAOS_POR_UF,
    // Só os "novos" desde a última vez que esse usuário viu a aba TEP —
    // não o total de pendentes (esses continuam todos visíveis na aba).
    tepPendentes: contarTepNovos_(perfil.email),
    processosEmAberto: contarProcessosEmAberto_()
  };
}

// Processos com pelo menos um veículo salvo como rascunho (ver "Salvar
// rascunho" no cadastro e StatusCadastro em validarESanitizarVeiculo_) —
// alimenta o aviso "Você tem X processo(s) em aberto" ao lado do TEP na
// tela Início.
function contarProcessosEmAberto_() {
  var registros = listarVeiculos({});
  var chaves = {};
  registros.forEach(function (r) {
    if ((r.StatusCadastro || 'COMPLETO') !== 'RASCUNHO') return;
    chaves[chaveProcesso_(r)] = true;
  });
  return Object.keys(chaves).length;
}

// Mapeia o seletor "Buscar em" da tela de Listagem para o campo real do
// registro. Vazio ('') continua buscando em todos os campos de uma vez —
// é o que fazia "222" (ou qualquer trecho curto) achar chassis, placas e
// renavams sem relação nenhuma entre si, então o seletor existe para
// restringir a busca a um único campo quando isso importa.
// "recentes" (Últimos cadastrados) não mapeia pra nenhum campo — não é uma
// busca de texto, é só a lista já ordenada do mais recente pro mais antigo
// (comportamento padrão), com o campo Buscar desabilitado nesse modo.
var MAPA_CAMPOS_BUSCA = {
  donataria: 'Donataria', chassi: 'Chassi', placa: 'Placa',
  renavam: 'Renavam', termo: 'TermoDoacao', marca: 'Marca'
};

function listarVeiculos(filtros) {
  filtros = filtros || {};
  var perfil = getPerfilUsuarioAtual_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxUF = cabecalho.indexOf('UF');

  var busca = filtros.busca ? normalizarTexto_(filtros.busca).toUpperCase() : '';
  var campoBusca = MAPA_CAMPOS_BUSCA[filtros.buscaCampo] || '';
  var resultado = [];

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    if (!podeVerLinha_(perfil, linha[idxUF])) continue;

    var registro = linhaParaObjeto_(cabecalho, linha);

    // Excluído (lixeira) some das telas normais por padrão — só aparece
    // pra quem pede explicitamente (tela Lixeira, via filtros.incluirExcluidos).
    if (registro.Excluido === 'SIM' && !filtros.incluirExcluidos) continue;

    if (filtros.uf && registro.UF !== filtros.uf) continue;
    if (filtros.ente && registro.Ente !== filtros.ente) continue;
    if (filtros.marca && registro.Marca !== filtros.marca) continue;
    if (filtros.ano && filtros.ano.length) {
      var anosFiltro = Array.isArray(filtros.ano) ? filtros.ano.map(String) : [String(filtros.ano)];
      if (anosFiltro.indexOf(String(registro.Ano)) === -1) continue;
    }
    if (filtros.transferido && registro.Transferido !== filtros.transferido) continue;
    if (filtros.donataria && registro.Donataria !== filtros.donataria) continue;
    if (filtros.somenteRascunho && (registro.StatusCadastro || 'COMPLETO') !== 'RASCUNHO') continue;
    if (busca) {
      var camposAlvo = campoBusca
        ? [registro[campoBusca]]
        : [registro.Donataria, registro.Chassi, registro.Placa, String(registro.Renavam), registro.Descricao, registro.TermoDoacao, registro.Marca];
      var alvo = camposAlvo.join(' ').toUpperCase();
      if (alvo.indexOf(busca) === -1) continue;
    }

    resultado.push(registro);
  }

  resultado.sort(function (a, b) { return b.DataCadastro - a.DataCadastro; });
  return resultado;
}

/**
 * Veículos ainda não transferidos, só com os campos que a tela
 * "Conferência SINESP" usa — usada pra gerar os lotes de chassi/placa que
 * são colados na busca do SINESP na conferência semanal. Devolve todos os
 * pendentes de uma vez (sem limite de página, ao contrário da Listagem),
 * mas com um DTO bem enxuto pra não pesar o payload mesmo com centenas de
 * registros. Ordenado por UF/Donatária/Placa pra os lotes de 10 saírem
 * agrupados por quem recebeu os veículos, em vez de embaralhados.
 */
function listarPendentesSinesp(filtros) {
  filtros = filtros || {};
  var pendentes = listarVeiculos({
    uf: filtros.uf || '',
    ente: filtros.ente || '',
    ano: filtros.ano || '',
    transferido: 'NÃO'
  });
  pendentes.sort(function (a, b) {
    var chaveA = (a.UF || '') + '|' + (a.Donataria || '') + '|' + (a.Placa || '');
    var chaveB = (b.UF || '') + '|' + (b.Donataria || '') + '|' + (b.Placa || '');
    return chaveA < chaveB ? -1 : chaveA > chaveB ? 1 : 0;
  });
  return pendentes.map(function (r) {
    return { id: r.ID, chassi: r.Chassi, placa: r.Placa, uf: r.UF, donataria: r.Donataria };
  });
}

function paraDtoListagem_(r) {
  return {
    ID: r.ID,
    Ano: r.Ano,
    Mes: r.Mes,
    UF: r.UF,
    Ente: r.Ente,
    Donataria: r.Donataria,
    TermoDoacao: r.TermoDoacao,
    NumeroSei: r.NumeroSei,
    Descricao: r.Descricao,
    Marca: r.Marca,
    Chassi: r.Chassi,
    Renavam: r.Renavam,
    Placa: r.Placa,
    Transferido: r.Transferido,
    Observacoes: r.Observacoes,
    CNPJDonataria: r.CNPJDonataria,
    CEP: r.CEP,
    Logradouro: r.Logradouro,
    Numero: r.Numero,
    Complemento: r.Complemento,
    Bairro: r.Bairro,
    Municipio: r.Municipio,
    ATPVeEmitido: r.ATPVeEmitido,
    ATPVeEnviado: r.ATPVeEnviado,
    Contrato: r.Contrato,
    Aditivo: r.Aditivo,
    NumeroAditivo: r.NumeroAditivo,
    QtdVeiculosContrato: r.QtdVeiculosContrato,
    QtdVeiculosAditivo: r.QtdVeiculosAditivo,
    NumeroProcesso: r.NumeroProcesso,
    MotivoInclusaoPosterior: r.MotivoInclusaoPosterior,
    ValorVeiculo: r.ValorVeiculo,
    StatusCadastro: r.StatusCadastro || 'COMPLETO'
  };
}

/**
 * Agrupa os veículos filtrados por Termo de Doação ("Processo"), com
 * contagem de quantos já tiveram o ATPVe emitido/enviado. É o que a tela
 * de Listagem exibe — processos, não veículos soltos.
 *
 * Não traz a lista de veículos de cada processo (só os totais) — a tela
 * busca isso à parte, um processo de cada vez, só quando a pessoa expande
 * o card (ver getVeiculosDoProcesso). Antes essa função montava a lista
 * completa de veículos de TODOS os processos da página de uma vez, mesmo
 * dos cards ainda fechados — trabalho e tráfego desperdiçados numa tela
 * com muitos processos.
 */
function listarProcessos(filtros) {
  var todos = listarVeiculos(filtros);
  var grupos = {};
  var ordem = [];
  // Maior ID de veículo visto em cada processo, usado para ordenar do mais
  // recente para o mais antigo. IDs têm o formato "VC-000123" (largura fixa),
  // então comparar como texto já reflete a ordem numérica/cronológica de
  // cadastro — mais confiável do que confiar em como a planilha formata a
  // coluna de data.
  var maiorIdPorChave = {};

  todos.forEach(function (v) {
    // Agrupa pelo Número do Processo (o que a Listagem exibe). Registros
    // antigos, migrados antes desse campo existir, não têm NumeroProcesso —
    // para não cair todos num único grupo gigante (o que travaria a tela),
    // esses usam o Termo de Doação como identificador de agrupamento.
    var chave = chaveProcesso_(v);
    if (!grupos[chave]) {
      grupos[chave] = {
        chave: chave,
        numeroProcesso: v.NumeroProcesso || '',
        termoDoacao: v.TermoDoacao,
        numeroSei: v.NumeroSei || '',
        contrato: v.Contrato || '',
        aditivo: v.Aditivo || 'NÃO',
        numeroAditivo: v.NumeroAditivo || '',
        qtdVeiculosContrato: v.QtdVeiculosContrato || '',
        qtdVeiculosAditivo: v.QtdVeiculosAditivo || '',
        uf: v.UF,
        ente: v.Ente,
        donataria: v.Donataria,
        cnpjDonataria: v.CNPJDonataria || '',
        ano: v.Ano,
        mes: v.Mes,
        cep: v.CEP || '',
        logradouro: v.Logradouro || '',
        numero: v.Numero || '',
        complemento: v.Complemento || '',
        bairro: v.Bairro || '',
        municipio: v.Municipio || '',
        totalVeiculos: 0,
        totalEmitidos: 0,
        totalEnviados: 0,
        totalTransferidos: 0,
        totalValor: 0,
        totalRascunhos: 0
      };
      ordem.push(chave);
      maiorIdPorChave[chave] = '';
    }
    var grupo = grupos[chave];
    grupo.totalVeiculos++;
    if (v.ATPVeEmitido === 'SIM') grupo.totalEmitidos++;
    if (v.ATPVeEnviado === 'SIM') grupo.totalEnviados++;
    if (v.Transferido === 'SIM') grupo.totalTransferidos++;
    if ((v.StatusCadastro || 'COMPLETO') === 'RASCUNHO') grupo.totalRascunhos++;
    grupo.totalValor += Number(v.ValorVeiculo) || 0;
    var idAtual = String(v.ID || '');
    if (idAtual > maiorIdPorChave[chave]) maiorIdPorChave[chave] = idAtual;
  });

  ordem.sort(function (a, b) {
    var idA = maiorIdPorChave[a], idB = maiorIdPorChave[b];
    if (idA === idB) return 0;
    return idA < idB ? 1 : -1; // ID maior (mais recente) primeiro
  });

  var processos = ordem.map(function (chave) { return grupos[chave]; });
  processos.forEach(function (p) {
    var qtdContrato = parseInt(p.qtdVeiculosContrato, 10) || 0;
    var qtdAditivo = (p.aditivo === 'SIM') ? (parseInt(p.qtdVeiculosAditivo, 10) || 0) : 0;
    p.qtdEsperada = qtdContrato + qtdAditivo;
    p.temRascunho = p.totalRascunhos > 0;
  });
  var totalPaginas = Math.max(1, Math.ceil(processos.length / LIMITE_LISTAGEM_PADRAO));
  var pagina = Math.min(totalPaginas, Math.max(1, parseInt(filtros && filtros.pagina, 10) || 1));
  var inicio = (pagina - 1) * LIMITE_LISTAGEM_PADRAO;
  // Soma sobre TODOS os processos que passaram no filtro (não só os da página
  // atual), para o total de veículos bater com o total de processos exibido —
  // um processo normalmente tem vários veículos, então esse número é maior.
  var totalVeiculos = processos.reduce(function (soma, p) { return soma + p.totalVeiculos; }, 0);

  return {
    totalProcessos: processos.length,
    totalVeiculos: totalVeiculos,
    pagina: pagina,
    totalPaginas: totalPaginas,
    processos: processos.slice(inicio, inicio + LIMITE_LISTAGEM_PADRAO)
  };
}

/**
 * Veículos de UM processo só — chamada pela tela de Listagem no momento em
 * que a pessoa expande aquele card (não mais junto com listarProcessos).
 * "chave" é o campo "chave" que cada processo já traz (ver chaveProcesso_).
 * Os mesmos filtros (ano, transferido, busca etc.) usados em listarProcessos
 * devem ser passados de novo aqui, senão um processo que só aparece com um
 * filtro aplicado devolveria a lista errada (ou vazia) ao expandir.
 */
function getVeiculosDoProcesso(chave, filtros) {
  if (!chave) throw new Error('Processo inválido.');
  var todos = listarVeiculos(filtros || {});
  return todos
    .filter(function (v) { return chaveProcesso_(v) === chave; })
    .map(paraDtoListagem_);
}

/**
 * Anos distintos existentes em toda a base de veículos, para o filtro de Ano
 * da tela de Listagem. Precisa varrer a base inteira (sem paginação): os
 * processos mais antigos ficam nas últimas páginas de listarProcessos, então
 * derivar os anos só da página carregada deixaria anos antigos de fora do
 * filtro.
 */
function getAnosDisponiveis() {
  var cache = CacheService.getDocumentCache();
  var cacheado = cache.get('anos_disponiveis');
  if (cacheado) return JSON.parse(cacheado);

  var registros = listarVeiculos({});
  var anos = {};
  registros.forEach(function (r) { anos[String(r.Ano)] = true; });
  var resultado = Object.keys(anos).sort();

  cache.put('anos_disponiveis', JSON.stringify(resultado), CACHE_ANOS_SEGUNDOS);
  return resultado;
}

/**
 * Alterna rapidamente o status de emissão/envio do ATPVe ou de
 * transferência de um veículo, sem reenviar/validar o cadastro inteiro —
 * usado pelos toggles dentro de um processo expandido na Listagem.
 */
// Converte uma data "AAAA-MM-DD" (vinda de <input type="date">) num Date
// LOCAL ao meio-dia — em vez de new Date('AAAA-MM-DD') puro, que interpreta
// como meia-noite UTC e pode "voltar um dia" em fusos negativos como o do
// Brasil. Devolve null se vier vazio/ inválido (quem chamar deve cair pra
// "agora" nesse caso).
function parseDataLocal_(valor) {
  if (!valor) return null;
  var partes = String(valor).split('-');
  if (partes.length !== 3) return null;
  var ano = parseInt(partes[0], 10), mes = parseInt(partes[1], 10), dia = parseInt(partes[2], 10);
  if (!ano || !mes || !dia) return null;
  return new Date(ano, mes - 1, dia, 12, 0, 0);
}

function atualizarStatusVeiculo(id, campo, valor, dataEmissaoAtpve, dataEnvioAtpve) {
  if (['ATPVeEmitido', 'ATPVeEnviado', 'Transferido'].indexOf(campo) === -1) {
    throw new Error('Campo inválido: ' + campo);
  }
  var valorNormalizado = normalizarTransferido_(valor);
  if (!valorNormalizado) throw new Error('Valor inválido: ' + valor);

  var perfil = getPerfilUsuarioAtual_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();
  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Veículo não encontrado: ' + id);

  if (!podeEditarLinha_(perfil)) {
    throw new Error('Você não tem permissão para editar este registro — visitantes só podem visualizar.');
  }

  // Um veículo transferido implica que o ATPVe dele já foi emitido e
  // enviado — por segurança/consistência da base:
  // - Não deixa desmarcar ATPVeEmitido/ATPVeEnviado enquanto o veículo
  //   ainda estiver marcado como Transferido (evitaria um estado
  //   contraditório: transferido mas sem ATPVe).
  if ((campo === 'ATPVeEmitido' || campo === 'ATPVeEnviado') && valorNormalizado === 'NÃO') {
    var transferidoAtual = normalizarTransferido_(sheet.getRange(linhaIdx, colunaParaIndice_('Transferido') + 1).getValue());
    if (transferidoAtual === 'SIM') {
      throw new Error('Não é possível desmarcar o ATPVe de um veículo já transferido. Desmarque primeiro o status "Transferido".');
    }
  }

  var agora = new Date();
  // A data informada na caixa "Que data o ATPVe foi emitido/enviado?" (ver
  // tela) tem prioridade sobre "agora" — permite registrar hoje uma emissão
  // que na prática aconteceu num dia anterior, sem distorcer o Relatório de
  // Produtividade (que conta pela data real, não pela data do clique).
  var dataEmissaoEscolhida = parseDataLocal_(dataEmissaoAtpve) || agora;
  var dataEnvioEscolhida = parseDataLocal_(dataEnvioAtpve) || agora;
  var cascataTransferido = campo === 'Transferido' && valorNormalizado === 'SIM';
  var celulaDataEmissaoAtpve = sheet.getRange(linhaIdx, colunaParaIndice_('DataEmissaoATPVe') + 1);
  var celulaDataEnvioAtpve = sheet.getRange(linhaIdx, colunaParaIndice_('DataEnvioATPVe') + 1);

  sheet.getRange(linhaIdx, colunaParaIndice_(campo) + 1).setValue(valorNormalizado);
  // Só grava a data de emissão/envio do ATPVe na primeira vez que cada campo
  // vira SIM — o relatório de produtividade conta pela data real, então não
  // pode ser sobrescrita depois por uma cascata de Transferido (senão a
  // emissão passaria a contar na semana da transferência, não na semana em
  // que o ATPVe foi de fato emitido/enviado).
  if (campo === 'ATPVeEmitido' && valorNormalizado === 'SIM' && !celulaDataEmissaoAtpve.getValue()) {
    celulaDataEmissaoAtpve.setValue(dataEmissaoEscolhida);
  }
  if (campo === 'ATPVeEnviado' && valorNormalizado === 'SIM' && !celulaDataEnvioAtpve.getValue()) {
    celulaDataEnvioAtpve.setValue(dataEnvioEscolhida);
  }
  if (cascataTransferido) {
    // Marcar como transferido também marca o ATPVe como emitido e enviado —
    // não existe, na prática, veículo transferido sem isso.
    sheet.getRange(linhaIdx, colunaParaIndice_('ATPVeEmitido') + 1).setValue('SIM');
    sheet.getRange(linhaIdx, colunaParaIndice_('ATPVeEnviado') + 1).setValue('SIM');
    if (!celulaDataEmissaoAtpve.getValue()) {
      celulaDataEmissaoAtpve.setValue(dataEmissaoEscolhida);
    }
    if (!celulaDataEnvioAtpve.getValue()) {
      celulaDataEnvioAtpve.setValue(dataEnvioEscolhida);
    }
    // Mesmo comportamento do cadastro/edição completa: registra a data da
    // primeira vez que o veículo é marcado como transferido; não apaga essa
    // data se depois for desmarcado.
    sheet.getRange(linhaIdx, colunaParaIndice_('DataTransferencia') + 1).setValue(agora);
  }
  sheet.getRange(linhaIdx, colunaParaIndice_('UltimaAtualizacao') + 1).setValue(agora);
  sheet.getRange(linhaIdx, colunaParaIndice_('AtualizadoPor') + 1).setValue(perfil.email);

  registrarLog_('ATUALIZAR_STATUS', id, campo + '=' + valorNormalizado);
  invalidarCacheDashboard_();
  return { mensagem: 'Atualizado com sucesso.', campo: campo, valor: valorNormalizado, cascata: cascataTransferido };
}

/**
 * Identidade de um processo pra fins de agrupamento — usada pela tela de
 * Processos, pelo aviso de TEP e pelo detalhamento por UF/Região.
 * NumeroProcesso quando existe; senão Ano + Número SEI (quando tiver) ou
 * Ano + Termo de Doação. O Ano entra porque o SENASP reaproveita os
 * mesmos números de termo a cada ano (ex.: "Termo de Doação SENASP 85"
 * existiu em 2024 E de novo, sem relação nenhuma, em 2026). O Número SEI
 * tem prioridade sobre o texto do termo porque é o identificador
 * administrativo de verdade: dois números de termo iguais no MESMO ano,
 * mas com SEI diferente (ex.: "SENASP 411" usado tanto por um órgão do
 * Pará quanto pela Prefeitura de Florianópolis, no mesmo 2026), só o SEI
 * consegue diferenciar — o texto do termo sozinho ainda juntaria os dois.
 *
 * Separador '_' (não ':') de propósito: uma chave tipo "2026:33808427"
 * parece hora/duração (H:MM:SS) pro autoparser do Google Sheets, que
 * converte sozinho pra um valor de duração (ex.: virou "565499:47:00")
 * mesmo com a coluna travada como texto puro — já aconteceu com as chaves
 * de TEP finalizado. '_' nunca é interpretado como data/hora, então essa
 * classe de bug não pode mais acontecer aqui.
 */
function chaveProcesso_(registro) {
  if (registro.NumeroProcesso) return registro.NumeroProcesso;
  return (registro.Ano || '') + '_' + (registro.NumeroSei || registro.TermoDoacao || '');
}

function linhaParaObjeto_(cabecalho, linha) {
  var obj = {};
  cabecalho.forEach(function (campo, i) { obj[campo] = linha[i]; });
  return obj;
}

function salvarVeiculo(dados) {
  var perfil = getPerfilUsuarioAtual_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);

  var registro = validarESanitizarVeiculo_(dados);

  if (dados.ID) {
    return atualizarVeiculo_(sheet, perfil, dados.ID, registro);
  }
  return criarVeiculo_(sheet, perfil, registro);
}

function validarESanitizarVeiculo_(dados) {
  var erros = [];
  // Presença de dados.ID indica edição de um veículo já existente — muitos
  // vieram de migração de dados antigos incompletos, com marcadores como
  // "NI" (UF não informada) ou chassi "HIST-..." (lote sem chassi
  // individual). Exigir esses campos completos/no formato certo pra poder
  // salvar até uma edição que não mexe neles travava a tela sem necessidade
  // — essa obrigatoriedade agora vale só para cadastro novo.
  var ehEdicao = !!dados.ID;

  var uf = normalizarUF_(dados.UF);
  var ente = normalizarTexto_(dados.Ente);
  var mes = normalizarTexto_(dados.Mes).toUpperCase();
  var chassi = normalizarChassi_(dados.Chassi);
  var placa = normalizarPlaca_(dados.Placa);
  var renavam = normalizarTexto_(dados.Renavam).replace(/\D/g, '');
  var transferido = normalizarTransferido_(dados.Transferido) || 'NÃO';
  var atpveEmitido = normalizarTransferido_(dados.ATPVeEmitido) || 'NÃO';
  var atpveEnviado = normalizarTransferido_(dados.ATPVeEnviado) || 'NÃO';
  // Um veículo transferido implica que o ATPVe dele já foi emitido e
  // enviado — não existe, na prática, veículo "transferido" sem isso.
  if (transferido === 'SIM') {
    atpveEmitido = 'SIM';
    atpveEnviado = 'SIM';
  }
  var ano = parseInt(dados.Ano, 10);
  var cep = normalizarTexto_(dados.CEP).replace(/\D/g, '');

  // Salvar como rascunho (só vale pra cadastro novo — dados.SalvarRascunho)
  // permite criar o processo com o veículo em branco, pra completar depois
  // em "Editar processo". Formato ainda é validado quando o campo foi
  // preenchido; só a OBRIGATORIEDADE de cada campo fica de lado.
  var rascunho = !ehEdicao && !!dados.SalvarRascunho;

  if (!ehEdicao) {
    if (uf && UFS_VALIDAS.indexOf(uf) === -1 && CODIGOS_ORGAO_FEDERAL.indexOf(uf) === -1) {
      erros.push('UF inválida: ' + dados.UF);
    }
    if (ente && ENTES_VALIDOS.indexOf(ente) === -1) erros.push('Ente inválido: ' + dados.Ente);
    if (mes && MESES_VALIDOS.indexOf(mes) === -1) erros.push('Mês inválido: ' + dados.Mes);
    if (dados.Ano && !ano) erros.push('Ano inválido: ' + dados.Ano);
    if (ano && (ano < 2000 || ano > 2100)) erros.push('Ano inválido: ' + dados.Ano);
    if (chassi && !validarChassi_(chassi)) erros.push('Chassi inválido (17 caracteres, sem I/O/Q): ' + chassi);
    if (placa && !validarPlaca_(placa)) erros.push('Placa inválida: ' + placa);
    if (renavam && !validarRenavam_(renavam)) erros.push('Renavam inválido: ' + renavam);

    if (!rascunho) {
      if (!uf) erros.push('UF é obrigatória.');
      if (!ente) erros.push('Ente é obrigatório.');
      if (!mes) erros.push('Mês é obrigatório.');
      if (!dados.Ano) erros.push('Ano é obrigatório.');
      if (!chassi) erros.push('Chassi inválido (17 caracteres, sem I/O/Q): ' + chassi);
      if (!placa) erros.push('Placa inválida: ' + placa);
      if (!renavam) erros.push('Renavam inválido: ' + renavam);
      if (!normalizarTexto_(dados.Donataria)) erros.push('Donatária é obrigatória.');
      if (!normalizarTexto_(dados.TermoDoacao)) erros.push('Termo de doação é obrigatório.');
      if (!normalizarTexto_(dados.NumeroSei)) erros.push('Número SEI do Termo é obrigatório.');
    }
  }
  // CEP só é validado no formato quando informado — não é exigido aqui para
  // não travar a edição de veículos antigos (migrados sem endereço).
  if (cep && cep.length !== 8) erros.push('CEP inválido: ' + dados.CEP);

  if (erros.length) {
    throw new Error(erros.join('\n'));
  }

  // Processo "completo" = todos os campos essenciais presentes e válidos.
  // Recalculado sempre (não só na criação) pra um rascunho virar COMPLETO
  // sozinho assim que "Editar processo" preencher o que faltava, e pra uma
  // edição que apague um campo essencial voltar a aparecer como rascunho.
  var completo = !!(
    (UFS_VALIDAS.indexOf(uf) !== -1 || CODIGOS_ORGAO_FEDERAL.indexOf(uf) !== -1) &&
    ENTES_VALIDOS.indexOf(ente) !== -1 &&
    MESES_VALIDOS.indexOf(mes) !== -1 &&
    ano && ano >= 2000 && ano <= 2100 &&
    validarChassi_(chassi) &&
    validarPlaca_(placa) &&
    validarRenavam_(renavam) &&
    normalizarTexto_(dados.Donataria) &&
    normalizarTexto_(dados.TermoDoacao) &&
    normalizarTexto_(dados.NumeroSei)
  );

  return {
    StatusCadastro: completo ? 'COMPLETO' : 'RASCUNHO',
    Ano: ano || dados.Ano,
    Mes: mes,
    UF: uf,
    Ente: ente,
    Donataria: normalizarTexto_(dados.Donataria),
    TermoDoacao: normalizarTexto_(dados.TermoDoacao),
    NumeroSei: normalizarTexto_(dados.NumeroSei),
    Descricao: normalizarTexto_(dados.Descricao),
    Marca: normalizarMarca_(dados.Marca),
    Chassi: chassi,
    Renavam: renavam,
    Placa: placa,
    Transferido: transferido,
    Observacoes: normalizarTexto_(dados.Observacoes),
    CNPJDonataria: normalizarCnpjCpf_(dados.CNPJDonataria),
    CEP: cep,
    Logradouro: normalizarTexto_(dados.Logradouro),
    Numero: normalizarTexto_(dados.Numero),
    Complemento: normalizarTexto_(dados.Complemento),
    Bairro: normalizarTexto_(dados.Bairro),
    Municipio: normalizarTexto_(dados.Municipio),
    ATPVeEmitido: atpveEmitido,
    ATPVeEnviado: atpveEnviado,
    Contrato: normalizarTexto_(dados.Contrato),
    Aditivo: normalizarTransferido_(dados.Aditivo) || 'NÃO',
    NumeroAditivo: normalizarTexto_(dados.NumeroAditivo),
    QtdVeiculosContrato: normalizarTexto_(dados.QtdVeiculosContrato).replace(/\D/g, ''),
    QtdVeiculosAditivo: normalizarTexto_(dados.QtdVeiculosAditivo).replace(/\D/g, ''),
    NumeroProcesso: normalizarTexto_(dados.NumeroProcesso),
    ValorVeiculo: normalizarValorMonetario_(dados.ValorVeiculo),
    // Só normaliza (e assim só grava) quando o cliente realmente mandou o campo —
    // ele só é enviado ao inserir um veículo novo num processo já existente. Deixar
    // undefined nos demais casos faz atualizarVeiculo_ pular essa coluna e preservar
    // o motivo já gravado, em vez de apagá-lo a cada edição do processo.
    MotivoInclusaoPosterior: dados.MotivoInclusaoPosterior !== undefined ? normalizarTexto_(dados.MotivoInclusaoPosterior) : undefined
  };
}

function criarVeiculo_(sheet, perfil, registro) {
  if (perfil.perfil !== PERFIL_ADMIN && perfil.perfil !== PERFIL_USUARIO) {
    throw new Error('Você não tem permissão para cadastrar veículos — visitantes só podem visualizar.');
  }

  garantirColunasVeiculos_();

  var duplicado = encontrarDuplicado_(sheet, registro.Chassi, registro.Placa);
  if (duplicado) {
    throw new Error('Já existe um veículo cadastrado com este chassi ou placa (ID ' + duplicado + ').');
  }

  var id = gerarProximoId_();
  var agora = new Date();
  var linha = CABECALHO_VEICULOS.map(function (campo) {
    switch (campo) {
      case 'ID': return id;
      case 'DataCadastro': return agora;
      case 'DataTransferencia': return registro.Transferido === 'SIM' ? agora : '';
      case 'DataEmissaoATPVe': return registro.ATPVeEmitido === 'SIM' ? agora : '';
      case 'CadastradoPor': return perfil.email;
      case 'UltimaAtualizacao': return agora;
      case 'AtualizadoPor': return perfil.email;
      default: return registro[campo] !== undefined ? registro[campo] : '';
    }
  });

  sheet.appendRow(linha);
  registrarLog_('CRIAR', id, JSON.stringify(registro));
  invalidarCacheDashboard_();
  return { ID: id, mensagem: 'Veículo cadastrado com sucesso.' };
}

/**
 * Motor genérico de importação em lote — usado pelas funções de
 * importação pontual de ofícios/termos de doação (ex.:
 * importarOficio480_2026). Ao contrário de chamar salvarVeiculo() num
 * loop (que relê a planilha inteira do zero a cada veículo só pra
 * checar duplicidade — com ~3.500 linhas, isso levou mais de 3 minutos
 * pra importar 67 veículos), lê a planilha UMA VEZ, valida cada linha
 * em memória com a mesma validarESanitizarVeiculo_() do cadastro
 * manual (as mesmas regras, os mesmos erros) e grava tudo de uma vez
 * com um único setValues() — questão de segundos mesmo com centenas de
 * linhas.
 *
 * "comum" são os campos que valem pra todos os veículos do lote (Ano,
 * UF, Donataria, NumeroSei etc.). "veiculos" é uma lista de objetos só
 * com os campos que variam por veículo (pelo menos Chassi/Renavam/
 * Placa) — cada um mesclado com "comum" antes de validar (o que vier
 * no objeto do veículo tem prioridade, pra poder sobrescrever algo
 * específico daquele item se precisar). Duplicidade (chassi OU placa
 * já existente — seja na planilha ou repetido dentro do próprio lote)
 * é ignorada sem erro, pra poder rodar de novo com segurança se a
 * execução parar no meio.
 */
function importarVeiculosEmLote_(comum, veiculos) {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil !== PERFIL_ADMIN && perfil.perfil !== PERFIL_USUARIO) {
    throw new Error('Você não tem permissão para cadastrar veículos — visitantes só podem visualizar.');
  }

  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var dadosAtuais = sheet.getDataRange().getValues();
  var cabecalho = dadosAtuais[0];
  var idxChassi = cabecalho.indexOf('Chassi');
  var idxPlaca = cabecalho.indexOf('Placa');
  var chassisExistentes = {}, placasExistentes = {};
  for (var i = 1; i < dadosAtuais.length; i++) {
    if (dadosAtuais[i][idxChassi]) chassisExistentes[dadosAtuais[i][idxChassi]] = true;
    if (dadosAtuais[i][idxPlaca]) placasExistentes[dadosAtuais[i][idxPlaca]] = true;
  }

  var agora = new Date();
  var criados = [], jaExistiam = [], erros = [], novasLinhas = [];

  veiculos.forEach(function (v) {
    var dadosVeiculo = {};
    for (var campo in comum) dadosVeiculo[campo] = comum[campo];
    for (var campoVeiculo in v) dadosVeiculo[campoVeiculo] = v[campoVeiculo];

    var registro;
    try {
      registro = validarESanitizarVeiculo_(dadosVeiculo);
    } catch (e) {
      erros.push((dadosVeiculo.Placa || dadosVeiculo.Chassi || '?') + ': ' + (e.message || String(e)));
      return;
    }

    if (chassisExistentes[registro.Chassi] || placasExistentes[registro.Placa]) {
      jaExistiam.push(registro.Placa || registro.Chassi);
      return;
    }

    var id = gerarProximoId_();
    novasLinhas.push(CABECALHO_VEICULOS.map(function (campoCabecalho) {
      switch (campoCabecalho) {
        case 'ID': return id;
        case 'DataCadastro': return agora;
        case 'DataTransferencia': return registro.Transferido === 'SIM' ? agora : '';
        case 'DataEmissaoATPVe': return registro.ATPVeEmitido === 'SIM' ? agora : '';
        case 'CadastradoPor': return perfil.email;
        case 'UltimaAtualizacao': return agora;
        case 'AtualizadoPor': return perfil.email;
        default: return registro[campoCabecalho] !== undefined ? registro[campoCabecalho] : '';
      }
    }));
    chassisExistentes[registro.Chassi] = true;
    placasExistentes[registro.Placa] = true;
    criados.push(id + ' — ' + (registro.Placa || registro.Chassi));
  });

  if (novasLinhas.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, novasLinhas.length, CABECALHO_VEICULOS.length).setValues(novasLinhas);
    registrarLog_('CRIAR_LOTE', '-', criados.length + ' veículo(s) importado(s) em lote: ' + criados.join(', '));
    invalidarCacheDashboard_();
  }

  return { criados: criados, jaExistiam: jaExistiam, erros: erros };
}

function atualizarVeiculo_(sheet, perfil, id, registro) {
  // Garante que colunas adicionadas depois da criação original da planilha
  // (como ValorVeiculo) já existem com o cabeçalho certo antes de gravar —
  // sem isso, colunaParaIndice_ aponta pra uma coluna sem rótulo físico na
  // aba, e o valor gravado nunca é reconhecido de volta como esse campo.
  garantirColunasVeiculos_();

  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Veículo não encontrado: ' + id);

  if (!podeEditarLinha_(perfil)) {
    throw new Error('Você não tem permissão para editar registros — visitantes só podem visualizar.');
  }

  var agora = new Date();
  var duplicado = encontrarDuplicado_(sheet, registro.Chassi, registro.Placa, id);
  if (duplicado) {
    throw new Error('Já existe outro veículo com este chassi ou placa (ID ' + duplicado + ').');
  }
  CABECALHO_VEICULOS.forEach(function (campo) {
    if (['ID', 'DataCadastro', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor'].indexOf(campo) !== -1) return;
    if (campo === 'DataTransferencia') return;
    var valor = registro[campo];
    if (valor !== undefined) {
      sheet.getRange(linhaIdx, colunaParaIndice_(campo) + 1).setValue(valor);
    }
  });
  // Só grava a data na primeira vez que o veículo vira "Transferido: SIM"
  // — reeditar um processo já transferido (pra corrigir só o Contrato,
  // por exemplo) não pode empurrar a data de transferência pra hoje de
  // novo, senão o Relatório de Produtividade passaria a contar esse
  // veículo como "transferido" no período errado.
  if (registro.Transferido === 'SIM') {
    var celulaDataTransferencia = sheet.getRange(linhaIdx, colunaParaIndice_('DataTransferencia') + 1);
    if (!celulaDataTransferencia.getValue()) {
      celulaDataTransferencia.setValue(agora);
    }
  }

  sheet.getRange(linhaIdx, colunaParaIndice_('UltimaAtualizacao') + 1).setValue(agora);
  sheet.getRange(linhaIdx, colunaParaIndice_('AtualizadoPor') + 1).setValue(perfil.email);

  registrarLog_('ATUALIZAR', id, JSON.stringify(registro));
  invalidarCacheDashboard_();
  return { ID: id, mensagem: 'Veículo atualizado com sucesso.' };
}

/**
 * Salva de uma vez TODOS os veículos de um processo sendo editado
 * (existentes + novos) — em vez de uma chamada salvarVeiculo() por
 * veículo, que fazia a tela ir/voltar ao servidor uma vez PRA CADA
 * veículo do processo, cada ida relendo a planilha inteira (checagem de
 * duplicidade). "comuns" são os campos que valem pra todos os veículos
 * do processo (Contrato, UF, Donataria, endereço etc.). "veiculos" é a
 * lista de veículos do processo, cada um com os campos que só ele tem
 * (Chassi, Placa, Marca...) e, se já existir, o ID (indica atualização;
 * sem ID é veículo novo).
 *
 * Lê só as 3 colunas necessárias pra achar a linha de cada ID e checar
 * duplicidade (ID/Chassi/Placa — bem mais leve que ler as 42 colunas de
 * ~3.500 linhas por inteiro), depois lê/grava APENAS as linhas dos
 * veículos que de fato mudam — nunca a planilha inteira. Assim o custo
 * fica proporcional a quantos veículos o PROCESSO tem, não a quantos
 * veículos existem no sistema todo (que só cresce, processo grande ou
 * pequeno). Valida cada veículo em memória com a mesma
 * validarESanitizarVeiculo_() de sempre (os mesmos erros, as mesmas
 * regras) e replica o comportamento de atualizarVeiculo_/criarVeiculo_
 * campo a campo (inclusive a regra de DataTransferencia: só é
 * atualizada pra "agora" quando Transferido é salvo como SIM pela
 * primeira vez, nunca apagada quando Transferido é NÃO nem
 * re-carimbada numa reedição — e DataEmissaoATPVe nunca é tocada numa
 * edição, só na criação, pra não sobrescrever a data real da primeira
 * emissão).
 */
function salvarProcessoEditado(comuns, veiculos) {
  var perfil = exigirPerfilEditor_();
  if (!veiculos || !veiculos.length) throw new Error('O processo precisa ter ao menos um veículo.');

  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var idxId = colunaParaIndice_('ID');
  var idxChassi = colunaParaIndice_('Chassi');
  var idxPlaca = colunaParaIndice_('Placa');
  var idxTransferencia = colunaParaIndice_('DataTransferencia');
  var idxUltimaAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');

  var ultimaLinha = sheet.getLastRow();
  var largura = Math.max(idxId, idxChassi, idxPlaca) + 1;
  var referencia = ultimaLinha >= 2 ? sheet.getRange(2, 1, ultimaLinha - 1, largura).getValues() : [];

  // Linha de cada ID já existente, e quem é "dono" de cada chassi/placa
  // hoje — pra checar duplicidade em memória (mesma lógica de
  // encontrarDuplicado_, só que pré-calculada de uma leitura só).
  var linhaPorId = {};
  var donoChassi = {}, donoPlaca = {};
  for (var i = 0; i < referencia.length; i++) {
    var idLinha = referencia[i][idxId];
    if (!idLinha) continue;
    linhaPorId[idLinha] = i + 2; // linha real na planilha (1 = cabeçalho)
    if (referencia[i][idxChassi]) donoChassi[referencia[i][idxChassi]] = idLinha;
    if (referencia[i][idxPlaca]) donoPlaca[referencia[i][idxPlaca]] = idLinha;
  }

  var agora = new Date();
  var idsNovos = [];
  var novasLinhas = [];

  for (var v = 0; v < veiculos.length; v++) {
    var veiculo = veiculos[v];
    var dadosVeiculo = {};
    for (var campoComum in comuns) dadosVeiculo[campoComum] = comuns[campoComum];
    for (var campoVeiculo in veiculo) dadosVeiculo[campoVeiculo] = veiculo[campoVeiculo];

    var registro;
    try {
      registro = validarESanitizarVeiculo_(dadosVeiculo);
    } catch (e) {
      throw new Error('Veículo ' + (v + 1) + ' (' + (veiculo.Placa || veiculo.Chassi || '?') + '): ' + (e.message || String(e)));
    }

    var idAtual = veiculo.ID || null;
    // Chassi/placa em branco (veículo ainda em rascunho) nunca contam como
    // duplicidade — nem contra a planilha, nem entre dois rascunhos do
    // mesmo processo salvos juntos neste lote.
    var donoAtualChassi = registro.Chassi ? donoChassi[registro.Chassi] : null;
    var donoAtualPlaca = registro.Placa ? donoPlaca[registro.Placa] : null;
    if ((donoAtualChassi && donoAtualChassi !== idAtual) || (donoAtualPlaca && donoAtualPlaca !== idAtual)) {
      throw new Error('Veículo ' + (v + 1) + ': já existe outro veículo cadastrado com este chassi ou placa (ID ' +
        (donoAtualChassi || donoAtualPlaca) + ').');
    }

    if (idAtual) {
      var linhaIdx = linhaPorId[idAtual];
      if (!linhaIdx) throw new Error('Veículo ' + (v + 1) + ' (ID ' + idAtual + ') não encontrado.');
      var faixaLinha = sheet.getRange(linhaIdx, 1, 1, CABECALHO_VEICULOS.length);
      var linhaAtual = faixaLinha.getValues()[0];
      CABECALHO_VEICULOS.forEach(function (campo, colIdx) {
        if (['ID', 'DataCadastro', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor', 'DataTransferencia'].indexOf(campo) !== -1) return;
        if (registro[campo] !== undefined) linhaAtual[colIdx] = registro[campo];
      });
      // Só grava a data na primeira vez que o veículo vira "Transferido:
      // SIM" — reeditar um processo já transferido (pra corrigir só o
      // Contrato, por exemplo) não pode empurrar a data de transferência
      // pra hoje de novo, senão o Relatório de Produtividade passaria a
      // contar esse veículo como "transferido" no período errado.
      if (registro.Transferido === 'SIM' && !linhaAtual[idxTransferencia]) {
        linhaAtual[idxTransferencia] = agora;
      }
      linhaAtual[idxUltimaAtualizacao] = agora;
      linhaAtual[idxAtualizadoPor] = perfil.email;
      faixaLinha.setValues([linhaAtual]);
    } else {
      var novoId = gerarProximoId_();
      var novaLinha = CABECALHO_VEICULOS.map(function (campo) {
        switch (campo) {
          case 'ID': return novoId;
          case 'DataCadastro': return agora;
          case 'DataTransferencia': return registro.Transferido === 'SIM' ? agora : '';
          case 'DataEmissaoATPVe': return registro.ATPVeEmitido === 'SIM' ? agora : '';
          case 'CadastradoPor': return perfil.email;
          case 'UltimaAtualizacao': return agora;
          case 'AtualizadoPor': return perfil.email;
          default: return registro[campo] !== undefined ? registro[campo] : '';
        }
      });
      novasLinhas.push(novaLinha);
      idsNovos.push({ indice: v, id: novoId });
      idAtual = novoId;
    }

    if (registro.Chassi) donoChassi[registro.Chassi] = idAtual;
    if (registro.Placa) donoPlaca[registro.Placa] = idAtual;
  }

  if (novasLinhas.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, novasLinhas.length, CABECALHO_VEICULOS.length).setValues(novasLinhas);
  }

  registrarLog_('EDITAR_PROCESSO', comuns.NumeroProcesso || '-', veiculos.length + ' veículo(s) do processo salvos em lote.');
  invalidarCacheDashboard_();

  return { mensagem: 'Processo atualizado com sucesso.', idsNovos: idsNovos };
}

// Exclusão lógica: a linha nunca é apagada de verdade, só marcada como
// excluída e filtrada das telas normais (ver listarVeiculos). O log grava
// o registro inteiro (igual ATUALIZAR) — sem isso, restaurar não bastaria,
// porque não haveria como saber o que tinha na linha antes de virar
// "excluído" (o log antigo só guardava "EXCLUIR" + o ID, sem os dados).
function excluirVeiculo(id) {
  var perfil = exigirPerfilAdmin_();
  garantirColunasVeiculos_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Veículo não encontrado: ' + id);

  var cabecalho = sheet.getRange(1, 1, 1, CABECALHO_VEICULOS.length).getValues()[0];
  var linhaAtual = sheet.getRange(linhaIdx, 1, 1, CABECALHO_VEICULOS.length).getValues()[0];
  var registroAntes = linhaParaObjeto_(cabecalho, linhaAtual);
  if (registroAntes.Excluido === 'SIM') {
    return { mensagem: 'Esse veículo já estava na lixeira.' };
  }

  var agora = new Date();
  sheet.getRange(linhaIdx, colunaParaIndice_('Excluido') + 1).setValue('SIM');
  sheet.getRange(linhaIdx, colunaParaIndice_('ExcluidoPor') + 1).setValue(perfil.email);
  sheet.getRange(linhaIdx, colunaParaIndice_('DataExclusao') + 1).setValue(agora);

  registrarLog_('EXCLUIR', id, JSON.stringify(registroAntes));
  invalidarCacheDashboard_();
  return { mensagem: 'Veículo movido para a lixeira — um administrador pode restaurar em "Lixeira".' };
}

// Tira o veículo da lixeira — some da tela Lixeira e volta a aparecer
// normalmente em todo o resto do site.
function restaurarVeiculo(id) {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Veículo não encontrado: ' + id);

  sheet.getRange(linhaIdx, colunaParaIndice_('Excluido') + 1).setValue('NÃO');
  sheet.getRange(linhaIdx, colunaParaIndice_('ExcluidoPor') + 1).setValue('');
  sheet.getRange(linhaIdx, colunaParaIndice_('DataExclusao') + 1).setValue('');

  registrarLog_('RESTAURAR', id, '');
  invalidarCacheDashboard_();
  return { mensagem: 'Veículo restaurado com sucesso.' };
}

// Lista da tela "Lixeira" — só os veículos excluídos, mais recentes
// primeiro. Só administradores (mesma exigência de quem pode excluir).
function getVeiculosExcluidos() {
  exigirPerfilAdmin_();
  var registros = listarVeiculos({ incluirExcluidos: true });
  return registros
    .filter(function (r) { return r.Excluido === 'SIM'; })
    .map(function (r) {
      return {
        ID: r.ID,
        Placa: r.Placa,
        Chassi: r.Chassi,
        TermoDoacao: r.TermoDoacao,
        Ano: r.Ano,
        Donataria: r.Donataria,
        UF: r.UF,
        ExcluidoPor: r.ExcluidoPor,
        DataExclusao: r.DataExclusao ? new Date(r.DataExclusao).getTime() : 0
      };
    })
    .sort(function (a, b) { return b.DataExclusao - a.DataExclusao; });
}

function encontrarLinhaPorId_(sheet, id) {
  var idCol = colunaParaIndice_('ID') + 1;
  var valores = sheet.getRange(1, idCol, sheet.getLastRow(), 1).getValues();
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][0] === id) return i + 1;
  }
  return null;
}

function encontrarDuplicado_(sheet, chassi, placa, ignorarId) {
  var dados = sheet.getDataRange().getValues();
  var cabecalho = dados[0];
  var idCol = cabecalho.indexOf('ID');
  var chassiCol = cabecalho.indexOf('Chassi');
  var placaCol = cabecalho.indexOf('Placa');

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (ignorarId && linha[idCol] === ignorarId) continue;
    // Chassi/placa em branco (veículo salvo como rascunho) nunca contam como
    // duplicidade entre si — senão o segundo rascunho sem chassi/placa
    // preenchidos seria barrado por "já existe" apontando pro primeiro.
    if ((chassi && linha[chassiCol] === chassi) || (placa && linha[placaCol] === placa)) {
      return linha[idCol];
    }
  }
  return null;
}
