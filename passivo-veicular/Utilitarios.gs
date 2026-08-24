/**
 * Utilitarios.gs
 * Funções genéricas (normalização, validação) e o sistema de login/perfis —
 * copiadas do projeto de Doação Veicular (CodigoCompleto_REFERENCIA_projeto_
 * atual.gs) porque o Passivo Veicular usa o MESMO login: a aba "Usuarios"
 * fica na planilha de Doações, não na planilha própria do Passivo.
 *
 * IMPORTANTE — configuração obrigatória antes de usar o site:
 * Abra o editor do Apps Script > Configurações do projeto > Propriedades do
 * script, e crie a propriedade DOACAO_SPREADSHEET_ID com o ID da planilha
 * "Base de Veículos Doados" do projeto de Doação Veicular (o ID é o trecho
 * da URL da planilha entre /d/ e /edit). Sem isso, getPerfilUsuarioAtual_
 * não encontra a aba "Usuarios" e ninguém consegue entrar no site.
 */

var PROP_DOACAO_SPREADSHEET_ID = 'DOACAO_SPREADSHEET_ID';

var SHEET_USUARIOS = 'Usuarios';
var CABECALHO_USUARIOS = ['Email', 'Perfil', 'UF', 'Nome'];

var PERFIL_ADMIN = 'admin';
var PERFIL_USUARIO = 'usuario';
var PERFIL_VISITANTE = 'visitante';

var UFS_VALIDAS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
  'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
  'SE', 'SP', 'TO'
];

var CODIGOS_ORGAO_FEDERAL = ['PF', 'PRF'];

var CORRECOES_MARCA = {
  'MITSHUBISHI': 'MITSUBISHI',
  'MITISUBISHI': 'MITSUBISHI',
  'MITREN': 'MITSUBISHI'
};

// Órgãos donatários de cada Estado, com CNPJ — usado no cadastro de veículo
// (select de instituição quando a UF tem lista conhecida) e no cadastro de
// infração (select de órgão autuador estadual). Faltam AC, MA, MS, MT, PR e
// SC (não constavam na lista de origem) — para essas UFs o campo continua
// sendo digitado livremente.
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
// PLANILHA DE DOAÇÕES — só para login/perfis (aba "Usuarios")
// ======================================================================

function getSpreadsheetDoacoes_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_DOACAO_SPREADSHEET_ID);
  if (!id) {
    throw new Error('A planilha de Doações (login/usuários) ainda não foi configurada. Peça a um administrador para abrir Configurações do projeto > Propriedades do script e criar a propriedade "' + PROP_DOACAO_SPREADSHEET_ID + '" com o ID da planilha "Base de Veículos Doados".');
  }
  return SpreadsheetApp.openById(id);
}

function getOrCreateSheet_(nome, cabecalho) {
  var ss = getSpreadsheetDoacoes_();
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

// ======================================================================
// NORMALIZAÇÃO E VALIDAÇÃO
// ======================================================================

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

// CNPJ/CPF: guarda só os dígitos (sem ponto, barra, hífen) — assim
// "12.345.678/0001-99" e "12345678000199" digitados por pessoas diferentes
// viram o mesmo valor gravado.
function normalizarCnpjCpf_(valor) {
  return String(valor || '').replace(/\D/g, '');
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

function linhaParaObjeto_(cabecalho, linha) {
  var obj = {};
  cabecalho.forEach(function (campo, i) { obj[campo] = linha[i]; });
  return obj;
}

// ======================================================================
// PERMISSÕES — controle de acesso por perfil (login compartilhado com o
// site de Doação Veicular: mesma planilha, mesma aba "Usuarios").
// admin:     irrestrito.
// usuario:   pode cadastrar e editar, mas não exclui nem restaura da lixeira.
// visitante: só visualiza — nenhuma ação de escrita é permitida.
// ======================================================================

function getEmailUsuarioAtual_() {
  try {
    var email = Session.getActiveUser().getEmail();
    return email || 'desconhecido';
  } catch (e) {
    return 'desconhecido';
  }
}

function getPerfilUsuarioAtual_() {
  var email = getEmailUsuarioAtual_();
  var sheet = getOrCreateSheet_(SHEET_USUARIOS, CABECALHO_USUARIOS);
  var dados = sheet.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    var linha = dados[i];
    if (String(linha[0]).trim().toLowerCase() === email.toLowerCase()) {
      var perfilBruto = normalizarTexto_(linha[1]).toLowerCase();
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
