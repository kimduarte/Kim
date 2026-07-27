/**
 * CodigoCompleto.gs
 * Versão de instalação simplificada: todo o código do sistema em um único
 * arquivo, para quem nunca usou o Apps Script — basta colar este arquivo
 * inteiro no lugar do "Código.gs" padrão. (A versão dividida em vários
 * arquivos, mais organizada para quem já programa, está nos outros .gs
 * desta mesma pasta.)
 */

// ======================================================================
// CONSTANTES — nomes de abas, cabeçalhos e listas de domínio
// ======================================================================

var SHEET_VEICULOS = 'Veiculos';
var SHEET_CONFIG = 'Config';
var SHEET_USUARIOS = 'Usuarios';
var SHEET_LOG = 'LogAlteracoes';
var SHEET_IMPORT_LOG = 'ImportacaoLog';

// Quantas linhas extras (além do que já tem dado) recebem validação de
// lista suspensa — mantém espaço para novos cadastros sem inflar demais
// o "tamanho" da aba aos olhos do Google Sheets (ver corrigirTamanhoDaAba).
var MARGEM_VALIDACAO_LINHAS = 3000;

// Quantos veículos a tela de Listagem mostra de uma vez. Devolver milhares
// de registros de uma vez trava o navegador (a transferência do resultado
// de volta ao cliente é lenta mesmo quando o servidor termina rápido) —
// use os filtros/busca para encontrar um veículo específico além disso.
var LIMITE_LISTAGEM_PADRAO = 50;

var ABAS_ORIGEM_MIGRACAO = ['BDADOS2024', 'BDADOS2025', '2026'];

var CABECALHO_VEICULOS = [
  'ID', 'DataCadastro', 'Ano', 'Mes', 'UF', 'Ente', 'Donataria',
  'TermoDoacao', 'Descricao', 'Marca', 'Chassi', 'Renavam', 'Placa',
  'Transferido', 'DataTransferencia', 'Observacoes', 'CadastradoPor',
  'UltimaAtualizacao', 'AtualizadoPor', 'CNPJDonataria',
  'CEP', 'Logradouro', 'Numero', 'Complemento', 'Bairro', 'Municipio',
  'ATPVeEmitido', 'ATPVeEnviado',
  'Contrato', 'Aditivo', 'NumeroAditivo', 'QtdVeiculosContrato', 'QtdVeiculosAditivo',
  'NumeroProcesso', 'MotivoInclusaoPosterior',
  // Sempre adicione campos novos aqui no final: garantirColunasVeiculos_ só
  // ANEXA colunas ausentes ao final da planilha física — inserir um campo no
  // meio deste array desalinharia todas as colunas seguintes em planilhas
  // já existentes (com dados nas posições antigas).
  'NumeroSei', 'ValorVeiculo'
];

var CABECALHO_LOG = ['DataHora', 'Usuario', 'Acao', 'IdVeiculo', 'Detalhes'];

var CABECALHO_IMPORT_LOG = ['DataHora', 'AbaOrigem', 'LinhaOrigem', 'Situacao', 'Motivo', 'Chassi', 'Placa'];

var CABECALHO_USUARIOS = ['Email', 'Perfil', 'UF', 'Nome'];

var UFS_VALIDAS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
  'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
  'SE', 'SP', 'TO'
];

var CODIGOS_ORGAO_FEDERAL = ['PF', 'PRF'];

// Usada na migração tolerante quando o registro antigo não tem UF preenchida
// — mesmo padrão do identificador temporário usado para chassi/placa
// ausentes: não descarta a linha, importa com este marcador para revisão
// posterior (ver processarLinhaOrigem_).
var UF_NAO_INFORMADA = 'NI';

// Lista de validação da coluna UF na planilha: precisa incluir UF_NAO_INFORMADA
// (além das UFs e códigos de órgão federal), senão a própria validação da
// célula rejeitaria a gravação das linhas migradas sem UF. Não usada na lista
// suspensa do formulário de cadastro (getContextoInicial) — lá só fazem
// sentido as UFs e órgãos federais reais.
var UFS_PARA_VALIDACAO_PLANILHA = UFS_VALIDAS.concat(CODIGOS_ORGAO_FEDERAL, [UF_NAO_INFORMADA]);

var ENTES_VALIDOS = ['Estado', 'Município', 'União'];

var MESES_VALIDOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// Nomes de mês por extenso (como aparecem nas planilhas antigas) mapeados
// para a abreviação usada no sistema — usado só na migração, pra não
// rejeitar meses válidos escritos por extenso (ex.: "MAIO").
var MESES_ALIAS = {
  'JANEIRO': 'JAN', 'FEVEREIRO': 'FEV', 'MARCO': 'MAR', 'MARÇO': 'MAR',
  'ABRIL': 'ABR', 'MAIO': 'MAI', 'JUNHO': 'JUN', 'JULHO': 'JUL',
  'AGOSTO': 'AGO', 'SETEMBRO': 'SET', 'OUTUBRO': 'OUT',
  'NOVEMBRO': 'NOV', 'DEZEMBRO': 'DEZ'
};

var STATUS_TRANSFERIDO = ['SIM', 'NÃO'];

var PERFIL_ADMIN = 'admin';
var PERFIL_USUARIO = 'usuario';
var PERFIL_VISITANTE = 'visitante';

var CORRECOES_MARCA = {
  'MITSHUBISHI': 'MITSUBISHI',
  'MITISUBISHI': 'MITSUBISHI',
  'MITREN': 'MITSUBISHI'
};

// Órgãos donatários de cada Estado (Ente = "Estado"), com CNPJ, extraídos de
// "LISTA DOS ÓRGÃOS COM CNPJ". Faltam AC, MA, MS, MT, PR e SC (não constavam
// na lista de origem) — para essas UFs (e para Município/União) o campo
// Donatária continua sendo digitado livremente.
var ORGAOS_POR_UF = {
  AL: [
    { orgao: 'ESTADO DE ALAGOAS', cnpj: '12.200.176/0001-76' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA DE ALAGOAS', cnpj: '12.200.226/0001-15' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '12.442.570/0001-10' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '69.977.817/0001-10' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '06.062.642/0001-00' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '13.898.581/0001-72' }
  ],
  AP: [
    { orgao: 'ESTADO DO AMAPÁ', cnpj: '00.394.577/0001-25' },
    { orgao: 'SECRETARIA DE ESTADO DA JUSTIÇA E SEGURANÇA PÚBLICA DO AMAPÁ', cnpj: '04.243.026/0001-11' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '06.023.862/0001-16' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '02.954.346/0001-54' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '11.762.025/0001-49' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '34.943.480/0001-46' }
  ],
  AM: [
    { orgao: 'ESTADO DO AMAZONAS', cnpj: '04.312.369/0001-90' },
    { orgao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO AMAZONAS', cnpj: '01.804.019/0001-53' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '63.656.292/0001-35' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '02.963.980/0001-53' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '03.072.388/0001-24' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '03.072.388/0001-24' }
  ],
  BA: [
    { orgao: 'ESTADO DA BAHIA', cnpj: '13.937.032/0001-60' },
    { orgao: 'SECRETARIA DA SEGURANÇA PÚBLICA DO ESTADO DA BAHIA', cnpj: '13.937.149/0001-43' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '33.457.634/0001-27' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '22.306.987/0001-00' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '33.390.921/0001-67' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '13.937.149/0001-43' }
  ],
  CE: [
    { orgao: 'ESTADO DO CEARÁ', cnpj: '07.954.480/0001-79' },
    { orgao: 'SECRETARIA DA SEGURANÇA PÚBLICA E DEFESA SOCIAL DO ESTADO DO CEARÁ', cnpj: '01.869.566/0001-17' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '01.790.944/0001-72' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '35.025.022/0001-90' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '01.869.564/0001-28' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '10.263.825/0001-52' }
  ],
  DF: [
    { orgao: 'DISTRITO FEDERAL', cnpj: '00.394.601/0001-26' },
    { orgao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpj: '00.394.718/0001-00' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '08.942.610/0001-16' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '08.977.914/0001-19' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '37.115.482/0001-35' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '37.115.482/0001-35' }
  ],
  ES: [
    { orgao: 'ESTADO DO ESPÍRITO SANTO', cnpj: '27.080.530/0001-43' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA E DEFESA SOCIAL DO ESPÍRITO SANTO', cnpj: '27.142.025/0001-86' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '27.476.373/0001-90' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '02.133.636/0001-37' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '27.470.897/0001-73' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '27.470.897/0001-73' }
  ],
  GO: [
    { orgao: 'ESTADO DE GOIÁS', cnpj: '01.409.580/0001-38' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA DE GOIÁS', cnpj: '01.409.606/0001-48' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '01.409.671/0001-73' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '33.638.099/0001-00' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '37.014.123/0001-91' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '01.409.606/0001-48' }
  ],
  MG: [
    { orgao: 'ESTADO DE MINAS GERAIS', cnpj: '18.715.615/0001-60' },
    { orgao: 'SECRETARIA DE ESTADO DE JUSTIÇA E SEGURANÇA PÚBLICA DE MINAS GERAIS', cnpj: '05.487.631/0001-09' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '16.695.025/0001-97' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '03.389.126/0001-98' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '18.715.532/0001-70' }
  ],
  PA: [
    { orgao: 'ESTADO DO PARÁ', cnpj: '08.761.124/0001-00' },
    { orgao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA E DEFESA SOCIAL DO PARÁ', cnpj: '05.054.952/0001-01' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '05.054.994/0001-42' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '34.847.236/0001-80' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '00.368.105/0001-06' }
  ],
  PB: [
    { orgao: 'ESTADO DA PARAÍBA', cnpj: '08.761.124/0001-00' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA E DA DEFESA SOCIAL DA PARAÍBA', cnpj: '08.730.095/0001-00' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '08.907.776/0001-00' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '09.537.092/0001-18' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '22.404.257/0001-41' }
  ],
  PE: [
    { orgao: 'ESTADO DE PERNAMBUCO', cnpj: '10.571.982/0001-25' },
    { orgao: 'SECRETARIA DE DEFESA SOCIAL DO ESTADO DE PERNAMBUCO', cnpj: '02.960.040/0001-00' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '11.433.190/0023-62' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '00.358.773/0001-44' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '10.572.063/0228-11' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '02.960.040/0001-00' }
  ],
  PI: [
    { orgao: 'ESTADO DO PIAUÍ', cnpj: '06.553.481/0001-49' },
    { orgao: 'SECRETARIA DE SEGURANÇA PÚBLICA DO ESTADO DO PIAUÍ', cnpj: '06.553.549/0001-90' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '07.444.159/0001-44' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '05.485.613/0001-80' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '06.553.549/0027-29' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '06.553.549/0001-90' }
  ],
  RJ: [
    { orgao: 'ESTADO DO RIO DE JANEIRO', cnpj: '42.498.600/0001-71' },
    { orgao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO RIO DE JANEIRO', cnpj: '53.267.065/0001-64' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '32.690.668/0001-02' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '28.176.998/0001-07' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '32.855.236/0001-04' }
  ],
  RN: [
    { orgao: 'ESTADO DO RIO GRANDE DO NORTE', cnpj: '08.241.739/0001-05' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA E DA DEFESA SOCIAL DO RIO GRANDE DO NORTE', cnpj: '00.498.299/0001-56' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '04.058.766/0001-88' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '04.994.771/0001-00' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '04.238.444/0001-10' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '05.067.810/0001-89' }
  ],
  RS: [
    { orgao: 'ESTADO DO RIO GRANDE DO SUL', cnpj: '87.934.675/0001-96' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA DO RIO GRANDE DO SUL', cnpj: '87.958.583/0001-46' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '89.175.541/0001-64' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '28.610.005/0001-55' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '00.058.163/0001-25' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '87.958.583/0001-46' }
  ],
  RO: [
    { orgao: 'ESTADO DE RONDÔNIA', cnpj: '00.394.585/0001-71' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA, DEFESA E CIDADANIA DE RONDÔNIA', cnpj: '04.793.055/0001-57' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '04.562.872/0001-02' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '02.606.612/0001-02' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '01.664.910/0001-31' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '23.087.774/0001-05' }
  ],
  RR: [
    { orgao: 'ESTADO DE RORAIMA', cnpj: '84.012.012/0001-26' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA DE RORAIMA', cnpj: '07.696.095/0001-79' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '53.383.645/0001-17' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '21.939.771/0001-19' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '21.082.624/0001-75' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '84.012.012/0001-26' }
  ],
  SP: [
    { orgao: 'ESTADO DE SÃO PAULO', cnpj: '46.379.400/0001-50' },
    { orgao: 'SECRETARIA DA SEGURANÇA PÚBLICA DO ESTADO DE SÃO PAULO', cnpj: '46.377.800/0001-27' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '04.198.514/0038-46' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '04.378.330/0002-57' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '04.236.548/0011-68' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '23.429.162/0001-45' }
  ],
  SE: [
    { orgao: 'ESTADO DE SERGIPE', cnpj: '13.128.798/0001-01' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA DE SERGIPE', cnpj: '34.841.214/0001-02' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '34.850.014/0001-16' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '34.850.068/0001-81' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '34.841.214/0001-02' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '34.841.214/0001-02' }
  ],
  TO: [
    { orgao: 'ESTADO DO TOCANTINS', cnpj: '01.786.029/0001-03' },
    { orgao: 'SECRETARIA DE ESTADO DA SEGURANÇA PÚBLICA DO TOCANTINS', cnpj: '25.053.109/0001-18' },
    { orgao: 'POLÍCIA MILITAR', cnpj: '33.567.785/0001-38' },
    { orgao: 'CORPO DE BOMBEIROS', cnpj: '07.924.551/0001-90' },
    { orgao: 'POLÍCIA CIVIL', cnpj: '25.053.109/0001-18' },
    { orgao: 'POLÍCIA CIENTÍFICA', cnpj: '25.053.109/0001-18' }
  ]
};

// ======================================================================
// UTILS — funções auxiliares, normalização de texto, validações
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
    sheet.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  }
  return sheet;
}

function normalizarTexto_(valor) {
  if (valor === null || valor === undefined) return '';
  var texto = String(valor);
  texto = texto.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  return texto;
}

function normalizarMarca_(valor) {
  var marca = normalizarTexto_(valor).toUpperCase();
  return CORRECOES_MARCA[marca] || marca;
}

function normalizarPlaca_(valor) {
  return normalizarTexto_(valor).toUpperCase().replace(/[\s-]/g, '');
}

function normalizarChassi_(valor) {
  return normalizarTexto_(valor).toUpperCase().replace(/\s/g, '');
}

function normalizarUF_(valor) {
  return normalizarTexto_(valor).toUpperCase();
}

function normalizarTransferido_(valor) {
  var texto = normalizarTexto_(valor).toUpperCase();
  if (texto === 'SIM' || texto === 'S') return 'SIM';
  if (texto === 'NÃO' || texto === 'NAO' || texto === 'N') return 'NÃO';
  return null;
}

// Aceita tanto um número quanto o texto digitado no formato brasileiro (ex.:
// "1.500,00", vindo da máscara de moeda da tela) e devolve sempre um número.
function normalizarValorMonetario_(valor) {
  if (typeof valor === 'number') return valor;
  var texto = normalizarTexto_(valor);
  if (!texto) return 0;
  var numero = parseFloat(texto.replace(/\./g, '').replace(',', '.').replace(/[^\d.\-]/g, ''));
  return isNaN(numero) ? 0 : numero;
}

function validarChassi_(chassi) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(chassi);
}

function validarPlaca_(placa) {
  var antiga = /^[A-Z]{3}[0-9]{4}$/;
  var mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return antiga.test(placa) || mercosul.test(placa);
}

function validarRenavam_(renavam) {
  var texto = String(renavam).replace(/\D/g, '');
  return texto.length >= 9 && texto.length <= 11;
}

function gerarProximoId_() {
  var props = PropertiesService.getDocumentProperties();
  var seq = Number(props.getProperty('SEQ_VEICULO') || '0');
  seq += 1;
  props.setProperty('SEQ_VEICULO', String(seq));
  return 'VC-' + ('000000' + seq).slice(-6);
}

function registrarLog_(acao, idVeiculo, detalhes) {
  var sheet = getOrCreateSheet_(SHEET_LOG, CABECALHO_LOG);
  sheet.appendRow([new Date(), getEmailUsuarioAtual_(), acao, idVeiculo, detalhes || '']);
}

function getEmailUsuarioAtual_() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email || 'desconhecido';
  } catch (e) {
    return 'desconhecido';
  }
}

function colunaParaIndice_(nomeColuna) {
  return CABECALHO_VEICULOS.indexOf(nomeColuna);
}

// ======================================================================
// PERMISSÕES — controle de acesso por perfil
// admin:     irrestrito (cadastra, edita, exclui, cadastra usuários).
// usuario:   pode cadastrar e editar operações (veículos/processos), mas
//            não exclui processos nem cadastra outros usuários.
// visitante: só visualiza — nenhuma ação de escrita é permitida.
// ======================================================================

function getPerfilUsuarioAtual_() {
  var email = getEmailUsuarioAtual_();
  var sheet = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  var dados = sheet.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (String(linha[0]).trim().toLowerCase() === email.toLowerCase()) {
      var perfilBruto = normalizarTexto_(linha[1]).toLowerCase();
      // "uf" era o perfil intermediário do modelo antigo (restrito por UF).
      // Equivale ao novo perfil "usuario" (cadastra/edita, sem restrição de
      // UF) — mantém acesso de quem já estava cadastrado assim antes.
      var perfil = perfilBruto === 'uf' ? PERFIL_USUARIO : (perfilBruto || PERFIL_VISITANTE);
      return {
        email: email,
        perfil: perfil,
        uf: normalizarUF_(linha[2] || ''),
        nome: linha[3] || email
      };
    }
  }
  return { email: email, perfil: 'sem_acesso', uf: '', nome: email };
}

function exigirPerfilAdmin_() {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil !== PERFIL_ADMIN) {
    throw new Error('Ação restrita a administradores.');
  }
  return perfil;
}

function exigirPerfilEditor_() {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil !== PERFIL_ADMIN && perfil.perfil !== PERFIL_USUARIO) {
    throw new Error('Você não tem permissão para cadastrar ou editar — visitantes só podem visualizar.');
  }
  return perfil;
}

function podeVerLinha_(perfil) {
  return perfil.perfil === PERFIL_ADMIN || perfil.perfil === PERFIL_USUARIO || perfil.perfil === PERFIL_VISITANTE;
}

function podeEditarLinha_(perfil) {
  return perfil.perfil === PERFIL_ADMIN || perfil.perfil === PERFIL_USUARIO;
}

// ======================================================================
// SETUP — cria a estrutura da planilha (abas, cabeçalhos, validações)
// ======================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Base de Veículos')
    .addItem('1) Criar estrutura inicial', 'criarEstruturaInicial')
    .addItem('2) Migrar dados originais (BDADOS2024/2025/2026)', 'migrarBaseOriginal')
    .addSeparator()
    .addItem('Recalcular painel', 'invalidarCacheDashboard_')
    .addItem('Corrigir tamanho da aba (desempenho)', 'corrigirTamanhoDaAba')
    .addItem('Extrair Número SEI do Termo de Doação (dados antigos)', 'corrigirNumeroSeiDoTermo')
    .addToUi();
}

function criarEstruturaInicial() {
  criarAbaVeiculos_();
  criarAbaConfig_();
  criarAbaUsuarios_();
  getOrCreateSheet_(SHEET_LOG, CABECALHO_LOG);
  getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
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

    var match = REGEX_SEI_NO_TERMO.exec(String(termos[i][0] || '').trim());
    if (!match) continue;

    termos[i][0] = match[1].trim();
    seis[i][0] = match[2];
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
    sheet.getRange(2, 1, 1, 4).setValues([[email, PERFIL_ADMIN, '', 'Administrador inicial']]);
  }
  return sheet;
}

/**
 * Dá acesso ao sistema para uma pessoa nova (ou atualiza o perfil dela, se
 * o e-mail já estiver cadastrado) — usado pela caixa "Cadastrar Usuário" na
 * tela inicial. Só administradores podem cadastrar outros usuários.
 */
function cadastrarUsuario(dados) {
  exigirPerfilAdmin_();

  var email = normalizarTexto_(dados.Email).toLowerCase();
  var perfil = normalizarTexto_(dados.Perfil).toLowerCase();
  var nome = normalizarTexto_(dados.Nome);

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

  var linha = [email, perfil, '', nome];
  if (linhaExistente) {
    sheet.getRange(linhaExistente, 1, 1, 4).setValues([linha]);
    registrarLog_('ATUALIZAR_USUARIO', email, JSON.stringify(linha));
    return { mensagem: 'Usuário "' + email + '" já existia e foi atualizado com sucesso.' };
  }
  sheet.appendRow(linha);
  registrarLog_('CRIAR_USUARIO', email, JSON.stringify(linha));
  return { mensagem: 'Usuário "' + email + '" cadastrado com sucesso. Ele já pode acessar o sistema pelo mesmo link.' };
}

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
    orgaosPorUF: ORGAOS_POR_UF
  };
}

// Mapeia o seletor "Buscar em" da tela de Listagem para o campo real do
// registro. Vazio ('') continua buscando em todos os campos de uma vez —
// é o que fazia "222" (ou qualquer trecho curto) achar chassis, placas e
// renavams sem relação nenhuma entre si, então o seletor existe para
// restringir a busca a um único campo quando isso importa.
var MAPA_CAMPOS_BUSCA = {
  donataria: 'Donataria', chassi: 'Chassi', placa: 'Placa',
  renavam: 'Renavam', termo: 'TermoDoacao', marca: 'Marca', descricao: 'Descricao'
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

    if (filtros.uf && registro.UF !== filtros.uf) continue;
    if (filtros.ente && registro.Ente !== filtros.ente) continue;
    if (filtros.marca && registro.Marca !== filtros.marca) continue;
    if (filtros.ano && String(registro.Ano) !== String(filtros.ano)) continue;
    if (filtros.transferido && registro.Transferido !== filtros.transferido) continue;
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
 * Versão usada pela tela de Listagem: devolve no máximo
 * LIMITE_LISTAGEM_PADRAO registros (os mais recentes) para não travar o
 * navegador com milhares de linhas de uma vez. Use os filtros/busca para
 * encontrar um veículo específico fora desse recorte.
 */
function listarVeiculosParaExibicao(filtros) {
  var todos = listarVeiculos(filtros);
  var truncado = todos.length > LIMITE_LISTAGEM_PADRAO;
  var recorte = truncado ? todos.slice(0, LIMITE_LISTAGEM_PADRAO) : todos;
  return {
    total: todos.length,
    truncado: truncado,
    // Sem os campos de data/auditoria: não aparecem na Listagem nem no
    // modal de edição, e valores Date dentro de listas grandes já
    // atrapalharam a entrega da resposta ao navegador antes.
    registros: recorte.map(paraDtoListagem_)
  };
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
    ValorVeiculo: r.ValorVeiculo
  };
}

/**
 * Agrupa os veículos filtrados por Termo de Doação ("Processo"), com
 * contagem de quantos já tiveram o ATPVe emitido/enviado. É o que a tela
 * de Listagem exibe — processos, não veículos soltos.
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
    var chave = v.NumeroProcesso ? ('P:' + v.NumeroProcesso) : ('T:' + (v.TermoDoacao || '(sem identificação)'));
    if (!grupos[chave]) {
      grupos[chave] = {
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
        totalValor: 0,
        veiculos: []
      };
      ordem.push(chave);
      maiorIdPorChave[chave] = '';
    }
    var grupo = grupos[chave];
    grupo.totalVeiculos++;
    if (v.ATPVeEmitido === 'SIM') grupo.totalEmitidos++;
    if (v.ATPVeEnviado === 'SIM') grupo.totalEnviados++;
    grupo.totalValor += Number(v.ValorVeiculo) || 0;
    var idAtual = String(v.ID || '');
    if (idAtual > maiorIdPorChave[chave]) maiorIdPorChave[chave] = idAtual;
    grupo.veiculos.push(paraDtoListagem_(v));
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
 * Anos distintos existentes em toda a base de veículos, para o filtro de Ano
 * da tela de Listagem. Precisa varrer a base inteira (sem paginação): os
 * processos mais antigos ficam nas últimas páginas de listarProcessos, então
 * derivar os anos só da página carregada deixaria anos antigos de fora do
 * filtro.
 */
function getAnosDisponiveis() {
  var registros = listarVeiculos({});
  var anos = {};
  registros.forEach(function (r) { anos[String(r.Ano)] = true; });
  return Object.keys(anos).sort();
}

/**
 * Alterna rapidamente o status de emissão/envio do ATPVe de um veículo,
 * sem reenviar/validar o cadastro inteiro — usado pelos toggles dentro de
 * um processo expandido na Listagem.
 */
function atualizarStatusAtpve(id, campo, valor) {
  if (campo !== 'ATPVeEmitido' && campo !== 'ATPVeEnviado') {
    throw new Error('Campo inválido: ' + campo);
  }
  var valorNormalizado = normalizarTransferido_(valor);
  if (!valorNormalizado) throw new Error('Valor inválido: ' + valor);

  var perfil = getPerfilUsuarioAtual_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Veículo não encontrado: ' + id);

  if (!podeEditarLinha_(perfil)) {
    throw new Error('Você não tem permissão para editar este registro — visitantes só podem visualizar.');
  }

  sheet.getRange(linhaIdx, colunaParaIndice_(campo) + 1).setValue(valorNormalizado);
  sheet.getRange(linhaIdx, colunaParaIndice_('UltimaAtualizacao') + 1).setValue(new Date());
  sheet.getRange(linhaIdx, colunaParaIndice_('AtualizadoPor') + 1).setValue(perfil.email);

  registrarLog_('ATUALIZAR_ATPVE', id, campo + '=' + valorNormalizado);
  invalidarCacheDashboard_();
  return { mensagem: 'Atualizado com sucesso.', campo: campo, valor: valorNormalizado };
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

  var uf = normalizarUF_(dados.UF);
  var ente = normalizarTexto_(dados.Ente);
  var mes = normalizarTexto_(dados.Mes).toUpperCase();
  var chassi = normalizarChassi_(dados.Chassi);
  var placa = normalizarPlaca_(dados.Placa);
  var renavam = normalizarTexto_(dados.Renavam).replace(/\D/g, '');
  var transferido = normalizarTransferido_(dados.Transferido) || 'NÃO';
  var atpveEmitido = normalizarTransferido_(dados.ATPVeEmitido) || 'NÃO';
  var atpveEnviado = normalizarTransferido_(dados.ATPVeEnviado) || 'NÃO';
  var ano = parseInt(dados.Ano, 10);
  var cep = normalizarTexto_(dados.CEP).replace(/\D/g, '');

  if (UFS_VALIDAS.indexOf(uf) === -1 && CODIGOS_ORGAO_FEDERAL.indexOf(uf) === -1) {
    erros.push('UF inválida: ' + dados.UF);
  }
  if (ENTES_VALIDOS.indexOf(ente) === -1) erros.push('Ente inválido: ' + dados.Ente);
  if (MESES_VALIDOS.indexOf(mes) === -1) erros.push('Mês inválido: ' + dados.Mes);
  if (!ano || ano < 2000 || ano > 2100) erros.push('Ano inválido: ' + dados.Ano);
  if (!validarChassi_(chassi)) erros.push('Chassi inválido (17 caracteres, sem I/O/Q): ' + chassi);
  if (!validarPlaca_(placa)) erros.push('Placa inválida: ' + placa);
  if (!validarRenavam_(renavam)) erros.push('Renavam inválido: ' + renavam);
  if (!normalizarTexto_(dados.Donataria)) erros.push('Donatária é obrigatória.');
  if (!normalizarTexto_(dados.TermoDoacao)) erros.push('Termo de doação é obrigatório.');
  if (!normalizarTexto_(dados.NumeroSei)) erros.push('Número SEI do Termo é obrigatório.');
  // CEP só é validado no formato quando informado — não é exigido aqui para
  // não travar a edição de veículos antigos (migrados sem endereço).
  if (cep && cep.length !== 8) erros.push('CEP inválido: ' + dados.CEP);

  if (erros.length) {
    throw new Error(erros.join('\n'));
  }

  return {
    Ano: ano,
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
    CNPJDonataria: normalizarTexto_(dados.CNPJDonataria),
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
  if (registro.Transferido === 'SIM') {
    sheet.getRange(linhaIdx, colunaParaIndice_('DataTransferencia') + 1).setValue(agora);
  }

  sheet.getRange(linhaIdx, colunaParaIndice_('UltimaAtualizacao') + 1).setValue(agora);
  sheet.getRange(linhaIdx, colunaParaIndice_('AtualizadoPor') + 1).setValue(perfil.email);

  registrarLog_('ATUALIZAR', id, JSON.stringify(registro));
  invalidarCacheDashboard_();
  return { ID: id, mensagem: 'Veículo atualizado com sucesso.' };
}

function excluirVeiculo(id) {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var linhaIdx = encontrarLinhaPorId_(sheet, id);
  if (!linhaIdx) throw new Error('Veículo não encontrado: ' + id);

  sheet.deleteRow(linhaIdx);
  registrarLog_('EXCLUIR', id, '');
  invalidarCacheDashboard_();
  return { mensagem: 'Veículo excluído.' };
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
    if (linha[chassiCol] === chassi || linha[placaCol] === placa) {
      return linha[idCol];
    }
  }
  return null;
}

// ======================================================================
// MIGRAÇÃO — importa e limpa os dados originais (BDADOS2024/2025/2026)
// ======================================================================

var COL_ORIGEM = {
  DONATARIA: 1,
  UF: 2,
  ENTE: 3,
  TERMO: 4,
  DESCRICAO: 6,
  MARCA: 7,
  CHASSI: 8,
  RENAVAM: 9,
  PLACA: 10,
  ANO: 11,
  MES: 12,
  TRANSFERIDO: 13
};

function migrarBaseOriginal() {
  exigirPerfilAdmin_();
  var ss = getSpreadsheet_();

  var ui = SpreadsheetApp.getUi();
  var respostaTolerante = ui.alert(
    'Registros antigos incompletos',
    'Alguns registros antigos podem não ter chassi/placa individual para cada veículo — por exemplo, processos em que ' +
    'só foi informada a quantidade total de veículos doados, com um único chassi representando o lote inteiro, ou um ' +
    'chassi digitado fora do padrão de 17 caracteres.\n\n' +
    'Deseja IMPORTAR esses registros mesmo assim (usando um identificador temporário quando faltar chassi ou placa, e ' +
    'mantendo o chassi digitado mesmo que fora do padrão), em vez de pular esses registros?\n\n' +
    'Você pode revisar depois pela aba "' + SHEET_IMPORT_LOG + '".',
    ui.ButtonSet.YES_NO
  );
  var modoTolerante = respostaTolerante === ui.Button.YES;

  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var logSheet = getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  garantirColunasVeiculos_();

  var chassisExistentes = carregarChassisExistentes_(sheetVeiculos);
  var origensExistentes = carregarOrigensExistentes_(sheetVeiculos);
  var linhasNovas = [];
  var logEntradas = [];
  var agora = new Date();
  var perfil = getPerfilUsuarioAtual_();

  // Gera os IDs em memória e só grava o contador uma única vez no final —
  // ler/gravar no PropertiesService a cada linha (milhares de vezes) é o
  // que deixava a migração extremamente lenta.
  var props = PropertiesService.getDocumentProperties();
  var proximoId = Number(props.getProperty('SEQ_VEICULO') || '0');

  var resumo = { lidas: 0, importadas: 0, duplicadas: 0, invalidas: 0 };

  ABAS_ORIGEM_MIGRACAO.forEach(function (nomeAba) {
    var aba = ss.getSheetByName(nomeAba);
    if (!aba) {
      logEntradas.push([agora, nomeAba, '-', 'AVISO', 'Aba não encontrada nesta planilha — nada importado dela.', '', '']);
      return;
    }

    var valores = aba.getDataRange().getValues();
    for (var i = 1; i < valores.length; i++) {
      var linha = valores[i];
      if (linhaVazia_(linha)) continue;
      resumo.lidas++;

      var resultado = processarLinhaOrigem_(linha, nomeAba, i + 1, chassisExistentes, origensExistentes, agora, perfil.email, modoTolerante);

      if (resultado.status === 'OK') {
        proximoId++;
        resultado.linha[0] = 'VC-' + ('000000' + proximoId).slice(-6);
        linhasNovas.push(resultado.linha);
        chassisExistentes[resultado.chassi] = true;
        origensExistentes[nomeAba + '|' + (i + 1)] = true;
        resumo.importadas++;
      } else if (resultado.status === 'DUPLICADO') {
        resumo.duplicadas++;
      } else {
        resumo.invalidas++;
      }
      if (resultado.log) logEntradas.push(resultado.log);
    }
  });

  props.setProperty('SEQ_VEICULO', String(proximoId));

  gravarNovosVeiculos_(sheetVeiculos, linhasNovas, logEntradas, agora);

  logEntradas.push([agora, 'RESUMO', '-', 'INFO',
    'Lidas: ' + resumo.lidas + ' | Importadas: ' + resumo.importadas +
    ' | Duplicadas (ignoradas): ' + resumo.duplicadas + ' | Inválidas (ignoradas): ' + resumo.invalidas,
    '', '']);

  if (logEntradas.length) {
    logSheet.getRange(logSheet.getLastRow() + 1, 1, logEntradas.length, CABECALHO_IMPORT_LOG.length)
      .setValues(logEntradas);
  }

  invalidarCacheDashboard_();

  var mensagem = 'Migração concluída. Lidas: ' + resumo.lidas + ', importadas: ' + resumo.importadas +
    ', duplicadas: ' + resumo.duplicadas + ', inválidas: ' + resumo.invalidas + '. Veja detalhes em "' + SHEET_IMPORT_LOG + '".';
  ss.toast(mensagem, 'Migração', 10);
  return { resumo: resumo, mensagem: mensagem };
}

function gravarNovosVeiculos_(sheetVeiculos, linhasNovas, logEntradas, agora) {
  if (!linhasNovas.length) return;
  try {
    sheetVeiculos.getRange(sheetVeiculos.getLastRow() + 1, 1, linhasNovas.length, CABECALHO_VEICULOS.length)
      .setValues(linhasNovas);
  } catch (erroLote) {
    var chassiCol = colunaParaIndice_('Chassi');
    linhasNovas.forEach(function (linha) {
      try {
        sheetVeiculos.appendRow(linha);
      } catch (erroLinha) {
        logEntradas.push([agora, 'GRAVACAO', '-', 'ERRO',
          'Falha ao gravar linha (valor rejeitado pela planilha): ' + erroLinha.message,
          linha[chassiCol], '']);
      }
    });
  }
}

// Verifica só as colunas de dados que a migração realmente usa (COL_ORIGEM).
// Checar a linha inteira falha em planilhas ligadas ao PowerApps: elas
// preenchem um __PowerAppsId__ (e às vezes um "\n" perdido) em linhas que
// no restante estão totalmente em branco, então a linha nunca era
// reconhecida como vazia e seguia para validação completa, virando um
// "Ente desconhecido" (ou similar) só por ruído de linhas de template sem
// nenhum dado de veículo.
function linhaVazia_(linha) {
  return Object.keys(COL_ORIGEM).every(function (campo) {
    var v = linha[COL_ORIGEM[campo]];
    return v === '' || v === null || v === undefined || String(v).trim() === '';
  });
}

function carregarChassisExistentes_(sheet) {
  var mapa = {};
  if (sheet.getLastRow() < 2) return mapa;
  var chassiCol = colunaParaIndice_('Chassi') + 1;
  var valores = sheet.getRange(2, chassiCol, sheet.getLastRow() - 1, 1).getValues();
  valores.forEach(function (linha) {
    if (linha[0]) mapa[normalizarChassi_(linha[0])] = true;
  });
  return mapa;
}

// Identifica quais linhas das abas de origem (aba + número da linha) já
// foram migradas antes, lendo o padrão 'Migrado de "aba", linha N.' gravado
// em Observacoes por processarLinhaOrigem_. Sem isso, rodar a migração mais
// de uma vez faz cada linha antiga colidir com o próprio chassi que ela
// mesma gerou na vez anterior — e como esse tipo de colisão é tratado como
// "chassi repetido no lote original" (ver o bloco de chassisExistentes
// abaixo), a linha seria reimportada como um veículo "novo" (com sufixo
// -DUP) em vez de ser reconhecida como já migrada, duplicando a base
// inteira a cada nova execução.
var REGEX_ORIGEM_OBSERVACOES = /^Migrado de "(.+)", linha (\d+)\.$/;

function carregarOrigensExistentes_(sheet) {
  var mapa = {};
  if (sheet.getLastRow() < 2) return mapa;
  var obsCol = colunaParaIndice_('Observacoes') + 1;
  var valores = sheet.getRange(2, obsCol, sheet.getLastRow() - 1, 1).getValues();
  valores.forEach(function (linha) {
    var match = REGEX_ORIGEM_OBSERVACOES.exec(String(linha[0] || ''));
    if (match) mapa[match[1] + '|' + match[2]] = true;
  });
  return mapa;
}

function processarLinhaOrigem_(linha, aba, numLinha, chassisExistentes, origensExistentes, agora, usuario, modoTolerante) {
  if (origensExistentes[aba + '|' + numLinha]) {
    return {
      status: 'DUPLICADO',
      log: [agora, aba, numLinha, 'AVISO', 'Esta linha já havia sido migrada em uma execução anterior — ignorada para não duplicar.', '', '']
    };
  }

  var chassi = normalizarChassi_(linha[COL_ORIGEM.CHASSI]);
  var placaOriginal = normalizarPlaca_(linha[COL_ORIGEM.PLACA]);
  var avisos = [];

  if ((!chassi || !placaOriginal) && !modoTolerante) {
    return {
      status: 'INVALIDO',
      log: [agora, aba, numLinha, 'ERRO',
        'Chassi ou placa ausente — linha ignorada (rode a migração de novo e responda "Sim" à pergunta sobre registros incompletos para importar mesmo assim).',
        chassi, placaOriginal]
    };
  }
  // Comum em processos antigos que só informaram a quantidade total de
  // veículos doados, com um único chassi/placa representando o lote inteiro:
  // em vez de perder a linha, usa um identificador temporário e importa
  // mesmo assim — a revisão fica registrada no ImportacaoLog.
  if (!chassi) {
    chassi = 'HIST-' + aba + '-L' + numLinha;
    avisos.push('Chassi ausente no original — usado identificador temporário "' + chassi + '". Revise e informe o chassi real de cada veículo, se possível.');
  }
  if (!placaOriginal) {
    placaOriginal = 'HIST-L' + numLinha;
    avisos.push('Placa ausente no original — usado identificador temporário "' + placaOriginal + '". Revise e informe a placa real, se possível.');
  }
  if (!validarChassi_(chassi)) {
    if (!modoTolerante) {
      return {
        status: 'INVALIDO',
        log: [agora, aba, numLinha, 'ERRO',
          'Chassi fora do padrão VIN (17 caracteres) — linha ignorada (rode a migração de novo e responda "Sim" à pergunta sobre registros incompletos para importar mesmo assim).',
          chassi, placaOriginal]
      };
    }
    avisos.push('Chassi fora do padrão VIN de 17 caracteres: "' + chassi + '" — importado mesmo assim, revise se possível.');
  }
  if (chassisExistentes[chassi]) {
    if (!modoTolerante) {
      return {
        status: 'DUPLICADO',
        chassi: chassi,
        log: [agora, aba, numLinha, 'AVISO', 'Chassi já existente na base — linha ignorada.', chassi, placaOriginal]
      };
    }
    // Comum em processos antigos: um único chassi foi usado pra representar
    // vários veículos diferentes do mesmo lote. Em vez de descartar (o que
    // sub-contaria o total real de doações), gera um identificador próprio
    // pra não colidir, mas mantém como uma doação separada na contagem.
    var chassiOriginal = chassi;
    var sufixo = 2;
    while (chassisExistentes[chassiOriginal + '-DUP' + sufixo]) sufixo++;
    chassi = chassiOriginal + '-DUP' + sufixo;
    avisos.push('Chassi original "' + chassiOriginal + '" repetido em mais de um veículo deste lote antigo — usado o identificador "' + chassi + '" só para diferenciar no sistema; contado como doação separada.');
  }

  var uf = normalizarUF_(linha[COL_ORIGEM.UF]);
  if (!uf) {
    uf = UF_NAO_INFORMADA;
    avisos.push('UF ausente no original — usado marcador "' + UF_NAO_INFORMADA + '" (não informada). Revise e informe a UF real, se possível.');
  } else if (UFS_VALIDAS.indexOf(uf) === -1 && CODIGOS_ORGAO_FEDERAL.indexOf(uf) === -1) {
    return {
      status: 'INVALIDO',
      log: [agora, aba, numLinha, 'ERRO', 'UF desconhecida: "' + linha[COL_ORIGEM.UF] + '" — linha ignorada.', chassi, placaOriginal]
    };
  } else if (CODIGOS_ORGAO_FEDERAL.indexOf(uf) !== -1) {
    avisos.push('UF é código de órgão federal (' + uf + '), não uma UF real.');
  }

  var ente = normalizarTexto_(linha[COL_ORIGEM.ENTE]);
  if (ENTES_VALIDOS.indexOf(ente) === -1) {
    return {
      status: 'INVALIDO',
      log: [agora, aba, numLinha, 'ERRO', 'Ente desconhecido: "' + linha[COL_ORIGEM.ENTE] + '" — linha ignorada.', chassi, placaOriginal]
    };
  }

  var mes = normalizarTexto_(linha[COL_ORIGEM.MES]).toUpperCase();
  mes = MESES_ALIAS[mes] || mes;
  if (MESES_VALIDOS.indexOf(mes) === -1) {
    return {
      status: 'INVALIDO',
      log: [agora, aba, numLinha, 'ERRO', 'Mês desconhecido: "' + linha[COL_ORIGEM.MES] + '" — linha ignorada.', chassi, placaOriginal]
    };
  }

  var renavam = normalizarTexto_(linha[COL_ORIGEM.RENAVAM]).replace(/\D/g, '');
  if (!validarRenavam_(renavam)) {
    avisos.push('Renavam com formato incomum: "' + linha[COL_ORIGEM.RENAVAM] + '".');
  }

  if (!validarPlaca_(placaOriginal)) {
    avisos.push('Placa fora do padrão Mercosul/antigo: "' + placaOriginal + '".');
  }

  var transferido = normalizarTransferido_(linha[COL_ORIGEM.TRANSFERIDO]);
  if (!transferido) {
    avisos.push('Status "Transferido" ausente/ilegível ("' + linha[COL_ORIGEM.TRANSFERIDO] + '") — definido como NÃO por padrão.');
    transferido = 'NÃO';
  }

  var registro = {
    DataCadastro: agora,
    Ano: parseInt(linha[COL_ORIGEM.ANO], 10) || linha[COL_ORIGEM.ANO],
    Mes: mes,
    UF: uf,
    Ente: ente,
    Donataria: normalizarTexto_(linha[COL_ORIGEM.DONATARIA]),
    TermoDoacao: normalizarTexto_(linha[COL_ORIGEM.TERMO]),
    Descricao: normalizarTexto_(linha[COL_ORIGEM.DESCRICAO]),
    Marca: normalizarMarca_(linha[COL_ORIGEM.MARCA]),
    Chassi: chassi,
    Renavam: renavam,
    Placa: placaOriginal,
    Transferido: transferido,
    DataTransferencia: transferido === 'SIM' ? agora : '',
    Observacoes: 'Migrado de "' + aba + '", linha ' + numLinha + '.',
    CadastradoPor: usuario + ' (migração)',
    UltimaAtualizacao: agora,
    AtualizadoPor: usuario + ' (migração)'
  };

  var linhaFinal = CABECALHO_VEICULOS.map(function (campo) { return registro[campo] !== undefined ? registro[campo] : ''; });

  return {
    status: 'OK',
    chassi: chassi,
    linha: linhaFinal,
    log: avisos.length ? [agora, aba, numLinha, 'AVISO', avisos.join(' '), chassi, placaOriginal] : null
  };
}

// ======================================================================
// PAINEL — agregações estatísticas (dashboard)
// ======================================================================

var CACHE_DASHBOARD_SEGUNDOS = 300;

function invalidarCacheDashboard_() {
  CacheService.getDocumentCache().removeAll(['dash_admin', 'dash_geral']);
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
 * Só para testar manualmente pelo editor (menu de funções > Executar):
 * funções terminadas em "_" (como notificarPorEmail_) não aparecem nesse
 * menu — essa função pública existe só para poder disparar o teste.
 */
function testarNotificacaoEmail() {
  notificarPorEmail_();
}

// ======================================================================
// INTEGRAÇÃO DIRETA COM O ONEDRIVE (Microsoft Graph, sem Power Automate)
// ======================================================================
//
// Requer a biblioteca "OAuth2 for Apps Script" instalada no projeto
// (Bibliotecas > colar o ID 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF
// > selecionar a versão mais recente > identificador "OAuth2") e as
// Propriedades do Script: MS_CLIENT_ID, MS_CLIENT_SECRET, MS_TENANT_ID
// (valores obtidos ao registrar o aplicativo no Azure/Microsoft Entra).
// Opcionalmente, MS_ONEDRIVE_CAMINHO define o caminho do arquivo no OneDrive
// (padrão: "/Base_Veiculos_ATUAL.xlsx").

function getServicoMicrosoft_() {
  var props = PropertiesService.getScriptProperties();
  var tenantId = props.getProperty('MS_TENANT_ID');
  return OAuth2.createService('microsoft')
    .setAuthorizationBaseUrl('https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/authorize')
    .setTokenUrl('https://login.microsoftonline.com/' + tenantId + '/oauth2/v2.0/token')
    .setClientId(props.getProperty('MS_CLIENT_ID'))
    .setClientSecret(props.getProperty('MS_CLIENT_SECRET'))
    .setCallbackFunction('autorizarMicrosoftCallback_')
    .setPropertyStore(props)
    .setScope('https://graph.microsoft.com/Files.ReadWrite offline_access')
    .setParam('response_mode', 'query');
}

/**
 * Roda esta função manualmente pelo editor do Apps Script (selecione
 * "autorizarMicrosoft" no menu de funções e clique em Executar) uma única
 * vez, depois de preencher MS_CLIENT_ID/MS_CLIENT_SECRET/MS_TENANT_ID nas
 * Propriedades do Script. Ela mostra, no log de execução (Ver > Execuções),
 * o link para abrir e conceder a permissão de acesso ao OneDrive.
 */
function autorizarMicrosoft() {
  var servico = getServicoMicrosoft_();
  if (servico.hasAccess()) {
    Logger.log('Já autorizado.');
  } else {
    Logger.log('Abra este link para autorizar o acesso ao OneDrive: ' + servico.getAuthorizationUrl());
  }
}

function autorizarMicrosoftCallback_(request) {
  var servico = getServicoMicrosoft_();
  var autorizado = servico.handleCallback(request);
  return HtmlService.createHtmlOutput(autorizado
    ? 'Autorizado com sucesso! Pode fechar esta aba.'
    : 'Falha na autorização. Feche esta aba e tente de novo.');
}

function enviarParaOneDriveViaGraph_() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MS_CLIENT_ID')) return; // integração não configurada — no-op
  try {
    var servico = getServicoMicrosoft_();
    if (!servico.hasAccess()) return; // ainda não autorizado (ver autorizarMicrosoft()) — no-op

    var caminho = props.getProperty('MS_ONEDRIVE_CAMINHO') || '/Base_Veiculos_ATUAL.xlsx';
    var url = 'https://graph.microsoft.com/v1.0/me/drive/root:' + caminho + ':/content';
    UrlFetchApp.fetch(url, {
      method: 'put',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      payload: exportarPlanilhaComoXlsx_().getBytes(),
      headers: { Authorization: 'Bearer ' + servico.getAccessToken() },
      muteHttpExceptions: true
    });
  } catch (e) {
    // Intencional: notificação é best-effort, não deve travar a operação principal.
  }
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
 * Distribuição de veículos por UF, opcionalmente restrita a um ano e/ou a um
 * status de transferência — usada pelos seletores de Ano e Transferidos dos
 * cards "Veículos por UF" e "Veículos por Região/Estado" na tela de
 * Estatísticas. Sem cache: é uma consulta pontual (só quando o usuário troca
 * um filtro), diferente do painel geral que é recalculado toda hora que
 * alguém abre a tela.
 */
function getVeiculosPorUFAno(ano, transferido) {
  var filtros = {};
  if (ano) filtros.ano = ano;
  if (transferido) filtros.transferido = transferido;
  var registros = listarVeiculos(filtros);
  return paraArrayOrdenado_(contarPor_(registros, 'UF'));
}

function calcularEstatisticas_(registros) {
  var total = registros.length;
  var porTransferido = contarPor_(registros, 'Transferido');
  var porUF = contarPor_(registros, 'UF');
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
      var dias = r.DataCadastro ? Math.floor((agora - new Date(r.DataCadastro)) / 86400000) : null;
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
    porUF: paraArrayOrdenado_(porUF),
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
