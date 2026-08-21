
/**
 * Busca um veículo já cadastrado por Placa OU Chassi — usada pelo fluxo
 * "Cadastrar Emissão de 2ª via de ATPVe" pra localizar o veículo antes de
 * registrar a emissão. Não cria nada; devolve null se não achar (ou se a
 * busca vier vazia). Reaproveita listarVeiculos (já filtra por UF conforme
 * o perfil do usuário) e depois exige bater exatamente com Chassi ou
 * Placa — busca por substring aqui poderia trazer o veículo errado.
 */
function buscarVeiculoParaSegundaVia(busca) {
  exigirPerfilEditor_(); // aba/opção fica visível a todos, mas só admin/usuário podem usar
  var termo = normalizarTexto_(busca);
  if (!termo) return null;
  var chassiBusca = normalizarChassi_(termo);
  var placaBusca = normalizarPlaca_(termo);

  // Busca restrita por campo (igual à Listagem/Processos, que já é
  // comprovadamente confiável) em vez de uma busca livre por vários campos
  // ao mesmo tempo — mais direto e sem depender de um filtro extra depois.
  var candidatos = listarVeiculos({ busca: termo, buscaCampo: 'placa' })
    .concat(listarVeiculos({ busca: termo, buscaCampo: 'chassi' }));
  var encontrado = candidatos.filter(function (r) {
    return normalizarChassi_(r.Chassi) === chassiBusca || normalizarPlaca_(r.Placa) === placaBusca;
  })[0];
  if (!encontrado) return null;

  return {
    ID: encontrado.ID,
    Marca: encontrado.Marca,
    Descricao: encontrado.Descricao,
    Chassi: encontrado.Chassi,
    Placa: encontrado.Placa,
    Donataria: encontrado.Donataria,
    UF: encontrado.UF,
    DataEmissaoSegundaViaATPVe: encontrado.DataEmissaoSegundaViaATPVe
  };
}

/**
 * Registra a emissão de uma 2ª via do ATPVe de um veículo já cadastrado
 * (documento original perdido/danificado etc.) — só pra fins de relatório;
 * não mexe em ATPVeEmitido/ATPVeEnviado nem no fluxo normal de
 * transferência, e não cria um veículo novo.
 */
function registrarSegundaViaAtpve(id, dataEmissao) {
  if (!dataEmissao) throw new Error('Informe a data de emissão da 2ª via.');

  var perfil = getPerfilUsuarioAtual_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  garantirColunasVeiculos_();

  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Veículo não encontrado: ' + id);
  if (!podeEditarLinha_(perfil)) {
    throw new Error('Você não tem permissão para registrar isso — visitantes só podem visualizar.');
  }

  var agora = new Date();
  sheet.getRange(linhaIdx, colunaParaIndice_('DataEmissaoSegundaViaATPVe') + 1).setValue(new Date(dataEmissao));
  sheet.getRange(linhaIdx, colunaParaIndice_('UltimaAtualizacao') + 1).setValue(agora);
  sheet.getRange(linhaIdx, colunaParaIndice_('AtualizadoPor') + 1).setValue(perfil.email);

  registrarLog_('SEGUNDA_VIA_ATPVE', id, 'Emissão: ' + dataEmissao);
  invalidarCacheDashboard_();
  return { mensagem: '2ª via de ATPVe registrada com sucesso.', ID: id };
}

/**
 * Remove a marca de "2ª via emitida" direto do cadastro do veículo — usado
 * quando não há mais como casar com um registro exato do log (log já
 * apagado, ou campo preenchido fora do fluxo normal do formulário). Também
 * limpa qualquer linha de log de SEGUNDA_VIA_ATPVE remanescente desse
 * veículo, pra não sobrar rastro inconsistente. Restrito a administradores.
 */
function removerSegundaViaAtpve(idVeiculo) {
  exigirPerfilAdmin_();
  if (!idVeiculo) throw new Error('Veículo inválido.');

  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var linhaVeiculo = encontrarLinhaPorId_(sheetVeiculos, idVeiculo);
  if (!linhaVeiculo) throw new Error('Veículo não encontrado: ' + idVeiculo);
  sheetVeiculos.getRange(linhaVeiculo, colunaParaIndice_('DataEmissaoSegundaViaATPVe') + 1).setValue('');

  var sheetLog = getOrCreateSheet_(SHEET_LOG, CABECALHO_LOG);
  var dadosLog = sheetLog.getDataRange().getValues();
  for (var i = dadosLog.length - 1; i >= 1; i--) {
    var linha = dadosLog[i];
    if (linha[2] === 'SEGUNDA_VIA_ATPVE' && String(linha[3]) === String(idVeiculo)) {
      sheetLog.deleteRow(i + 1);
    }
  }

  return { mensagem: '2ª via removida do cadastro do veículo.' };
}

/**
 * Lista direto (sem depender de busca por placa/chassi) todos os veículos
 * que estão com DataEmissaoSegundaViaATPVe preenchida — usada pra revisar e
 * remover marcações feitas por engano, quando a busca no modal de "Emissão
 * de 2ª via" não encontra o veículo por algum motivo. Restrito a
 * administradores.
 */
function listarVeiculosComSegundaViaEmitida() {
  exigirPerfilAdmin_();
  var lista = listarVeiculos({}).filter(function (v) { return !!v.DataEmissaoSegundaViaATPVe; });
  var fuso = Session.getScriptTimeZone();
  return lista.map(function (v) {
    return {
      ID: v.ID,
      Placa: v.Placa,
      Chassi: v.Chassi,
      Marca: v.Marca,
      Descricao: v.Descricao,
      Donataria: v.Donataria,
      UF: v.UF,
      DataEmissaoSegundaViaATPVe: Utilities.formatDate(new Date(v.DataEmissaoSegundaViaATPVe), fuso, 'dd/MM/yyyy')
    };
  });
}

/**
 * Relatório de produtividade — conta quantas emissões de 2ª via de ATPVe
 * cada usuário registrou num período escolhido (data início/fim, ambas
 * "AAAA-MM-DD"), e lista quais veículos (placa) tiveram 2ª via emitida.
 * Fonte dos dados é a aba de log (append-only, nunca é apagada). Restrito
 * a quem tem acesso à aba Produtividade (admins sempre têm; outros
 * usuários, se liberados).
 */
function getRelatorioProdutividade(dataInicio, dataFim) {
  exigirAcessoProdutividade_();
  if (!dataInicio || !dataFim) throw new Error('Informe o período (data de início e de fim).');

  var sheetUsuarios = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  var nomesPorEmail = {};
  sheetUsuarios.getDataRange().getValues().slice(1).forEach(function (linha) {
    if (linha[0]) nomesPorEmail[String(linha[0]).trim().toLowerCase()] = linha[3] || linha[0];
  });

  var veiculoPorId = {};
  listarVeiculos({}).forEach(function (v) { veiculoPorId[v.ID] = v; });

  var sheetLog = getOrCreateSheet_(SHEET_LOG, CABECALHO_LOG);
  var dadosLog = sheetLog.getDataRange().getValues().slice(1);
  var fuso = Session.getScriptTimeZone();

  var porUsuario = {};
  var emissoes = [];

  dadosLog.forEach(function (linha) {
    if (linha[2] !== 'SEGUNDA_VIA_ATPVE') return;
    var dataHora = linha[0];
    if (!dataDentroDoIntervalo_(dataHora, dataInicio, dataFim)) return;

    var email = String(linha[1] || '').trim().toLowerCase();
    var nome = nomesPorEmail[email] || email || 'Desconhecido';
    var veiculo = veiculoPorId[linha[3]];

    porUsuario[nome] = (porUsuario[nome] || 0) + 1;
    emissoes.push({
      dataHoraOrdenacao: new Date(dataHora).getTime(),
      dataHoraIso: new Date(dataHora).toISOString(),
      dataHora: Utilities.formatDate(new Date(dataHora), fuso, 'dd/MM/yyyy HH:mm'),
      idVeiculo: linha[3],
      placa: veiculo ? veiculo.Placa : '(veículo excluído)',
      marca: veiculo ? veiculo.Marca : '',
      descricao: veiculo ? veiculo.Descricao : '',
      usuario: nome
    });
  });

  var usuarios = Object.keys(porUsuario).map(function (nome) {
    return { usuario: nome, quantidade: porUsuario[nome] };
  }).sort(function (a, b) {
    return b.quantidade - a.quantidade || a.usuario.localeCompare(b.usuario);
  });

  emissoes.sort(function (a, b) { return b.dataHoraOrdenacao - a.dataHoraOrdenacao; });
  emissoes.forEach(function (e) { delete e.dataHoraOrdenacao; });

  return { total: emissoes.length, usuarios: usuarios, emissoes: emissoes };
}

/**
 * Exclui um registro de emissão de 2ª via de ATPVe da tabela "ATPVe's
 * emitidos" do Relatório de Produtividade — remove a linha correspondente
 * do log (pra não contar mais na produtividade) e, se o veículo ainda
 * apontar exatamente pra essa emissão, limpa também o campo
 * DataEmissaoSegundaViaATPVe dele (senão continuaria contando no
 * Relatório de Atividades e aparecendo na busca de 2ª Via ATPVe mesmo sem
 * o registro correspondente). Restrito a administradores.
 */
function excluirEmissaoAtpve(idVeiculo, dataHoraIso) {
  exigirPerfilAdmin_();
  if (!idVeiculo || !dataHoraIso) throw new Error('Emissão inválida.');
  var alvo = new Date(dataHoraIso).getTime();

  var sheetLog = getOrCreateSheet_(SHEET_LOG, CABECALHO_LOG);
  var dadosLog = sheetLog.getDataRange().getValues();
  var linhaAlvo = null;
  var detalhesAlvo = '';
  for (var i = 1; i < dadosLog.length; i++) {
    var linha = dadosLog[i];
    if (linha[2] === 'SEGUNDA_VIA_ATPVE' && String(linha[3]) === String(idVeiculo) && new Date(linha[0]).getTime() === alvo) {
      linhaAlvo = i + 1;
      detalhesAlvo = String(linha[4] || '');
      break;
    }
  }
  if (!linhaAlvo) throw new Error('Registro de emissão não encontrado — pode já ter sido excluído.');
  sheetLog.deleteRow(linhaAlvo);

  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var linhaVeiculo = encontrarLinhaPorId_(sheetVeiculos, idVeiculo);
  if (linhaVeiculo) {
    var celula = sheetVeiculos.getRange(linhaVeiculo, colunaParaIndice_('DataEmissaoSegundaViaATPVe') + 1);
    var valorAtual = celula.getValue();
    // O log guarda o instante exato do clique (com hora); o campo do
    // veículo guarda só a data digitada no formulário (sem hora) — os dois
    // timestamps nunca batem exatamente. A comparação certa é por data,
    // usando o texto salvo em "Detalhes" (formato "Emissão: AAAA-MM-DD").
    var dataEmissaoTexto = detalhesAlvo.replace('Emissão:', '').trim();
    if (valorAtual && dataEmissaoTexto) {
      var fuso = Session.getScriptTimeZone();
      if (Utilities.formatDate(new Date(valorAtual), fuso, 'yyyy-MM-dd') === dataEmissaoTexto) {
        celula.setValue('');
      }
    }
  }

  return { mensagem: 'Emissão de 2ª via excluída com sucesso.' };
}

/**
 * Diz se uma data (valor de célula, pode vir vazio) cai dentro de
 * [dataInicio, dataFim] (inclusive) — inicio/fim chegam como string
 * "AAAA-MM-DD" do <input type="date">, comparando só a parte de data.
 */
function dataDentroDoIntervalo_(valor, dataInicio, dataFim) {
  if (!valor) return false;
  var chave = Utilities.formatDate(new Date(valor), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return chave >= dataInicio && chave <= dataFim;
}

function normalizarPlacaParaArquivo_(texto) {
  return String(texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Procura, na pasta do Drive configurada na Script Property
 * ATPVE_DRIVE_PASTA_ID (Editor do Apps Script → Configurações do projeto →
 * Propriedades do script), arquivo(s) cujo nome (sem extensão, ignorando
 * espaços/hífens/maiúsculas) bata com a placa informada. Serve pra recuperar
 * o ATPVe escaneado de veículos antigos que só existem como arquivo solto no
 * Drive (nome do arquivo = placa), sem depender de nenhum campo na planilha.
 */
/**
 * Link da pasta do Drive configurada em ATPVE_DRIVE_PASTA_ID (a mesma
 * usada por buscarAtpvePorPlaca) — usado pelo lembrete "Coloque o ATPVe
 * escaneado no Drive" que aparece ao registrar uma emissão de 2ª via.
 * Devolve null se a pasta ainda não foi configurada.
 */
function getUrlPastaAtpve() {
  getPerfilUsuarioAtual_();
  var pastaId = PropertiesService.getScriptProperties().getProperty('ATPVE_DRIVE_PASTA_ID');
  return pastaId ? 'https://drive.google.com/drive/folders/' + pastaId : null;
}

function buscarAtpvePorPlaca(placa) {
  exigirPerfilEditor_(); // aba fica visível a todos, mas só admin/usuário podem usar
  var placaNormalizada = normalizarPlacaParaArquivo_(placa);
  if (!placaNormalizada) throw new Error('Informe a placa do veículo.');

  var pastaId = PropertiesService.getScriptProperties().getProperty('ATPVE_DRIVE_PASTA_ID');
  if (!pastaId) {
    throw new Error('A pasta do Drive com os ATPVe escaneados ainda não foi configurada. Peça para um administrador definir a Script Property ATPVE_DRIVE_PASTA_ID (ID da pasta do Drive) no Editor do Apps Script.');
  }

  var pasta;
  try {
    pasta = DriveApp.getFolderById(pastaId);
  } catch (e) {
    throw new Error('Não encontrei a pasta configurada no Drive — confira o ID salvo em ATPVE_DRIVE_PASTA_ID.');
  }

  var encontrados = [];
  buscarAtpveNaPastaRecursivo_(pasta, placaNormalizada, encontrados, 0);
  return encontrados;
}

/**
 * Procura em toda a árvore de subpastas (ex.: "Abril - 2026/PMBA/..."), não
 * só na pasta raiz — os ATPVe costumam vir organizados por mês/órgão dentro
 * da pasta configurada. Limita a profundidade pra não rodar pra sempre numa
 * estrutura de pastas mal formada com referência circular.
 */
function buscarAtpveNaPastaRecursivo_(pasta, placaNormalizada, encontrados, profundidade) {
  if (profundidade > 10) return;

  var arquivos = pasta.getFiles();
  while (arquivos.hasNext()) {
    var arquivo = arquivos.next();
    var nomeSemExtensao = arquivo.getName().replace(/\.[^.]+$/, '');
    if (normalizarPlacaParaArquivo_(nomeSemExtensao) === placaNormalizada) {
      encontrados.push({
        id: arquivo.getId(),
        nome: arquivo.getName(),
        urlVisualizacao: 'https://drive.google.com/file/d/' + arquivo.getId() + '/preview',
        urlAbrir: 'https://drive.google.com/file/d/' + arquivo.getId() + '/view'
      });
    }
  }

  var subpastas = pasta.getFolders();
  while (subpastas.hasNext()) {
    buscarAtpveNaPastaRecursivo_(subpastas.next(), placaNormalizada, encontrados, profundidade + 1);
  }
}
