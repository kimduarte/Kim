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
    .addItem('3) Reconciliar Veiculos com BDADOS2024/2025/2026 atualizadas', 'reconciliarBaseOrigem')
    .addItem('4) ATENÇÃO: apagar tudo e remigrar do zero', 'zerarVeiculosERemigrar')
    .addItem('5) Importar Contrato (coluna O) da origem', 'importarContratoDaOrigem')
    .addItem('6) Importar Valor de veículos (base legado)', 'importarValorLegado')
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
        totalTransferidos: 0,
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
    if (v.Transferido === 'SIM') grupo.totalTransferidos++;
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
 * Alterna rapidamente o status de emissão/envio do ATPVe ou de
 * transferência de um veículo, sem reenviar/validar o cadastro inteiro —
 * usado pelos toggles dentro de um processo expandido na Listagem.
 */
function atualizarStatusVeiculo(id, campo, valor) {
  if (['ATPVeEmitido', 'ATPVeEnviado', 'Transferido'].indexOf(campo) === -1) {
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
  var cascataTransferido = campo === 'Transferido' && valorNormalizado === 'SIM';

  sheet.getRange(linhaIdx, colunaParaIndice_(campo) + 1).setValue(valorNormalizado);
  if (cascataTransferido) {
    // Marcar como transferido também marca o ATPVe como emitido e enviado —
    // não existe, na prática, veículo transferido sem isso.
    sheet.getRange(linhaIdx, colunaParaIndice_('ATPVeEmitido') + 1).setValue('SIM');
    sheet.getRange(linhaIdx, colunaParaIndice_('ATPVeEnviado') + 1).setValue('SIM');
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

  if (!ehEdicao) {
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
  }
  // CEP só é validado no formato quando informado — não é exigido aqui para
  // não travar a edição de veículos antigos (migrados sem endereço).
  if (cep && cep.length !== 8) erros.push('CEP inválido: ' + dados.CEP);

  if (erros.length) {
    throw new Error(erros.join('\n'));
  }

  return {
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
  TRANSFERIDO: 13,
  // Coluna "O" das abas de origem — só existe nas versões mais recentes de
  // BDADOS2024/2025/2026 (número do contrato de cada lote/termo).
  CONTRATO: 14
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

// Considera a linha "vazia" olhando só pros campos que realmente identificam
// um veículo/doação (Donatária, Ente, Chassi, Placa) — não pra linha inteira.
// Duas causas já vistas de linha em branco não ser reconhecida como tal:
// 1) planilhas ligadas ao PowerApps preenchem um __PowerAppsId__ (e às vezes
//    um "\n" perdido) em linhas do resto totalmente em branco;
// 2) checkbox/dropdown de formatação de tabela aplicado além da última linha
//    realmente preenchida — ex.: um checkbox de "Transferido" desmarcado lê
//    como "false" (não como vazio) mesmo numa linha sem nenhum dado real.
// Em ambos os casos, se Donatária/Ente/Chassi/Placa estão todos em branco,
// não há veículo de verdade ali, mesmo que alguma coluna auxiliar carregue
// esse tipo de valor residual — daí checar só essas quatro, e não a linha
// inteira, senão a linha seguia pra validação completa e virava um "Ente
// desconhecido" (ou similar) só por ruído de linha de template sem dado.
function linhaVazia_(linha) {
  var CAMPOS_IDENTIFICADORES_ = ['DONATARIA', 'ENTE', 'CHASSI', 'PLACA'];
  return CAMPOS_IDENTIFICADORES_.every(function (campo) {
    var v = linha[COL_ORIGEM[campo]];
    return v === '' || v === null || v === undefined || String(v).trim() === '';
  });
}

/**
 * Reconcilia a aba Veiculos com uma versão atualizada/corrigida das abas de
 * origem (BDADOS2024/2025/2026) — use depois de substituir essas 3 abas por
 * uma base mais confiável (chassi/placa/renavam corrigidos, duplicidades
 * entre abas removidas etc.), quando Veiculos já tem operações em andamento
 * (Transferido, ATPVe, Valor, endereço, Processo) que não podem ser
 * perdidas rodando a migração do zero de novo.
 *
 * Ao contrário de migrarBaseOriginal (que rastreia o que já foi migrado
 * pelo par "aba+linha", e por isso trata tudo como "novo" se a planilha de
 * origem foi reordenada), esta função casa os registros pelo CHASSI — a
 * única forma confiável de saber que "é o mesmo veículo" depois que a
 * planilha de origem foi limpa/reordenada. Por isso, se o chassi de um
 * veículo foi corrigido na origem (ex.: tinha um caractere errado), ele
 * entra como um cadastro NOVO — o registro antigo com o chassi errado
 * continua em Veiculos e aparece no aviso de "sumiram da origem" no final,
 * pra você decidir se apaga ou corrige manualmente.
 *
 * Para cada linha válida das abas de origem:
 * - Chassi já existe em Veiculos: ATUALIZA só os campos "de origem" (Ano,
 *   Mês, UF, Ente, Donatária, Termo de Doação, Descrição, Marca, Renavam,
 *   Placa) — nunca mexe em ID, Transferido, DataTransferencia, ATPVe,
 *   Valor, endereço, Processo/Contrato ou Observações: isso é trabalho
 *   operacional já feito no site.
 * - Chassi novo: cadastra como veículo novo (mesma validação/modo
 *   tolerante de migrarBaseOriginal, sempre tolerante aqui porque a base já
 *   foi revisada manualmente antes desta reconciliação).
 *
 * Ao final, lista em ImportacaoLog (sem apagar nada) os veículos que já
 * estavam em Veiculos vindos de uma migração anterior, mas cujo chassi não
 * aparece mais em nenhuma das 3 abas de origem — pode ser um duplicado
 * removido de propósito na limpeza, ou algo que sumiu por engano.
 */
function reconciliarBaseOrigem() {
  exigirPerfilAdmin_();
  var ss = getSpreadsheet_();
  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var logSheet = getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  garantirColunasVeiculos_();

  var perfil = getPerfilUsuarioAtual_();
  var agora = new Date();

  var idxChassiV = colunaParaIndice_('Chassi');
  var idxObsV = colunaParaIndice_('Observacoes');
  var CAMPOS_ATUALIZAVEIS = ['Ano', 'Mes', 'UF', 'Ente', 'Donataria', 'TermoDoacao', 'Descricao', 'Marca', 'Renavam', 'Placa'];
  var idxAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');

  var ultimaLinha = sheetVeiculos.getLastRow();
  var dadosVeiculos = ultimaLinha >= 2
    ? sheetVeiculos.getRange(2, 1, ultimaLinha - 1, CABECALHO_VEICULOS.length).getValues()
    : [];

  var chassiParaIndice = {}; // chassi normalizado -> índice em dadosVeiculos
  var chassisMigrados = {}; // chassi normalizado -> true, se veio de uma migração anterior
  dadosVeiculos.forEach(function (linhaV, indice) {
    var chassiV = normalizarChassi_(linhaV[idxChassiV]);
    if (!chassiV) return;
    chassiParaIndice[chassiV] = indice;
    if (REGEX_ORIGEM_OBSERVACOES.test(String(linhaV[idxObsV] || ''))) {
      chassisMigrados[chassiV] = true;
    }
  });

  var chassisExistentes = {}; // usado por processarLinhaOrigem_ pra evitar colisão entre linhas novas
  Object.keys(chassiParaIndice).forEach(function (c) { chassisExistentes[c] = true; });
  var chassisNaOrigemAtual = {};

  var props = PropertiesService.getDocumentProperties();
  var proximoId = Number(props.getProperty('SEQ_VEICULO') || '0');

  var linhasNovas = [];
  var logEntradas = [];
  var atualizados = 0, novos = 0, invalidos = 0;

  ABAS_ORIGEM_MIGRACAO.forEach(function (nomeAba) {
    var aba = ss.getSheetByName(nomeAba);
    if (!aba) {
      logEntradas.push([agora, nomeAba, '-', 'AVISO', 'Aba não encontrada nesta planilha — nada reconciliado dela.', '', '']);
      return;
    }
    var valores = aba.getDataRange().getValues();

    for (var i = 1; i < valores.length; i++) {
      var linha = valores[i];
      if (linhaVazia_(linha)) continue;
      var numLinha = i + 1;

      var chassi = normalizarChassi_(linha[COL_ORIGEM.CHASSI]);
      if (!chassi) continue; // sem chassi real na origem — não dá pra casar com segurança, revise manualmente
      chassisNaOrigemAtual[chassi] = true;

      var indiceExistente = chassiParaIndice[chassi];
      if (indiceExistente !== undefined) {
        var uf = normalizarUF_(linha[COL_ORIGEM.UF]) || UF_NAO_INFORMADA;
        var mes = normalizarTexto_(linha[COL_ORIGEM.MES]).toUpperCase();
        mes = MESES_ALIAS[mes] || mes;
        var novosValores = {
          Ano: parseInt(linha[COL_ORIGEM.ANO], 10) || linha[COL_ORIGEM.ANO],
          Mes: mes,
          UF: uf,
          Ente: normalizarTexto_(linha[COL_ORIGEM.ENTE]),
          Donataria: normalizarTexto_(linha[COL_ORIGEM.DONATARIA]),
          TermoDoacao: normalizarTexto_(linha[COL_ORIGEM.TERMO]),
          Descricao: normalizarTexto_(linha[COL_ORIGEM.DESCRICAO]),
          Marca: normalizarMarca_(linha[COL_ORIGEM.MARCA]),
          Renavam: normalizarTexto_(linha[COL_ORIGEM.RENAVAM]).replace(/\D/g, ''),
          Placa: normalizarPlaca_(linha[COL_ORIGEM.PLACA])
        };
        var linhaV = dadosVeiculos[indiceExistente];
        CAMPOS_ATUALIZAVEIS.forEach(function (campo) {
          linhaV[colunaParaIndice_(campo)] = novosValores[campo];
        });
        linhaV[idxAtualizacao] = agora;
        linhaV[idxAtualizadoPor] = perfil.email + ' (reconciliação com origem)';
        atualizados++;
      } else {
        var resultado = processarLinhaOrigem_(linha, nomeAba, numLinha, chassisExistentes, {}, agora, perfil.email, true);
        if (resultado.status === 'OK') {
          proximoId++;
          resultado.linha[0] = 'VC-' + ('000000' + proximoId).slice(-6);
          linhasNovas.push(resultado.linha);
          chassisExistentes[resultado.chassi] = true;
          novos++;
        } else {
          invalidos++;
        }
        if (resultado.log) logEntradas.push(resultado.log);
      }
    }
  });

  if (dadosVeiculos.length) {
    sheetVeiculos.getRange(2, 1, dadosVeiculos.length, CABECALHO_VEICULOS.length).setValues(dadosVeiculos);
  }
  props.setProperty('SEQ_VEICULO', String(proximoId));
  gravarNovosVeiculos_(sheetVeiculos, linhasNovas, logEntradas, agora);

  // Veículos migrados antes que sumiram da origem atual — só reporta, nunca apaga.
  var sumidos = Object.keys(chassisMigrados).filter(function (c) { return !chassisNaOrigemAtual[c]; });
  if (sumidos.length) {
    logEntradas.push([agora, 'RECONCILIACAO', '-', 'AVISO',
      'Estes ' + sumidos.length + ' chassi(s) estavam em Veiculos (de uma migração anterior) mas não aparecem mais em ' +
      'nenhuma das 3 abas de origem — revise manualmente se devem ser removidos: ' + sumidos.join(', '),
      '', '']);
  }

  logEntradas.push([agora, 'RESUMO', '-', 'INFO',
    'Reconciliação: atualizados: ' + atualizados + ' | novos: ' + novos + ' | inválidos (ignorados): ' + invalidos +
    ' | sumidos da origem (revisar): ' + sumidos.length,
    '', '']);

  if (logEntradas.length) {
    logSheet.getRange(logSheet.getLastRow() + 1, 1, logEntradas.length, CABECALHO_IMPORT_LOG.length)
      .setValues(logEntradas);
  }

  invalidarCacheDashboard_();

  var mensagem = 'Reconciliação concluída. Atualizados: ' + atualizados + ', novos: ' + novos +
    ', inválidos: ' + invalidos + ', sumidos da origem (revisar): ' + sumidos.length +
    '. Veja detalhes em "' + SHEET_IMPORT_LOG + '".';
  ss.toast(mensagem, 'Reconciliação', 10);
  return { atualizados: atualizados, novos: novos, invalidos: invalidos, sumidos: sumidos, mensagem: mensagem };
}

/**
 * AÇÃO IRREVERSÍVEL: apaga TODOS os veículos já cadastrados em Veiculos —
 * Transferido, ATPVe emitido/enviado, Valor, endereço, Número de
 * Processo/Contrato, tudo — e migra do zero só com o que estiver nas abas
 * BDADOS2024/2025/2026 agora. Mantém a estrutura de colunas (CABECALHO_
 * VEICULOS) intacta, só esvazia as linhas de dado.
 *
 * Ao contrário de reconciliarBaseOrigem (que preserva o que já existe),
 * esta função existe especificamente para quando a base de origem foi
 * reconstruída do zero e não deve sobrar nenhum vestígio da base antiga.
 * Pede confirmação explícita antes de apagar qualquer coisa.
 */
function zerarVeiculosERemigrar() {
  exigirPerfilAdmin_();
  var ss = getSpreadsheet_();
  var ui = SpreadsheetApp.getUi();

  var confirmacao = ui.alert(
    'Apagar toda a base de veículos?',
    'Isso vai apagar TODOS os veículos já cadastrados em "Veiculos" (Transferido, ATPVe, Valor, endereço, Processo — ' +
    'tudo) e recriar a aba do zero só com o que estiver nas abas BDADOS2024/2025/2026 agora. Essa ação não pode ser ' +
    'desfeita.\n\nTem certeza que quer continuar?',
    ui.ButtonSet.YES_NO
  );
  if (confirmacao !== ui.Button.YES) {
    ss.toast('Operação cancelada — nada foi apagado.', 'Cancelado', 5);
    return { cancelado: true };
  }

  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var ultimaLinha = sheetVeiculos.getLastRow();
  if (ultimaLinha >= 2) {
    sheetVeiculos.getRange(2, 1, ultimaLinha - 1, sheetVeiculos.getLastColumn()).clearContent();
  }

  PropertiesService.getDocumentProperties().setProperty('SEQ_VEICULO', '0');
  invalidarCacheDashboard_();
  ss.toast('Base de veículos zerada. Iniciando migração...', 'Zerar e remigrar', 5);

  return migrarBaseOriginal();
}

/**
 * Importa o número do Contrato (coluna "O" das abas BDADOS2024/2025/2026)
 * para o campo Contrato de cada veículo já cadastrado em Veiculos, casando
 * por Chassi. Só preenche esse único campo — não mexe em mais nada (nem
 * cria veículo novo, nem apaga). Linhas de origem sem Contrato preenchido,
 * ou cujo chassi não é encontrado em Veiculos, são ignoradas.
 */
function importarContratoDaOrigem() {
  exigirPerfilAdmin_();
  var ss = getSpreadsheet_();
  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var logSheet = getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  garantirColunasVeiculos_();

  var perfil = getPerfilUsuarioAtual_();
  var agora = new Date();

  var idxChassiV = colunaParaIndice_('Chassi');
  var idxContratoV = colunaParaIndice_('Contrato');
  var idxAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');

  var ultimaLinha = sheetVeiculos.getLastRow();
  var dadosVeiculos = ultimaLinha >= 2
    ? sheetVeiculos.getRange(2, 1, ultimaLinha - 1, CABECALHO_VEICULOS.length).getValues()
    : [];

  var chassiParaIndice = {};
  dadosVeiculos.forEach(function (linhaV, indice) {
    var chassiV = normalizarChassi_(linhaV[idxChassiV]);
    if (chassiV) chassiParaIndice[chassiV] = indice;
  });

  var preenchidos = 0, semChassiCorrespondente = 0;

  ABAS_ORIGEM_MIGRACAO.forEach(function (nomeAba) {
    var aba = ss.getSheetByName(nomeAba);
    if (!aba) return;
    var valores = aba.getDataRange().getValues();

    for (var i = 1; i < valores.length; i++) {
      var linha = valores[i];
      if (linhaVazia_(linha)) continue;

      var contrato = normalizarTexto_(linha[COL_ORIGEM.CONTRATO]);
      if (!contrato) continue;

      var chassi = normalizarChassi_(linha[COL_ORIGEM.CHASSI]);
      if (!chassi) continue;

      var indiceExistente = chassiParaIndice[chassi];
      if (indiceExistente === undefined) {
        semChassiCorrespondente++;
        continue;
      }

      dadosVeiculos[indiceExistente][idxContratoV] = contrato;
      dadosVeiculos[indiceExistente][idxAtualizacao] = agora;
      dadosVeiculos[indiceExistente][idxAtualizadoPor] = perfil.email + ' (importação de Contrato)';
      preenchidos++;
    }
  });

  if (dadosVeiculos.length) {
    sheetVeiculos.getRange(2, 1, dadosVeiculos.length, CABECALHO_VEICULOS.length).setValues(dadosVeiculos);
  }

  logSheet.getRange(logSheet.getLastRow() + 1, 1, 1, CABECALHO_IMPORT_LOG.length).setValues([[
    agora, 'IMPORTAR_CONTRATO', '-', 'INFO',
    'Contratos preenchidos: ' + preenchidos + ' | Linhas de origem com contrato mas sem chassi correspondente em Veiculos: ' + semChassiCorrespondente,
    '', ''
  ]]);

  invalidarCacheDashboard_();

  var mensagem = 'Contratos preenchidos: ' + preenchidos +
    (semChassiCorrespondente ? '. ' + semChassiCorrespondente + ' linha(s) com contrato não encontraram o chassi em Veiculos (veja "' + SHEET_IMPORT_LOG + '").' : '.');
  ss.toast(mensagem, 'Importar Contrato', 10);
  return { preenchidos: preenchidos, semChassiCorrespondente: semChassiCorrespondente, mensagem: mensagem };
}

/**
 * Mapa chassi -> valor (R$) apurado a partir de uma planilha de controle de
 * contratos/legado (fora do Google Sheets — não é uma das abas BDADOS),
 * cruzado uma única vez com os chassis já cadastrados em Veiculos. Usado só
 * por importarValorLegado — se a base mudar de novo, gere um mapa novo e
 * substitua esta constante.
 */
var MAPA_VALOR_LEGADO_POR_CHASSI_ = {"3N1AB8AE0TY200350": 168082.82, "3N1AB8AE0TY200395": 168082.82, "3N1AB8AE2TY200379": 168082.82, "3N1AB8AE3TY200388": 168082.82, "3N1AB8AE0TY200722": 168082.82, "3N1AB8AE5TY200540": 168082.82, "93XSYKL1TSCR90430": 270774.0, "93XSYKL1TSCR90439": 270774.0, "93XSYKL1TSCR90446": 270774.0, "93XSYKL1TSCR90456": 270774.0, "8AP359AFTSU409718": 115435.99, "8AP359AFTSU419063": 115435.99, "8AP359AFTSU427813": 115435.99, "8AP359AFTSU430921": 115435.99, "8AP359AFTSU430965": 115435.99, "8AP359AFTSU428722": 115435.99, "8AP359AFTSU433328": 115435.99, "8AP359AFTSU401710": 115435.99, "8AP359AFTSU414242": 115435.99, "8AP359AFWRU373458": 115435.99, "8AP359AFWRU379204": 115435.99, "93XSYKL1TSCR91164": 251671.0, "9BRBC3F31S8336434": 127800.0, "9BRBC3F33S8336533": 127800.0, "9BRBC3F38R8297335": 127800.0, "9BRBC3F39R8296887": 127800.0, "9BRBC3F30R8296194": 127800.0, "9BRBC3F31R8298956": 127800.0, "9BRBC3F35R8298720": 127800.0, "9BRBC3F3XR8298681": 127800.0, "9BRBC3F32R8296147": 127800.0, "9BRBC3F34R8295856": 127800.0, "9BRBC3F35R8295381": 127800.0, "9BRBC3F36R8296216": 127800.0, "9BRBC3F31R8298732": 127800.0, "9BRBC3F39R8297828": 127800.0, "93XTYKL1TSCR80124": 313406.0, "93XTYKL1TSCR80126": 313406.0, "93XTYKL1TSCR80128": 313406.0, "93XTYKL1TSCR80131": 313406.0, "93XPYKL1TSCR79982": 313402.0, "93XPYKL1TSCR79990": 313402.0, "93XPYKL1TSCR80099": 313402.0, "93XPYKL1TSCR80102": 313402.0, "93XSYKL1TSCR80039": 310926.0, "93XTYKL1TSCR80248": 313406.0, "93XTYKL1TSCR80299": 313406.0, "93XTYKL1TSCR80320": 313406.0, "93XTYKL1TSCR80328": 313406.0, "93XPYKL1TSCR79622": 313402.0, "8AP359AFXRU339385": 115435.99, "8AP359AFXRU341515": 115435.99, "8AP359AFXRU347951": 115435.99, "8AP359AFXRU360390": 115435.99, "93XTYKL1TRCP77558": 313406.0, "93XTYKL1TRCP77587": 313406.0, "93XTYKL1TRCP77875": 313406.0, "93XTYKL1TRCP77902": 313406.0, "93XTYKL1TRCP77997": 313406.0, "93XTYKL1TRCP78007": 313406.0, "9BM951104NB279946": 413195.0, "93XSYKL1TNCM44827": 177200.0, "93YF62S07TJ449028": 344772.73, "93YF62S08TJ449023": 344772.73, "93XSYKL1TSCS93051": 318282.34, "93XSYKL1TSCS93052": 318282.34, "93XSYKL1TSCS93053": 318282.34, "93XSYKL1TSCS93037": 318282.34, "93XSYKL1TSCS93038": 318282.34, "9BG156FK0TC429281": 305861.89, "91JPWC601S1000703": 9798.0, "9535E6TB4TR003695": 1420000.0, "93XSYKL1TSCR90625": 270774.0, "8AP359AFTSU431101": 115435.99, "8AP359AFTSU431103": 115435.99, "8AP359AFTSU406393": 115435.99, "8AP359AFTSU423778": 115435.99, "8AP359AFTSU433070": 115435.99, "8AP359AFTSU433395": 115435.99, "8AP359AFTSU435929": 115435.99, "8AP359AFTSU435982": 115435.99, "93XSYKL1TSCR85951": 270774.0, "93XSYKL1TSCR86812": 270774.0, "93XSYKL1TSCR86817": 270774.0, "9BRBC3F36R8298595": 127600.0, "9BRBC3F37R8297584": 127600.0, "9BRBC3F38R8297044": 127600.0, "9BRBC3F3XR8298177": 127400.0, "93XTYKL1TSCR80858": 313406.0, "93XTYKL1TSCR80862": 313406.0, "93XTYKL1TSCR80865": 313406.0, "9BRBC3F30R8267732": 127600.0, "9BRBC3F30R8269108": 127600.0, "9BRBC3F33R8269006": 127600.0, "9BRBC3F35R8269234": 127600.0, "9BRBC3F36R8270201": 127600.0, "9BRBC3F37R8270188": 127600.0, "93XTYKL1TSCR79650": 313406.0, "93XTYKL1TRCP77449": 313406.0, "93XTYKL1TRCP77736": 313406.0, "93XTYKL1TRCP77801": 313406.0, "93XTYKL1TRCP77877": 313406.0, "93XTYKL1TRCP77924": 313406.0, "93Y5SRJSXPJ312338": 92150.0, "93Y5SRJSXPJ312353": 92150.0, "3N1AB8AE3TY200911": 168082.82, "3N1AB8AE6TY200949": 168082.82, "93XSYKL1TSCR90517": 270774.0, "93XSYKL1TSCR90527": 270774.0, "93XSYKL1TSCR90535": 270774.0, "8AP359AFTSU431089": 115435.99, "8AP359AFTSU432620": 115435.99, "8AP359AFTSU433567": 115435.99, "8AP359AFTSU434368": 115435.99, "8AP359AFTSU434373": 115435.99, "8AP359AFTSU435219": 115435.99, "8AP359AFTSU435997": 115435.99, "8AP359AFTSU427906": 115435.99, "9321FHMJ2DD658688": 53449.0, "9321FHMJ6DD658709": 53449.0, "93XSYKL1TSCR91153": 263934.95, "93XSYKL1TSCR91201": 263934.95, "9BRBC3F34R8297638": 127800.0, "8AFAR23L2JJ057509": 145584.0, "8AFAR23L8JJ039452": 145584.0, "9BRBC3F34R8269936": 127600.0, "9BRBC3F3XR8271111": 127600.0, "9BRBC3F31R8271658": 127600.0, "9BRBC3F3XR8273084": 127600.0, "93XTYKL1TSCR80216": 313406.0, "93XTYKL1TSCR80333": 313406.0, "93XPYKL1TSCR79705": 313402.0, "93XPYKL1TSCR79709": 313402.0, "93XSYKL1TSCR80041": 310926.0, "93XSYKL1TSCR80044": 310926.0, "93XTYKL1TSCR80047": 310406.0, "93XTYKL1TSCR80049": 310406.0, "93XTYKL1TSCR80051": 310406.0, "93XTYKL1TSCR80053": 310406.0, "93XTYKL1TSCR80056": 310406.0, "93XTYKL1TSCR80059": 310406.0, "93XTYKL1TSCR80061": 310406.0, "93XTYKL1TSCR80063": 310406.0, "93XTYKL1TSCR80065": 310406.0, "93XTYKL1TSCR80068": 310406.0, "93XTYKL1TSCR80165": 313406.0, "93XTYKL1TSCR80172": 313406.0, "93XTYKL1TSCR80199": 313406.0, "93XTYKL1TSCR80202": 313406.0, "93XTYKL1TSCR80209": 313406.0, "93XTYKL1TSCR80211": 313406.0, "93XTYKL1TSCR80219": 313406.0, "93XTYKL1TSCR80253": 313406.0, "93XTYKL1TSCR80277": 313406.0, "93XTYKL1TSCR80297": 313406.0, "93XTYKL1TSCR80301": 313406.0, "93XTYKL1TSCR80306": 313406.0, "93XTYKL1TSCR80323": 313406.0, "93XTYKL1TSCR80326": 313406.0, "93XTYKL1TSCR79595": 313406.0, "93XTYKL1TSCR79597": 313406.0, "93XTYKL1TSCR79599": 313406.0, "93XTYKL1TRCP77459": 313406.0, "93XTYKL1TRCP77790": 313406.0, "93XTYKL1TRCP77825": 313406.0, "93XTYKL1TRCP77864": 313406.0, "93XTYKL1TRCP77949": 313406.0, "93XTYKL1TRCP78020": 313406.0, "9BRBC3F31R8268338": 127600.0, "9BRBC3F33R8269619": 127600.0, "9BRBC3F35R8269718": 127600.0, "9BRBC3F36R8268710": 127600.0, "9BRBC3F37R8268957": 127600.0, "9BRBC3F39R8268331": 127600.0, "9BM951104NB278918": 413195.0, "9BRBC3F30R8267360": 127600.0, "9BRBC3F30R8267469": 127600.0, "9BRBC3F31R8267450": 127600.0, "9BRBC3F32R8267392": 127600.0, "9BRBC3F32R8267649": 127600.0, "9BRBC3F33R8267725": 127600.0, "9BRBC3F34R8267619": 127600.0, "9BRBC3F37R8269316": 127600.0, "9BRBC3F39R8267437": 127600.0, "93XSYKL1TNCM44777": 177200.0, "93XSYKL1TNCM39965": 186000.0, "93XSYKL1TNCM41902": 186000.0, "3N1AB8AE6TY200384": 172000.0, "3N1AB8AE0TY200381": 172000.0, "3N1AB8AE1TY200342": 172000.0, "3N1AB8AE1TY200406": 172000.0, "3N1AB8AE5TY200943": 168082.82, "3N1AB8AE7TY201009": 168082.82, "3N1AB8AEXTY200937": 168082.82, "3N1AB8AEXTY201148": 168082.82, "3N1AB8AE5TY200683": 172000.0, "3N1AB8AE5TY200716": 172000.0, "93XSYKL1TSCS93104": 263934.95, "3N1AB8AE9SY258214": 168082.82, "3N1AB8AE1TY200471": 168082.82, "3N1AB8AE3TY200584": 168082.82, "3N1AB8AE4TY200531": 168082.82, "9BG156FK0TC404697": 305861.89, "9BG156FK0TC405139": 305861.89, "8AP359AFTSU426698": 115435.99, "9BRBC3F31S8324431": 127600.0, "9BRBC3F33S8325564": 127600.0, "9BRBC3F35S8325307": 127600.0, "9BRBC3F36S8325977": 127600.0, "9BRBC3F37S8323333": 127600.0, "8AP359AFTSU425306": 115435.99, "8AP359AFTSU426742": 115435.99, "8AP359AFTSU430903": 115435.99, "8AP359AFTSU430918": 115435.99, "8AP359AFTSU430964": 115435.99, "8AP359AFTSU431703": 115435.99, "93XSYKL1TSCR90471": 270774.0, "93XSYKL1TSCR90495": 270774.0, "93XSYKL1TSCR90502": 270774.0, "93XSYKL1TSCR90510": 270774.0, "8AP359AFTSU418812": 115435.99, "8AP359AFTSU427717": 115435.99, "93XSYKL1TSCR91159": 251671.0, "9BRBC3F30R8277080": 127400.0, "9BRBC3F33R8297260": 127800.0, "93XTYKL1TSCR80170": 313406.0, "93XTYKL1TSCR80174": 313406.0, "93XTYKL1TSCR80177": 313406.0, "93XTYKL1TSCR80204": 313406.0, "93XTYKL1TSCR80214": 313406.0, "93XPYKL1TSCR79624": 313402.0, "93XTYKL1TSCR79601": 313406.0, "93XTYKL1TSCR79603": 313406.0, "93XTYKL1TSCR79606": 313406.0, "9BRBC3F36R8296961": 127800.0, "93XTYKL1TRCP77513": 313406.0, "93XTYKL1TRCP77597": 313406.0, "93XTYKL1TRCP77639": 313406.0, "93XTYKL1TRCP77680": 313406.0, "93XTYKL1TRCP77872": 313406.0, "9BM951104NB298928": 413195.0, "93XSYKL1TNCM39997": 177200.0, "8AGBB69S0NR116649": 114700.0, "8AGBB69S0NR116987": 114700.0, "9BG148FK0NC453330": 215943.0, "9BRBC3F30P8239264": 127800.0, "9BRBC3F37R8251267": 127800.0, "93XSYKL1TSCS93054": 318282.34, "93XSYKL1TSCS93055": 318282.34, "93XSYKL1TSCS93056": 318282.34, "93XSYKL1TSCS93057": 318282.34, "93XSYKL1TSCS93058": 318282.34, "93XSYKL1TSCS93059": 318282.34, "93XSYKL1TSCS93060": 318282.34, "93XSYKL1TSCS93061": 318282.34, "93XSYKL1TSCS93062": 318282.34, "93XSYKL1TSCS93063": 318282.34, "93XSYKL1TSCS93064": 318282.34, "93XSYKL1TSCS93065": 318282.34, "93XSYKL1TSCS93066": 318282.34, "93XSYKL1TSCS93067": 318282.34, "93XSYKL1TSCS93068": 318282.34, "93XSYKL1TSCS93069": 318282.34, "93XSYKL1TSCS93070": 318282.34, "9BG156FK0TC429756": 289017.0, "93XSYKL1TSCS93028": 318282.34, "93XSYKL1TSCS93029": 318282.34, "93XSYKL1TSCS93030": 318282.34, "93XSYKL1TSCS93032": 318282.34, "93XSYKL1TSCS93033": 318282.34, "93XSYKL1TSCS93034": 318282.34, "93XSYKL1TSCS93035": 318282.34, "93XSYKL1TSCS93049": 318282.34, "93XSYKL1TSCS93050": 318282.34, "91JPWC601S1000712": 9798.0, "93XSYKL1TSCS93048": 318282.34, "93XSYKL1TSCS93042": 318282.34, "93XSYKL1TSCS93039": 318282.34, "93XSYKL1TSCS93040": 318282.34, "93XSYKL1TSCS93047": 318282.34, "93XSYKL1TSCS93046": 318282.34, "93XSYKL1TSCS93041": 318282.34, "93XSYKL1TSCS93044": 318282.34, "93XSYKL1TSCS93045": 318282.34, "93XSYKL1TSCS93043": 318282.34, "93XDLLC2TTCS06145": 318226.54, "9535E6TB0TR025550": 1420000.0, "93XSYKL1TSCR90927": 239116.65, "93XSYKL1TSCR90938": 239116.65, "93XSYKL1TSCR90981": 239116.65, "93XSYKL1TSCR91023": 239116.65, "93XSYKL1TSCR91103": 239116.65, "93XSYKL1TSCR90975": 239116.65, "93XSYKL1TSCR91135": 239116.65, "9BM951104SB397886": 605782.26, "9BM951104SB412619": 605782.26, "9BM951104SB412805": 605782.26, "9BM951104SB412815": 605782.26, "93XSYKL1TSCR91008": 283968.84, "93XSYKL1TSCR91028": 283968.84, "93XSYKL1TSCS93235": 283968.84, "93XSYKL1TSCS93236": 283968.84, "93XSYKL1TSCS93237": 283968.84, "93XSYKL1TSCS93238": 283968.84, "93XSYKL1TSCS93239": 283968.84, "93XSYKL1TSCS93240": 283968.84, "93XSYKL1TSCS93241": 283968.84, "93XSYKL1TSCS93143": 283968.84, "93XSYKL1TSCS93100": 263934.95, "93XSYKL1TSCS93102": 263934.95, "9BG156FK0TC405135": 305861.89, "9BG156FK0TC405136": 305861.89, "8AP359AFTSU433337": 115435.99, "8AP359AFTSU417059": 115435.99, "8AP359AFTSU426693": 115435.99, "8AP359AFTSU430905": 115435.99, "8AP359AFTSU430909": 115435.99, "8AP359AFTSU430920": 115435.99, "8AP359AFTSU431054": 115435.99, "8AP359AFTSU418064": 115435.99, "8AP359AFTSU423209": 115435.99, "8AP359AFTSU426624": 115435.99, "8AP359AFTSU426910": 115435.99, "8AP359AFTSU427130": 115435.99, "8AP359AFTSU427681": 115435.99, "8AP359AFWRU372735": 115435.99, "8AP359AFWRU390195": 115435.99, "8AP359AFWRU373184": 115435.99, "93XSYKL1TSCR87434": 270774.0, "93XSYKL1TSCR88372": 254933.0, "93XSYKL1TSCR88384": 254933.0, "91JPWC601S1000711": 9798.0, "9BRBC3F31R8296723": 127600.0, "9BRBC3F34R8297719": 127600.0, "9BRBC3F39R8297926": 127600.0, "9BRBC3F32R8277761": 127600.0, "9BRBC3F37R8277772": 127600.0, "9BRBC3F35R8297969": 127600.0, "9BRBC3F37R8297620": 127600.0, "9BRBC3F39R8297649": 127600.0, "9BRBC3F3XR8297367": 127600.0, "9BRBC3F30S8315008": 127600.0, "9BRBC3F32S8314197": 127600.0, "9BRBC3F34S8313892": 127600.0, "9BRBC3F34S8314170": 127600.0, "9BRBC3F35S8314999": 127600.0, "9BRBC3F36S8314915": 127600.0, "9BRBC3F37S8314986": 127600.0, "9BRBC3F39S8315007": 127600.0, "9BRBC3F3XS8314190": 127600.0, "9BRBC3F3XS8314397": 127600.0, "9BRBC3F34S8305176": 127600.0, "9BRBC3F35S8307387": 127600.0, "9BRBC3F35S8307471": 127600.0, "9BRBC3F36S8306958": 127600.0, "9BRBC3F38S8306377": 127600.0, "9BRBC3F39S8304914": 127600.0, "9BRBC3F39S8306923": 127600.0, "9BRBC3F3XS8305893": 127600.0, "9BRBC3F35S8314713": 127600.0, "9BRBC3F36S8314509": 127600.0, "9BRBC3F30R8273000": 127600.0, "9BRBC3F31R8273328": 127600.0, "9BRBC3F34R8271699": 127600.0, "9BRBC3F31R8298584": 127600.0, "9BRBC3F34R8298997": 127600.0, "9BG156FK0RC417942": 348600.0, "9BG156FK0RC419563": 348600.0, "9BG156FK0RC419673": 348600.0, "9BG156FK0RC419679": 348600.0, "9BG156FK0RC419685": 348600.0, "9BG156FK0RC419697": 348600.0, "9BG156FK0RC419703": 348600.0, "9BG156FK0RC419709": 348600.0, "9BG156FK0RC419715": 348600.0, "9BG156FK0RC419722": 348600.0, "9BG156FK0RC419729": 348600.0, "9BG156FK0RC419730": 348600.0, "9BG156FK0RC419735": 348600.0, "9BG156FK0RC419736": 348600.0, "9BG156FK0RC419741": 348600.0, "9BG156FK0RC419742": 348600.0, "9BG156FK0RC419747": 348600.0, "9BG156FK0RC419821": 348600.0, "9BG156FK0RC419839": 348600.0, "9BG156FK0RC419851": 348600.0, "9BG156FK0RC420399": 348600.0, "9BG156FK0RC420405": 348600.0, "9BG156FK0RC420411": 348600.0, "9BG156FK0RC420417": 348600.0, "9BG156FK0RC420428": 348600.0, "9BG156FK0RC420435": 348600.0, "9BG156FK0RC419568": 348600.0, "9BG156FK0RC419691": 348600.0, "9BG156FK0RC419716": 348600.0, "9BG156FK0RC419723": 348600.0, "9BG156FK0RC419827": 348600.0, "9BG156FK0RC419833": 348600.0, "9BG156FK0RC419845": 348600.0, "9BG156FK0RC419857": 348600.0, "9BG156FK0RC420381": 348600.0, "9BG156FK0RC420387": 348600.0, "9BG156FK0RC420393": 348600.0, "9BG156FK0RC420422": 348600.0, "9BG156FK0RC420429": 348600.0, "9BG156FK0RC420440": 348600.0, "9BRBC3F30R8272610": 127600.0, "9BRBC3F35R8271176": 127600.0, "9BRBC3F38R8273276": 127600.0, "9BRBC3F32R8277422": 127600.0, "9BRBC3F33R8277154": 127600.0, "9BRBC3F35R8277009": 127600.0, "9BRBC3F30R8271411": 127600.0, "9BRBC3F32R8272947": 127600.0, "9BRBC3F33R8272083": 127600.0, "9BRBC3F37R8272510": 127600.0, "9BRBC3F32R8271720": 127600.0, "9BRBC3F39R8271424": 127600.0, "9BRBC3F3XR8271190": 127600.0, "9BRBC3F39R8292936": 127600.0, "93XTYKL1TSCR80764": 313406.0, "93XTYKL1TSCR80766": 313406.0, "93XTYKL1TSCR80769": 313406.0, "93XTYKL1TSCR80775": 313406.0, "93XTYKL1TSCR80778": 313406.0, "93XTYKL1TSCR80801": 313406.0, "93XTYKL1TSCR80804": 313406.0, "93XTYKL1TSCR80807": 313406.0, "93XTYKL1TSCR80825": 313406.0, "93XTYKL1TSCR80830": 313406.0, "93XTYKL1TSCR80848": 313406.0, "93XTYKL1TSCR80852": 313406.0, "93XTYKL1TSCR80855": 313406.0, "9BRBC3F30R8269996": 127600.0, "9BRBC3F37R8270563": 127600.0, "9BRBC3F30R8272185": 127600.0, "9BRBC3F34R8272237": 127600.0, "9BRBC3F39R8271438": 127600.0, "93XPYKL1TSCR79724": 313402.0, "9BRBC3F33R8270544": 127600.0, "9BRBC3F35R8270772": 127600.0, "9BRBC3F36R8270229": 127600.0, "9BRBC3F3XR8270444": 127600.0, "93XTYKL1TSCR79653": 313406.0, "93XTYKL1TRCP78025": 313406.0, "9BRBC3F30R8271652": 127600.0, "9BRBC3F32R8268400": 127600.0, "9BRBC3F34R8268639": 127600.0, "9BRBC3F35R8268830": 127600.0, "9BRBC3F35R8269282": 127600.0, "9BRBC3F37R8269929": 127600.0, "9BRBC3F39R8267924": 127600.0, "93XTYKL1TRCP78087": 313406.0, "93XTYKL1TRCP78027": 313406.0, "93XTYKL1TRCP77608": 313406.0, "93XTYKL1TRCP77827": 313406.0, "93XTYKL1TRCP77828": 313406.0, "93XTYKL1TRCP77859": 313406.0, "93XTYKL1TRCP77889": 313406.0, "93XTYKL1TRCP77980": 313406.0, "93XTYKL1TRCP78000": 313406.0, "93XTYKL1TRCP78064": 313406.0, "9BRBC3F37R8271888": 127600.0, "9BRBC3F3XR8268547": 127600.0, "9BRBC3F3XR8272002": 127600.0, "93XDLLC2TVCT12961": 318382.34, "93XDLLC2TVCT13200": 239116.65, "93XDLLC2TVCT13205": 239116.65, "9321FHMJ2DD658674": 53449.0, "9321FHMJ8DD656444": 53449.0, "9BG148FK0NC453882": 215943.0, "9BG148FK0NC454020": 215943.0, "93XTYKL1TRCP77425": 313406.0, "93XTYKL1TRCP77455": 313406.0, "93XTYKL1TRCP77485": 313406.0, "93XTYKL1TRCP77502": 313406.0, "93XTYKL1TRCP77528": 313406.0, "93XTYKL1TRCP77541": 313406.0, "93XTYKL1TRCP77550": 313406.0, "93XTYKL1TRCP77554": 313406.0, "93XTYKL1TRCP77561": 313406.0, "93XTYKL1TRCP77569": 313406.0, "93XTYKL1TRCP77576": 313406.0, "93XTYKL1TRCP77580": 313406.0, "93XTYKL1TRCP77582": 313406.0, "93XTYKL1TRCP77593": 313406.0, "93XTYKL1TRCP77615": 313406.0, "93XTYKL1TRCP77628": 313406.0, "93XTYKL1TRCP77632": 313406.0, "93XTYKL1TRCP77652": 313406.0, "93XTYKL1TRCP77684": 313406.0, "93XTYKL1TRCP77686": 313406.0, "93XTYKL1TRCP77695": 313406.0, "93XTYKL1TRCP77723": 313406.0, "93XTYKL1TRCP77725": 313406.0, "93XTYKL1TRCP77727": 313406.0, "93XTYKL1TRCP77734": 313406.0, "93XTYKL1TRCP77738": 313406.0, "93XTYKL1TRCP77753": 313406.0, "93XTYKL1TRCP77777": 313406.0, "93XTYKL1TRCP77779": 313406.0, "93XTYKL1TRCP77784": 313406.0, "93XTYKL1TRCP77795": 313406.0, "93XTYKL1TRCP77803": 313406.0, "93XTYKL1TRCP77813": 313406.0, "93XTYKL1TRCP77818": 313406.0, "93XTYKL1TRCP77820": 313406.0, "93XTYKL1TRCP77821": 313406.0, "93XTYKL1TRCP77837": 313406.0, "93XTYKL1TRCP77838": 313406.0, "93XTYKL1TRCP77843": 313406.0, "93XTYKL1TRCP77862": 313406.0, "93XTYKL1TRCP77870": 313406.0, "93XTYKL1TRCP77874": 313406.0, "93XTYKL1TRCP77879": 313406.0, "93XTYKL1TRCP77882": 313406.0, "93XTYKL1TRCP77884": 313406.0, "93XTYKL1TRCP77885": 313406.0, "93XTYKL1TRCP77887": 313406.0, "93XTYKL1TRCP77894": 313406.0, "93XTYKL1TRCP77900": 313406.0, "93XTYKL1TRCP77912": 313406.0, "93XTYKL1TRCP77914": 313406.0, "93XTYKL1TRCP77915": 313406.0, "93XTYKL1TRCP77920": 313406.0, "93XTYKL1TRCP77922": 313406.0, "93XTYKL1TRCP77925": 313406.0, "93XTYKL1TRCP77929": 313406.0, "93XTYKL1TRCP77930": 313406.0, "93XTYKL1TRCP77934": 313406.0, "93XTYKL1TRCP77939": 313406.0, "93XTYKL1TRCP77942": 313406.0, "93XTYKL1TRCP77944": 313406.0, "93XTYKL1TRCP77950": 313406.0, "93XTYKL1TRCP77955": 313406.0, "93XTYKL1TRCP77957": 313406.0, "93XTYKL1TRCP77960": 313406.0, "93XTYKL1TRCP77962": 313406.0, "93XTYKL1TRCP77965": 313406.0, "93XTYKL1TRCP77967": 313406.0, "93XTYKL1TRCP77969": 313406.0, "93XTYKL1TRCP77970": 313406.0, "93XTYKL1TRCP77974": 313406.0, "93XTYKL1TRCP77975": 313406.0, "93XTYKL1TRCP77987": 313406.0, "93XTYKL1TRCP78002": 313406.0, "93XTYKL1TRCP78004": 313406.0, "93XTYKL1TRCP78005": 313406.0, "93XTYKL1TRCP78009": 313406.0, "93XTYKL1TRCP78015": 313406.0, "93XTYKL1TRCP78017": 313406.0, "93XTYKL1TRCP78019": 313406.0, "93XTYKL1TRCP78022": 313406.0, "93XTYKL1TRCP78024": 313406.0, "93XTYKL1TRCP78032": 313406.0, "93XTYKL1TRCP78034": 313406.0, "93XTYKL1TRCP78035": 313406.0, "93XTYKL1TRCP78037": 313406.0, "93XTYKL1TRCP78039": 313406.0, "93XTYKL1TRCP78045": 313406.0, "93XTYKL1TRCP78052": 313406.0, "93XTYKL1TRCP78054": 313406.0, "93XTYKL1TRCP78055": 313406.0, "93XTYKL1TRCP78065": 313406.0, "93XTYKL1TRCP78067": 313406.0, "93XTYKL1TRCP78069": 313406.0, "93XTYKL1TRCP78070": 313406.0, "93XTYKL1TRCP78072": 313406.0, "93XTYKL1TRCP78075": 313406.0, "93XTYKL1TRCP78080": 313406.0, "93XTYKL1TRCP78082": 313406.0, "93XTYKL1TRCP77623": 313406.0, "9BG148FK0NC454015": 215943.0, "9BG148FK0NC453773": 196950.0, "9BG148FK0NC453860": 196950.0, "9BG148FK0NC453967": 196950.0, "9BG148FK0NC453987": 196950.0, "9BG148FK0NC453313": 215943.0, "9BG148FK0NC453568": 215943.0, "9BG148FK0NC453716": 215943.0, "9BG148FK0NC453739": 215943.0, "9BG148FK0NC453740": 215943.0, "9BG148FK0NC453775": 215943.0, "9BG148FK0NC453874": 215943.0, "9BG148FK0NC453886": 215943.0, "9BG148FK0NC453901": 215943.0, "9BG148FK0NC453923": 215943.0, "9BG148FK0NC453932": 215943.0, "9BG148FK0NC453962": 215943.0, "9BG148FK0NC453995": 215943.0, "9BG148FK0NC454001": 215943.0, "9BG148FK0NC454005": 215943.0, "9BG148FK0NC454007": 215943.0, "9BG148FK0NC454011": 215943.0, "9BG148FK0NC453953": 215943.0, "8AGBB69S0NR116913": 114700.0, "8AGBB69S0NR113146": 114700.0, "8AGBB69S0NR116925": 114700.0, "8AGBB69S0NR116928": 114700.0, "8AGBB69S0NR117136": 114700.0, "9BGTW69W05B206024": 46450.0, "9BGTW69W05B236268": 46450.0, "9BGTW69W05B242537": 46450.0, "93XSYKL1TSCR90417": 239116.65, "93XSYKL1TSCR90821": 239116.65, "93XSYKL1TSCR91536": 239116.65, "93XSYKL1TSCR90870": 239116.65, "9BRKC3F39S8349254": 129459.36, "3N1AB8AE1TY200504": 168082.82, "3N1AB8AEXTY200601": 165151.14, "93XSYKL1TSCS93152": 283884.09, "93XSYKL1TSCS93180": 283884.09, "93XSYKL1TSCS93181": 283884.09, "93XSYKL1TSCS93182": 283884.09, "93XSYKL1TSCS93184": 283884.09, "93XSYKL1TSCS93185": 283884.09, "93XSYKL1TSCS93186": 283884.09, "93XSYKL1TSCS93187": 283884.09, "93XSYKL1TSCS93190": 283884.09, "93XSYKL1TSCS93192": 283884.09, "93XSYKL1TSCS93193": 283884.09, "93XSYKL1TSCS93194": 283884.09, "93XSYKL1TSCS93197": 283884.09, "3N1AB8AE8SY258012": 168082.82, "93XSYKL1TSCS93112": 283968.84, "93XSYKL1TSCS93150": 283968.84, "93XSYKL1TSCS93151": 283968.84, "93XSYKL1TSCS93153": 283968.84, "93XSYKL1TSCS93178": 283968.84, "93XSYKL1TSCS93179": 283968.84, "93XSYKL1TSCS93183": 283968.84, "93XSYKL1TSCS93188": 283968.84, "93XSYKL1TSCS93189": 283968.84, "93XSYKL1TSCS93191": 283968.84, "93XSYKL1TSCS93195": 283968.84, "93XSYKL1TSCS93196": 283968.84, "93XSYKL1TSCR90543": 228256.0, "93XSYKL1TSCR90395": 228256.0, "9321FHMJ7DD655480": 53449.0, "9321FHMJ9DD658719": 53449.0, "93XSYKL1TSCR90594": 270774.0, "93XSYKL1TSCR90612": 270774.0, "8AP359AFTSU408028": 115435.99, "8AP359AFTSU426395": 115435.99, "8AP359AFTSU426722": 115435.99, "8AP359AFTSU427223": 115435.99, "8AP359AFTSU431085": 115435.99, "8AP359AFTSU431697": 115435.99, "8AP359AFTSU431759": 115435.99, "8AP359AFTSU415135": 115435.99, "8AP359AFTSU424820": 115435.99, "8AP359AFTSU425973": 115435.99, "8AP359AFTSU426900": 115435.99, "9BRBC3F33R8297601": 127600.0, "9BRBC3F34R8297073": 127600.0, "9BRBC3F33R8294195": 127600.0, "9BRBC3F33R8272990": 127600.0, "9BRBC3F35R8273316": 127600.0, "9BRBC3F34R8271136": 127600.0, "9BRBC3F39R8271150": 127600.0, "93XTYKL1TSCR80884": 313406.0, "93XTYKL1TSCR80887": 313406.0, "93XTYKL1TSCR80890": 313406.0, "93XTYKL1TSCR80895": 313406.0, "93XTYKL1TSCR80898": 313406.0, "93XTYKL1TSCR80901": 313406.0, "93XTYKL1TSCR80904": 313406.0, "93XTYKL1TSCR80907": 313406.0, "93XTYKL1TSCR80910": 313406.0, "93XPYKL1TSCR79711": 313402.0, "93XPYKL1TSCR79718": 313402.0, "93XTYKL1TSCR79617": 313406.0, "93XTYKL1TSCR79620": 313406.0, "9BRBC3F37R8272281": 127600.0, "9BRBC3F39R8272637": 127600.0, "9BRBC3F30R8271618": 127600.0, "9BRBC3F32R8270129": 127600.0, "9BRBC3F36R8273275": 127600.0, "9BRBC3F38R8270233": 127600.0, "93XTYKL1TSCR79610": 313406.0, "93XTYKL1TSCR79612": 313406.0, "93XTYKL1TSCR79615": 313406.0, "9BRBC3F30R8269982": 127600.0, "9BRBC3F31R8270266": 127600.0, "9BRBC3F32R8269336": 127600.0, "9BRBC3F33R8269815": 127600.0, "9BRBC3F37R8268036": 127600.0, "9BRBC3F37R8268148": 127600.0, "9BRBC3F37R8268196": 127600.0, "9BRBC3F37R8268344": 127600.0, "9BRBC3F3XR8268385": 127600.0, "9BRBC3F35R8268116": 127600.0, "9BRBC3F35R8269296": 127600.0, "9BRBC3F35R8269704": 127600.0, "9BRBC3F36R8267931": 127600.0, "93XTYKL1TRCP77419": 313406.0, "93XTYKL1TRCP77437": 313406.0, "93XTYKL1TRCP77556": 313406.0, "93XTYKL1TRCP77760": 313406.0, "93XTYKL1TRCP78047": 313406.0, "93XTYKL1TRCP78050": 313406.0, "9BRBC3F34R8268690": 127600.0, "9BRBC3F39R8269950": 127600.0, "9BRBC3F3XR8268418": 127600.0, "9BRBC3F31R8268372": 127600.0, "9BRBC3F37R8268716": 127600.0, "9BRBC3F34R8267779": 127600.0, "9BRBC3F34R8269872": 127600.0, "9BRBC3F36R8269601": 127600.0, "9BRBC3F39R8270192": 127600.0, "8AFAR23L0JJ034567": 145584.0, "8AFAR23L1JJ065729": 145584.0, "8AFAR23L9JJ039430": 145584.0, "8AFAR23L9JJ064893": 145584.0, "93XDLLC2TVCT14130": 267355.91, "93YF62S07TJ449014": 344772.73, "93XDLLC2TVCT13253": 283968.84, "9BM951104TB435180": 466527.28, "9BM951104TB443026": 466527.28, "9BM951104TB443029": 466527.28, "9BM951104TB434375": 466527.28, "9BM951104TB444294": 466527.28, "9BM951104TB442155": 466527.28, "91JPWC601S1000710": 9798.0, "9535E6TB6TR025908": 1420000.0, "91JPWC601S1000704": 9798.0, "91JPWC601S1000705": 9798.0, "91JPWC601S1000706": 9798.0, "9BG156FK0TC404910": 305861.89, "9BG156FK0TC404913": 305861.89, "9BG156FK0TC404915": 305861.89, "9BRKC3F31S8349393": 129459.36, "93XSYKL1TSCR90405": 270774.0, "93XSYKL1TSCR90410": 270774.0, "93XSYKL1TSCR90415": 270774.0, "8AP359AFTSU432167": 115435.99, "8AP359AFTSU436019": 115435.99, "8AP359AFTSU436517": 115435.99, "8AP359AFTSU436545": 115435.99, "8AP359AFTSU436585": 115435.99, "8AP359AFTSU436609": 115435.99, "8AP359AFTSU436029": 115435.99, "93XSYKL1TSCR91180": 251671.0, "93XSYKL1TSCR91207": 251671.0, "9BRBC3F30S8316790": 127400.0, "93XPYKL1TSCR79766": 313402.0, "9BRBC3F32R8267456": 127600.0, "9BRBC3F33R8268003": 127600.0, "9BRBC3F34R8268365": 127600.0, "9BRBC3F36R8268450": 127600.0, "9BRBC3F37R8268618": 127600.0, "9BRBC3F39R8268684": 127600.0, "9BRBC3F3XR8271450": 127600.0, "93Y5SRJSXPJ312377": 92150.0, "9BG148FK0NC448656": 183600.0, "9BG148FK0NC449428": 196950.0, "9BG148FK0NC452589": 196950.0, "9BG148FK0NC452593": 196950.0, "9BG148FK0NC452596": 196950.0, "9BG148FK0NC452599": 196950.0, "93XSYKL1TSCS93272": 283884.09, "93XSYKL1TSCS93271": 283884.09, "93XSYKL1TSCS93269": 283884.09, "93XSYKL1TSCS93270": 283884.09, "93XSYKL1TSCR91246": 239060.36, "93XSYKL1TSCR91362": 239060.36, "93XSYKL1TSCR91120": 239060.36, "93XSYKL1TSCR91092": 239060.36, "93XSYKL1TSCR90788": 239060.36, "93XSYKL1TSCR90893": 239060.36, "9BRKC3F30S8357159": 129459.36, "9BRKC3F31S8350270": 129459.36, "9BRKC3F31S8356862": 129459.36, "9BRKC3F31S8357123": 129459.36, "9BRKC3F32S8349757": 129459.36, "9BRKC3F32S8350679": 129459.36, "9BRKC3F33S8356958": 129459.36, "9BRKC3F33S8357155": 129459.36, "9BRKC3F33S8357298": 129459.36, "9BRKC3F34S8350196": 129459.36, "9BRKC3F34S8357102": 129459.36, "9BRKC3F34S8357388": 129459.36, "9BRKC3F35S8350398": 129459.36, "9BRKC3F35S8356833": 129459.36, "9BRKC3F35S8357352": 129459.36, "9BRKC3F36S8357067": 129459.36, "9BRKC3F37S8356848": 129459.36, "9BRKC3F37S8356932": 129459.36, "9BRKC3F37S8356980": 129459.36, "9BRKC3F37S8357014": 129459.36, "9BRKC3F37S8357207": 129459.36, "9BRKC3F38S8357233": 129459.36, "9BRKC3F3XS8349408": 129459.36, "9BRKC3F3XS8350297": 129459.36, "93XSYKL1TSCR86128": 303826.0, "93XSYKL1TSCR86129": 303826.0, "93XSYKL1TSCR86130": 303826.0, "93XSYKL1TSCS93140": 283968.84, "93XSYKL1TSCS93144": 283968.84, "93XSYKL1TSCS93145": 283968.84, "93XSYKL1TSCS93146": 283968.84, "93XSYKL1TSCS93147": 283968.84, "93XSYKL1TSCS93124": 263934.95, "93XSYKL1TSCS93125": 263934.95, "3N1AB8AE9TY200704": 172000.0, "3N1AB8AEXTY200730": 172000.0, "3N1AB8AE5TY200358": 163800.0, "93XSYKL1TSCS92433": 270774.0, "93XSYKL1TSCS92435": 270774.0, "93XSYKL1TSCS92436": 270774.0, "93XSYKL1TSCS92437": 270774.0, "93XSYKL1TSCS92438": 270774.0, "93XSYKL1TSCS92439": 270774.0, "93XSYKL1TSCS92440": 270774.0, "93XSYKL1TSCS92441": 270774.0, "93XSYKL1TSCS92442": 270774.0, "93XSYKL1TSCS92443": 270774.0, "93XSYKL1TSCS92444": 270774.0, "93XSYKL1TSCS92445": 270774.0, "93XSYKL1TSCS92446": 270774.0, "93XSYKL1TSCS92447": 270774.0, "93XSYKL1TSCS92448": 270774.0, "93XSYKL1TSCS92449": 270774.0, "93XSYKL1TSCS92450": 270774.0, "9BRKC3F30S8342600": 129459.36, "9BRKC3F32S8342503": 129459.36, "9BRKC3F33S8342736": 129459.36, "9BRKC3F35S8342446": 129459.36, "9BRKC3F36S8330158": 129459.36, "9BRKC3F36S8330435": 129459.36, "9BRKC3F38S8342571": 129459.36, "9BRKC3F38S8342697": 129459.36, "9BRKC3F39S8330798": 129459.36, "9BRKC3F39S8331398": 129459.36, "9BRKC3F39S8342529": 129459.36, "9BRKC3F38S8345003": 129459.36, "8AP359AFTSU432153": 115435.99, "8AP359AFTSU432159": 115435.99, "8AP359AFTSU433387": 115435.99, "8AP359AFTSU433573": 115435.99, "8AP359AFTSU435212": 115435.99, "8AP359AFTSU435584": 115435.99, "8AP359AFTSU425342": 115435.99, "9BG156FK0SC417107": 291649.77, "93XSYKL1TSCR88472": 228255.95, "9BG156FK0SC406941": 348600.0, "9BG156FK0SC406948": 348600.0, "9BG156FK0SC407085": 348600.0, "9BG156FK0SC407088": 348600.0, "9BG156FK0SC407136": 348600.0, "9BG156FK0SC407230": 348600.0, "9BG156FK0SC407234": 348600.0, "9BG156FK0SC407376": 348600.0, "9BG156FK0SC407379": 348600.0, "9BG156FK0SC407899": 348600.0, "9BG156FK0SC407915": 348600.0, "9BG156FK0SC408011": 348600.0, "9BG156FK0SC408064": 348600.0, "9BG156FK0SC408083": 348600.0, "9BG156FK0SC408174": 348600.0, "9BG156FK0SC408230": 348600.0, "9BG156FK0SC408252": 348600.0, "9BG156FK0SC408395": 348600.0, "9BG156FK0SC408417": 348600.0, "9BG156FK0SC408587": 348600.0, "9BG156FK0SC408716": 348600.0, "9BG156FK0SC408862": 348600.0, "9BG156FK0SC408864": 348600.0, "9BG156FK0SC408962": 348600.0, "9BG156FK0SC409119": 348600.0, "9BG156FK0SC411886": 348600.0, "9BG156FK0SC412183": 348600.0, "9BG156FK0SC412232": 348600.0, "9BG156FK0SC412325": 348600.0, "9BG156FK0SC412335": 348600.0, "9BG156FK0SC407426": 348600.0, "9BG156FK0SC421665": 348600.0, "93XSYKL1TSCR85352": 228255.95, "9BRBC3F3XS8309569": 127400.0, "9BRBC3F32R8277503": 127600.0, "9BRBC3F34R8276269": 127600.0, "9BRBC3F37R8273303": 127600.0, "9BRBC3F39R8270791": 127600.0, "9BG156FK0RC430284": 348600.0, "8AP359AFXRU351586": 115435.99, "8AP359AFXRU354568": 115435.99, "8AP359AFXRU359767": 115435.99, "8AP359AFXRU357920": 115435.99, "8AP359AFXRU357935": 115435.99, "8AP359AFXRU357952": 115435.99, "8AP359AFXRU360377": 115435.99, "93XTYKL1TSCR81436": 313406.0, "93XSYKL1TSCR80550": 310926.0, "93XSYKL1TSCR80574": 310926.0, "93XPYKL1TSCR79752": 313402.0, "9BRBC3F33R8295640": 127400.0, "9BRBC3F33R8272889": 127600.0, "9BRBC3F35R8270853": 127600.0, "9BRBC3F3XR8271416": 127600.0, "9BRBC3F3XR8271867": 127600.0, "93XSYKL1TSCR80558": 310926.0, "9BRBC3F30R8269917": 127600.0, "9BRBC3F36R8270697": 127600.0, "93XTYKL1TSCR79420": 313406.0, "93XTYKL1TSCR79422": 313406.0, "93XPYKL1TSCR79748": 313402.0, "8AP359AFXRU360362": 115435.99, "8AP359AFXRU358001": 115435.99, "93XTYKL1TRCP77413": 313406.0, "93XTYKL1TRCP77535": 313406.0, "93XTYKL1TRCP77656": 313406.0, "93XTYKL1TRCP77730": 313406.0, "93XTYKL1TRCP77764": 313406.0, "93XTYKL1TRCP78040": 313406.0, "9BRBC3F31R8267643": 127600.0, "9BRBC3F35R8268987": 127600.0, "9BRBC3F3XR8269679": 127600.0, "93XTYKL1TRCP77857": 313406.0, "93XTYKL1TRCP77927": 313406.0, "9BRBC3F33R8268325": 127600.0, "9BRBC3F36R8267864": 127600.0, "9BRBC3F38R8269020": 127600.0, "9BRBC3F36R8268299": 127600.0, "9BRBC3F38R8267798": 127600.0, "9BRBC3F38R8269633": 127600.0, "9BRBC3F33R8255168": 127400.0, "9BRBC3F34R8255180": 127400.0, "9BRBC3F35R8254913": 127400.0, "9BRBC3F37R8259644": 127400.0, "9BRBC3F39R8264148": 127400.0, "9BRBC3F3XR8255071": 127400.0, "9BRBC3F3XR8259184": 127400.0, "93Y5SRJSXPJ312376": 92150.0, "93XDLLC2TVCT13681": 267355.91, "93XDLLC2TVCT13714": 267355.91, "93XDLLC2TVCT13728": 267355.91, "93XDLLC2TVCT14512": 267355.91, "93XDLLC2TVCT13686": 267355.91, "93XDLLC2TVCT13689": 267355.91, "93XDLLC2TVCT13700": 267355.91, "93XDLLC2TVCT13709": 267355.91, "93XDLLC2TVCT13737": 267355.91, "93XDLLC2TVCT14506": 267355.91, "93XDLLC2TVCT14509": 267355.91, "93XDLLC2TVCT14515": 267355.91, "93XDLLC2TVCT14518": 267355.91, "93XDLLC2TTCS06212": 267355.91, "9535E6TB7TR031720": 1420000.0, "9535E6TB1TR034807": 1420000.0, "8AFAR23L8JJ039418": 145584.0, "8AFAR23L8JJ042478": 145584.0, "9BRKC3F39S8349397": 129459.36, "9535E6TB0TR025595": 1420000.0, "93XSYKL1TSCR90442": 239116.65, "93XSYKL1TSCS93141": 283884.09, "3N1AB8AE6TY201017": 168082.82, "3N1AB8AE6TY201065": 168082.82, "3N1AB8AE0TY200428": 168082.82, "3N1AB8AE1TY200499": 168082.82, "93XSYKL1TSCR90701": 270774.0, "93XSYKL1TSCR90709": 270774.0, "93XSYKL1TSCR90716": 270774.0, "93XSYKL1TSCR90728": 270774.0, "93XSYKL1TSCR90744": 270774.0, "8AP359AFTSU416844": 115435.99, "8AP359AFTSU421629": 115435.99, "8AP359AFTSU421885": 115435.99, "8AP359AFTSU422280": 115435.99, "8AP359AFTSU422347": 115435.99, "8AP359AFTSU422561": 115435.99, "8AP359AFTSU422908": 115435.99, "8AP359AFTSU414074": 115435.99, "8AP359AFTSU424717": 115435.99, "8AP359AFWRU373534": 115435.99, "8AP359AFWRU373543": 115435.99, "9321FHMJ2DD653149": 53449.0, "9321FHMJ9DD653147": 53449.0, "9BRBC3F37S8316611": 127400.0, "9BRBC3F39S8316531": 127400.0, "93XSYKL1TSCR80031": 310926.0, "93XSYKL1TSCR80033": 310926.0, "93XSYKL1TSCR80036": 310926.0, "93XTYKL1TSCR79924": 313406.0, "93XTYKL1TSCR79944": 313406.0, "93XTYKL1TSCR79681": 313406.0, "8AP359AFXRU344742": 115435.99, "8AP359AFXRU350940": 115435.99, "8AP359AFXRU350961": 115435.99, "8AP359AFXRU351598": 115435.99, "8AP359AFXRU344075": 115435.99, "8AP359AFXRU344087": 115435.99, "9BRBC3F30R8271084": 127600.0, "9BG148FK0NC453855": 215943.0, "9BRBC3F33R8267563": 127600.0, "9BRBC3F34R8267765": 127600.0, "9BRBC3F35R8270173": 127600.0, "9BM951104NB280224": 413195.0, "9BRBC3F31R8269764": 127600.0, "9BRBC3F32R8268378": 127600.0, "9BRBC3F33R8267692": 127600.0, "9BRBC3F36R8269646": 127600.0, "9BRBC3F38R8268952": 127600.0, "9BRBC3F39R8268703": 127600.0, "93XTYKL1TRCP77604": 313406.0, "93XTYKL1TRCP77769": 313406.0, "93XTYKL1TRCP77806": 313406.0, "93XTYKL1TRCP77909": 313406.0, "93XTYKL1TRCP77932": 313406.0, "9BRBC3F30R8268279": 127600.0, "9BRBC3F31R8267786": 127600.0, "9BRBC3F31R8269263": 127600.0, "9BRBC3F31R8270168": 127600.0, "9BRBC3F32R8270213": 127600.0, "9BRBC3F33R8268017": 127600.0, "9BRBC3F33R8268406": 127600.0, "9BRBC3F34R8269323": 127600.0, "9BRBC3F37R8269851": 127600.0, "9BRBC3F38R8269227": 127600.0, "9BRBC3F39R8268913": 127600.0, "9BRBC3F3XR8269911": 127600.0, "9BRBC3F3XR8269956": 127600.0, "8AGBB69S0NR117001": 114700.0, "9BG156FK0TC430320": 289017.0, "9BG156FK0TC429755": 289017.0, "93XDLLC2TTCS11415": 318226.54, "8BCND5GVUKG523062": 77100.0, "8BCND5GVUKG523254": 77100.0, "8BCND5GVUKG523836": 77100.0, "8BCND5GVUKG523501": 77100.0, "8BCND5GVULG501826": 77100.0, "3N1AB8AEXTY200615": 172000.0, "3N1AB8AE0TY201174": 168082.82, "3N1AB8AE1TY201247": 168082.82, "3N1AB8AEXTY201246": 168082.82, "3N1AB8AE0SY258926": 168082.82, "93XSYKL1TSCS93130": 263934.95, "93XSYKL1TSCR90640": 270774.0, "93XSYKL1TSCR91172": 251671.0, "9BRBC3F31S8326213": 127600.0, "9BRBC3F37S8351990": 127600.0, "9BRBC3F38S8325589": 127600.0, "9BRBC3F38S8325866": 127600.0, "9BRBC3F38S8352114": 127600.0, "9BRBC3F38S8352162": 127600.0, "9BRBC3F3XS8352034": 127600.0, "8AP359AFWRU371727": 115435.99, "8AP359AFWRU373369": 115435.99, "8AP359AFWRU373494": 115435.99, "8AP359AFWRU373525": 115435.99, "8AP359AFWRU371760": 115435.99, "8AP359AFTSU412053": 115435.99, "8AP359AFTSU414062": 115435.99, "8AP359AFTSU414113": 115435.99, "8AP359AFTSU417897": 115435.99, "8AP359AFTSU418645": 115435.99, "8AP359AFTSU418740": 115435.99, "8AP359AFTSU423153": 115435.99, "93XSYKL1TSCR87005": 270774.0, "93XSYKL1TSCR87015": 270774.0, "93XSYKL1TSCR87018": 270774.0, "93XSYKL1TSCR87027": 270774.0, "93XSYKL1TSCR87035": 270774.0, "93XSYKL1TSCR87045": 270774.0, "93XSYKL1TSCR87054": 270774.0, "93XSYKL1TSCR87066": 270774.0, "93XSYKL1TSCR87069": 270774.0, "93XSYKL1TSCR87080": 270774.0, "93XSYKL1TSCR87091": 270774.0, "93XSYKL1TSCR87099": 270774.0, "93XSYKL1TSCR87109": 270774.0, "93XSYKL1TSCR87115": 270774.0, "93XSYKL1TSCR87123": 270774.0, "93XSYKL1TSCR87134": 270774.0, "93XSYKL1TSCR87144": 270774.0, "93XSYKL1TSCR87150": 270774.0, "93XSYKL1TSCR87160": 270774.0, "93XSYKL1TSCR87185": 270774.0, "93XSYKL1TSCR88540": 228255.95, "9BRBC3F31S8326504": 127600.0, "9BRBC3F34R8298420": 127600.0, "93XSYKL1TSCR85856": 228255.95, "93XSYKL1TSCR85842": 228255.95, "9BRBC3F36R8296491": 127600.0, "9BRBC3F39R8298459": 127600.0, "9BRBC3F31R8299010": 127600.0, "93XTYKL1TSCR80913": 313406.0, "93XTYKL1TSCR80919": 313406.0, "93XTYKL1TSCR80927": 313406.0, "93XTYKL1TSCR80948": 313406.0, "93XTYKL1TSCR80954": 313406.0, "93XTYKL1TSCR81071": 313406.0, "93XTYKL1TSCR81074": 313406.0, "93XPYKL1TSCR79631": 313402.0, "93XPYKL1TSCR79722": 313402.0, "93XTYKL1TSCR79657": 313406.0, "93XTYKL1TSCR79655": 313406.0, "9BRBC3F33R8267711": 127600.0, "9BRBC3F36R8268030": 127600.0, "93XTYKL1TRCP77490": 313406.0, "93XTYKL1TRCP77600": 313406.0, "9BRBC3F33R8268972": 127600.0, "9BRBC3F33R8269085": 127600.0, "9BRBC3F36R8267752": 127600.0, "9BRBC3F3XR8269567": 127600.0, "9BRBC3F30R8269612": 127600.0, "9BRBC3F30R8270209": 127600.0, "9BRBC3F33R8269877": 127600.0, "9BRBC3F36R8269890": 127600.0, "9BRBC3F32R8269787": 127600.0, "9BRBC3F35R8268598": 127600.0, "9BRBC3F35R8268844": 127600.0, "9BRBC3F39R8269625": 127600.0, "9BRBC3F3XR8267740": 127600.0, "9BRBC3F34R8267684": 127600.0, "9BRBC3F35R8269363": 127600.0, "9BRBC3F32R8269188": 127600.0, "9BRBC3F33R8267658": 127600.0, "9BRBC3F33R8269779": 127600.0, "9BRBC3F30R8271604": 127600.0, "9BRBC3F34R8267412": 127600.0, "9BRBC3F37R8268070": 127600.0, "9BRBC3F38R8268837": 127600.0, "9BRBC3F39R8268992": 127600.0, "9BRBC3F3XR8269214": 127600.0, "9BM951104NB295561": 413195.0, "93XTYKL1TRCP77404": 313406.0, "93XTYKL1TRCP77407": 313406.0, "93XTYKL1TRCP77519": 313406.0, "93XTYKL1TRCP77543": 313406.0, "93XTYKL1TRCP77565": 313406.0, "93XTYKL1TRCP77574": 313406.0, "93XTYKL1TRCP77606": 313406.0, "93XTYKL1TRCP77619": 313406.0, "93XTYKL1TRCP77643": 313406.0, "93XTYKL1TRCP77654": 313406.0, "93XTYKL1TRCP77704": 313406.0, "93XTYKL1TRCP77717": 313406.0, "93XTYKL1TRCP77732": 313406.0, "93XTYKL1TRCP77782": 313406.0, "93Y5SRJSXPJ312331": 92150.0, "93Y5SRJSXPJ312292": 92150.0, "93Y5SRJSXPJ312380": 92150.0, "93Y5SRJSXPJ312430": 92150.0, "93Y5SRJSXPJ312285": 92150.0, "93Y5SRJSXPJ312290": 92150.0, "93Y5SRJSXPJ312330": 92150.0, "93Y5SRJSXPJ312379": 92150.0, "93Y5SRJSXPJ312390": 92150.0, "93Y5SRJSXPJ312431": 92150.0, "8AGBB69S0NR116936": 114700.0, "8AGBB69S0NR116937": 114700.0, "8AGBB69S0NR116945": 114700.0, "8AGBB69S0NR117009": 114700.0, "93Y5SRJSXPJ312378": 92150.0, "93Y5SRJSXPJ312381": 92150.0, "93XDLLC2TVCT13217": 239116.65, "93XDLLC2TVCT14774": 267355.91, "93XDLLC2TVCT14776": 267355.91, "93XDLLC2TVCT14778": 267355.91, "93XDLLC2TVCT14780": 267355.91, "93XDLLC2TVCT14782": 267355.91, "93XDLLC2TVCT14784": 267355.91, "93XDLLC2TVCT14786": 267355.91, "93XDLLC2TVCT14788": 267355.91, "93XDLLC2TVCT14790": 267355.91, "93XDLLC2TVCT14792": 267355.91, "93XDLLC2TVCT14794": 267355.91, "93XDLLC2TVCT14796": 267355.91, "93XDLLC2TVCT14807": 267355.91, "93XDLLC2TVCT14809": 267355.91, "9535E6TB4VR001612": 1420000.0, "93XSYKL1TSCS93025": 318226.54, "93XDLLC2TVCT12903": 283968.84, "93XSYKL1TSCS93019": 318226.54, "93XSYKL1TSCS93014": 318226.54, "93XSYKL1TSCS93015": 318226.54, "93XSYKL1TSCS93016": 318226.54, "93XSYKL1TSCS93017": 318226.54, "93XSYKL1TSCS93018": 318226.54, "93XSYKL1TSCS93020": 318226.54, "93XSYKL1TSCS93021": 318226.54, "93XSYKL1TSCS93022": 318226.54, "93XSYKL1TSCS93023": 318226.54, "93XSYKL1TSCS93024": 318226.54, "93XSYKL1TSCS93026": 318226.54, "93XSYKL1TSCS93027": 318226.54, "9535E6TB8TR031757": 1420000.0, "93XSYKL1TSCR90805": 239060.36, "93XSYKL1TSCR90853": 267355.91, "3N1AB8AE9TY200573": 172000.0, "9BG156FK0TC404911": 305861.89, "3N1AB8AE2TY200804": 168082.82, "3N1AB8AE5TY201168": 168082.82, "3N1AB8AE9TY201139": 168082.82, "3N1AB8AEXTY201005": 168082.82, "3N1AB8AE2TY200429": 168082.82, "9BG156FK0TC405138": 305861.89, "3N1AB8AE4TY200352": 168082.82, "3N1AB8AE6TY200370": 168082.82, "9535E6TB6TR025567": 1420000.0, "93XSYKL1TSCR88527": 244900.0, "9BRKC3F32S8349354": 129459.36, "93XSYKL1TSCS92431": 270774.0, "93XSYKL1TSCS92432": 270774.0, "8AP359AFWRU380520": 115435.99, "8AP359AFWRU373516": 115435.99, "8AP359AFTSU403698": 115435.99, "8AP359AFTSU421642": 115435.99, "8AP359AFTSU411639": 115435.99, "8AP359AFTSU416288": 115435.99, "8AP359AFWRU373880": 115435.99, "8AP359AFTSU414188": 115435.99, "8AP359AFTSU416918": 115435.99, "8AP359AFTSU416920": 115435.99, "8AP359AFTSU417027": 115435.99, "8AP359AFTSU417207": 115435.99, "8AP359AFTSU428865": 115435.99, "8AP359AFTSU430212": 115435.99, "8AP359AFTSU431714": 115435.99, "8AP359AFTSU432870": 115435.99, "8AP359AFTSU433312": 115435.99, "8AP359AFTSU401992": 115435.99, "8AP359AFTSU402004": 115435.99, "8AP359AFTSU408072": 115435.99, "8AP359AFTSU409174": 115435.99, "8AP359AFTSU410351": 115435.99, "8AP359AFTSU411563": 115435.99, "8AP359AFTSU411595": 115435.99, "8AP359AFTSU413784": 115435.99, "8AP359AFTSU416265": 115435.99, "8AP359AFTSU416290": 115435.99, "8AP359AFWRU370637": 115435.99, "8AP359AFWRU378191": 115435.99, "9BRBC3F34S8314699": 127400.0, "9BRBC3F31S8309959": 127400.0, "9BRBC3F32S8314796": 127400.0, "9BRBC3F39R8297344": 127400.0, "93XSYKL1TSCR85874": 228255.95, "93XSYKL1TSCR85891": 228255.95, "9BRBC3F32S8315026": 127400.0, "9BRBC3F33S8310031": 127400.0, "9BRBC3F37S8314793": 127400.0, "9BRBC3F37S8314874": 127400.0, "9BRBC3F38S8314849": 127400.0, "9BRBC3F39R8297070": 127400.0, "9BRBC3F39S8314990": 127400.0, "9BRBC3F3XR8291407": 127400.0, "9BRBC3F35S8308555": 127400.0, "9BRBC3F35S8309575": 127400.0, "9BRBC3F38S8309893": 127400.0, "9BRBC3F3XS8309958": 127400.0, "9BRBC3F30R8267424": 127400.0, "9BRBC3F30R8278309": 127400.0, "9BRBC3F31R8270509": 127400.0, "9BRBC3F31R8276813": 127400.0, "9BRBC3F31R8276925": 127400.0, "9BRBC3F34R8294724": 127400.0, "9BRBC3F35R8294358": 127400.0, "9BRBC3F38R8268143": 127600.0, "9BRBC3F39R8272931": 127600.0, "8AP359AFXRU360393": 115435.99, "8AP359AFXRU360639": 115435.99, "93XSYKL1TSCR80019": 310926.0, "93XSYKL1TSCR80022": 310926.0, "93XSYKL1TSCR80024": 310926.0, "93XSYKL1TSCR80027": 310926.0, "93XSYKL1TSCR80029": 310926.0, "93XTYKL1TSCR79932": 313406.0, "93XTYKL1TSCR79935": 313406.0, "93XTYKL1TSCR79490": 313406.0, "93XTYKL1TSCR79516": 313406.0, "93XTYKL1TSCR79522": 313406.0, "8AP359AFXRU357869": 115435.99, "8AP359AFXRU357872": 115435.99, "8AP359AFXRU359955": 115435.99, "93XTYKL1TRCP77476": 313406.0, "93XTYKL1TRCP77799": 313406.0, "93XTYKL1TRCP77832": 313406.0, "93XTYKL1TRCP77935": 313406.0, "9BRBC3F32R8268946": 127600.0, "9BRBC3F36R8267671": 127600.0, "9BRBC3F3XR8267494": 127600.0, "93XTYKL1TRCP77410": 313406.0, "93XTYKL1TRCP77480": 313406.0, "93XTYKL1TRCP77984": 313406.0, "93XTYKL1TRCP77985": 313406.0, "9BRBC3F32R8271734": 127600.0, "9BRBC3F38R8268871": 127600.0, "9BRBC3F32R8272043": 127600.0, "9BRBC3F35R8267502": 127600.0, "9BRBC3F35R8267824": 127600.0, "9BRBC3F35R8268763": 127600.0, "9BRBC3F35R8271145": 127600.0, "9BRBC3F36R8271753": 127600.0, "9BRBC3F38R8272029": 127600.0, "9BRBC3F3XR8269309": 127600.0, "9BRBC3F32R8268090": 127600.0, "9BRBC3F33R8268678": 127600.0, "9BRBC3F36R8268643": 127600.0, "9BRBC3F38R8267476": 127600.0, "93XDLLC2TVCT12862": 283968.84, "93XDLLC2TVCT12854": 283968.84, "93XDLLC2TVCT12899": 283968.84, "93XDLLC2TVCT12846": 283968.84, "93XDLLC2TVCT12838": 283968.84, "93XDLLC2TVCT16549": 283968.84, "93XDLLC2TVCT16553": 283968.84, "93XDLLC2TVCT16557": 283968.84, "93XDLLC2TVCT16634": 283968.84, "93XDLLC2TVCT16643": 283968.84, "93XDLLC2TVCT16758": 283968.84, "93XDLLC2TVCT16764": 283968.84, "93XDLLC2TVCT16767": 283968.84, "93XDLLC2TVCT16773": 283968.84, "93XDLLC2TVCT16776": 283968.84, "93XDLLC2TVCT16778": 283968.84, "93XDLLC2TVCT16805": 283968.84, "93XDLLC2TVCT16807": 283968.84, "93XDLLC2TVCT16809": 283968.84, "93XDLLC2TVCT16811": 283968.84, "93XDLLC2TVCT16813": 283968.84, "93XDLLC2TVCT16815": 283968.84, "93XDLLC2TVCT16817": 283968.84, "93XDLLC2TVCT16819": 283968.84, "93XDLLC2TVCT16882": 283968.84, "93XDLLC2TVCT16890": 283968.84, "93XDLLC2TVCT16914": 283968.84, "93XDLLC2TVCT16561": 283968.84, "93XDLLC2TVCT16638": 283968.84, "93XDLLC2TVCT16649": 283968.84, "93XDLLC2TVCT16700": 283968.84, "93XDLLC2TVCT16761": 283968.84, "93XDLLC2TVCT16770": 283968.84, "93XDLLC2TVCT16878": 283968.84, "93XDLLC2TVCT16880": 283968.84, "93XDLLC2TVCT16886": 283968.84, "93XDLLC2TVCT16888": 283968.84, "93XDLLC2TVCT16912": 283968.84, "93XDLLC2TVCT16916": 283968.84, "93XDLLC2TVCT16918": 283968.84, "93XDLLC2TVCT16920": 283968.84, "93XDLLC2TVCT16922": 283968.84, "93XDLLC2TVCT16924": 283968.84, "93XDLLC2TVCT16926": 283968.84, "93XDLLC2TVCT16969": 283968.84, "93XDLLC2TVCT16971": 283968.84, "93XDLLC2TVCT17030": 283968.84, "93XDLLC2TVCT17032": 283968.84, "93XDLLC2TVCT17066": 283968.84, "93XDLLC2TVCT17070": 283968.84, "9535E6TB7VR001409": 1420000.0, "93XDLLC2TVCT14611": 267355.91, "93XDLLC2TVCT14615": 267355.91, "93XDLLC2TVCT14632": 267355.91, "93XDLLC2TVCT14634": 267355.91, "93XDLLC2TVCT14636": 267355.91, "93XDLLC2TVCT14638": 267355.91, "93XDLLC2TVCT14640": 267355.91, "93XDLLC2TVCT14642": 267355.91, "93XDLLC2TVCT14644": 267355.91, "93XDLLC2TVCT14646": 267355.91, "93XDLLC2TVCT14648": 267355.91, "93XDLLC2TVCT14650": 267355.91, "93XDLLC2TVCT14652": 267355.91, "93XDLLC2TVCT14703": 267355.91, "93XDLLC2TVCT14654": 267355.91, "93XSYKL1TSCR89018": 239060.36, "93XSYKL1TSCR89042": 239060.36, "93XSYKL1TSCR89619": 239060.36, "93XSYKL1TSCR91131": 239060.36, "93XSYKL1TSCR91331": 239060.36, "93XSYKL1TSCR91422": 239060.36, "3N1AB8AE8SY259967": 168082.82, "3N1AB8AE3TY200505": 168082.82, "8AP359AFWRU370626": 115435.99, "8AP359AFWRU372988": 115435.99, "8AP359AFWRU373585": 115435.99, "8AP359AFWRU373799": 115435.99, "8AP359AFWRU376990": 115435.99, "8AP359AFWRU378566": 115435.99, "8AP359AFTSU426911": 115435.99, "8AP359AFTSU431692": 115435.99, "8AP359AFTSU433314": 115435.99, "8AP359AFWRU372750": 115435.99, "8AP359AFWRU390024": 115435.99, "93XSYKL1TSCR90790": 270774.0, "93XSYKL1TSCR90801": 270774.0, "93XSYKL1TSCR90807": 270774.0, "93XSYKL1TSCR90813": 270774.0, "8AP359AFTSU418744": 115435.99, "93XSYKL1TSCR91144": 263934.95, "93XSYKL1TSCR86176": 254933.0, "93XSYKL1TSCR90862": 254933.0, "93XSYKL1TSCR90867": 254933.0, "93XSYKL1TSCR90874": 254933.0, "93XSYKL1TSCR90891": 254933.0, "93XSYKL1TSCR90895": 254933.0, "93XSYKL1TSCR90899": 254933.0, "93XSYKL1TSCR90904": 254933.0, "93XSYKL1TSCR90909": 254933.0, "93XSYKL1TSCR90916": 254933.0, "93XSYKL1TSCR90923": 254933.0, "93XSYKL1TSCR90930": 254933.0, "93XSYKL1TSCR90936": 254933.0, "93XSYKL1TSCR90942": 254933.0, "93XSYKL1TSCR90948": 254933.0, "93XSYKL1TSCR90956": 254933.0, "93XSYKL1TSCR90964": 254933.0, "9BRBC3F32R8298075": 127400.0, "9BRBC3F35R8298166": 127400.0, "93XSYKL1TSCR86827": 290500.0, "93XSYKL1TSCR86836": 290500.0, "93XSYKL1TSCR86846": 290500.0, "93XSYKL1TSCR86854": 290500.0, "93XSYKL1TSCR86863": 290500.0, "93XSYKL1TSCR86867": 290500.0, "93XSYKL1TSCR86876": 290500.0, "93XSYKL1TSCR86887": 290500.0, "93XSYKL1TSCR86898": 290500.0, "93XSYKL1TSCR86906": 290500.0, "93XSYKL1TSCR86913": 290500.0, "93XSYKL1TSCR86924": 290500.0, "93XSYKL1TSCR86932": 290500.0, "93XSYKL1TSCR86941": 290500.0, "93XSYKL1TSCR86949": 290500.0, "93XSYKL1TSCR86957": 290500.0, "93XSYKL1TSCR86967": 290500.0, "93XSYKL1TSCR86975": 290500.0, "93XSYKL1TSCR86983": 290500.0, "93XSYKL1TSCR86994": 290500.0, "93XSYKL1TSCR87546": 290500.0, "93XSYKL1TSCR87566": 290500.0, "93XSYKL1TSCR87579": 290500.0, "93XSYKL1TSCR87592": 290500.0, "93XSYKL1TSCR87605": 290500.0, "93XSYKL1TSCR87618": 290500.0, "93XSYKL1TSCR87631": 290500.0, "93XSYKL1TSCR87644": 290500.0, "93XSYKL1TSCR87657": 290500.0, "93XSYKL1TSCR87670": 290500.0, "93XSYKL1TSCR87683": 290500.0, "93XSYKL1TSCR87696": 290500.0, "93XSYKL1TSCR87708": 290500.0, "93XSYKL1TSCR87721": 290500.0, "93XSYKL1TSCR87735": 290500.0, "93XSYKL1TSCR87749": 290500.0, "93XSYKL1TSCR87761": 290500.0, "93XSYKL1TSCR87774": 290500.0, "93XSYKL1TSCR87788": 290500.0, "93XSYKL1TSCR87801": 290500.0, "93XSYKL1TSCR87892": 290500.0, "93XSYKL1TSCR87907": 290500.0, "93XSYKL1TSCR87921": 290500.0, "93XSYKL1TSCR87935": 290500.0, "93XSYKL1TSCR87948": 290500.0, "93XSYKL1TSCR87957": 290500.0, "93XSYKL1TSCR87970": 290500.0, "93XSYKL1TSCR87982": 290500.0, "93XSYKL1TSCR87995": 290500.0, "93XSYKL1TSCR88007": 290500.0, "93XSYKL1TSCR88021": 290500.0, "93XSYKL1TSCR88035": 290500.0, "93XSYKL1TSCR88048": 290500.0, "93XSYKL1TSCR88061": 290500.0, "93XSYKL1TSCR88072": 290500.0, "93XSYKL1TSCR88084": 290500.0, "93XSYKL1TSCR88097": 290500.0, "93XSYKL1TSCR88110": 290500.0, "93XSYKL1TSCR88123": 290500.0, "93XSYKL1TSCR88132": 290500.0, "9BRBC3F33S8316783": 127400.0, "9BRBC3F37S8316690": 127400.0, "9BRBC3F38R8276632": 127600.0, "9BRBC3F39R8276283": 127600.0, "93XTYKL1TSCR79930": 313406.0, "93XPYKL1TSCR79772": 313402.0, "9BRBC3F33R8271726": 127600.0, "9BRBC3F34R8270522": 127600.0, "9BRBC3F34R8270780": 127600.0, "9BRBC3F39R8270757": 127600.0, "93XTYKL1TSCR79947": 313406.0, "93XTYKL1TSCR79671": 313406.0, "93XTYKL1TSCR79673": 313406.0, "93XTYKL1TSCR79679": 313406.0, "8AP359AFXRU343302": 115435.99, "8AP359AFXRU343408": 115435.99, "9BM951104NB279883": 413195.0, "9BM951104NB281123": 413195.0, "9BM951104NB298628": 413195.0, "93XTYKL1TRCP77463": 313406.0, "93XTYKL1TRCP77660": 313406.0, "93XTYKL1TRCP77808": 313406.0, "93XTYKL1TRCP77842": 313406.0, "93XTYKL1TRCP77917": 313406.0, "93XTYKL1TRCP77964": 313406.0, "9BRBC3F33R8255512": 127400.0, "9BRBC3F33R8259883": 127400.0, "9BRBC3F36R8255150": 127400.0, "9BRBC3F38R8255408": 127400.0, "9BRBC3F39R8259239": 127400.0, "9BRBC3F39R8259662": 127400.0, "9BRBC3F3XR8259895": 127400.0, "9BG148FK0NC453751": 215943.0, "9BG148FK0NC453969": 215943.0, "9BG148FK0NC453971": 215943.0, "9BG148FK0NC454033": 215943.0, "9BRBY3BE1P4034228": 195000.0, "8AGBB69S0NR117127": 114700.0, "93XSYKL1TSCS93123": 263934.95, "8AP359AFTSU430968": 115435.99, "93XSYKL1TSCR90751": 270774.0, "93XSYKL1TSCR90757": 270774.0, "93XSYKL1TSCR90763": 270774.0, "93XSYKL1TSCR90774": 270774.0, "8AP359AFTSU418714": 115435.99, "8AP359AFTSU430970": 115435.99, "8AP359AFTSU431087": 115435.99, "8AP359AFTSU416947": 115435.99, "8AP359AFTSU418363": 115435.99, "8AP359AFTSU418619": 115435.99, "8AP359AFTSU418710": 115435.99, "8AP359AFTSU418847": 115435.99, "8AP359AFTSU418884": 115435.99, "93XSYKL1TSCR91186": 270000.0, "9BRBC3F31R8278433": 127400.0, "9BRBC3F36S8316499": 127400.0, "9BRBC3F37S8316947": 127400.0, "9BRBC3F33R8271760": 127600.0, "9BRBC3F34R8271962": 127600.0, "9BRBC3F31R8272678": 127600.0, "9BRBC3F32R8272351": 127600.0, "9BRBC3F38R8273049": 127600.0, "93XPYKL1TSCR79770": 313402.0, "93XTYKL1TSCR79920": 313406.0, "93XTYKL1TSCR79927": 313406.0, "8AP359AFXRU341379": 115435.99, "9BM951104NB280643": 413195.0, "9BM951104NB280779": 413195.0, "93XTYKL1TRCP77422": 313406.0, "93XTYKL1TRCP77714": 313406.0, "93XTYKL1TRCP77771": 313406.0, "93XTYKL1TRCP77773": 313406.0, "93XTYKL1TRCP77811": 313406.0, "93XTYKL1TRCP77830": 313406.0, "9BRBC3F34R8259827": 127400.0, "9BRBC3F34R8260024": 127400.0, "9BRBC3F35R8255334": 127400.0, "9BRBC3F35R8264194": 127400.0, "9BRBC3F35R8264292": 127400.0, "9BRBC3F36R8264138": 127400.0, "9BRBC3F36R8264253": 127400.0, "9BRBC3F37R8255464": 127400.0, "9BG156YK0NC451989": 233750.0, "3N1AB8AE2TY200849": 168082.82, "3N1AB8AE5TY200893": 168082.82, "3N1AB8AE8TY200905": 168082.82, "3N1AB8AEXTY200906": 168082.82, "3N1AB8AE0SY258358": 168082.82, "3N1AB8AE2SY258412": 168082.82, "3N1AB8AE1TY200454": 168082.82, "3N1AB8AE2TY200575": 168082.82, "8AP359AFTSU430853": 115435.99, "8AP359AFTSU431096": 115435.99, "8AP359AFTSU431708": 115435.99, "8AP359AFTSU432241": 115435.99, "8AP359AFTSU433621": 115435.99, "8AP359AFTSU435968": 115435.99, "8AP359AFTSU435972": 115435.99, "8AP359AFTSU418582": 115435.99, "8AP359AFTSU432214": 115435.99, "8AP359AFTSU435995": 115435.99, "8AP359AFTSU436072": 115435.99, "93XSYKL1TSCR90551": 270774.0, "93XSYKL1TSCR90561": 270774.0, "93XSYKL1TSCR90568": 270774.0, "93XSYKL1TSCR91151": 251671.0, "93XSYKL1TSCR91193": 251671.0, "9BRBC3F30R8297605": 127800.0, "9BRBC3F30R8297930": 127800.0, "9BRBC3F35R8297311": 127800.0, "93XTYKL1TSCR80236": 313406.0, "93XTYKL1TSCR80240": 313406.0, "93XTYKL1TSCR80251": 313406.0, "93XTYKL1TSCR80255": 313406.0, "93XTYKL1TSCR80282": 313406.0, "93XPYKL1TSCR79626": 313402.0, "93XPYKL1TSCR79720": 313402.0, "9BRBC3F37R8270787": 127600.0, "9BRBC3F38R8271222": 127600.0, "9BRBC3F30R8269724": 127600.0, "9BRBC3F32R8269305": 127600.0, "9BRBC3F33R8269488": 127600.0, "9BRBC3F33R8269586": 127600.0, "9BRBC3F37R8269607": 127600.0, "9BRBC3F39R8268135": 127600.0, "9BRBC3F3XR8267379": 127600.0, "9BRBC3F30R8268024": 127600.0, "9BRBC3F30R8268671": 127600.0, "9BRBC3F30R8268735": 127600.0, "93XTYKL1TRCP77469": 313406.0, "93XTYKL1TRCP77591": 313406.0, "93XTYKL1TRCP77897": 313406.0, "93XTYKL1TRCP77940": 313406.0, "93XTYKL1TRCP78030": 313406.0, "93XTYKL1TRCP78062": 313406.0, "9BM951104NB280807": 413195.0, "93XSYKL1TNCM44768": 117200.0, "93Y5SRJSXPJ312385": 92150.0, "8AFAR23L1JJ054259": 137500.0, "8AFAR23L2JJ042475": 137500.0, "8AFAR23L3JJ042503": 137500.0, "93XLNKB8TGCF21376": 119000.0, "93XLNKB8TGCF21379": 119000.0, "93XLNKB8TGCF21447": 119000.0, "9BM951501SB430040": 1697800.0, "93XSYKL1TSCS93273": 283884.09, "93XSYKL1TSCS93274": 283884.09, "93XSYKL1TSCS93275": 283884.09, "93XSYKL1TSCS93276": 283884.09, "93XSYKL1TSCR88996": 239060.36, "93XSYKL1TSCR91368": 239060.36, "93XSYKL1TSCR91526": 239060.36, "93XSYKL1TSCR91538": 239060.36, "91JPWC601S1000701": 9798.0, "91JPWC601S1000702": 9798.0, "3N1AB8AE2TY200706": 172000.0, "3N1AB8AE2TY200737": 172000.0, "3N1AB8AE6SY259045": 168082.82, "9BM951501SB420031": 1697800.0, "93XSYKL1TSCS93106": 263934.95, "93XSYKL1TSCS93108": 263934.95, "8AP359AFWRU373390": 115435.99, "8AP359AFWRU373455": 115435.99, "8AP359AFWRU373562": 115435.99, "8AP359AFWRU373589": 115435.99, "8AP359AFWRU373937": 115435.99, "8AP359AFWRU378581": 115435.99, "8AP359AFTSU415126": 115435.99, "8AP359AFTSU435932": 115435.99, "9BRBC3F38R8298713": 127600.0, "9BRBC3F34S8309986": 127600.0, "93XTYKL1TSCR80959": 313406.0, "93XTYKL1TSCR80962": 313406.0, "93XTYKL1TSCR80968": 313406.0, "93XTYKL1TSCR80971": 313406.0, "93XTYKL1TSCR80977": 313406.0, "93XTYKL1TSCR80981": 313406.0, "93XTYKL1TSCR80984": 313406.0, "93XTYKL1TSCR81010": 313406.0, "93XTYKL1TSCR81022": 313406.0, "93XTYKL1TSCR81027": 313406.0, "93XTYKL1TSCR81080": 313406.0, "93XPYKL1TSCR79639": 313402.0, "9BRBC3F31R8271949": 127600.0, "9BRBC3F36R8270912": 127600.0, "93XTYKL1TRCP77431": 313406.0, "93XTYKL1TRCP77452": 313406.0, "93XTYKL1TRCP77524": 313406.0, "93XTYKL1TRCP77758": 313406.0, "93XTYKL1TRCP77995": 313406.0, "9BRBC3F30R8268573": 127600.0, "9BRBC3F34R8268463": 127600.0, "9BRBC3F36R8267444": 127600.0, "9BRBC3F37R8268392": 127600.0, "9BRBC3F39R8267759": 127600.0, "9BRBC3F3XR8268063": 127600.0, "8AFAR23L0JJ062403": 145584.0, "8AFAR23L2JJ064914": 145584.0, "8AFAR23L3JJ061911": 145584.0, "8AFAR23L6JJ064947": 145584.0, "93XSYKL1TSCS93265": 283884.09, "93XSYKL1TSCS93263": 283884.09, "93XSYKL1TSCS93266": 283884.09, "93XSYKL1TSCS93267": 283884.09, "93XSYKL1TSCS93277": 283884.09, "93XSYKL1TSCS93279": 283884.09, "93XSYKL1TSCS93280": 283884.09, "3N1AB8AE9TY200766": 172000.0, "3N1AB8AEXTY200694": 172000.0, "3N1AB8AE0TY200624": 168082.82, "3N1AB8AE2TY200527": 168082.82, "3N1AB8AE0TY200770": 168082.82, "3N1AB8AE1TY200633": 168082.82, "93XSYKL1TSCR90950": 239060.36, "3N1AB8AE6TY200546": 168082.82, "3N1AB8AE7TY200605": 168082.82, "3N1AB8AE2TY200690": 172000.0, "3N1AB8AE6TY200692": 172000.0, "3N1AB8AE8TY200631": 172000.0, "3N1AB8AEXTY200596": 172000.0, "93XSYKL1TSCS92451": 270774.0, "93XSYKL1TSCS92452": 270774.0, "93XSYKL1TSCR90619": 270774.0, "93XSYKL1TSCR90634": 270774.0, "3N1AB8AE6TY200675": 172000.0, "3N1AB8AEXTY200646": 172000.0, "3N1AB8AE2SY257521": 168082.82, "8AP359AFTSU411804": 115435.99, "8AP359AFTSU414067": 115435.99, "8AP359AFTSU418671": 115435.99, "8AP359AFTSU418758": 115435.99, "8AP359AFTSU422175": 115435.99, "8AP359AFTSU422427": 115435.99, "8AP359AFTSU422578": 115435.99, "8AP359AFTSU418297": 115435.99, "8AP359AFTSU426301": 115435.99, "8AP359AFTSU427008": 115435.99, "8AP359AFTSU427518": 115435.99, "8AP359AFTSU427565": 115435.99, "8AP359AFWRU374906": 115435.99, "8AP359AFTSU418853": 115435.99, "8AP359AFTSU432645": 115435.99, "8AP359AFTSU435199": 115435.99, "8AP359AFTSU435267": 115435.99, "8AP359AFTSU435990": 115435.99, "8AP359AFTSU436009": 115435.99, "93XSYKL1TSCR91168": 251671.0, "9321FHMJ6DD655468": 53449.0, "9321FHMJ9DD655500": 53449.0, "8AFAR23LXJJ039405": 145584.0, "9BRBC3F32R8296729": 127600.0, "9BRBC3F35R8296661": 127600.0, "9BRBC3F35R8298068": 127600.0, "9BRBC3F37R8297956": 127600.0, "9BRBC3F32R8298657": 127600.0, "9BRBC3F33R8297839": 127600.0, "9BRBC3F32R8272401": 127600.0, "9BRBC3F35R8273039": 127600.0, "9BRBC3F36R8272921": 127600.0, "9BRBC3F37R8272572": 127600.0, "9BRBC3F34R8272920": 127600.0, "9BRBC3F38R8271026": 127600.0, "9BRBC3F3XR8272985": 127600.0, "9BRBC3F32R8297217": 127600.0, "9BRBC3F39R8295349": 127600.0, "9BRBC3F3XR8296655": 127600.0, "93XPYKL1TSCR79641": 313406.0, "93XTYKL1TSCR81000": 313406.0, "93XTYKL1TSCR81013": 313406.0, "93XTYKL1TSCR81016": 313406.0, "93XTYKL1TSCR81019": 313406.0, "93XTYKL1TSCR81051": 313406.0, "93XTYKL1TSCR81062": 313406.0, "93XTYKL1TSCR81054": 313402.0, "9BRBC3F30R8270873": 127600.0, "9BRBC3F36R8270246": 127600.0, "9BRBC3F37R8270501": 127600.0, "9BRBC3F3XR8270380": 127600.0, "9BRBC3F34R8272299": 127600.0, "9BRBC3F35R8269573": 127600.0, "9BRBC3F38R8271611": 127600.0, "9BRBC3F38R8272306": 127600.0, "9BRBC3F36R8296667": 127600.0, "9BRBC3F32R8293832": 127600.0, "9BRBC3F37R8293888": 127600.0, "9BRBC3F37R8294121": 127600.0, "9BRBC3F3XR8293898": 127600.0, "9BRBC3F3XR8294470": 127600.0, "93XPYKL1TSCR79746": 313402.0, "93XTYKL1TRCP77994": 313406.0, "9BRBC3F30R8268931": 127600.0, "9BRBC3F32R8269417": 127600.0, "9BRBC3F33R8267773": 127600.0, "9BRBC3F34R8267698": 127600.0, "9BRBC3F34R8267877": 127600.0, "9BRBC3F37R8267419": 127600.0, "9BRBC3F3XR8270122": 127600.0, "9BRBC3F3XR8271982": 127600.0, "93XTYKL1TRCP77747": 313406.0, "93XTYKL1TRCP77567": 313406.0, "9BRBC3F32R8270180": 127600.0, "9BRBC3F37R8270482": 127600.0, "93XTYKL1TRCP77671": 313406.0, "93XTYKL1TRCP77710": 313406.0, "93XTYKL1TRCP77982": 313406.0, "9BRBC3F30R8270260": 127600.0, "9BRBC3F33R8269149": 127600.0, "9BRBC3F35R8270254": 127600.0, "9BRBC3F36R8267718": 127600.0, "9BRBC3F39R8269012": 127600.0, "9BRBC3F39R8270239": 127600.0, "93XTYKL1TRCP77990": 313406.0, "93XTYKL1TRCP77745": 313406.0, "93XTYKL1TRCP77952": 313406.0, "93XTYKL1TRCP78042": 313406.0, "3N1AB8AE3TY200603": 172000.0, "3N1AB8AE5TY200649": 172000.0, "3N1AB8AE7TY200751": 172000.0, "93XTYKL1TRCP77434": 313406.0, "93XTYKL1TRCP77446": 313406.0, "93XTYKL1TRCP77500": 313406.0, "93XTYKL1TRCP77699": 313406.0, "93XTYKL1TRCP77719": 313406.0, "93XTYKL1TRCP77840": 313406.0, "93XTYKL1TRCP77904": 313406.0, "93XTYKL1TRCP78029": 313406.0, "9BRBC3F37R8269896": 127600.0, "9BRBC3F39R8269026": 127600.0, "9BRBY3BE3P4034165": 195000.0, "8AGBB69S0NR116796": 114700.0, "8AGBB69S0NR117175": 114700.0, "9BG148FK0FC407047": 196950.0, "8AFAR23L2JJ057512": 145584.0, "8AFAR23L8JJ061919": 145584.0, "9A9GA01CPMBFB9452": 89900.0, "9BG148FK0NC452558": 196950.0, "8AFAR23L1JJ047098": 138461.0, "8AFAR23L1JJ050910": 138461.0, "8AFAR23L1JJ054312": 138461.0, "8AFAR23L3JJ047104": 138461.0, "8AFAR23L6JJ045105": 138461.0, "9535E6TB8VR001418": 1420000.0, "93XDLLC2TVCT14831": 267355.91, "93XDLLC2TVCT14833": 267355.91, "93XDLLC2TVCT14837": 267355.91, "93XDLLC2TVCT14839": 267355.91, "93XDLLC2TVCT14841": 267355.91, "93XDLLC2TVCT14843": 267355.91, "93XDLLC2TVCT14846": 267355.91, "93XDLLC2TVCT14852": 267355.91, "93XDLLC2TVCT14855": 267355.91, "93XDLLC2TVCT14858": 267355.91, "93XDLLC2TVCT14835": 267355.91, "93XDLLC2TVCT14849": 267355.91, "93XDLLC2TVCT14861": 267355.91, "93XDLLC2TVCT14864": 267355.91, "9535E6TB0TR034698": 1420000.0, "9535E6TB1TR025508": 1420000.0, "9535E6TB5TR025849": 1420000.0, "93XSYKL1TSCS93110": 263934.95, "93XSYKL1TSCR90645": 270774.0, "93XSYKL1TSCR90682": 270774.0, "8AP359AFWRU373569": 115435.99, "8AP359AFTSU430877": 115435.99, "8AP359AFTSU432156": 115435.99, "8AP359AFTSU432508": 115435.99, "8AP359AFTSU418752": 115435.99, "8AP359AFTSU432661": 115435.99, "8AP359AFTSU433252": 115435.99, "8AP359AFTSU433593": 115435.99, "8AP359AFTSU434365": 115435.99, "93XSYKL1TSCR91161": 251671.0, "9BRBC3F34S8336833": 127600.0, "9BRBC3F36S8309830": 127600.0, "9BRBC3F34R8293234": 127600.0, "9BRBC3F38R8291972": 127600.0, "93XTYKL1TSCR81004": 313406.0, "93XTYKL1TSCR81007": 313406.0, "93XTYKL1TSCR81059": 313406.0, "93XTYKL1TSCR81068": 313406.0, "93XTYKL1TSCR81083": 313406.0, "93XTYKL1TSCR81168": 313406.0, "93XTYKL1TSCR81174": 313406.0, "93XPYKL1TSCR79643": 313402.0, "93XTYKL1TRCP77992": 313406.0, "93XTYKL1TRCP78059": 313406.0, "9BRBC3F30R8268217": 127600.0, "9BRBC3F31R8269201": 127600.0, "9BRBC3F32R8268624": 127600.0, "9BRBC3F38R8268613": 127600.0, "9BRBC3F36R8268965": 127600.0, "9BRBC3F39R8269639": 127600.0, "93XTYKL1TRCP77693": 313406.0, "93XTYKL1TRCP77706": 313406.0, "93XTYKL1TRCP77835": 313406.0, "93XTYKL1TRCP77850": 313406.0, "93XTYKL1TRCP78077": 313406.0, "9BG156FK0TC429979": 289017.0, "93XSYKL1TSCS93264": 283884.09, "3N1AB8AEXTY201070": 168082.82, "8AP359AFVSU452838": 115435.99, "3N1AB8AE4TY200349": 168082.82, "93XSYKL1TSCR86120": 303826.0, "93XSYKL1TSCS93126": 263934.95, "93XSYKL1TSCS93127": 263934.95, "93XSYKL1TSCR86121": 303826.0, "93XSYKL1TSCR86122": 303826.0, "93XSYKL1TSCR86123": 303826.0, "3N1AB8AEXSY236173": 160272.73, "8AP359AFTSU414105": 115435.99, "8AP359AFTSU416836": 115435.99, "8AP359AFTSU416852": 115435.99, "8AP359AFTSU416962": 115435.99, "8AP359AFTSU421648": 115435.99, "8AP359AFTSU422705": 115435.99, "8AP359AFTSU427514": 115435.99, "8AP359AFTSU431019": 115435.99, "8AP359AFTSU397881": 115435.99, "8AP359AFTSU403950": 115435.99, "8AP359AFTSU415099": 115435.99, "8AP359AFWRU372711": 115435.99, "8AP359AFWRU386820": 115435.99, "8AP359AFWRU390013": 115435.99, "8AP359AFWRU390076": 115435.99, "8AP359AFWRU371745": 115435.99, "9BRKC3F31S8344842": 129459.36, "9BRKC3F34S8331504": 129459.36, "9BRKC3F35S8330250": 129459.36, "9BRKC3F36S8345405": 129459.36, "9BRKC3F39S8329599": 129459.36, "9BRKC3F3XS8331829": 129459.36, "9BRKC3F3XS8332933": 129459.36, "93XSYKL1TSCR88508": 228255.95, "93XSYKL1TSCR87494": 270774.0, "93XSYKL1TSCR87533": 270774.0, "93XSYKL1TSCR88395": 254933.0, "9BG156FK0SC406439": 348600.0, "9BG156FK0SC408561": 348600.0, "9BG156FK0SC406818": 348600.0, "93XSYKL1TSCR87458": 270774.0, "93XSYKL1TSCR87446": 270774.0, "93XSYKL1TSCR87169": 270774.0, "93XSYKL1TSCR87175": 270774.0, "9BRBC3F33R8273296": 127600.0, "9BRBC3F34R8276319": 127600.0, "9BRBC3F38R8276551": 127600.0, "9BRBC3F39R8276428": 127600.0, "9BRBC3F32S8316354": 127600.0, "93XSYKL1TSCR88500": 228255.95, "93XSYKL1TSCR88521": 228255.95, "9BRBC3F32R8296472": 127600.0, "9BRBC3F33R8294746": 127600.0, "9BRBC3F33R8295802": 127600.0, "9BRBC3F38R8295522": 127600.0, "9BRBC3F34R8272741": 127600.0, "9BRBC3F38R8272435": 127600.0, "9BRBC3F38R8272841": 127600.0, "9BRBC3F3XR8272906": 127600.0, "9BRBC3F38R8294435": 127600.0, "9BRBC3F38R8294774": 127600.0, "9BRBC3F30R8271215": 127600.0, "9BRBC3F32R8272625": 127600.0, "9BRBC3F34R8270827": 127600.0, "9BRBC3F36R8271090": 127600.0, "9BRBC3F30R8273062": 127600.0, "9BRBC3F34R8272786": 127600.0, "9BRBC3F37R8273107": 127600.0, "9BRBC3F3XR8272288": 127600.0, "93XSYKL1TSCR80012": 310926.0, "93XSYKL1TSCR80014": 310926.0, "93XSYKL1TSCR80016": 310926.0, "9BRBC3F30R8271375": 127600.0, "9BRBC3F37R8270806": 127600.0, "9BRBC3F39R8270919": 127600.0, "9BRBC3F31R8270476": 127600.0, "9BRBC3F31R8272292": 127600.0, "9BRBC3F39R8269799": 127600.0, "9BRBC3F39R8270886": 127600.0, "93XTYKL1TSCR79556": 313406.0, "93XTYKL1TSCR79562": 313406.0, "93XTYKL1TSCR79577": 313406.0, "93XTYKL1TSCR79528": 313406.0, "93XTYKL1TSCR79554": 313406.0, "93XTYKL1TSCR79687": 313406.0, "93XTYKL1TSCR79689": 313406.0, "93XTYKL1TSCR79691": 313406.0, "93XTYKL1TRCP78350": 313406.0, "93XSYKL1TSCR88407": 254933.0, "93XTYKL1TSCR79549": 313406.0, "93XTYKL1TSCR79552": 313406.0, "93XTYKL1TSCR79564": 313406.0, "93XTYKL1TSCR79547": 313406.0, "93XTYKL1TSCR79567": 313406.0, "93XTYKL1TSCR79569": 313406.0, "93XTYKL1TSCR79571": 313406.0, "93XTYKL1TSCR79685": 313406.0, "93XTYKL1TRCP77647": 313406.0, "93XTYKL1TRCP77504": 313406.0, "93XTYKL1TRCP77626": 313406.0, "93XTYKL1TRCP77645": 313406.0, "93XTYKL1TRCP77669": 313406.0, "93XTYKL1TRCP77860": 313406.0, "93XTYKL1TRCP77945": 313406.0, "93XTYKL1TRCP78012": 313406.0, "93XTYKL1TSCR80156": 313406.0, "93XTYKL1TSCR80158": 313406.0, "8AP359AFXRU344145": 115435.99, "8AP359AFXRU346843": 115435.99, "8AP359AFXRU347925": 115435.99, "9BRBC3F31R8269943": 127600.0, "9BRBC3F32R8268056": 127600.0, "9BRBC3F35R8268083": 127600.0, "9BRBC3F35R8268665": 127600.0, "9BRBC3F38R8270135": 127600.0, "9BRBC3F39R8269480": 127600.0, "9BG148FK0NC453316": 215943.0, "9BG148FK0NC453765": 215943.0, "9BG148FK0NC453866": 215943.0, "9BG148FK0NC453906": 215943.0, "9BG148FK0NC453928": 215943.0, "9BG148FK0NC453930": 215943.0, "9BG148FK0NC453955": 215943.0, "9BG148FK0NC453991": 215943.0, "9BM951104NB279143": 413195.0, "9BM951104NB279344": 413195.0, "93YF62S09TJ331787": 549790.0, "93XSYKL1TSCS93246": 283968.84, "93XSYKL1TSCS93247": 283968.84, "93XSYKL1TSCS93248": 283968.84, "93XSYKL1TSCR90793": 239060.36, "93XSYKL1TSCR90810": 239060.36, "93XSYKL1TSCR90811": 239060.36, "93XSYKL1TSCR90820": 239060.36, "93XSYKL1TSCR91480": 239116.65, "93XSYKL1TSCR91485": 239116.65, "93XSYKL1TSCR90419": 239060.36, "3N1AB8AE2SY260600": 168082.82, "3N1AB8AE3SY260265": 168082.82, "91JPWC601S1000700": 9798.0, "3N1AB8AE7TY200569": 169069.57, "9BG156FK0TC404917": 305861.89, "9BG156FK0TC404918": 305861.89, "3N1AB8AE9TY200461": 168082.82, "9BRKC3F31S8358983": 129459.36, "9BRKC3F33S8358967": 129459.36, "93XSYKL1TRCP77901": 244900.0, "93XSYKL1TSCR86131": 303826.0, "93XSYKL1TSCR86132": 303826.0, "93XSYKL1TSCR86133": 303826.0, "8AP359AFTSU433121": 115435.99, "8AP359AFTSU433195": 115435.99, "8AP359AFTSU433563": 115435.99, "8AP359AFTSU433611": 115435.99, "8AP359AFTSU433800": 115435.99, "8AP359AFTSU426882": 115435.99, "8AP359AFTSU433821": 115435.99, "8AP359AFTSU433870": 115435.99, "8AP359AFTSU415235": 115435.99, "8AP359AFTSU435960": 115435.99, "8AP359AFTSU436087": 115435.99, "8AP359AFTSU436523": 115435.99, "8AP359AFWRU371797": 115435.99, "9BRKC3F30S8338630": 129459.36, "9BM951102SB402146": 466527.58, "9BRBC3F32S8351976": 127600.0, "9BRBC3F32S8352271": 127600.0, "9BRBC3F32S8352285": 127600.0, "9BRBC3F34S8352207": 127600.0, "9BRBC3F34S8352210": 127600.0, "9BRBC3F35S8352197": 127600.0, "9BRBC3F38S8352145": 127600.0, "9BRBC3F3XS8352213": 127600.0, "8AP359AFTSU401966": 115435.99, "8AP359AFTSU403195": 115435.99, "9321FHMJ4DD658658": 53449.0, "9321FHMJ8DD658677": 53449.0, "93PB40N31FC056098": 224000.0, "93XSYKL1TSCR88485": 228255.95, "93XSYKL1TSCR88495": 228255.95, "93XSYKL1TSCR88504": 228255.95, "93XSYKL1TSCR88516": 228255.95, "93XSYKL1TSCR88416": 254933.0, "93XSYKL1TSCR88424": 254933.0, "9BRBC3F3XR8276325": 127600.0, "9BRBC3F3XR8276387": 127600.0, "9BRBC3F35R8271792": 127600.0, "9BRBC3F39R8271343": 127600.0, "9BRBC3F31S8316300": 127400.0, "9BRBC3F35S8316185": 127400.0, "9BRBC3F37S8315779": 127400.0, "9BRBC3F3XS8317011": 127400.0, "9BRBC3F32R8271104": 127600.0, "9BRBC3F33R8270334": 127600.0, "9BRBC3F39R8271598": 127600.0, "9BRBC3F35R8271503": 127600.0, "9BRBC3F36R8272109": 127600.0, "93XTYKL1TSCR79937": 313406.0, "9BRBC3F38R8294645": 127400.0, "9BRBC3F36R8273244": 127600.0, "9BRBC3F38R8271740": 127600.0, "9BRBC3F38R8272340": 127600.0, "9BRBC3F39R8270810": 127600.0, "9BRBC3F30R8294171": 127400.0, "9BRBC3F31R8290517": 127400.0, "9BRBC3F33R8289949": 127400.0, "9BRBC3F33R8268096": 127600.0, "9BRBC3F35R8272618": 127600.0, "9BRBC3F39R8272363": 127600.0, "9BRBC3F32R8271071": 127600.0, "9BRBC3F33R8272553": 127600.0, "9BRBC3F33R8272665": 127600.0, "9BRBC3F38R8273309": 127600.0, "93XPYKL1TSCR79750": 313402.0, "9BRBC3F32R8294690": 127400.0, "9BRBC3F33R8294147": 127400.0, "9BRBC3F34R8294447": 127400.0, "9BRBC3F34R8294464": 127400.0, "8AP359AFXRU359917": 115435.99, "8AP359AFXRU359922": 115435.99, "8AP359AFXRU359925": 115435.99, "8AP359AFXRU359934": 115435.99, "8AP359AFXRU359952": 115435.99, "8AP359AFXRU360331": 115435.99, "9BRBC3F31R8271773": 127600.0, "9BRBC3F36R8271395": 127600.0, "9BRBC3F39R8272685": 127600.0, "9BRBC3F39R8272962": 127600.0, "9BRBC3F3XR8272212": 127600.0, "9BRBC3F3XR8272968": 127600.0, "9BRBC3F30R8270355": 127600.0, "9BRBC3F31R8271157": 127600.0, "9BRBC3F34R8270570": 127600.0, "9BRBC3F35R8270609": 127600.0, "9BRBC3F37R8270515": 127600.0, "9BRBC3F39R8271097": 127600.0, "8AP359AFXRU354129": 115435.99, "8AP359AFXRU355274": 115435.99, "8AP359AFXRU355882": 115435.99, "9BRBC3F32R8271006": 127600.0, "9BRBC3F34R8272223": 127600.0, "9BRBC3F36R8273292": 127600.0, "9BRBC3F39R8272606": 127600.0, "93XTYKL1TSCR79939": 313406.0, "93XTYKL1TSCR79941": 313406.0, "93XTYKL1TSCR79496": 313406.0, "8AP359AFXRU359847": 115435.99, "8AP359AFXRU359865": 115435.99, "8AP359AFXRU359868": 115435.99, "93XTYKL1TSCR79439": 313406.0, "93XTYKL1TSCR79502": 313406.0, "8AP359AFXRU357995": 115435.99, "8AP359AFXRU350420": 115435.99, "8AP359AFXRU350601": 115435.99, "8AP359AFXRU345621": 115435.99, "9BRBC3F31R8270817": 127600.0, "8AP359AFXRU359871": 115435.99, "8AP359AFXRU343423": 115435.99, "8AP359AFXRU346830": 115435.99, "8AP359AFXRU350068": 115435.99, "8AP359AFXRU350441": 115435.99, "93XSYKL1TRCP77852": 313406.0, "9BRBC3F30R8270839": 127600.0, "9BRBC3F34R8269290": 127600.0, "9BRBC3F35R8270576": 127600.0, "9BRBC3F36R8269825": 127600.0, "9BRBC3F38R8267431": 127600.0, "9BRBC3F38R8268272": 127600.0, "93XTYKL1TRCP77880": 313406.0, "8AP359AFXRU344772": 115435.99, "8AP359AFXRU350539": 115435.99, "8AP359AFXRU351640": 115435.99, "93XTYKL1TRCP77667": 313406.0, "8AP359AFXRU350411": 115435.99, "8AP359AFXRU350444": 115435.99, "8AP359AFXRU344638": 115435.99, "8AP359AFXRU344674": 115435.99, "8AP359AFXRU350536": 115435.99, "8AP359AFXRU350598": 115435.99, "93XSYKL1TRCP77833": 310926.0, "9BRBC3F32R8268784": 127600.0, "9BRBC3F38R8268529": 127600.0, "93XTYKL1TRCP77509": 313406.0, "93XTYKL1TRCP77701": 313406.0, "93XTYKL1TRCP77855": 313406.0, "93XTYKL1TRCP77947": 313406.0, "93XTYKL1TRCP77816": 313406.0, "93XTYKL1TRCP77847": 313406.0, "93XTYKL1TRCP77890": 313406.0, "93XTYKL1TRCP78057": 313406.0, "9BG148FK0NC444416": 203318.64, "3N1AB8AE6TY201048": 168082.82, "3N1AB8AE8TY201018": 168082.82, "3N1AB8AE8TY201052": 168082.82, "3N1AB8AE8TY201147": 168082.82, "3N1AB8AE0SY259493": 168082.82, "3N1AB8AE9SY259914": 168082.82, "3N1AB8AE0TY200493": 168082.82, "3N1AB8AE3TY200472": 168082.82, "3N1AB8AE5TY200490": 168082.82, "9BG156FK0TC404699": 305861.89, "9BG156FK0TC404914": 305861.89, "8AP359AFTSU413770": 115435.99, "8AP359AFTSU426740": 115435.99, "8AP359AFTSU433231": 115435.99, "8AP359AFTSU433835": 115435.99, "8AP359AFVTU454016": 115435.99, "8AP359AFWRU372782": 115435.99, "8AP359AFWRU372785": 115435.99, "8AP359AFTSU427522": 115435.99, "8AP359AFTSU436513": 115435.99, "9321FHMJ4DD655467": 53449.0, "9321FHMJ9DD653150": 53449.0, "9BRBC3F38S8326533": 127600.0, "9BRBC3F30S8324744": 127600.0, "9BRBC3F32S8324051": 127600.0, "9BRBC3F33S8324558": 127600.0, "9BRBC3F38S8326239": 127600.0, "9BRBC3F39S8325018": 127600.0, "9BRBC3F3XS8325075": 127600.0, "9BRBC3F35S8310077": 127600.0, "9BRBC3F31R8294888": 127600.0, "9BRBC3F39R8290619": 127600.0, "9BRBC3F39R8290944": 127600.0, "93XTYKL1TSCR81137": 313406.0, "93XTYKL1TSCR81153": 313406.0, "93XTYKL1TSCR81156": 313406.0, "93XTYKL1TSCR81164": 313406.0, "93XPYKL1TSCR79645": 313402.0, "93XPYKL1TSCR79648": 313402.0, "93XTYKL1TSCR80616": 313406.0, "93XTYKL1TSCR80619": 313406.0, "93XTYKL1TSCR80622": 313406.0, "93XTYKL1TSCR80625": 313406.0, "93XTYKL1TSCR80628": 313406.0, "93XTYKL1TSCR80631": 313406.0, "93XTYKL1TSCR80634": 313406.0, "93XTYKL1TSCR80660": 313406.0, "93XTYKL1TSCR80663": 313406.0, "93XTYKL1TSCR80666": 313406.0, "93XTYKL1TSCR80669": 313406.0, "93XTYKL1TSCR80672": 313406.0, "93XTYKL1TSCR80692": 313406.0, "93XTYKL1TSCR80695": 313406.0, "93XTYKL1TSCR80723": 313406.0, "93XTYKL1TSCR80727": 313406.0, "93XTYKL1TSCR80730": 313406.0, "93XTYKL1TSCR80733": 313406.0, "93XTYKL1TSCR80781": 313406.0, "93XTYKL1TSCR80787": 313406.0, "93XTYKL1TSCR80790": 313406.0, "93XTYKL1TSCR80793": 313406.0, "93XTYKL1TSCR80836": 313406.0, "93XTYKL1TSCR80839": 313406.0, "93XTYKL1TSCR80842": 313406.0, "93XTYKL1TSCR80845": 313406.0, "93XTYKL1TSCR80868": 313406.0, "93XTYKL1TSCR80872": 313406.0, "93XTYKL1TSCR80875": 313406.0, "93XTYKL1TSCR80878": 313406.0, "93XTYKL1TSCR80933": 313406.0, "93XTYKL1TSCR80939": 313406.0, "93XTYKL1TSCR80942": 313406.0, "93XTYKL1TSCR80945": 313406.0, "93XTYKL1TSCR80987": 313406.0, "93XTYKL1TSCR80990": 313406.0, "93XTYKL1TSCR80994": 313406.0, "93XTYKL1TSCR80997": 313406.0, "93XTYKL1TSCR81033": 313406.0, "93XTYKL1TSCR81036": 313406.0, "93XTYKL1TSCR81042": 313406.0, "93XTYKL1TSCR81045": 313406.0, "93XTYKL1TSCR81086": 313406.0, "93XTYKL1TSCR81091": 313406.0, "93XTYKL1TSCR81094": 313406.0, "93XTYKL1TSCR81097": 313406.0, "93XTYKL1TSCR81143": 313406.0, "93XTYKL1TSCR81147": 313406.0, "93XTYKL1TSCR81184": 313406.0, "93XTYKL1TSCR81187": 313406.0, "93XTYKL1TSCR81190": 313406.0, "93XTYKL1TSCR81193": 313406.0, "93XTYKL1TSCR81216": 313406.0, "93XTYKL1TSCR81222": 313406.0, "93XTYKL1TSCR81229": 313406.0, "93XTYKL1TSCR81235": 313406.0, "93XTYKL1TSCR81242": 313406.0, "93XTYKL1TSCR81266": 313406.0, "93XTYKL1TSCR81273": 313406.0, "93XTYKL1TSCR81279": 313406.0, "93XTYKL1TSCR81287": 313406.0, "93XTYKL1TSCR81318": 313406.0, "93XTYKL1TSCR81321": 313406.0, "93XTYKL1TSCR81324": 313406.0, "93XTYKL1TSCR81327": 313406.0, "93XTYKL1TSCR81379": 313406.0, "93XTYKL1TSCR81386": 313406.0, "93XTYKL1TSCR81389": 313406.0, "93XTYKL1TSCR81392": 313406.0, "93XTYKL1TSCR81398": 313406.0, "93XTYKL1TSCR81419": 313406.0, "93XTYKL1TSCR81423": 313406.0, "93XTYKL1TSCR81426": 313406.0, "93XTYKL1TSCR81429": 313406.0, "93XTYKL1TSCR81432": 313406.0, "93XTYKL1TSCR79659": 313406.0, "93XTYKL1TSCR79667": 313406.0, "9BRBC3F30R8270629": 127600.0, "9BRBC3F30R8271196": 127600.0, "9BRBC3F38R8270880": 127600.0, "93XTYKL1TRCP78706": 313406.0, "93XTYKL1TRCP78710": 313406.0, "93XTYKL1TRCP78712": 313406.0, "93XTYKL1TRCP78715": 313406.0, "93XTYKL1TRCP78717": 313406.0, "93XTYKL1TRCP78721": 313406.0, "93XTYKL1TRCP78730": 313406.0, "93XTYKL1TRCP78732": 313406.0, "93XTYKL1TRCP78738": 313406.0, "93XTYKL1TRCP78740": 313406.0, "93XTYKL1TRCP78747": 313406.0, "93XTYKL1TRCP78751": 313406.0, "93XTYKL1TRCP78755": 313406.0, "93XTYKL1TRCP78757": 313406.0, "93XTYKL1TRCP78759": 313406.0, "93XTYKL1TRCP78761": 313406.0, "93XTYKL1TRCP78768": 313406.0, "93XTYKL1TRCP78774": 313406.0, "93XTYKL1TRCP78778": 313406.0, "93XTYKL1TRCP78789": 313406.0, "93XTYKL1TRCP78791": 313406.0, "93XTYKL1TRCP78793": 313406.0, "93XTYKL1TRCP78795": 313406.0, "9BG148FK0NC453878": 215943.0, "9BG148FK0NC453891": 215943.0, "9BG148FK0NC453911": 215943.0, "9BG148FK0NC453981": 215943.0, "9BG148FK0NC454024": 215943.0, "93XTYKL1TRCP77515": 313406.0, "93XTYKL1TRCP77532": 313406.0, "93XTYKL1TRCP77673": 313406.0, "93XTYKL1TRCP77756": 313406.0, "93XTYKL1TRCP78014": 313406.0, "9BRBC3F30R8267858": 127600.0, "9BRBC3F31R8268050": 127600.0, "9BRBC3F31R8269330": 127600.0, "9BRBC3F33R8271936": 127600.0, "9BRBC3F34R8268043": 127600.0, "9BRBC3F37R8267386": 127600.0, "9BRBC3F38R8272077": 127600.0, "9BRBC3F3XR8269925": 127600.0, "3N1AB8AE0TY200879": 168082.82, "3N1AB8AE2TY200799": 168082.82, "3N1AB8AE2TY200821": 168082.82, "3N1AB8AE5TY200876": 168082.82, "93XSYKL1TSCR90579": 270774.0, "93XSYKL1TSCR90586": 270774.0, "8AP359AFTSU403397": 115435.99, "8AP359AFTSU410819": 115435.99, "8AP359AFTSU418575": 115435.99, "8AP359AFTSU418738": 115435.99, "8AP359AFTSU418808": 115435.99, "8AP359AFTSU418903": 115435.99, "8AP359AFTSU426960": 115435.99, "8AP359AFWRU371824": 115435.99, "9BG148FK0NC406593": 195000.0, "9BG148FK0NC406650": 195000.0, "9BRBC3F34R8297624": 127800.0, "9BRBC3F32R8298447": 127800.0, "93XTYKL1TSCR80294": 313406.0, "93XTYKL1TSCR80303": 313406.0, "93XTYKL1TRCP77496": 313406.0, "93XTYKL1TRCP77637": 313406.0, "93XTYKL1TRCP77775": 313406.0, "93XTYKL1TRCP77865": 313406.0, "93XTYKL1TRCP78060": 313406.0, "9BRBC3F36R8268979": 127600.0, "9BRBC3F38R8267705": 127600.0, "9BRBC3F38R8269275": 127600.0, "9BRBC3F39R8269267": 127600.0, "9BRBC3F3XR8269553": 127600.0, "93XPYKL1TRCP76491": 313402.0, "93XPYKL1TRCP76802": 313402.0, "93XPYKL1TRCP76815": 313402.0, "93XPYKL1TRCP76824": 313402.0, "93XPYKL1TRCP76881": 313402.0, "93XPYKL1TRCP76929": 313402.0, "93XPYKL1TRCP76951": 313402.0, "93XPYKL1TRCP76977": 313402.0, "93XPYKL1TRCP77008": 313402.0, "93XPYKL1TRCP77065": 313402.0, "9BG156YK0NC451960": 233750.0, "9BG148FK0NC453761": 215943.0, "9BG148FK0NC453997": 215943.0, "9BG148FK0NC449712": 196950.0, "9BG148FK0NC449717": 196950.0, "9BG148FK0NC449719": 196950.0, "9BG148FK0NC449728": 196950.0, "9BG148FK0NC449734": 196950.0, "93Y5SRJSXPJ312433": 92150.0, "8AGBB69S0NR116785": 114700.0, "8AGBB69S0NR116828": 114700.0, "8AGBB69S0NR116845": 114700.0, "8AGBB69S0NR116970": 114700.0, "8AGBB69S0NR117007": 114700.0, "8AGBB69S0NR117022": 114700.0, "8AGBB69S0NR117038": 114700.0, "93Y5SRJSXPJ312343": 92150.0, "93Y5SRJSXPJ312383": 92150.0, "93Y5SRJSXPJ312422": 92150.0, "8AFAR23L0JJ037744": 145584.0, "8AFAR23L6JJ041524": 145584.0, "93XSYKL1TSCS93142": 283884.09, "93XSYKL1TSCS93003": 318226.54, "93XSYKL1TSCS93001": 318226.54, "93XSYKL1TSCS93000": 318226.54, "93XSYKL1TSCS93005": 318226.54, "93XSYKL1TSCS93004": 318226.54, "93XSYKL1TSCS93010": 318226.54, "93XSYKL1TSCS93009": 318226.54, "93XSYKL1TSCS93008": 318226.54, "93XSYKL1TSCS93013": 318226.54, "93XSYKL1TSCS93012": 318226.54, "93XSYKL1TSCS93011": 318226.54, "93XSYKL1TSCS93292": 283884.09, "3N1AB8AEXTY200758": 172000.0, "93XSYKL1TSCS93230": 283968.84, "3N1AB8AE1TY201300": 168082.82, "3N1AB8AE2TY200785": 168082.82, "93XSYKL1TSCS93234": 283968.84, "93XSYKL1TSCS93244": 283968.84, "3N1AB8AE5TY201266": 168082.82, "3N1AB8AE6TY201308": 168082.82, "8AP359AFTSU427136": 115435.99, "3N1AB8AE1TY200566": 168082.82, "3N1AB8AE2TY200513": 168082.82, "8AP359AFTSU426872": 115435.99, "8AP359AFTSU426924": 115435.99, "8AP359AFTSU426958": 115435.99, "8AP359AFTSU427492": 115435.99, "8AP359AFTSU427535": 115435.99, "8AP359AFWRU372581": 115435.99, "93XSYKL1TSCR90420": 270774.0, "8AP359AFWRU380543": 115435.99, "93XSYKL1TSCR91147": 251671.0, "93XSYKL1TSCR91214": 251671.0, "9BRBC3F37R8297018": 127800.0, "9BRBC3F32R8296858": 127800.0, "9BRBC3F36R8297821": 127800.0, "93XTYKL1TSCR80331": 313406.0, "9BM951104NB280619": 413195.0, "93XTYKL1TRCP77658": 313406.0, "93XTYKL1TRCP77697": 313406.0, "93XTYKL1TRCP77749": 313406.0, "93XTYKL1TRCP77867": 313406.0, "93XTYKL1TRCP77899": 313406.0, "93XTYKL1TRCP77919": 313406.0, "9BRBC3F35R8267404": 127600.0, "9BRBC3F35R8269394": 127600.0, "9BRBC3F37R8269073": 127600.0, "9BRBC3F3XR8267463": 127600.0, "9BRBC3F3XR8268919": 127600.0, "93PB40N31FC056122": 224000.0, "8AFAR23L4JJ041487": 145584.0, "8AFAR23L7JJ034274": 145584.0, "8AFAR23L6JJ039434": 145584.0, "8BCND5GVUKG523063": 75998.0, "8BCND5GVULG500843": 75998.0, "8BCND5GVULG500847": 75998.0, "8BCND5GVULG500850": 75998.0, "8BCND5GVULG501317": 75998.0, "8BCND5GVULG501338": 75998.0, "91JPWC601T1000704": 9798.0, "3N1AB8AE9SY260433": 168082.82, "93XSYKL1TSCS93128": 263934.95, "93XSYKL1TSCS93129": 263934.95, "93XSYKL1TSCS92357": 273500.0, "9321FHMJ1DD656446": 53449.0, "9321FHMJ9DD655416": 53449.0, "8AP359AFTSU418716": 115435.99, "8AP359AFTSU432152": 115435.99, "8AP359AFTSU432920": 115435.99, "8AP359AFTSU433306": 115435.99, "9BG156FK0SC405875": 340287.64, "9BG156FK0SC421628": 340287.64, "9BG156FK0SC429117": 340287.64, "9BG156FK0SC429144": 340287.64, "9BG156FK0SC429146": 340287.64, "9BG156FK0SC429147": 340287.64, "9BG156FK0SC429148": 340287.64, "9BG156FK0SC429150": 340287.64, "9BG156FK0SC429176": 340287.64, "9BG156FK0SC429204": 340287.64, "9BG156FK0SC429232": 340287.64, "9BG156FK0SC429257": 340287.64, "9BG156FK0SC429259": 340287.64, "9BG156FK0SC429300": 340287.64, "9BG156FK0SC429329": 340287.64, "9BG156FK0SC429370": 340287.64, "9BG156FK0SC429398": 340287.64, "9BG156FK0SC432027": 340287.64, "9BG156FK0SC432028": 340287.64, "9BG156FK0SC432033": 340287.64, "9BG156FK0SC432035": 340287.64, "9BG156FK0SC432206": 340287.64, "9BG156FK0SC432207": 340287.64, "9BG156FK0SC432208": 340287.64, "9BG156FK0SC432210": 340287.64, "9BG156FK0SC432961": 340287.64, "9BG156FK0SC432962": 340287.64, "9BG156FK0SC432963": 340287.64, "9BG156FK0SC432964": 340287.64, "9BG156FK0SC432965": 340287.64, "9BG156FK0SC432966": 340287.64, "9BG156FK0SC432970": 340287.64, "9BG156FK0SC433000": 340287.64, "9BG156FK0SC433055": 340287.64, "9BG156FK0SC433077": 340287.64, "9BG156FK0SC433095": 340287.64, "9BG156FK0SC433100": 340287.64, "8AP359AFTSU432155": 115435.99, "8AP359AFTSU432541": 115435.99, "8AP359AFTSU432878": 115435.99, "8AP359AFTSU433112": 115435.99, "8AP359AFTSU433210": 115435.99, "8AP359AFTSU433568": 115435.99, "9BM951102SB401320": 466527.58, "93XSYKL1TSCR88479": 228255.95, "9BG156FK0RC428052": 348600.0, "9BG156FK0RC428053": 348600.0, "9BG156FK0RC428070": 348600.0, "9BG156FK0RC428074": 348600.0, "9BG156FK0RC428170": 348600.0, "9BG156FK0RC428171": 348600.0, "9BG156FK0RC432875": 348600.0, "9BRBC3F30S8316756": 127600.0, "9BRBC3F35S8316994": 127600.0, "9BRBC3F30S8306101": 127600.0, "9BRBC3F32S8307508": 127600.0, "9BRBC3F33S8305508": 127600.0, "9BRBC3F34R8296098": 127600.0, "9BRBC3F34R8298708": 127600.0, "9BRBC3F32R8298691": 127600.0, "9BRBC3F30R8270162": 127600.0, "9BRBC3F35R8270724": 127600.0, "9BRBC3F38R8270488": 127600.0, "93XTYKL1TSCR80160": 313406.0, "93XTYKL1TSCR80162": 313406.0, "93XPYKL1TSCR79787": 313402.0, "93XTYKL1TSCR79573": 313406.0, "93XTYKL1TSCR79575": 313406.0, "9BRBC3F31R8270154": 127600.0, "9BRBC3F31R8270557": 127600.0, "9BRBC3F32R8269904": 127600.0, "9BRBC3F32R8270468": 127600.0, "9BRBC3F33R8270530": 127600.0, "9BRBC3F35R8270691": 127600.0, "9BRBC3F36R8270148": 127600.0, "9BRBC3F36R8270456": 127600.0, "9BRBC3F39R8271164": 127600.0, "9BRBC3F3XR8270797": 127600.0, "9BRBC3F3XR8272632": 127600.0, "93XTYKL1TRCP77610": 313406.0, "93XTYKL1TRCP77428": 313406.0, "9BRBC3F30R8267990": 127600.0, "9BRBC3F38R8267977": 127600.0, "9BRBC3F38R8268076": 127600.0, "9BRBC3F39R8268183": 127600.0, "9BG148FK0NC453559": 215943.0, "9BG148FK0NC453783": 215943.0, "9BG148FK0NC453795": 215943.0, "9BG148FK0NC453894": 215943.0, "9BG148FK0NC453947": 215943.0, "93XTYKL1TRCP77416": 313406.0, "93XTYKL1TRCP77443": 313406.0, "93XTYKL1TRCP77682": 313406.0, "93XTYKL1TRCP77869": 313406.0, "93XTYKL1TRCP77972": 313406.0, "93XTYKL1TRCP77977": 313406.0, "9BM951104TB434374": 477400.0, "93XSYKL1TSCS93006": 318226.54, "93XSYKL1TSCR90786": 239060.36, "93XSYKL1TSCS93148": 283968.84, "93XSYKL1TSCR90858": 267355.91, "93XSYKL1TSCR91137": 267355.91, "93XSYKL1TSCR90914": 239060.36, "93XSYKL1TSCR90512": 239060.36, "93XSYKL1TSCR90884": 239060.36, "93XSYKL1TSCS93232": 283968.84, "93XSYKL1TSCS93233": 283968.84, "93XSYKL1TSCS93242": 283968.84, "93XSYKL1TSCS93243": 283968.84, "93XSYKL1TSCS93249": 283968.84, "3N1AB8AE3SY261738": 168082.82, "3N1AB8AEXSY261638": 168082.82, "9BRKC3F34S8354040": 129459.36, "93XSYKL1TSCS93245": 283968.84, "3N1AB8AE8TY200466": 168082.82, "3N1AB8AEXTY200338": 168082.82, "9BRKC3F31S8350883": 129459.36, "9BRKC3F32S8355672": 129459.36, "9BRKC3F34S8354944": 129459.36, "9BG156FK0SC433170": 340287.64, "9BRKC3F30S8349451": 129459.36, "9BRKC3F38S8358723": 129459.36, "9BRKC3F38S8359922": 129459.36, "9BRKC3F39S8357466": 129459.36, "93XSYKL1TSCR86125": 303826.0, "93XSYKL1TSCR86124": 326000.0, "93XSYKL1TSCR86126": 326000.0, "3N1AB8AE4SY232152": 157477.27, "93XSYKL1TSCR87422": 270774.0, "8AP359AFWRU373597": 115435.99, "8AP359AFTSU403775": 115435.99, "8AP359AFTSU404357": 115435.99, "8AP359AFTSU410390": 115435.99, "8AP359AFTSU422307": 115435.99, "8AP359AFTSU422440": 115435.99, "8AP359AFTSU432611": 115435.99, "8AP359AFTSU433908": 115435.99, "9BG156FK0SC417032": 291649.77, "9BG156FK0SC417037": 291649.77, "9BG156FK0SC417041": 291649.77, "8AP359AFWRU390034": 115435.99, "8AP359AFTSU418052": 115435.99, "8AP359AFWRU390069": 115435.99, "9BRKC3F31S8333887": 129459.36, "9BRKC3F33S8333681": 129459.36, "9BRKC3F34S8332412": 129459.36, "9BRKC3F39S8332308": 129459.36, "9BRKC3F39S8333328": 129459.36, "93XSYKL1TSCR88550": 228255.95, "93XSYKL1TSCR88554": 228255.95, "93XSYKL1TSCR88432": 254933.0, "93XSYKL1TSCR88441": 254933.0, "93XSYKL1TSCR88453": 254933.0, "93XSYKL1TSCR90818": 254933.0, "93XSYKL1TSCR90827": 254933.0, "93XSYKL1TSCR90832": 254933.0, "93XSYKL1TSCR90837": 254933.0, "93XSYKL1TSCR90843": 254933.0, "93XSYKL1TSCR90849": 254933.0, "93XSYKL1TSCR90855": 254933.0, "9BRBC3F34S8316887": 127600.0, "93XSYKL1TSCR87470": 270774.0, "93XSYKL1TSCR82660": 254933.0, "9BG156FK0SC406428": 348600.0, "9BG156FK0SC406990": 348600.0, "9BG156FK0SC408885": 348600.0, "9BG156FK0SC408954": 348600.0, "9BG156FK0SC412327": 348600.0, "9BG156FK0SC412090": 348600.0, "9BRBC3F31S8316927": 127600.0, "9BRBC3F30R8296549": 127600.0, "9BRBC3F34R8298188": 127600.0, "9BRBC3F34S8315545": 127600.0, "9BRKC3F31S8338622": 129459.36, "9BRBC3F30R8294168": 127600.0, "9BRBC3F39R8294220": 127600.0, "9BRBC3F3XR8293979": 127600.0, "9BRBC3F30R8294333": 127600.0, "9BRBC3F35R8294098": 127600.0, "9BRBC3F36R8293543": 127600.0, "9BRBC3F36R8294191": 127600.0, "9BRBC3F38R8293852": 127600.0, "9BRBC3F30R8292940": 127600.0, "9BRBC3F33R8293533": 127600.0, "9BRBC3F34R8292939": 127600.0, "9BRBC3F34R8293122": 127600.0, "9BRBC3F34R8293508": 127600.0, "9BRBC3F35R8293579": 127600.0, "9BRBC3F37R8293518": 127600.0, "9BRBC3F37R8293602": 127600.0, "9BRBC3F37R8293678": 127600.0, "9BRBC3F38R8293043": 127600.0, "9BRBC3F3XR8293108": 127600.0, "9BRBC3F32R8271183": 127600.0, "9BRBC3F39R8269883": 127600.0, "9BRKC3F35S8338395": 129459.36, "93XTYKL1TRCP78381": 313406.0, "93XTYKL1TRCP78383": 313406.0, "8AP359AFXRU349402": 115435.99, "8AP359AFXRU351601": 115435.99, "8AP359AFXRU355281": 115435.99, "8AP359AFXRU357886": 115435.99, "93XTYKL1TRCP78356": 313406.0, "93XTYKL1TRCP78358": 313406.0, "93XTYKL1TRCP78360": 313406.0, "93XTYKL1TRCP78372": 313406.0, "93XTYKL1TRCP78376": 313406.0, "93XTYKL1TRCP78388": 313406.0, "93XSYKL1TRCP77810": 310926.0, "8AP359AFXRU357117": 115435.99, "8AP359AFXRU357169": 115435.99, "8AP359AFXRU359471": 115435.99, "8AP359AFXRU361559": 115435.99, "8AP359AFXRU363232": 115435.99, "8AP359AFXRU363662": 115435.99, "8AP359AFXRU363666": 115435.99, "8AP359AFXRU363668": 115435.99, "8AP359AFXRU363670": 115435.99, "8AP359AFXRU363694": 115435.99, "8AP359AFXRU366360": 115435.99, "93XPYKL1TRCP78685": 313402.0, "93XPYKL1TRCP78689": 313402.0, "93XPYKL1TRCP78693": 313402.0, "93XPYKL1TRCP78702": 313402.0, "93XPYKL1TRCP78749": 313402.0, "8AP359AFXRU349465": 115435.99, "8AP359AFXRU356378": 115435.99, "8AP359AFXRU357182": 115435.99, "8AP359AFXRU359508": 115435.99, "8AP359AFXRU359771": 115435.99, "8AP359AFXRU361079": 115435.99, "8AP359AFXRU361493": 115435.99, "8AP359AFXRU361680": 115435.99, "93XTYKL1TRCP77634": 313406.0, "93XTYKL1TRCP77712": 313406.0, "93XTYKL1TRCP77895": 313406.0, "93XTYKL1TRCP77910": 313406.0, "93XTYKL1TRCP77989": 313406.0, "93XTYKL1TRCP78044": 313406.0, "9BG148FK0NC453942": 215943.0, "9BM951104NB280356": 413195.0, "93XSYKL1TSCS93007": 318226.54, "93XDLLC2TVCT13067": 283968.84, "93XDLLC2TVCT12978": 283968.84, "93XDLLC2TVCT12973": 283968.84, "93XDLLC2TVCT14052": 267355.91, "93XDLLC2TVCT14058": 267355.91, "93XDLLC2TVCT14031": 267355.91, "93XDLLC2TVCT14046": 267355.91, "3N1AB8AE4SY259710": 168082.82, "3N1AB8AE8SY259726": 168082.82, "3N1AB8AE7TY200460": 168082.82, "93XSYKL1TSCS93122": 263934.95, "8AP359AFTSU406439": 115435.99, "93XSYKL1TSCR90687": 270774.0, "93XSYKL1TSCR90692": 270774.0, "8AP359AFTSU418768": 115435.99, "8AP359AFTSU418845": 115435.99, "8AP359AFTSU418879": 115435.99, "8AP359AFTSU418881": 115435.99, "8AP359AFTSU418897": 115435.99, "8AP359AFTSU418899": 115435.99, "8AP359AFTSU408193": 115435.99, "8AP359AFTSU422389": 115435.99, "8AP359AFTSU427623": 115435.99, "8AP359AFTSU436510": 115435.99, "8AP359AFTSU416568": 115435.99, "9BRBC3F30S8317017": 127600.0, "9BRBC3F3XS8316523": 127600.0, "9BRBC3F38S8316732": 127600.0, "9BRBC3F3XS8316506": 127600.0, "9BRBC3F31R8298147": 127600.0, "9BRBC3F34R8297347": 127600.0, "9BRBC3F30R8294087": 127600.0, "9BRBC3F33R8294035": 127600.0, "9BRBC3F37R8294720": 127600.0, "9BRBC3F39R8290913": 127600.0, "9BRBC3F30R8272204": 127600.0, "9BRBC3F33R8269135": 127600.0, "93XTYKL1TSCR81100": 313406.0, "93XTYKL1TSCR81103": 313406.0, "93XTYKL1TSCR81106": 313406.0, "93XTYKL1TSCR81109": 313406.0, "93XTYKL1TSCR81113": 313406.0, "93XTYKL1TSCR81116": 313406.0, "93XTYKL1TSCR81124": 313406.0, "93XTYKL1TSCR81127": 313406.0, "93XTYKL1TSCR81134": 313406.0, "93XTYKL1TSCR79669": 313406.0, "9BRBC3F32R8268011": 127600.0, "9BRBC3F33R8271841": 127600.0, "9BRBC3F34R8271928": 127600.0, "9BRBC3F36R8271431": 127600.0, "9BRBC3F38R8268580": 127600.0, "9BRBC3F3XR8268659": 127600.0, "93XTYKL1TRCP77401": 313406.0, "93XTYKL1TRCP77621": 313406.0, "93XTYKL1TRCP77721": 313406.0, "93XTYKL1TRCP77762": 313406.0, "93XTYKL1TRCP77823": 313406.0, "93Y5SRJSXPJ312342": 92150.0, "93Y5SRJSXPJ312346": 92150.0, "93YF62S04TJ448953": 344772.73, "9BG156FK0TC429041": 289017.0, "9BG156FK0TC429155": 289017.0, "9BG156FK0TC429758": 289017.0, "9BG156FK0TC417113": 289017.0, "9BG156FK0TC429760": 289017.0, "9BG156FK0TC429043": 289017.0, "9BG156FK0TC430262": 289017.0, "9BG156FK0TC429763": 289017.0, "9BG156FK0TC417109": 289017.0, "9BG156FK0TC430375": 289017.0, "9BG156FK0TC430218": 289017.0, "9BG156FK0TC429757": 289017.0, "9BG156FK0TC417111": 289017.0, "9BG156FK0TC429182": 289017.0, "9BM951104SB412868": 619900.0, "93XSYKL1TSCR91529": 239116.65, "93XSYKL1TSCS93231": 283968.84, "3N1AB8AEXTY200517": 172000.0, "9BG156FK0SC432024": 305861.89, "9BG156FK0SC436696": 305861.89, "9BG156FK0TC404701": 305861.89, "9BG156FK0TC404912": 305861.89, "9BG156FK0TC404916": 305861.89, "9BG156FK0TC405137": 305861.89, "3N1AB8AEXTY200565": 160069.57, "9BRKC3F37S8349270": 129459.36, "9BRKC3F39S8349335": 129459.36, "9BRKC3F39S8349111": 129459.36, "9BRKC3F38S8348791": 129459.36, "9BRKC3F39S8349237": 129459.36, "9BRKC3F37S8357420": 129459.36, "9BRKC3F34S8350487": 129459.36, "9BRKC3F39S8350405": 129459.36, "9BRKC3F37S8350595": 129459.36, "9BRKC3F33S8350531": 129459.36, "9BRKC3F36S8358476": 129459.36, "9BRKC3F30S8358604": 129459.36, "9BRKC3F34S8355494": 129459.36, "9BRKC3F3XS8351272": 129459.36, "9BRKC3F39S8350940": 129459.36, "9BRKC3F33S8356703": 129459.36, "9BRKC3F35S8355939": 129459.36, "9BRKC3F30S8356951": 129459.36, "9BRKC3F30S8356822": 129459.36, "9BRKC3F37S8349348": 129459.36, "93XSYKL1TSCR90400": 228256.0, "93XSYKL1TSCR86134": 303826.0, "93XSYKL1TSCR86135": 303826.0, "93XSYKL1TSCR86136": 303826.0, "93XSYKL1TSCR86127": 326000.0, "9BM951104SB412821": 605782.26, "8AP359AFWRU386802": 115435.99, "8AP359AFTSU432228": 115435.99, "8AP359AFTSU432606": 115435.99, "8AP359AFTSU432887": 115435.99, "8AP359AFTSU433093": 115435.99, "8AP359AFTSU433216": 115435.99, "3N1AB8AEXSY236643": 160272.73, "8AP359AFTSU433844": 115435.99, "9BRBC3F35S8352135": 127600.0, "9BRBC3F36S8352046": 127600.0, "9BRBC3F37S8352069": 127600.0, "9BRBC3F37S8352170": 127600.0, "9BRBC3F37S8352296": 127600.0, "9BRBC3F3XS8351966": 127600.0, "9BRBC3F3XS8352146": 127600.0, "3N1AB8AEXSY237727": 160272.73, "3N1AB8AE0SY234819": 157477.27, "3N1AB8AEXSY237131": 160272.73, "93XSYKL1TSCR86119": 303826.0, "9BRKC3F31S8345165": 129459.36, "9BRBC3F33S8324771": 127600.0, "9BRBC3F38S8325091": 127600.0, "9BRBC3F38S8325267": 127600.0, "8AP359AFTSU418702": 115435.99, "8AP359AFTSU427661": 115435.99, "8AP359AFTSU428281": 115435.99, "8AP359AFWRU380525": 115435.99, "9BRBC3F35S8352023": 127600.0, "8AP359AFTSU435935": 115435.99, "8AP359AFTSU436074": 115435.99, "8AP359AFWRU371815": 115435.99, "8AP359AFWRU373251": 115435.99, "8AP359AFWRU373814": 115435.99, "9BRKC3F3XS8352566": 129459.36, "8AP359AFTSU425442": 115435.99, "8AP359AFTSU426401": 115435.99, "8AP359AFTSU426909": 115435.99, "8AP359AFTSU427799": 115435.99, "8AP359AFTSU427922": 115435.99, "8AP359AFTSU428075": 115435.99, "8AP359AFTSU399309": 115435.99, "8AP359AFTSU409271": 115435.99, "8AP359AFTSU409467": 115435.99, "8AP359AFTSU416294": 115435.99, "8AP359AFTSU426404": 115435.99, "8AP359AFTSU426626": 115435.99, "8AP359AFTSU426898": 115435.99, "8AP359AFTSU427046": 115435.99, "8AP359AFTSU427049": 115435.99, "8AP359AFTSU427065": 115435.99, "8AP359AFTSU427132": 115435.99, "8AP359AFTSU427144": 115435.99, "8AP359AFTSU427214": 115435.99, "8AP359AFTSU427629": 115435.99, "8AP359AFTSU427733": 115435.99, "8AP359AFTSU427908": 115435.99, "8AP359AFTSU428010": 115435.99, "8AP359AFTSU428594": 115435.99, "8AP359AFTSU428623": 115435.99, "8AP359AFTSU428716": 115435.99, "8AP359AFTSU428737": 115435.99, "8AP359AFTSU429046": 115435.99, "8AP359AFTSU430244": 115435.99, "8AP359AFTSU430895": 115435.99, "8AP359AFTSU431845": 115435.99, "93XSYKL1TSCR87520": 270774.0, "9BRKC3F30S8338417": 129459.36, "9BRKC3F30S8338546": 129459.36, "9BRKC3F3XS8338540": 129459.36, "9BRBC3F30S8323643": 127600.0, "9BRBC3F38S8324250": 127600.0, "9BRBC3F3XS8325853": 127600.0, "8AP359AFWRU371503": 115435.99, "8AP359AFWRU373178": 115435.99, "9BRKC3F32S8331081": 129459.36, "9BRKC3F33S8333616": 129459.36, "9BRKC3F34S8332734": 129459.36, "9BRKC3F36S8334002": 129459.36, "9BRKC3F37S8333246": 129459.36, "9BRKC3F38S8330551": 129459.36, "9BRKC3F3XS8332138": 129459.36, "8AP359AFTSU413404": 115435.99, "8AP359AFTSU415183": 115435.99, "8AP359AFTSU418341": 115435.99, "8AP359AFTSU410726": 115435.99, "8AP359AFTSU414190": 115435.99, "8AP359AFTSU401962": 115435.99, "8AP359AFTSU418307": 115435.99, "9BRKC3F36S8344884": 129459.36, "8AP359AFTSU418696": 115435.99, "8AP359AFWRU389986": 115435.99, "8AP359AFWRU390021": 115435.99, "9BRKC3F37S8345218": 129459.36, "93XSYKL1TSCR88544": 228255.95, "93XSYKL1TSCR87507": 270774.0, "9BG156FK0SC408720": 348600.0, "9BG156FK0SC411799": 348600.0, "9BG156FK0SC412230": 348600.0, "9BRBC3F36S8315157": 127400.0, "9BRBC3F37S8315135": 127400.0, "93XSYKL1TSCR88558": 228255.95, "9BG156FK0SC408920": 348600.0, "9BG156FK0SC407281": 348600.0, "9BG156FK0SC408341": 348600.0, "9BG156FK0SC412295": 348600.0, "9BRBC3F31S8323473": 127600.0, "9BRBC3F33S8323622": 127600.0, "9BRBC3F34S8325640": 127600.0, "9BRBC3F37S8325339": 127600.0, "9BRBC3F39S8326007": 127600.0, "9BRBC3F30S8313887": 127400.0, "9BRBC3F32S8314202": 127400.0, "9BRBC3F3XS8313136": 127400.0, "9BRBC3F3XS8314643": 127400.0, "9BRBC3F30R8291156": 127400.0, "9BRBC3F30R8291786": 127400.0, "9BRBC3F30S8317857": 127400.0, "9BRBC3F31R8289612": 127400.0, "9BRBC3F31R8291442": 127400.0, "9BRBC3F32R8289747": 127400.0, "9BRBC3F33R8291068": 127400.0, "9BRBC3F34S8309857": 127400.0, "9BRBC3F35R8289757": 127400.0, "9BRBC3F35R8290312": 127400.0, "9BRBC3F35R8293128": 127400.0, "9BRBC3F36S8315613": 127400.0, "9BRBC3F36S8316616": 127400.0, "9BRBC3F37R8289968": 127400.0, "9BRBC3F37S8309741": 127400.0, "9BRBC3F37S8315541": 127400.0, "9BRBC3F37S8316592": 127400.0, "9BRBC3F38R8290577": 127400.0, "9BRBC3F38R8293575": 127400.0, "9BRBC3F38S8310106": 127400.0, "9BRBC3F38S8317492": 127400.0, "9BRBC3F39R8289275": 127400.0, "9BRBC3F39S8309059": 127400.0, "9BRBC3F39S8316156": 127400.0, "9BRBC3F3XR8290175": 127400.0, "9BRBC3F3XR8293478": 127400.0, "9BRBC3F3XS8315758": 127400.0, "9BRBC3F3XS8316943": 127400.0, "9BRBC3F3XS8316974": 127400.0, "9BG156FK0RC418605": 348600.0, "9BG156FK0RC418725": 348600.0, "9BG156FK0RC418798": 348600.0, "9BRBC3F31R8276889": 127400.0, "9BRBC3F31R8277458": 127400.0, "9BRBC3F31R8277945": 127400.0, "9BRBC3F31R8272017": 127400.0, "9BRBC3F32R8272267": 127400.0, "9BRBC3F33R8270964": 127400.0, "9BRBC3F39R8272332": 127400.0, "9BRBC3F3XR8272324": 127400.0, "9BRBC3F34R8273307": 127600.0, "9BRBC3F36R8271624": 127600.0, "9BRBC3F37R8272037": 127600.0, "9BRBC3F33R8271693": 127400.0, "9BRBC3F35R8273252": 127400.0, "9BRBC3F36R8272160": 127400.0, "9BRBC3F36R8273308": 127400.0, "9BRBC3F38R8271673": 127400.0, "9BRBC3F32R8270549": 127400.0, "9BRBC3F33R8270866": 127400.0, "9BRBC3F35R8270285": 127400.0, "9BRBC3F35R8270495": 127400.0, "9BRBC3F37R8270952": 127400.0, "9BRBC3F38R8270846": 127400.0, "9BRBC3F3XR8270220": 127400.0, "9BRBC3F30R8293876": 127400.0, "9BRBC3F3XR8294176": 127400.0, "8AP359AFWRU372696": 115435.99, "9BRBC3F30R8271747": 127600.0, "9BRBC3F33R8272651": 127600.0, "9BRBC3F35R8272022": 127600.0, "9BRBC3F3XR8271349": 127600.0, "9BRBC3F30R8272672": 127400.0, "9BRBC3F3XR8272565": 127400.0, "9BRBC3F38R8272645": 127400.0, "9BRBC3F38R8272659": 127400.0, "9BRBC3F31R8272972": 127600.0, "9BRBC3F32R8272740": 127600.0, "9BRBC3F35R8271713": 127600.0, "9BRBC3F36R8272255": 127600.0, "9BRBC3F38R8272693": 127600.0, "9BRBC3F38R8273018": 127600.0, "9BRBC3F30R8294767": 127400.0, "9BRBC3F34R8294416": 127400.0, "9BRBC3F38R8294483": 127400.0, "9BRBC3F30R8277340": 127400.0, "9BRBC3F30R8277645": 127400.0, "9BRBC3F32R8277694": 127400.0, "9BRBC3F37R8294491": 127400.0, "93XTYKL1TSCR79949": 313406.0, "9BRBC3F31R8272597": 127600.0, "9BRBC3F35R8271131": 127600.0, "9BRBC3F37R8271874": 127600.0, "9BRBC3F38R8272063": 127600.0, "9BRBC3F39R8270340": 127600.0, "9BRBC3F3XR8270833": 127600.0, "8AP359AFXRU357903": 115435.99, "8AP359AFXRU357929": 115435.99, "8AP359AFXRU357931": 115435.99, "8AP359AFXRU359620": 115435.99, "8AP359AFXRU359841": 115435.99, "8AP359AFXRU359874": 115435.99, "8AP359AFXRU359877": 115435.99, "8AP359AFXRU359880": 115435.99, "8AP359AFXRU359909": 115435.99, "8AP359AFXRU360325": 115435.99, "8AP359AFXRU360799": 115435.99, "9BRBC3F32R8290347": 127400.0, "9BRBC3F32R8290896": 127400.0, "93XTYKL1TSCR79504": 313406.0, "93XTYKL1TSCR79518": 313406.0, "93XTYKL1TSCR79520": 313406.0, "9BRBC3F31R8267903": 127600.0, "9BRBC3F31R8268999": 127600.0, "9BRBC3F32R8269207": 127600.0, "9BRBC3F33R8268177": 127600.0, "9BRBC3F35R8268696": 127600.0, "9BRBC3F35R8272070": 127600.0, "9BRBC3F36R8268495": 127600.0, "9BRBC3F38R8268353": 127600.0, "9BRBC3F39R8267745": 127600.0, "9BRBC3F39R8271827": 127600.0, "93XTYKL1TRCP77786": 313406.0, "93XTYKL1TRCP78049": 313406.0, "93XTYKL1TSCR79475": 313406.0, "9BRBC3F34R8270536": 127600.0, "9BRBC3F35R8271078": 127600.0, "9BRBC3F36R8270859": 127600.0, "9BRBC3F36R8271767": 127600.0, "9BRBC3F38R8271785": 127600.0, "9BRBC3F38R8273262": 127600.0, "93XTYKL1TSCR79465": 313406.0, "93XTYKL1TSCR79498": 313406.0, "93XTYKL1TSCR79424": 313406.0, "93XTYKL1TSCR79478": 313406.0, "93XTYKL1TSCR79483": 313406.0, "93XTYKL1TSCR79488": 313406.0, "93XTYKL1TSCR79427": 313406.0, "93XTYKL1TSCR79430": 313406.0, "93XTYKL1TSCR79432": 313406.0, "93XTYKL1TSCR79441": 313406.0, "93XTYKL1TSCR79444": 313406.0, "93XTYKL1TSCR79446": 313406.0, "93XTYKL1TSCR79449": 313406.0, "93XTYKL1TSCR79452": 313406.0, "93XTYKL1TSCR79457": 313406.0, "93XTYKL1TSCR79470": 313406.0, "93XTYKL1TSCR79494": 313406.0, "93XTYKL1TSCR79510": 313406.0, "93XTYKL1TSCR79512": 313406.0, "93XTYKL1TSCR79524": 313406.0, "93XTYKL1TSCR79480": 313406.0, "93XTYKL1TSCR79506": 313406.0, "93XTYKL1TSCR79435": 313406.0, "93XTYKL1TSCR79486": 313406.0, "93XTYKL1TSCR79500": 313406.0, "93XTYKL1TSCR79508": 313406.0, "93XTYKL1TSCR79492": 313406.0, "93XTYKL1TSCR79473": 313406.0, "93XTYKL1TSCR79514": 313406.0, "93XTYKL1TRCP77708": 313406.0, "93XSYKL1TSCR88491": 228255.95, "93XTYKL1TRCP77937": 313406.0, "93XTYKL1TRCP77539": 313406.0, "93XTYKL1TRCP77545": 313406.0, "93XTYKL1TRCP77688": 313406.0, "93XTYKL1TRCP77766": 313406.0, "93XTYKL1TRCP77792": 313406.0, "93XTYKL1TRCP77805": 313406.0, "93XTYKL1TRCP77815": 313406.0, "93XTYKL1TRCP77892": 313406.0, "9BRBC3F35P8240510": 127800.0, "9BRBY3BE2P4033928": 195000.0, "9BRBY3BE4P4034031": 195000.0, "9BRBC3F31P8240200": 127800.0, "9BRBC3F32P8239671": 127800.0, "9BRBC3F33P8238495": 127800.0, "9BRBC3F35P8238451": 127800.0, "9BRBC3F35P8238739": 127800.0, "9BRBC3F37P8238581": 127800.0, "9BRBC3F37P8238905": 127800.0, "9BRBC3F37P8240153": 127800.0, "9BRBC3F39P8239019": 127800.0, "9BRBC3F3XP8237828": 127800.0, "8AGBB69S0NR116775": 114700.0, "8AGBB69S0NR116978": 114700.0, "8AGBB69S0NR117209": 114700.0, "8AGBB69S0NR117248": 114700.0, "93Y5SRJSXPJ312382": 92150.0, "93XTYKL1TSCR79455": 313406.0, "93XTYKL1TSCR79459": 313406.0, "93XTYKL1TSCR79462": 313406.0, "93XTYKL1TSCR79467": 313406.0, "9BG148FK0NC421515": 203318.64, "9BG148FK0NC421819": 203318.64, "9BG148FK0NC425842": 203318.64, "9BG148FK0NC426784": 203318.64, "9BG148FK0NC427300": 203318.64, "9BG148FK0NC429027": 203318.64, "9BG148FK0NC429147": 203318.64, "9BG148FK0NC429679": 203318.64, "9BG148FK0NC429690": 203318.64, "9BG148FK0NC429696": 203318.64, "9BG148FK0NC429713": 203318.64, "9BG148FK0NC429717": 203318.64, "9BG148FK0NC430135": 203318.64, "9BG148FK0NC430153": 203318.64, "9BG148FK0NC430175": 203318.64, "9BG148FK0NC430189": 203318.64, "9BG148FK0NC430191": 203318.64, "9BG148FK0NC430265": 203318.64, "9BG148FK0NC430270": 203318.64, "9BG148FK0NC430287": 203318.64, "9BG148FK0NC430298": 203318.64, "9BG148FK0NC430305": 203318.64, "9BG148FK0NC430306": 203318.64, "9BG148FK0NC431416": 203318.64, "9BG148FK0NC431573": 203318.64, "9BG148FK0NC431582": 203318.64, "9BG148FK0NC431610": 203318.64, "9BG148FK0NC431665": 203318.64, "9BG148FK0NC431674": 203318.64, "9BG148FK0NC431807": 203318.64, "9BG148FK0NC431864": 203318.64, "9BG148FK0NC432729": 203318.64, "9BG148FK0NC432735": 203318.64, "9BG148FK0NC432739": 203318.64, "9BG148FK0NC432938": 203318.64, "9BG148FK0NC432966": 203318.64, "9BG148FK0NC432983": 203318.64, "9BG148FK0NC432997": 203318.64, "9BG148FK0NC433012": 203318.64, "9BG148FK0NC433018": 203318.64, "9BG148FK0NC433529": 203318.64, "9BG148FK0NC433841": 203318.64, "93XSYKL1TSCR91387": 239116.65, "93XSYKL1TSCR91516": 239116.65, "3N1AB8AE4TY200593": 169000.0, "3N1AB8AE8SY258592": 168082.82, "3N1AB8AE9SY258536": 168082.82, "93XSYKL1TSCR90422": 270774.0, "93XSYKL1TSCR81698": 326000.0, "93XSYKL1TSCR83550": 326000.0, "93XSYKL1TSCR83551": 326000.0, "93XSYKL1TSCR83552": 326000.0, "93XSYKL1TSCR83553": 326000.0, "8AP359AFTSU432165": 115435.99, "8AP359AFTSU432212": 115435.99, "8AP359AFTSU433557": 115435.99, "8AP359AFTSU433565": 115435.99, "8AP359AFTSU433571": 115435.99, "8AP359AFTSU433828": 115435.99, "8AP359AFTSU433878": 115435.99, "8AP359AFTSU435858": 115435.99, "8AP359AFWRU372702": 115435.99, "8AP359AFWRU373580": 115435.99, "8AP359AFWRU390019": 115435.99, "8AP359AFWRU390036": 115435.99, "93XSYKL1TSCR91175": 251671.0, "93XSYKL1TSCR91178": 251671.0, "9BM958078MB237414": 942000.0, "93XSYKL1TSCR85340": 228255.95, "93XSYKL1TSCR85363": 228255.95, "9BRBC3F39R8296677": 127800.0, "93XTYKL1TSCR80260": 313406.0, "93XTYKL1TSCR80316": 313406.0, "93XPYKL1TSCR79715": 313402.0, "93XTYKL1TSCR80168": 313406.0, "93XTYKL1TSCR80197": 313406.0, "93XTYKL1TSCR80206": 313406.0, "93XTYKL1TSCR80245": 313406.0, "93XTYKL1TSCR80257": 313406.0, "9BRBC3F36R8271171": 127600.0, "9BRBC3F37R8273284": 127600.0, "93XSYKL1TRCP79048": 310926.0, "93XSYKL1TRCP79052": 310926.0, "93XSYKL1TRCP79056": 310926.0, "93XSYKL1TRCP79069": 310926.0, "93XSYKL1TRCP79073": 310926.0, "93XSYKL1TRCP79077": 310926.0, "93XSYKL1TRCP79080": 310926.0, "93XSYKL1TRCP79083": 310926.0, "93XSYKL1TRCP79086": 310926.0, "93XSYKL1TRCP79089": 310926.0, "93XSYKL1TRCP79092": 310926.0, "93XSYKL1TRCP79095": 310926.0, "93XSYKL1TRCP79098": 310926.0, "93XSYKL1TRCP79101": 310926.0, "93XSYKL1TRCP79104": 310926.0, "93XSYKL1TRCP79107": 310926.0, "93XSYKL1TRCP79110": 310926.0, "93XSYKL1TRCP79113": 310926.0, "93XSYKL1TRCP79116": 310926.0, "93XSYKL1TRCP79119": 310926.0, "93XSYKL1TRCP79122": 310926.0, "93XSYKL1TRCP79125": 310926.0, "93XSYKL1TRCP79127": 310926.0, "93XSYKL1TRCP79130": 310926.0, "93XSYKL1TRCP79133": 310926.0, "93XSYKL1TRCP79135": 310926.0, "93XSYKL1TRCP79138": 310926.0, "93XSYKL1TRCP79141": 310926.0, "93XSYKL1TRCP79143": 310926.0, "93XSYKL1TRCP79146": 310926.0, "93XSYKL1TRCP79149": 310926.0, "93XSYKL1TRCP79152": 310926.0, "93XSYKL1TRCP79155": 310926.0, "93XSYKL1TRCP79158": 310926.0, "93XSYKL1TRCP79161": 310926.0, "93XSYKL1TRCP79164": 310926.0, "93XSYKL1TRCP79167": 310926.0, "93XSYKL1TRCP79170": 310926.0, "93XSYKL1TRCP79173": 310926.0, "93XSYKL1TRCP79176": 310926.0, "93XSYKL1TRCP79179": 310926.0, "93XSYKL1TRCP79182": 310926.0, "93XSYKL1TRCP79185": 310926.0, "93XSYKL1TRCP79188": 310926.0, "93XSYKL1TRCP79191": 310926.0, "93XSYKL1TRCP79194": 310926.0, "93XSYKL1TRCP79197": 310926.0, "93XSYKL1TRCP79200": 310926.0, "93XSYKL1TRCP79203": 310926.0, "93XSYKL1TRCP79206": 310926.0, "93XSYKL1TRCP79209": 310926.0, "93XSYKL1TRCP79212": 310926.0, "93XSYKL1TRCP79215": 310926.0, "93XSYKL1TRCP79218": 310926.0, "93XSYKL1TRCP79221": 310926.0, "93XSYKL1TRCP79224": 310926.0, "93XSYKL1TRCP79227": 310926.0, "93XSYKL1TRCP79230": 310926.0, "93XSYKL1TRCP79233": 310926.0, "93XSYKL1TRCP79236": 310926.0, "93XSYKL1TRCP79239": 310926.0, "93XSYKL1TRCP79242": 310926.0, "93XSYKL1TRCP79245": 310926.0, "93XSYKL1TRCP79248": 310926.0, "9BRBC3F30R8268816": 127600.0, "9BRBC3F31R8271921": 127600.0, "9BRBC3F38R8268482": 127600.0, "9BRBC3F39R8268359": 127600.0, "93XTYKL1TRCP77526": 313406.0, "93XTYKL1TRCP77662": 313406.0, "93XTYKL1TRCP77675": 313406.0, "93XTYKL1TRCP77751": 313406.0, "93XTYKL1TRCP77788": 313406.0, "93XTYKL1TRCP77907": 313406.0, "9BG148FK0NC453918": 215943.0, "9BM951104NB280288": 413195.0, "9BG148FK0NC453326": 215943.0, "9BG148FK0NC453787": 215943.0, "9BG148FK0NC453938": 215943.0, "9BG156YK0NC452903": 233750.0, "9BG148FK0NC449618": 196950.0, "8AGBB69S0NR116526": 114700.0, "8AGBB69S0NR117030": 114700.0, "8AGBB69S0NR117178": 114700.0, "9BM958074FB004668": 441983.0, "9BM958074FB013117": 441983.0};

/**
 * Preenche o campo Valor de cada veículo já cadastrado em Veiculos, casando
 * por Chassi com o mapa MAPA_VALOR_LEGADO_POR_CHASSI_ (apurado a partir de
 * uma planilha de controle de contratos externa). Só preenche quando o
 * Valor atual está vazio/zero — nunca sobrescreve um valor já informado
 * manualmente. Não cria veículo novo, não apaga nada.
 */
function importarValorLegado() {
  exigirPerfilAdmin_();
  var sheetVeiculos = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var logSheet = getOrCreateSheet_(SHEET_IMPORT_LOG, CABECALHO_IMPORT_LOG);
  garantirColunasVeiculos_();

  var perfil = getPerfilUsuarioAtual_();
  var agora = new Date();

  var idxChassiV = colunaParaIndice_('Chassi');
  var idxValorV = colunaParaIndice_('ValorVeiculo');
  var idxAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');

  var ultimaLinha = sheetVeiculos.getLastRow();
  var dadosVeiculos = ultimaLinha >= 2
    ? sheetVeiculos.getRange(2, 1, ultimaLinha - 1, CABECALHO_VEICULOS.length).getValues()
    : [];

  var preenchidos = 0, jaTinhaValor = 0, semCorrespondencia = 0;

  dadosVeiculos.forEach(function (linhaV) {
    var chassi = normalizarChassi_(linhaV[idxChassiV]);
    if (!chassi) return;
    var valorLegado = MAPA_VALOR_LEGADO_POR_CHASSI_[chassi];
    if (valorLegado === undefined) { semCorrespondencia++; return; }

    var valorAtual = Number(linhaV[idxValorV]) || 0;
    if (valorAtual > 0) { jaTinhaValor++; return; }

    linhaV[idxValorV] = valorLegado;
    linhaV[idxAtualizacao] = agora;
    linhaV[idxAtualizadoPor] = perfil.email + ' (importação de Valor — base legado)';
    preenchidos++;
  });

  if (dadosVeiculos.length) {
    sheetVeiculos.getRange(2, 1, dadosVeiculos.length, CABECALHO_VEICULOS.length).setValues(dadosVeiculos);
  }

  logSheet.getRange(logSheet.getLastRow() + 1, 1, 1, CABECALHO_IMPORT_LOG.length).setValues([[
    agora, 'IMPORTAR_VALOR', '-', 'INFO',
    'Valores preenchidos: ' + preenchidos + ' | Já tinham valor informado (não sobrescrito): ' + jaTinhaValor +
    ' | Chassi sem correspondência na base legado: ' + semCorrespondencia,
    '', ''
  ]]);

  invalidarCacheDashboard_();

  var mensagem = 'Valores preenchidos: ' + preenchidos + '. Já tinham valor: ' + jaTinhaValor +
    '. Sem correspondência: ' + semCorrespondencia + '. Veja detalhes em "' + SHEET_IMPORT_LOG + '".';
  getSpreadsheet_().toast(mensagem, 'Importar Valor', 10);
  return { preenchidos: preenchidos, jaTinhaValor: jaTinhaValor, semCorrespondencia: semCorrespondencia, mensagem: mensagem };
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
function listarVeiculosDetalhadosUF_(uf, ano, transferido) {
  var filtros = { uf: uf };
  if (ano) filtros.ano = ano;
  if (transferido) filtros.transferido = transferido;
  var registros = listarVeiculos(filtros);

  // "Qtd" = quantos veículos do mesmo processo aparecem neste recorte (UF +
  // Ano + Transferidos) — contexto útil ao ver cada veículo isoladamente.
  var qtdPorProcesso = {};
  registros.forEach(function (r) {
    var chave = r.NumeroProcesso || r.TermoDoacao || '';
    qtdPorProcesso[chave] = (qtdPorProcesso[chave] || 0) + 1;
  });

  return registros.map(function (r) {
    var chave = r.NumeroProcesso || r.TermoDoacao || '';
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
    var chaveA = a.Processo || a.TermoDoacao || '';
    var chaveB = b.Processo || b.TermoDoacao || '';
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
function getVeiculosPorUFDetalhado(uf, ano, transferido) {
  var registros = listarVeiculosDetalhadosUF_(uf, ano, transferido);
  var grupos = {};
  var ordem = [];

  registros.forEach(function (r) {
    var chave = r.Processo || r.TermoDoacao || '';
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
function exportarDetalheUFXlsx(uf, ano, transferido) {
  var registros = listarVeiculosDetalhadosUF_(uf, ano, transferido);
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
