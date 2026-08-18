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
var SHEET_RELATORIO_ITENS = 'RelatorioItens';
var SHEET_TEP_FINALIZADOS = 'TepFinalizados';
var SHEET_TEP_VISUALIZACOES = 'TepVisualizacoes';
var SHEET_TEP_OBSERVACOES = 'TepObservacoes';

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
  'NumeroSei', 'ValorVeiculo',
  // Emissão de 2ª via do ATPVe de um veículo já cadastrado (documento
  // original perdido/danificado etc.) — só pra fins de relatório, não
  // afeta ATPVeEmitido/ATPVeEnviado nem o fluxo normal de transferência.
  'DataEmissaoSegundaViaATPVe',
  // Data da primeira vez que ATPVeEmitido virou SIM (toggle direto ou
  // cascata ao marcar Transferido) — usada só pelo relatório de
  // produtividade, pra contar emissões de ATPVe dentro de um período.
  'DataEmissaoATPVe',
  // Exclusão lógica (soft delete): excluirVeiculo() nunca mais apaga a
  // linha de verdade — só marca Excluido='SIM' e some das telas normais
  // (listarVeiculos filtra por padrão). Assim um administrador pode
  // restaurar em "Lixeira" se alguém excluir por engano, e o histórico
  // completo do veículo (quem cadastrou, quando foi transferido etc.)
  // não se perde.
  'Excluido', 'ExcluidoPor', 'DataExclusao',
  // Data da primeira vez que ATPVeEnviado virou SIM (toggle direto ou
  // cascata ao marcar Transferido) — companheira de DataEmissaoATPVe, pro
  // dia informado na caixa "Que data o ATPVe foi enviado?" não se perder.
  'DataEnvioATPVe'
];

var CABECALHO_LOG = ['DataHora', 'Usuario', 'Acao', 'IdVeiculo', 'Detalhes'];

var CABECALHO_IMPORT_LOG = ['DataHora', 'AbaOrigem', 'LinhaOrigem', 'Situacao', 'Motivo', 'Chassi', 'Placa'];

// Dados manuais do Relatório de Atividades (ofícios, e-mails,
// reconhecimentos de firma etc.) — um registro por período (chave
// DataInicio+DataFim) pra poder editar/revisar depois.
var CABECALHO_RELATORIO_ITENS = ['Chave', 'DataInicio', 'DataFim', 'ItensJSON', 'AtualizadoPor', 'AtualizadoEm'];

// Processos (chave = ver chaveProcesso_: NumeroProcesso, ou Ano+TermoDoacao
// quando não há) que já tiveram o Termo de Encerramento de Processo (TEP)
// registrado como finalizado — usado só pra tirar da lista de pendentes
// (getProcessosPendentesTep_) um processo
// 100% transferido que já foi encerrado.
var CABECALHO_TEP_FINALIZADOS = ['Chave', 'DataFinalizacao', 'FinalizadoPor'];

// Uma linha por usuário: quando ele visualizou a aba TEP pela última vez —
// só serve pra saber quais processos pendentes são "novos" pra essa pessoa
// (aparecem no aviso vermelho do menu) desde então. Não afeta a lista da
// aba em si, que sempre mostra todos os processos ainda não finalizados.
var CABECALHO_TEP_VISUALIZACOES = ['Email', 'UltimaVisualizacao'];

// Anotação livre por processo pendente de TEP — pra registrar o motivo de
// ainda não ter sido finalizado (ex.: "aguardando assinatura do donatário").
// Uma linha por chave de processo (upsert em salvarObservacaoTep_).
var CABECALHO_TEP_OBSERVACOES = ['Chave', 'Observacao', 'AtualizadoPor', 'AtualizadoEm'];

// AcessoProdutividade ('SIM'/'NÃO'): libera o uso da aba Produtividade pra
// esse usuário específico, independente do Perfil — admins sempre têm
// acesso, isso é só pra estender a quem mais o administrador escolher.
// AcessoPlanilha ('NENHUM'/'LEITOR'/'EDITOR'): nível de compartilhamento
// da planilha do Drive em si (Google Sheets), à parte do Perfil no
// sistema — editar a planilha direto pula todas as validações do site.
var CABECALHO_USUARIOS = ['Email', 'Perfil', 'UF', 'Nome', 'AcessoProdutividade', 'AcessoPlanilha'];

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

// CNPJ/CPF: guarda só os dígitos (sem ponto, barra, hífen) — assim
// "12.345.678/0001-99" e "12345678000199" digitados por pessoas diferentes
// viram o mesmo valor gravado, e buscar ou comparar depois não falha por
// causa da formatação usada na hora de digitar.
function normalizarCnpjCpf_(valor) {
  return String(valor || '').replace(/\D/g, '');
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
        nome: linha[3] || email,
        // Admin sempre tem acesso à Produtividade — o campo na planilha só
        // importa pra estender esse acesso a usuários/visitantes específicos.
        acessoProdutividade: perfil === PERFIL_ADMIN || normalizarTexto_(linha[4]).toUpperCase() === 'SIM'
      };
    }
  }
  return { email: email, perfil: 'sem_acesso', uf: '', nome: email, acessoProdutividade: false };
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

function exigirAcessoProdutividade_() {
  var perfil = getPerfilUsuarioAtual_();
  if (!perfil.acessoProdutividade) {
    throw new Error('Você não tem permissão para usar a aba Produtividade — fale com um administrador.');
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
    tepPendentes: contarTepNovos_(perfil.email)
  };
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

  var corpo = 'Prezado(a) responsável,\n\n' +
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
        totalValor: 0
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

  var candidatos = listarVeiculos({ busca: termo });
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
  for (var i = 1; i < dadosLog.length; i++) {
    var linha = dadosLog[i];
    if (linha[2] === 'SEGUNDA_VIA_ATPVE' && String(linha[3]) === String(idVeiculo) && new Date(linha[0]).getTime() === alvo) {
      linhaAlvo = i + 1;
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
    if (valorAtual && new Date(valorAtual).getTime() === alvo) {
      celula.setValue('');
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

/**
 * Importação pontual dos 5 veículos do Ofício nº 480/2026/TRANSV/COLOG/
 * DGFNSP/SENASP/MJ (Termo de Doação SENASP 439/2026, à Secretaria de
 * Estado da Segurança Pública do Paraná — SEI 36509302, Processo
 * 08020.000781/2026-53). Usa importarVeiculosEmLote_ — lê a planilha
 * uma vez só e grava tudo de uma vez, então roda em segundos mesmo com
 * a base já grande. Rode manualmente pelo editor (selecione
 * "importarOficio480_2026" no menu de funções, clique em Executar,
 * depois Ver > Registros/Execuções pra conferir) — função de uso
 * único, pode apagar depois de rodada.
 */
function importarOficio480_2026() {
  var comum = {
    Ano: 2026,
    Mes: 'AGO',
    UF: 'PR',
    Ente: 'Estado',
    Donataria: 'Secretaria de Estado da Segurança Pública do Paraná',
    TermoDoacao: 'Termo de Doação SENASP 439/2026',
    NumeroSei: '36509302',
    NumeroProcesso: '08020.000781/2026-53',
    Descricao: 'TRAILBLAZER LT D4A',
    Marca: 'CHEVROLET',
    CNPJDonataria: '76.416.932/0001-81',
    CEP: '80420170',
    Logradouro: 'Rua Cel. Dulcídio',
    Numero: '800',
    Bairro: 'Batel',
    Municipio: 'Curitiba',
    ValorVeiculo: 289017.00,
    Transferido: 'NÃO'
  };

  // Anexo I do Ofício 480/2026 (o mesmo Termo de Doação 439/2026 tinha
  // esses dados sem o Renavam completo; o ofício trouxe a tabela
  // completa) — Destinação vira Observações, só de referência.
  var veiculos = [
    { Chassi: '9BG156FK0TC443806', Renavam: '1489869651', Placa: 'UIZ2B44', Observacoes: 'Destinação (Anexo I): Corpo de Bombeiros Militar do Estado do Paraná - 1º GBM Curitiba' },
    { Chassi: '9BG156FK0TC443819', Renavam: '1489876089', Placa: 'UIZ2B59', Observacoes: 'Destinação (Anexo I): Polícia Militar do Estado do Paraná - 18º BPM de Cornélio Procópio - PR' },
    { Chassi: '9BG156FK0TC444587', Renavam: '1489889350', Placa: 'UIZ2B91', Observacoes: 'Destinação (Anexo I): Polícia Militar do Estado do Paraná - 15º BPM de Porecatu - PR' },
    { Chassi: '9BG156FK0TC444654', Renavam: '1489898651', Placa: 'UIZ2C06', Observacoes: 'Destinação (Anexo I): Polícia Civil do Estado do Paraná' },
    { Chassi: '9BG156FK0TC444581', Renavam: '1489894010', Placa: 'UIZ2C00', Observacoes: 'Destinação (Anexo I): Polícia Civil do Estado do Paraná' }
  ];

  var resultado = importarVeiculosEmLote_(comum, veiculos);
  Logger.log('Cadastrados: ' + resultado.criados.length + (resultado.criados.length ? '\n' + resultado.criados.join('\n') : ''));
  if (resultado.jaExistiam.length) Logger.log('Já existiam (ignorados): ' + resultado.jaExistiam.length + '\n' + resultado.jaExistiam.join(', '));
  if (resultado.erros.length) Logger.log('Erros: ' + resultado.erros.length + '\n' + resultado.erros.join('\n'));

  var mensagem = resultado.criados.length + ' de ' + veiculos.length + ' veículo(s) cadastrado(s) com sucesso.' +
    (resultado.jaExistiam.length ? ' ' + resultado.jaExistiam.length + ' já existia(m) (ignorado(s)).' : '') +
    (resultado.erros.length ? ' ' + resultado.erros.length + ' com erro — veja Ver > Registros/Execuções.' : '');
  SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Importar Ofício 480/2026', 15);
  return { criados: resultado.criados.length, jaExistiam: resultado.jaExistiam.length, erros: resultado.erros.length, mensagem: mensagem };
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
    var donoAtualChassi = donoChassi[registro.Chassi];
    var donoAtualPlaca = donoPlaca[registro.Placa];
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

    donoChassi[registro.Chassi] = idAtual;
    donoPlaca[registro.Placa] = idAtual;
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
  var idxNumeroSei = colunaParaIndice_('NumeroSei');
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
        // O Termo de Doação na origem costuma trazer o Número SEI embutido
        // entre parênteses (ex.: "165/2023 (24860169)") — separa aqui pra
        // TermoDoacao e NumeroSei ficarem em campos distintos, sem precisar
        // rodar corrigirNumeroSeiDoTermo depois de cada reconciliação.
        var separadoSei = separarNumeroSeiDoTermo_(linha[COL_ORIGEM.TERMO]);
        var novosValores = {
          Ano: parseInt(linha[COL_ORIGEM.ANO], 10) || linha[COL_ORIGEM.ANO],
          Mes: mes,
          UF: uf,
          Ente: normalizarTexto_(linha[COL_ORIGEM.ENTE]),
          Donataria: normalizarTexto_(linha[COL_ORIGEM.DONATARIA]),
          TermoDoacao: separadoSei.termo,
          Descricao: normalizarTexto_(linha[COL_ORIGEM.DESCRICAO]),
          Marca: normalizarMarca_(linha[COL_ORIGEM.MARCA]),
          Renavam: normalizarTexto_(linha[COL_ORIGEM.RENAVAM]).replace(/\D/g, ''),
          Placa: normalizarPlaca_(linha[COL_ORIGEM.PLACA])
        };
        var linhaV = dadosVeiculos[indiceExistente];
        CAMPOS_ATUALIZAVEIS.forEach(function (campo) {
          linhaV[colunaParaIndice_(campo)] = novosValores[campo];
        });
        // Só grava o SEI extraído se achou algum — senão preserva o que já
        // estava (pode ter sido informado manualmente pela tela).
        if (separadoSei.numeroSei) {
          linhaV[idxNumeroSei] = separadoSei.numeroSei;
        }
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

  // Trava a coluna Contrato como texto puro ANTES de gravar — números de
  // contrato como "07/2017" ou "8/2025" parecem data pro autoparser do
  // Sheets, que os converte sozinho se a coluna não estiver travada (foi
  // assim que a corrupção que corrigirContratosCorrompidos_ conserta
  // aconteceu da primeira vez).
  sheetVeiculos.getRange(2, idxContratoV + 1, sheetVeiculos.getMaxRows() - 1, 1).setNumberFormat('@');

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
 * Repara veículos cujo Contrato foi corrompido pelo autoparser de data do
 * Google Sheets: números de contrato no formato "MM/AAAA" (ex.: "07/2017")
 * foram digitados numa aba de origem sem a coluna travada como texto, o
 * Sheets sozinho interpretou como data, e importarContratoDaOrigem acabou
 * copiando esse valor já corrompido pra Veiculos — virando um texto longo
 * tipo "Sat Jul 01 2017 00:00:00 GMT-0300 (Horário Padrão de Brasília)".
 *
 * Detecta os dois formatos que a corrupção pode assumir (um objeto Date de
 * verdade na célula, ou o texto gerado por Date.toString()), reconstrói o
 * "MM/AAAA" original a partir do mês/ano da própria data corrompida — sem
 * precisar re-consultar a aba de origem, que pode estar com o mesmo
 * problema — e trava a coluna como texto antes de gravar, pra não
 * corromper de novo. Rode manualmente pelo menu "Base de Veículos" depois
 * de implantar esta versão.
 */
function corrigirContratosCorrompidos_() {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheet_(SHEET_VEICULOS, CABECALHO_VEICULOS);
  var idxContrato = colunaParaIndice_('Contrato');
  var idxChassi = colunaParaIndice_('Chassi');
  var idxPlaca = colunaParaIndice_('Placa');
  var idxAtualizacao = colunaParaIndice_('UltimaAtualizacao');
  var idxAtualizadoPor = colunaParaIndice_('AtualizadoPor');
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha < 2) {
    return { corrigidos: 0, mensagem: 'Nenhum veículo cadastrado.' };
  }

  var dados = sheet.getRange(2, 1, ultimaLinha - 1, CABECALHO_VEICULOS.length).getValues();
  var padraoDateToString = /^[A-Za-z]{3} [A-Za-z]{3} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT[+-]\d{4}/;
  var perfil = getPerfilUsuarioAtual_();
  var agora = new Date();
  var corrigidos = [];

  dados.forEach(function (linha) {
    var valor = linha[idxContrato];
    var data = null;
    if (Object.prototype.toString.call(valor) === '[object Date]' && !isNaN(valor.getTime())) {
      data = valor;
    } else if (typeof valor === 'string' && padraoDateToString.test(valor.trim())) {
      var tentativa = new Date(valor);
      if (!isNaN(tentativa.getTime())) data = tentativa;
    }
    if (!data) return;

    var mes = data.getMonth() + 1;
    var novoValor = (mes < 10 ? '0' + mes : String(mes)) + '/' + data.getFullYear();
    corrigidos.push({ chassi: linha[idxChassi], placa: linha[idxPlaca], de: String(valor), para: novoValor });
    linha[idxContrato] = novoValor;
    linha[idxAtualizacao] = agora;
    linha[idxAtualizadoPor] = perfil.email + ' (correção de Contrato corrompido)';
  });

  if (!corrigidos.length) {
    return { corrigidos: 0, mensagem: 'Nenhum Contrato corrompido encontrado — nada pra corrigir.' };
  }

  // Trava a coluna como texto ANTES de gravar, senão o Sheets corrompe de
  // novo os valores "MM/AAAA" que estamos prestes a escrever.
  sheet.getRange(2, idxContrato + 1, sheet.getMaxRows() - 1, 1).setNumberFormat('@');
  sheet.getRange(2, 1, dados.length, CABECALHO_VEICULOS.length).setValues(dados);

  registrarLog_('CORRIGIR_CONTRATOS', '-', 'Contratos corrigidos: ' + corrigidos.length + ' — ' + JSON.stringify(corrigidos));
  invalidarCacheDashboard_();

  var mensagem = corrigidos.length + ' contrato(s) corrompido(s) corrigido(s) com sucesso.';
  SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Corrigir Contratos', 10);
  return { corrigidos: corrigidos.length, detalhes: corrigidos, mensagem: mensagem };
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

  // O Termo de Doação na origem costuma trazer o Número SEI embutido entre
  // parênteses (ex.: "165/2023 (24860169)") — separa aqui pra TermoDoacao e
  // NumeroSei ficarem em campos distintos desde a migração, sem precisar
  // rodar corrigirNumeroSeiDoTermo depois pra corrigir isso retroativamente.
  var separadoSei = separarNumeroSeiDoTermo_(linha[COL_ORIGEM.TERMO]);

  var registro = {
    DataCadastro: agora,
    Ano: parseInt(linha[COL_ORIGEM.ANO], 10) || linha[COL_ORIGEM.ANO],
    Mes: mes,
    UF: uf,
    Ente: ente,
    Donataria: normalizarTexto_(linha[COL_ORIGEM.DONATARIA]),
    TermoDoacao: separadoSei.termo,
    NumeroSei: separadoSei.numeroSei || '',
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
var CACHE_ANOS_SEGUNDOS = 21600; // 6h (máximo do CacheService) — anos disponíveis raríssimo mudam

function invalidarCacheDashboard_() {
  CacheService.getDocumentCache().removeAll(['dash_admin', 'dash_geral', 'anos_disponiveis', 'cobranca_base']);
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
    .setScope('https://graph.microsoft.com/Files.ReadWrite https://graph.microsoft.com/Mail.Send offline_access')
    .setParam('response_mode', 'query');
}

/**
 * Roda esta função manualmente pelo editor do Apps Script (selecione
 * "autorizarMicrosoft" no menu de funções e clique em Executar) uma única
 * vez, depois de preencher MS_CLIENT_ID/MS_CLIENT_SECRET/MS_TENANT_ID nas
 * Propriedades do Script. Ela mostra, no log de execução (Ver > Execuções),
 * o link para abrir e conceder a permissão de acesso ao OneDrive e ao envio
 * de e-mail em nome da conta autorizada (escopo Mail.Send).
 *
 * Se a integração já tinha sido autorizada ANTES do escopo Mail.Send existir
 * (ver getServicoMicrosoft_), é preciso rodar esta função de novo pra
 * conceder a permissão nova — trocar o escopo não amplia sozinho uma
 * autorização já concedida.
 */
function autorizarMicrosoft() {
  var servico = getServicoMicrosoft_();
  if (servico.hasAccess()) {
    Logger.log('Já autorizado.');
  } else {
    Logger.log('Abra este link para autorizar o acesso ao OneDrive e ao envio de e-mail: ' + servico.getAuthorizationUrl());
  }
}

/**
 * Revoga a autorização atual da integração com a Microsoft — use antes de
 * autorizarMicrosoft() quando for preciso conceder um escopo novo (ex.:
 * Mail.Send foi adicionado depois que a integração já estava autorizada só
 * com Files.ReadWrite) e o site da Microsoft não estiver reapresentando a
 * tela de consentimento sozinho.
 */
function reautorizarMicrosoft() {
  getServicoMicrosoft_().reset();
  Logger.log('Autorização anterior removida. Rode autorizarMicrosoft() de novo pra conceder o acesso com o escopo atualizado.');
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

/**
 * Envia um e-mail de verdade pela caixa de saída da conta institucional
 * (Outlook/Microsoft 365) autorizada em autorizarMicrosoft() — usa o mesmo
 * serviço já usado pro backup no OneDrive, só que com o escopo Mail.Send.
 * Devolve true se enviou por aqui; false se a integração não está
 * configurada/autorizada (nesse caso quem chamou deve cair pro MailApp do
 * Google como alternativa).
 */
function enviarEmailViaGraph_(destinatario, cc, assunto, corpo) {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('MS_CLIENT_ID')) return false; // integração não configurada

  var servico = getServicoMicrosoft_();
  if (!servico.hasAccess()) return false; // ainda não autorizado (ou autorizado sem o escopo Mail.Send)

  var mensagem = {
    message: {
      subject: assunto,
      body: { contentType: 'Text', content: corpo },
      toRecipients: String(destinatario).split(';').map(function (e) { return e.trim(); }).filter(Boolean)
        .map(function (e) { return { emailAddress: { address: e } }; }),
      ccRecipients: cc ? [{ emailAddress: { address: cc } }] : []
    },
    saveToSentItems: true
  };

  var resposta = UrlFetchApp.fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(mensagem),
    headers: { Authorization: 'Bearer ' + servico.getAccessToken() },
    muteHttpExceptions: true
  });

  var codigo = resposta.getResponseCode();
  if (codigo < 200 || codigo >= 300) {
    throw new Error('Falha ao enviar pelo Outlook institucional (' + codigo + '): ' + resposta.getContentText());
  }
  return true;
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
 * Distribuição de veículos por UF (ou por Ente, quando campo='Ente'),
 * opcionalmente restrita a um ou mais anos (array ou ano único) e/ou a um
 * status de transferência — usada pelo seletor "Como você deseja
 * visualizar?" (Por UF / Por Região / Por Ente) na tela de Estatísticas.
 * Cada item traz também a soma de ValorVeiculo do recorte, ao lado da
 * contagem. Sem cache: é uma consulta pontual (só quando o usuário troca
 * um filtro), diferente do painel geral que é recalculado toda hora que
 * alguém abre a tela.
 */
function getVeiculosPorUFAno(ano, transferido, campo, ente) {
  var filtros = {};
  if (ano && ano.length) filtros.ano = ano;
  if (transferido) filtros.transferido = transferido;
  if (ente) filtros.ente = ente;
  var registros = listarVeiculos(filtros);
  return contarESomarValorPor_(registros, campo || 'UF');
}

/**
 * Como contarPor_, mas devolve também a soma de ValorVeiculo de cada grupo
 * — usada só pelo painel "Como você deseja visualizar?", que mostra o
 * total em reais ao lado da contagem de veículos por UF/Região.
 */
function contarESomarValorPor_(registros, campo) {
  var mapa = {};
  registros.forEach(function (r) {
    var chave = r[campo] || '(não informado)';
    if (!mapa[chave]) mapa[chave] = { total: 0, valorTotal: 0 };
    mapa[chave].total++;
    mapa[chave].valorTotal += Number(r.ValorVeiculo) || 0;
  });
  return Object.keys(mapa).map(function (chave) {
    return { chave: chave, total: mapa[chave].total, valorTotal: mapa[chave].valorTotal };
  }).sort(function (a, b) { return b.total - a.total; });
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
function listarVeiculosDetalhadosUF_(valor, ano, transferido, campoFiltro, ente) {
  var filtros = {};
  filtros[campoFiltro || 'uf'] = valor;
  if (ano && ano.length) filtros.ano = ano;
  if (transferido) filtros.transferido = transferido;
  if (ente) filtros.ente = ente;
  var registros = listarVeiculos(filtros);

  // "Qtd" = quantos veículos do mesmo processo aparecem neste recorte (UF +
  // Ano + Transferidos) — contexto útil ao ver cada veículo isoladamente.
  var qtdPorProcesso = {};
  registros.forEach(function (r) {
    var chave = chaveProcesso_(r);
    qtdPorProcesso[chave] = (qtdPorProcesso[chave] || 0) + 1;
  });

  return registros.map(function (r) {
    var chave = chaveProcesso_(r);
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
    var chaveA = a.Processo || (a.Ano + ':' + (a.NumeroSei || a.TermoDoacao || ''));
    var chaveB = b.Processo || (b.Ano + ':' + (b.NumeroSei || b.TermoDoacao || ''));
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
function getVeiculosPorUFDetalhado(valor, ano, transferido, campoFiltro, ente) {
  var registros = listarVeiculosDetalhadosUF_(valor, ano, transferido, campoFiltro, ente);
  var grupos = {};
  var ordem = [];

  registros.forEach(function (r) {
    // Ano+SEI (ou Termo, se não houver SEI) quando não há Processo — ver
    // chaveProcesso_ pro mesmo raciocínio (o SENASP reaproveita número de
    // termo por ano, e dois termos iguais no mesmo ano só o SEI separa).
    var chave = r.Processo || (r.Ano + ':' + (r.NumeroSei || r.TermoDoacao || ''));
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
function exportarDetalheUFXlsx(valor, ano, transferido, campoFiltro, ente) {
  var registros = listarVeiculosDetalhadosUF_(valor, ano, transferido, campoFiltro, ente);
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

// Primeiro dia do mês/ano do PROCESSO (não da data de cadastro no sistema —
// que só diz quando o registro foi digitado aqui, útil pra auditoria, mas
// não pra saber há quanto tempo a doação em si está parada).
function dataInicioProcesso_(ano, mes) {
  var idxMes = MESES_VALIDOS.indexOf(mes);
  if (!ano || idxMes === -1) return null;
  return new Date(Number(ano), idxMes, 1);
}

function calcularEstatisticas_(registros) {
  var total = registros.length;
  var porTransferido = contarPor_(registros, 'Transferido');
  var porUF = contarESomarValorPor_(registros, 'UF');
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
      var dataProcesso = dataInicioProcesso_(r.Ano, r.Mes);
      var dias = dataProcesso ? Math.floor((agora - dataProcesso) / 86400000) : null;
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
    porUF: porUF,
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

// ======================================================================
// PASSIVO VEICULAR — Aba Veículos
// Banco separado (planilha própria, fora da planilha de Doações) para
// permitir no futuro compartilhamento de Drive independente entre os dois
// painéis. Login/perfis continuam sendo os mesmos (Usuarios fica na
// planilha de Doações, que é a planilha à qual este projeto está vinculado)
// — só os dados de veículos do passivo ficam na planilha separada.
// ======================================================================

var PROP_PV_SPREADSHEET_ID = 'PV_SPREADSHEET_ID';

var SHEET_PV_VEICULOS = 'Veiculos';

// Sempre adicione campos novos SÓ NO FINAL desta lista. A planilha do
// Passivo já existente não reescreve o cabeçalho sozinha quando esse array
// muda — inserir um campo no meio desalinha a leitura de todas as linhas
// já gravadas (ver corrigirCabecalhoVeiculosPassivo_, que existe
// justamente pra consertar isso quando acontece de novo).
var CABECALHO_PV_VEICULOS = [
  'ID', 'DataCadastro',
  'Marca', 'Modelo', 'Placa', 'Chassi', 'Renavam', 'AnoFabricacao', 'AnoModelo',
  // CNPJProprietario: quem ainda consta como dono no DETRAN (normalmente a
  // União/o ente doador) — a doação em si não transfere o registro no
  // DETRAN, só a posse; enquanto isso não é feito, o veículo é "passivo".
  // SituacaoDetran: texto livre copiado da consulta ao DETRAN (ex.: "EM
  // CIRCULAÇÃO COMUNICADO VENDA") — informativo, não confundir com
  // SituacaoTransferencia, que é o status de workflow controlado por nós.
  'CNPJProprietario', 'SituacaoDetran', 'SituacaoTransferencia',
  'UF', 'Municipio', 'Instituicao', 'CNPJInstituicao', 'DataDoacao', 'NumeroTermoDoacao',
  'Observacoes', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor'
];

var PV_SITUACOES_TRANSFERENCIA = ['PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDA'];

// ---- Débitos > Infrações ----
var SHEET_PV_INFRACOES = 'Infracoes';
var SHEET_PV_INFRACOES_ENVIOS = 'InfracoesEnvios';
// Tabela de referência Artigo (CTB) → Código de enquadramento — fica numa
// aba própria, editável direto na planilha por um administrador (não é
// preciso mexer em código pra corrigir ou completar). O cadastro de
// infração usa ela só pra sugerir/preencher automaticamente; o campo
// Código continua digitável, então nada fica travado nessa lista.
var SHEET_PV_TABELA_INFRACOES = 'TabelaInfracoes';
// Órgãos autuadores — igual à de cima, editável na planilha. Federais
// (DNIT, PRF) valem pra qualquer UF (linha com UF em branco); estaduais
// são por UF; municipais não entram aqui — ficam sempre como texto livre
// no cadastro, porque variam demais por prefeitura.
var SHEET_PV_ORGAOS_AUTUADORES = 'OrgaosAutuadores';

var CABECALHO_PV_INFRACOES = [
  'ID', 'DataCadastro',
  'Placa', 'OrgaoAutuador', 'AIT', 'Artigo', 'Codigo', 'DescricaoInfracao',
  'DataInfracao', 'StatusCancelamento',
  'Observacoes', 'CadastradoPor', 'UltimaAtualizacao', 'AtualizadoPor'
];

// Um envio de pedido de cancelamento por linha (não um contador único) —
// assim dá pra mostrar "2ª via enviada em 12/03/2025" e sinalizar "sem
// resposta" automaticamente com base na data do envio mais recente.
var CABECALHO_PV_INFRACOES_ENVIOS = ['ID', 'IdInfracao', 'DataEnvio', 'RegistradoPor', 'Observacoes'];

var CABECALHO_PV_TABELA_INFRACOES = ['Artigo', 'Descricao', 'Codigo', 'Gravidade'];

var CABECALHO_PV_ORGAOS_AUTUADORES = ['UF', 'Orgao', 'Tipo'];

var PV_STATUS_CANCELAMENTO = ['PENDENTE', 'ENVIADO', 'RECEBIDO', 'CANCELADA', 'NEGADA'];

// Depois de quantos dias sem mudar de status (ainda ENVIADO) o painel
// sinaliza "sem resposta" — só um alerta visual, não bloqueia nada.
var PV_DIAS_SEM_RESPOSTA = 60;

function getSpreadsheetPassivo_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_PV_SPREADSHEET_ID);
  if (!id) {
    throw new Error('A planilha do Passivo Veicular ainda não foi criada. Peça a um administrador para abrir o editor do Apps Script, selecionar a função "criarEstruturaPassivoVeicular" e clicar em Executar.');
  }
  return SpreadsheetApp.openById(id);
}

function getOrCreateSheetPassivo_(nome, cabecalho) {
  var ss = getSpreadsheetPassivo_();
  var sheet = ss.getSheetByName(nome);
  if (!sheet) {
    sheet = ss.insertSheet(nome);
  }
  if (cabecalho && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, cabecalho.length).setFontWeight('bold').setBackground('#1451B4').setFontColor('#ffffff');
  }
  return sheet;
}

// Conserta o cabeçalho (linha 1) da aba Veiculos quando ele ficou
// desatualizado em relação a CABECALHO_PV_VEICULOS — aconteceu quando um
// campo novo (AnoModelo, CNPJProprietario, SituacaoDetran, Municipio) foi
// inserido no meio do array em vez de só no final, e a planilha já criada
// antes disso continuou com os rótulos antigos na linha 1 enquanto os
// dados novos (import do DF) já eram gravados nas posições novas —
// resultado: leitura por nome de coluna vinha toda embaralhada (ex.: "UF"
// mostrando o texto de "Situação DETRAN"). Só reescreve os RÓTULOS da
// linha 1; não toca em nenhuma linha de dado — por isso é seguro rodar
// de novo sempre que a estrutura for atualizada (é chamada automaticamente
// dentro de criarEstruturaPassivoVeicular).
function corrigirCabecalhoVeiculosPassivo_(sheet) {
  var cabecalhoAtual = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), CABECALHO_PV_VEICULOS.length)).getValues()[0];
  var jaCorreto = CABECALHO_PV_VEICULOS.every(function (campo, i) { return cabecalhoAtual[i] === campo; });
  if (jaCorreto) return;
  sheet.getRange(1, 1, 1, CABECALHO_PV_VEICULOS.length).setValues([CABECALHO_PV_VEICULOS]);
  sheet.getRange(1, 1, 1, CABECALHO_PV_VEICULOS.length).setFontWeight('bold').setBackground('#1451B4').setFontColor('#ffffff');
  Logger.log('Cabeçalho da aba Veiculos (Passivo Veicular) corrigido.');
}

// Rode esta função uma vez pelo editor do Apps Script (selecione ela no
// menu de funções, ao lado do botão "Executar", e clique em Executar) pra
// criar a planilha do Passivo Veicular — separada da planilha de Doações,
// com compartilhamento de Drive próprio. Pode rodar de novo sem problema:
// se a planilha já existe, só garante que a aba/cabeçalho estão certos.
function criarEstruturaPassivoVeicular() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_PV_SPREADSHEET_ID);
  var ss = null;
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (e) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('Passivo Veicular - SGP/COLOG');
    props.setProperty(PROP_PV_SPREADSHEET_ID, ss.getId());
  }
  var sheet = ss.getSheetByName(SHEET_PV_VEICULOS) || ss.insertSheet(SHEET_PV_VEICULOS);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, CABECALHO_PV_VEICULOS.length).setValues([CABECALHO_PV_VEICULOS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, CABECALHO_PV_VEICULOS.length).setFontWeight('bold').setBackground('#1451B4').setFontColor('#ffffff');
    sheet.setColumnWidths(1, CABECALHO_PV_VEICULOS.length, 130);
  } else {
    corrigirCabecalhoVeiculosPassivo_(sheet);
  }

  [
    [SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES],
    [SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS],
    [SHEET_PV_TABELA_INFRACOES, CABECALHO_PV_TABELA_INFRACOES],
    [SHEET_PV_ORGAOS_AUTUADORES, CABECALHO_PV_ORGAOS_AUTUADORES]
  ].forEach(function (par) {
    var nomeAba = par[0], cabecalhoAba = par[1];
    var abaNova = ss.getSheetByName(nomeAba) || ss.insertSheet(nomeAba);
    if (abaNova.getLastRow() === 0) {
      abaNova.getRange(1, 1, 1, cabecalhoAba.length).setValues([cabecalhoAba]);
      abaNova.setFrozenRows(1);
      abaNova.getRange(1, 1, 1, cabecalhoAba.length).setFontWeight('bold').setBackground('#1451B4').setFontColor('#ffffff');
    }
  });
  pvFormatarColunaComoTexto_(ss.getSheetByName(SHEET_PV_INFRACOES), CABECALHO_PV_INFRACOES, 'Codigo');
  pvSeedTabelaInfracoesSeVazia_(ss);
  pvSeedOrgaosAutuadoresSeVazia_(ss);

  var abaPadrao = ss.getSheetByName('Sheet1') || ss.getSheetByName('Página1');
  if (abaPadrao && ss.getSheets().length > 1) {
    ss.deleteSheet(abaPadrao);
  }
  Logger.log('Planilha do Passivo Veicular pronta: ' + ss.getUrl());
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Planilha do Passivo Veicular pronta. Abra: ' + ss.getUrl(), 'Passivo Veicular', 15);
  } catch (e) {
    // Rodando sem UI ativa (ex.: direto pelo editor de scripts) — sem problema, a URL já foi gravada no Logger acima.
  }
  return ss.getUrl();
}

function pvProximoId_() {
  var props = PropertiesService.getScriptProperties();
  var seq = Number(props.getProperty('PV_SEQ_VEICULO') || '0');
  seq += 1;
  props.setProperty('PV_SEQ_VEICULO', String(seq));
  return 'PV-' + ('000000' + seq).slice(-6);
}

function pvValidarComuns_(dados) {
  if (!dados.uf) throw new Error('Informe a UF.');
  if (!dados.instituicao) throw new Error('Informe a instituição (donatária).');
  if (!dados.dataDoacao) throw new Error('Informe a data ou ano da doação.');
  if (!dados.numeroTermoDoacao) throw new Error('Informe o número do termo de doação.');
}

function pvValidarVeiculo_(dados) {
  if (!dados.marca) throw new Error('Informe a marca do veículo.');
  if (!dados.modelo) throw new Error('Informe o modelo do veículo.');
  if (!validarPlaca_(normalizarPlaca_(dados.placa))) throw new Error('Placa inválida: ' + dados.placa);
  if (!validarChassi_(normalizarChassi_(dados.chassi))) throw new Error('Chassi inválido: ' + dados.chassi);
  if (!validarRenavam_(dados.renavam)) throw new Error('Renavam inválido: ' + dados.renavam);
  if (!dados.anoFabricacao) throw new Error('Informe o ano de fabricação.');
}

function pvMontarRegistro_(dados, autor, existente) {
  var agora = new Date();
  return {
    ID: existente ? existente.ID : pvProximoId_(),
    DataCadastro: existente ? existente.DataCadastro : agora,
    Marca: normalizarMarca_(dados.marca),
    Modelo: normalizarTexto_(dados.modelo),
    Placa: normalizarPlaca_(dados.placa),
    Chassi: normalizarChassi_(dados.chassi),
    Renavam: normalizarTexto_(dados.renavam),
    AnoFabricacao: Number(dados.anoFabricacao) || dados.anoFabricacao,
    // Sem ano de modelo informado à parte, assume igual ao de fabricação
    // (a imensa maioria dos veículos não tem essa distinção relevante).
    AnoModelo: Number(dados.anoModelo) || Number(dados.anoFabricacao) || dados.anoFabricacao,
    CNPJProprietario: normalizarCnpjCpf_(dados.cnpjProprietario),
    SituacaoDetran: normalizarTexto_(dados.situacaoDetran),
    SituacaoTransferencia: dados.situacaoTransferencia || PV_SITUACOES_TRANSFERENCIA[0],
    UF: normalizarUF_(dados.uf),
    Municipio: normalizarTexto_(dados.municipio),
    Instituicao: normalizarTexto_(dados.instituicao),
    CNPJInstituicao: normalizarCnpjCpf_(dados.cnpjInstituicao),
    DataDoacao: normalizarTexto_(dados.dataDoacao),
    NumeroTermoDoacao: normalizarTexto_(dados.numeroTermoDoacao),
    Observacoes: normalizarTexto_(dados.observacoes),
    CadastradoPor: existente ? existente.CadastradoPor : autor,
    UltimaAtualizacao: agora,
    AtualizadoPor: autor
  };
}

function getListasPassivo() {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  return {
    uf: UFS_VALIDAS.concat(CODIGOS_ORGAO_FEDERAL),
    situacoes: PV_SITUACOES_TRANSFERENCIA
  };
}

function cadastrarVeiculoPassivo(dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarComuns_(dados);
  pvValidarVeiculo_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var registro = pvMontarRegistro_(dados, perfil.email);
  sheet.appendRow(CABECALHO_PV_VEICULOS.map(function (campo) { return registro[campo]; }));
  return { ok: true, id: registro.ID };
}

// dadosComuns: {uf, municipio, instituicao, cnpjInstituicao, dataDoacao, numeroTermoDoacao}
// veiculos: [{marca, modelo, placa, chassi, renavam, anoFabricacao, anoModelo, cnpjProprietario, situacaoDetran, situacaoTransferencia}, ...]
function cadastrarVeiculosPassivoLote(dadosComuns, veiculos) {
  var perfil = exigirPerfilEditor_();
  pvValidarComuns_(dadosComuns);
  if (!veiculos || !veiculos.length) throw new Error('Informe ao menos um veículo.');
  veiculos.forEach(pvValidarVeiculo_);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var linhas = veiculos.map(function (v) {
    var dados = {};
    Object.keys(dadosComuns).forEach(function (k) { dados[k] = dadosComuns[k]; });
    Object.keys(v).forEach(function (k) { dados[k] = v[k]; });
    var registro = pvMontarRegistro_(dados, perfil.email);
    return CABECALHO_PV_VEICULOS.map(function (campo) { return registro[campo]; });
  });
  sheet.getRange(sheet.getLastRow() + 1, 1, linhas.length, CABECALHO_PV_VEICULOS.length).setValues(linhas);
  return { ok: true, quantidade: linhas.length };
}

function listarVeiculosPassivo(filtros) {
  filtros = filtros || {};
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var busca = filtros.busca ? normalizarTexto_(filtros.busca).toUpperCase() : '';
  var resultado = [];

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);

    if (filtros.uf && registro.UF !== filtros.uf) continue;
    if (filtros.instituicao && registro.Instituicao !== filtros.instituicao) continue;
    if (filtros.situacao && registro.SituacaoTransferencia !== filtros.situacao) continue;
    if (busca) {
      var alvo = [registro.Placa, registro.Chassi, String(registro.Renavam), registro.Marca, registro.Modelo, registro.Instituicao, registro.NumeroTermoDoacao].join(' ').toUpperCase();
      if (alvo.indexOf(busca) === -1) continue;
    }

    // Datas viram texto simples antes de voltar ao cliente — evita o bug já
    // visto no google.script.run que devolve null pra listas grandes com
    // muitos objetos Date (ver histórico do painel de Doações).
    registro.DataCadastro = registro.DataCadastro ? Utilities.formatDate(new Date(registro.DataCadastro), 'GMT-3', 'dd/MM/yyyy') : '';
    registro.UltimaAtualizacao = registro.UltimaAtualizacao ? Utilities.formatDate(new Date(registro.UltimaAtualizacao), 'GMT-3', 'dd/MM/yyyy HH:mm') : '';
    resultado.push(registro);
  }

  resultado.sort(function (a, b) { return String(b.ID).localeCompare(String(a.ID)); });
  return resultado;
}

// Usado no cadastro de infração — devolve null (em vez de lançar erro)
// quando a placa ainda não está cadastrada na Aba Veículos, porque uma
// infração pode ser cadastrada antes do veículo em si estar completo.
function buscarVeiculoPassivoPorPlaca(placa) {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var placaNormalizada = normalizarPlaca_(placa);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxPlaca = cabecalho.indexOf('Placa');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxPlaca] === placaNormalizada) {
      var registro = linhaParaObjeto_(cabecalho, valores[i]);
      return { Marca: registro.Marca, Modelo: registro.Modelo, Chassi: registro.Chassi, Renavam: registro.Renavam, UF: registro.UF };
    }
  }
  return null;
}

function getPainelPassivo(filtros) {
  var lista = listarVeiculosPassivo(filtros);
  var painel = { total: lista.length, porSituacao: {}, porUF: {}, porInstituicao: {} };
  PV_SITUACOES_TRANSFERENCIA.forEach(function (s) { painel.porSituacao[s] = 0; });
  lista.forEach(function (v) {
    painel.porSituacao[v.SituacaoTransferencia] = (painel.porSituacao[v.SituacaoTransferencia] || 0) + 1;
    if (v.UF) painel.porUF[v.UF] = (painel.porUF[v.UF] || 0) + 1;
    if (v.Instituicao) painel.porInstituicao[v.Instituicao] = (painel.porInstituicao[v.Instituicao] || 0) + 1;
  });
  return painel;
}

function atualizarVeiculoPassivo(id, dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarComuns_(dados);
  pvValidarVeiculo_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      var existente = linhaParaObjeto_(cabecalho, valores[i]);
      var registro = pvMontarRegistro_(dados, perfil.email, existente);
      var linha = CABECALHO_PV_VEICULOS.map(function (campo) { return registro[campo]; });
      sheet.getRange(i + 1, 1, 1, CABECALHO_PV_VEICULOS.length).setValues([linha]);
      return { ok: true };
    }
  }
  throw new Error('Veículo não encontrado.');
}

function excluirVeiculoPassivo(id) {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var idxId = CABECALHO_PV_VEICULOS.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  throw new Error('Veículo não encontrado.');
}

// Importação única dos veículos do Distrito Federal, a partir da planilha
// "DISTRITO_FEDERAL.xlsx" (aba "SIMPLIFICADA") enviada pelo usuário —
// Marca/Modelo, Ano Fabricação/Modelo, CNPJ Proprietário, Situação DETRAN,
// Município e Instituição (resolvida a partir do CNPJ Origem/Possuidor,
// cruzado com ORGAOS_POR_UF['DF']) já vêm prontos. Data e número do termo
// de doação NÃO vinham na planilha original (o campo "Processo SEI" da
// origem estava em branco) — ficam marcados "A CONFIRMAR" e devem ser
// completados depois, editando cada veículo pelo próprio painel.
// Rode uma vez pelo editor do Apps Script (ou pelo menu "Base de
// Veículos" na planilha de Doações) — já ignora veículos cuja placa já
// exista na planilha do Passivo, então pode rodar de novo sem duplicar.
function importarVeiculosPassivoDF_() {
  var perfil = exigirPerfilEditor_();
  var veiculosDF = [
    { marca: 'GM', modelo: 'ASTRA SEDAN ADVANTAGE', placa: 'JFP2161', chassi: '9BGTR69W07B237917', renavam: '923894314', anoFabricacao: 2007, anoModelo: 2007, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'GM', modelo: 'BLAZER ADVANTAGE', placa: 'JJE4261', chassi: '9BG116GU07C422762', renavam: '927218291', anoFabricacao: 2007, anoModelo: 2007, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'MMC', modelo: 'L200 TRITON 3.2 D', placa: 'OVQ0953', chassi: '93XJNKB8TDCD69648', renavam: '595870511', anoFabricacao: 2013, anoModelo: 2013, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'MMC', modelo: 'L200 TRITON 3.2 D', placa: 'OVQ0963', chassi: '93XJNKB8TDCD69967', renavam: '595878571', anoFabricacao: 2013, anoModelo: 2013, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'MMC', modelo: 'L200 TRITON 3.2 D', placa: 'OVQ0973', chassi: '93XJNKB8TDCD69873', renavam: '595882030', anoFabricacao: 2013, anoModelo: 2013, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'MMC', modelo: 'L200 TRITON 3.2 D', placa: 'OVQ0983', chassi: '93XJNKB8TDCD69930', renavam: '595885560', anoFabricacao: 2013, anoModelo: 2013, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7556', chassi: '9BG148FK0GC400919', renavam: '1094496437', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7557', chassi: '9BG148FK0GC400623', renavam: '1094544040', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7558', chassi: '9BG148FK0GC414659', renavam: '1094496046', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7559', chassi: '9BG148FK0GC416863', renavam: '1094475120', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7560', chassi: '9BG148FK0GC400989', renavam: '1094495805', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS7561', chassi: '9BG148FK0GC414776', renavam: '1094513234', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'CHEVROLET', modelo: 'S10 LT DD4', placa: 'OVS8002', chassi: '9BG148FK0GC401045', renavam: '1094488396', anoFabricacao: 2015, anoModelo: 2016, cnpjProprietario: '394494001370', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'SECRETARIA DE ESTADO DE SEGURANÇA PÚBLICA DO DISTRITO FEDERAL', cnpjInstituicao: '00.394.718/0001-00' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9063', chassi: '8AFAR23L0JJ047092', renavam: '1139257312', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9064', chassi: '8AFAR23L1JJ039437', renavam: '1139257347', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9068', chassi: '8AFAR23L1JJ042483', renavam: '1139257444', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9067', chassi: '8AFAR23L3JJ037768', renavam: '1139257428', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9062', chassi: '8AFAR23L5JJ047119', renavam: '1139257266', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9056', chassi: '8AFAR23L3JJ050908', renavam: '1139257185', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9055', chassi: '8AFAR23L4JJ047113', renavam: '1139257169', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9060', chassi: '8AFAR23L0JJ045133', renavam: '1139257231', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9065', chassi: '8AFAR23L2JJ054299', renavam: '1139257363', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' },
    { marca: 'FORD', modelo: 'RANGER XLTCD4A32C', placa: 'PBE9058', chassi: '8AFAR23L5JJ048819', renavam: '1139257207', anoFabricacao: 2017, anoModelo: 2018, cnpjProprietario: '394494000560', situacaoDetran: 'EM CIRCULACAO COMUNICADO VENDA', municipio: 'BRASILIA', instituicao: 'POLÍCIA MILITAR', cnpjInstituicao: '08.942.610/0001-16' }
  ];

  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var idxPlaca = CABECALHO_PV_VEICULOS.indexOf('Placa');
  var placasExistentes = {};
  for (var i = 1; i < valores.length; i++) {
    placasExistentes[valores[i][idxPlaca]] = true;
  }

  var observacaoImportacao = 'Importado da planilha "Bens Doados (PAN 2007 / Legado 2016) - DF" em ' +
    Utilities.formatDate(new Date(), 'GMT-3', 'dd/MM/yyyy') + '.';
  var linhas = [];
  var ignorados = [];
  veiculosDF.forEach(function (v) {
    var placaNormalizada = normalizarPlaca_(v.placa);
    if (placasExistentes[placaNormalizada]) {
      ignorados.push(v.placa);
      return;
    }
    pvValidarVeiculo_(v);
    var dados = {
      marca: v.marca, modelo: v.modelo, placa: v.placa, chassi: v.chassi, renavam: v.renavam,
      anoFabricacao: v.anoFabricacao, anoModelo: v.anoModelo,
      cnpjProprietario: v.cnpjProprietario, situacaoDetran: v.situacaoDetran,
      situacaoTransferencia: PV_SITUACOES_TRANSFERENCIA[0],
      uf: 'DF', municipio: v.municipio, instituicao: v.instituicao, cnpjInstituicao: v.cnpjInstituicao,
      dataDoacao: 'A CONFIRMAR', numeroTermoDoacao: 'A CONFIRMAR',
      observacoes: observacaoImportacao
    };
    var registro = pvMontarRegistro_(dados, perfil.email);
    linhas.push(CABECALHO_PV_VEICULOS.map(function (campo) { return registro[campo]; }));
  });

  if (linhas.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, linhas.length, CABECALHO_PV_VEICULOS.length).setValues(linhas);
  }

  var mensagem = 'Importação do DF concluída: ' + linhas.length + ' veículo(s) novo(s) cadastrado(s).' +
    (ignorados.length ? ' ' + ignorados.length + ' já existiam (placa já cadastrada) e foram ignorados: ' + ignorados.join(', ') + '.' : '') +
    ' Data e número do termo de doação ficaram como "A CONFIRMAR" — ajuste em cada veículo pela tela Veículos > clique na linha > Editar.';
  Logger.log(mensagem);
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Importação Passivo Veicular - DF', 20);
  } catch (e) {
    // Rodando sem UI ativa — sem problema, a mensagem já foi gravada no Logger acima.
  }
  return mensagem;
}

// ======================================================================
// PASSIVO VEICULAR — Aba Débitos > Infrações
// ======================================================================

// Sheets converte sozinho valores tipo "5037-1" (código-desdobramento) pra
// data (interpreta como ano 5037, mês 1) — mesmo escrevendo pela API, não
// só pela interface. Trava a coluna inteira como texto puro ANTES de
// gravar; sem isso, o valor vira data e a leitura de volta traz um objeto
// Date em vez do código de verdade.
function pvFormatarColunaComoTexto_(sheet, cabecalho, nomeColuna) {
  if (!sheet) return;
  var idx = cabecalho.indexOf(nomeColuna);
  if (idx === -1) return;
  sheet.getRange(1, idx + 1, sheet.getMaxRows(), 1).setNumberFormat('@');
}

// Tabela oficial de códigos de infração (RENAINF), enviada pelo usuário —
// Código da Infração, Desdobramento (quando houver, já concatenado no
// Código como "código-desdobramento"), Descrição da Infração e Amparo
// Legal (artigo/inciso do CTB). Coluna Gravidade não veio nessa planilha
// de origem, por isso fica em branco (não estou inventando classificação
// que não veio da fonte oficial).
function pvDadosRenainf_() {
  return [
    ['257, § 8º', 'Multa, por não identificação do condutor infrator, imposta à pessoa jurídica', '5002', ''],
    ['162, I', 'Dirigir veículo sem possuir CNH ou Permissão para Dirigir', '5010', ''],
    ['162, II', 'Dirigir veículo com CNH ou PPD cassada', '5029-1', ''],
    ['162, II', 'Dirigir veículo com CNH ou PPD com suspensão do direito de dirigir', '5029-2', ''],
    ['162, III', 'Dirigir veículo com CNH de categoria diferente da do veículo e Dirigir veículo com CNH ou PPD com suspensão do direito de dirigir', '5037-1', ''],
    ['162, V', 'Dirigir veículo com validade de CNH/PPD vencida há mais de 30 dias', '5045', ''],
    ['162, VI', 'Dirigir veículo sem usar lentes corretoras de visão e Dirigir veículo sem usar aparelho auxiliar de audição e Dirigir veículo sem usar aparelho auxiliar de prótese física e Dirigir veículo s/ adaptações impostas na concessão/renovação licença conduzir', '5053-1', ''],
    ['163 c/c 162, I', 'Entregar veículo a pessoa sem CNH ou Permissão para Dirigir', '5061', ''],
    ['163 c/c 162, II', 'Entregar veículo a pessoa com CNH ou PPD cassada e Entregar veículo a pessoa com CNH ou PPD com suspensão do direito de dirigir', '5070-1', ''],
    ['163 c/c 162, III', 'Entregar veículo a pessoa com CNH de categoria diferente da do veículo e Entregar veículo a pessoa com PPD de categoria diferente da do veículo', '5088-1', ''],
    ['163 c/c 162, V', 'Entregar veículo a pessoa com CNH/PPD vencida há mais de 30 dias', '5096', ''],
    ['163 c/c 162, VI', 'Entregar o veículo a pessoa sem usar lentes corretoras de visão e Entregar o veículo a pessoa sem usar aparelho auxiliar de audição e Entregar o veículo a pessoa sem aparelho de prótese física e Entregar veíc pessoa s/ adaptações impostas concessão/renovação licença conduzir', '5100-1', ''],
    ['164 c/c 162, I', 'Permitir posse/condução do veículo a pessoa sem CNH ou PPD', '5118', ''],
    ['164 c/c 162, II', 'Permitir posse/condução do veículo a pessoa com CNH ou PPD cassada e Permitir posse/condução veíc pessoa com CNH/PPD c/ suspensão direito de dirigir', '5126-1', ''],
    ['164 c/c 162, III', 'Permitir posse/condução veíc a pessoa com CNH categoria diferente da do veículo e Permitir posse/condução veíc a pessoa com PPD categoria diferente da do veículo', '5134-1', ''],
    ['164 c/c 162, V', 'Permitir posse/condução do veíc a pessoa com CNH/PPD vencida há mais de 30 dias', '5142', ''],
    ['164 c/c 162, VI', 'Permitir posse/condução do veículo a pessoa sem usar lentes corretoras de visão e Permitir posse/condução do veículo a pessoa s/ usar aparelho auxiliar de audição e Permitir posse/condução do veículo a pessoa sem usar aparelho de prótese física e Permitir posse/cond veíc s/ adaptações impostas concessão/renovação licença cond', '5150-1', ''],
    ['165', 'Dirigir sob a influência de álcool e Dirigir sob a influência de qquer substância psicoativa que deter. Dependência', '5169-1', ''],
    ['166', 'Confiar/entregar veíc pess c/ estado físico/psíquico s/ condições dirigir segur', '5177', ''],
    ['167', 'Deixar o condutor de usar o cinto segurança e Deixar o passageiro de usar o cinto segurança', '5185-1', ''],
    ['168', 'Transportar criança sem observância das normas de segurança estabelecidas p/ CTB', '5193', ''],
    ['169', 'Dirigir sem atenção ou sem os cuidados indispensáveis à segurança', '5207', ''],
    ['170', 'Dirigir ameaçando os pedestres que estejam atravessando a via pública e Dirigir ameaçando os demais veículos', '5215-1', ''],
    ['171', 'Usar veículo para arremessar sobre os pedestres água ou detritos e Usar veículo para arremessar sobre os veículos água ou detritos', '5223-1', ''],
    ['172', 'Atirar do veículo objetos ou substâncias e Abandonar na via objetos ou substâncias', '5231-1', ''],
    ['173', 'Disputar corrida', '5240', ''],
    ['174', 'Promover na via competição sem permissão e Promover na via eventos organizados sem permissão e Promover na via exibição e demonstração de perícia em manobra de veículo s/perm', '5258-1', ''],
    ['174', 'Participar na via como condutor em competição sem permissão e Participar na via como condutor em eventos organizados sem permissão e Participar como condutor exib/demonst perícia em manobra de veic s/ permissão', '5266-1', ''],
    ['175', 'Utiliz veíc demonst/exibir manobra perigosa mediante arrancada brusca e Utiliz veíc dem/exibir manob perig med derrap/frenag c/desliz/arrast pneus', '5274-1', ''],
    ['176, I', 'Deixar o cond envolvido em acidente, de prestar ou providenciar socorro a vítima', '5282', ''],
    ['176, II', 'Deixar o cond envolvido em acid, de adotar provid p/ evitar perigo p/o trânsito', '5290', ''],
    ['176, III', 'Deixar o cond envolvido em acidente, de preservar local p/ trab policia/pericia', '5304', ''],
    ['176, IV', 'Deixar o cond envolvido em acid, de remover o veíc local qdo determ polic/agente', '5312', ''],
    ['176, V', 'Deixar o cond envolvido em acid, de identificar-se policial e prestar inf p/o BO', '5320', ''],
    ['177', 'Deixar o cond de prestar socorro vítima acid de trânsito, qdo solicit p/ agente', '5339', ''],
    ['178', 'Deixar o condutor envolvido em acidente s/ vítima, de remover o veículo do local', '5347', ''],
    ['179, I', 'Fazer ou deixar que se faça reparo em veíc, em rodovia e via de trânsito rápido', '5355', ''],
    ['179, II', 'Fazer/deixar que se faça reparo em veíc nas vias (q não rodovia/transito rapido)', '5363', ''],
    ['180', 'Ter seu veículo imobilizado na via por falta de combustível', '5371', ''],
    ['181, I', 'Estacionar nas esquinas e a menos de 5m do alinhamento da via transversal', '5380', ''],
    ['181, II', 'Estacionar afastado da guia da calçada (meio-fio) de 50cm a 1m', '5398', ''],
    ['181, III', 'Estacionar afastado da guia da calçada (meio-fio) a mais de 1m', '5401', ''],
    ['181, IV', 'Estacionar em desacordo com as posições estabelecidas no CTB', '5410', ''],
    ['181, V', 'Estacionar na pista de rolamento das estradas e Estacionar na pista de rolamento das rodovias e Estacionar na pista de rolamento das vias de trânsito rápido e Estacionar na pista de rolamento das vias dotadas de acostamento', '5428-1', ''],
    ['181, VI', 'Estacionar junto/sobre hidr de incêndio, reg de água/tampa de poço visit gal sub', '5436', ''],
    ['181, VII', 'Estacionar nos acostamentos', '5444', ''],
    ['181, VIII', 'Estacionar no passeio, Estacionar sobre faixa destinada a pedestre, Estacionar sobre ciclovia ou ciclofaixa, Estacionar nas ilhas ou refúgios, Estacionar ao lado ou sobre canteiro central/divisores de pista de rolamento, Estacionar ao lado ou sobre marcas de canalização, Estacionar ao lado ou sobre gramado ou jardim público', '5452-1', ''],
    ['181, IX', 'Estacionar em guia de calçada rebaixada destinada à entrada/saída de veículos', '5460', ''],
    ['181, X', 'Estacionar impedindo a movimentação de outro veículo', '5479', ''],
    ['181, XI', 'Estacionar ao lado de outro veículo em fila dupla', '5487', ''],
    ['181, XII', 'Estacionar na área de cruzamento de vias', '5495', ''],
    ['181, XIII', 'Estacionar no ponto de embarque/desembarque de passageiros transporte coletivo', '5509', ''],
    ['181, XIV', 'Estacionar nos viadutos, Estacionar nas pontes, Estacionar nos túneis', '5517-1', ''],
    ['181, XV', 'Estacionar na contramão de direção', '5525', ''],
    ['181, XVI', 'Estacionar aclive/declive ñ freado e sem calço segurança, PBT superior a 3500kg', '5533', ''],
    ['181, XVII', 'Estacionar em desacordo com a regulamentação especificada pela sinalização, estacionamento rotativo, ponto ou vaga de táxi, vaga de carga/descarga, vaga portador necessid especiais, vaga idoso, vaga de curta duração', '5541-1', ''],
    ['181, XVIII', 'Estacionar em local/horário proibido especificamente pela sinalização', '5550', ''],
    ['181, XIX', 'Estacionar local/horário de estacionamento e parada proibidos pela sinalização', '5568', ''],
    ['182, I', 'Parar nas esquinas e a menos 5m do bordo do alinhamento da via transversal', '5576', ''],
    ['182, II', 'Parar afastado da guia da calçada (meio-fio) de 50cm a 1m', '5584', ''],
    ['182, III', 'Parar afastado da guia da calçada (meio-fio) a mais de 1m', '5592', ''],
    ['182, IV', 'Parar em desacordo com as posições estabelecidas no CTB', '5606', ''],
    ['182, V', 'Parar na pista de rolamento das estradas, Parar na pista de rolamento das rodovias, Parar na pista de rolamento das vias de trânsito rápido, Parar na pista de rolamento das demais vias dotadas de acostamento', '5614-1', ''],
    ['182, VI', 'Parar no passeio, Parar sobre faixa destinada a pedestres, Parar nas ilhas ou refúgios, Parar nos canteiros centrais/divisores de pista de rolamento, Parar nas marcas de canalização', '5622-1', ''],
    ['182, VII', 'Parar na área de cruzamento de vias', '5630', ''],
    ['182, VIII', 'Parar nos viadutos, Parar nas pontes, Parar nos túneis', '5649-1', ''],
    ['182, IX', 'Parar na contramão de direção', '5657', ''],
    ['182, X', 'Parar em local/horário proibidos especificamente pela sinalização', '5665', ''],
    ['183', 'Parar sobre faixa de pedestres na mudança de sinal luminoso, e (fisc eletrônica)', '5673-1', ''],
    ['184, I', 'Transitar na faixa/pista da direita regul circulação exclusiva determ veículo', '5681', ''],
    ['184, II', 'Transitar na faixa/pista da esquerda regul circulação exclusiva determ veículo', '5690', ''],
    ['185, I', 'Deixar de conservar o veículo na faixa a ele destinada pela sinalização de regul', '5703', ''],
    ['185, II', 'Deixar de conservar nas faixas da direita o veículo lento e de maior porte', '5711', ''],
    ['186, I', 'Transitar pela contramão de direção em via com duplo sentido de circulação', '5720', ''],
    ['186, II', 'Transitar pela contramão de direção em via c/ sinalização de regul sentido único', '5738', ''],
    ['187, I', 'Transitar em local/horário não permitido pela regul estabelecida p/ autoridade, rodízio, caminhão', '5746-1', ''],
    ['188', 'Transitar ao lado de outro veículo, interrompendo ou perturbando o trânsito', '5762', ''],
    ['189', 'Deixar de dar passagem a veíc precedido de batedores devidamente identificados, Deixar de dar passagem a veíc socorro incêndio/salv serv urgência devid identif, Deixar de dar passagem a veíc de polícia em serviço de urgência devid identif, Deixar de dar passagem a veíc de operação e fiscalização de trânsito devid ident, Deixar de dar passagem a ambulância em serviço de urgência devid identificada', '5770-1', ''],
    ['190', 'Seguir veículo em serv urgência devid identific p/ alarme sonoro/ilum vermelha', '5789', ''],
    ['191', 'Forçar passagem entre veícs trans sent opostos na iminência realiz ultrapassagem', '5797', ''],
    ['192', 'Deixar guardar dist segurança lat/front entre seu veíc e demais e ao bordo pista', '5800', ''],
    ['193', 'Transitar com o veículo em calçadas, passeios, Transitar com o veículo em ciclovias, ciclofaixas - Transitar com o veículo em ajardinamentos, gramados, jardins públicos - Transitar com o veículo em canteiros centrais/divisores de pista de rolamento - Transitar com o veículo em ilhas, refúgios - Transitar com o veículo em marcas de canalização - Transitar com o veículo em acostamentos - Transitar com o veículo em passarelas', '5819-1', ''],
    ['194', 'Transitar em marcha ré, salvo na distância necessária a pequenas manobras', '5827', ''],
    ['195', 'Desobedecer às ordens emanadas da autorid compet de trânsito ou de seus agentes', '5835', ''],
    ['196', 'Deixar de indicar c/ antec, med gesto de braço/luz indicadora, início da marcha - Deixar de indicar c/ antec, med gesto de braço/luz indicadora, manobra de parar - Deixar de indicar c/ antec, med gesto de braço/luz indicadora, mudança direção - Deixar de indicar c/ antec, med gesto de braço/luz indicadora, mudança de faixa', '5843-1', ''],
    ['197', 'Deixar de deslocar c/antecedência veíc p/ faixa mais à esquerda qdo for manobrar - Deixar de deslocar c/antecedência veíc p/ faixa mais à direita qdo for manobrar', '5851-1', ''],
    ['198', 'Deixar de dar passagem pela esquerda quando solicitado', '5860', ''],
    ['199', 'Ultrapassar pela direita, salvo qdo veíc da frente der sinal p/ entrar esquerda', '5878', ''],
    ['200', 'Ultrap pela direita veíc transp colet/escolar parado para emb/desemb passageiros', '5886', ''],
    ['201', 'Deixar de guardar a distância lateral de 1,50m ao passar/ultrapassar bicicleta', '5894', ''],
    ['202, I', 'Ultrapassar pelo acostamento', '5908', ''],
    ['202, II', 'Ultrapassar em interseções - Ultrapassar em passagem de nível', '5916-1', ''],
    ['203, I', 'Ultrapassar pela contramão nas curvas sem visibilidade suficiente - Ultrapassar pela contramão nos aclives ou declives, sem visibilidade suficiente', '5924-1', ''],
    ['203, II', 'Ultrapassar pela contramão nas faixas de pedestre', '5932', ''],
    ['203, III', 'Ultrapassar pela contramão nas pontes - Ultrapassar pela contramão nos viadutos - Ultrapassar pela contramão nos túneis', '5940-1', ''],
    ['203, IV', 'Ultrapassar pela contramão veículo parado em fila junto sinal luminoso - Ultrapassar pela contramão veículo parado em fila junto a cancela/porteira - Ultrapassar pela contramão veículo parado em fila junto a cruzamento - Ultrapassar pela contramão veíc parado em fila junto qq impedimento à circulação', '5959-1', ''],
    ['203, V', 'Ultrapassar pela contramão linha de divisão de fluxos opostos, contínua amarela', '5967', ''],
    ['204', 'Deixar de parar no acostamento à direita, p/ cruzar pista ou entrar à esquerda', '5975', ''],
    ['205', 'Ultrapassar veículo em movimento que integre cortejo/desfile/formação militar', '5983', ''],
    ['206, I', 'Executar operação de retorno em locais proibidos pela sinalização', '5991', ''],
    ['206, II', 'Executar operação de retorno nas curvas - Executar operação de retorno nos aclives ou declives - Executar operação de retorno nas pontes - Executar operação de retorno nos viadutos - Executar operação de retorno nos túneis', '6009-1', ''],
    ['206, III', 'Executar operação de retorno passando por cima de calçada, passeio - Executar operação de retorno passando por cima de ilha, refúgio - Executar operação de retorno passando por cima de ajardinamento - Executar operação de retorno passando por cima de canteiro de divisor de pista - Executar operação de retorno passando por cima de faixa de pedestres - Executar operação de retorno passando por cima de faixa de veíc não motorizados', '6017-1', ''],
    ['206, IV', 'Executar retorno nas interseções, entrando na contramão da via transversal', '6025', ''],
    ['206, V', 'Executar retorno c/prejuízo da circulação/segurança ainda que em local permitido', '6033', ''],
    ['207', 'Executar operação de conversão à direita em local proibido pela sinalização - Executar operação de conversão à esquerda em local proibido pela sinalização', '6041-1', ''],
    ['208', 'Avançar o sinal vermelho do semáforo - Avançar o sinal de parada obrigatória - Avançar o sinal vermelho do semáforo - fiscalização eletrônica', '6050-1', ''],
    ['209', 'Transpor bloqueio viário com ou sem sinalização ou dispositivos auxiliares - Deixar de adentrar às áreas destinadas à pesagem de veículos - Evadir-se para não efetuar o pagamento do pedágio', '6068-1', ''],
    ['210', 'Transpor bloqueio viário policial', '6076', ''],
    ['211', 'Ultrapassar veículos motorizados em fila, parados em razão de sinal luminoso - Ultrapassar veículos motorizados em fila, parados em razão de cancela - Ultrapassar veíc motorizados em fila parados em razão de bloqueio viário parcial - Ultrapassar veículos motorizados em fila, parados em razão de qualquer obstáculo', '6084-1', ''],
    ['212', 'Deixar de parar o veículo antes de transpor linha férrea', '6092', ''],
    ['213, I', 'Deixar de parar sempre que a marcha for interceptada por agrupamento de pessoas', '6106', ''],
    ['213, II', 'Deixar de parar sempre que a marcha for interceptada por agrupamento de veículos', '6114', ''],
    ['214, I', 'Deixar de dar preferência a pedestre/veic ñ motorizado na faixa a ele destinada', '6122', ''],
    ['214, II', 'Deixar de dar preferência a pedestre/veic ñ mot que ñ haja concluído a travessia', '6130', ''],
    ['214, III', 'Deixar de dar preferência a pedestre port deficiência fís/criança/idoso/gestante', '6149', ''],
    ['214, IV', 'Deixar de dar preferência a pedestre/veic ñ mot qdo iniciada travessia s/sinaliz', '6157', ''],
    ['214, V', 'Deixar de dar preferência a pedestre/veic não mot atravessando a via transversal', '6165', ''],
    ['215, I, a', 'Deixar de dar preferência em interseção ñ sinaliz, a veíc circulando por rodovia - Deixar de dar preferência em interseção ñ sinaliz, veíc circulando por rotatória - Deixar de dar prefer em interseção não sinalizada, a veículo que vier da direita', '6173-1', ''],
    ['215, II', 'Deixar de dar preferência nas interseções com sinalização de Dê a Preferência', '6181', ''],
    ['216', 'Entrar/sair área lindeira sem precaução com a segurança de pedestres e veículos', '6190', ''],
    ['217', 'Entrar/sair de fila de veículos estacionados sem dar pref a pedestres/veículos', '6203', ''],
    ['219', 'Transitar em velocidade inferior à metade da máxima da via, salvo faixa direita', '6254', ''],
    ['220, I', 'Deixar de reduzir a veloc qdo se aproximar de passeata/aglomeração/desfile/etc', '6262', ''],
    ['220, II', 'Deixar de reduzir a veloc onde o trânsito esteja sendo controlado pelo agente', '6270', ''],
    ['220, III', 'Deixar de reduzir a velocidade do veículo ao aproximar-se da guia da calçada - Deixar de reduzir a velocidade do veículo ao aproximar-se do acostamento', '6289-1', ''],
    ['220, IV', 'Deixar de reduzir velocidade do veículo ao aproximar-se interseção ñ sinalizada', '6297', ''],
    ['220, V', 'Deixar reduzir velocidade nas vias rurais cuja faixa domínio não esteja cercada', '6300', ''],
    ['220, VI', 'Deixar de reduzir a velocidade nos trechos em curva de pequeno raio', '6319', ''],
    ['220, VII', 'Deixar de reduzir veloc ao aproximar local sinaliz advert de obras/trabalhadores', '6327', ''],
    ['220, VIII', 'Deixar de reduzir a velocidade sob chuva/neblina/cerração/ventos fortes', '6335', ''],
    ['220, IX', 'Deixar de reduzir a velocidade quando houver má visibilidade', '6343', ''],
    ['220, X', 'Deixar de reduzir veloc qdo pavimento se apresentar escorreg/defeituoso/avariado', '6351', ''],
    ['220, XI', 'Deixar de reduzir a velocidade à aproximação de animais na pista', '6360', ''],
    ['220, XII', 'Deixar de reduzir a velocidade de forma compatível com a segurança, em declive', '6378', ''],
    ['220, XIII', 'Deixar de reduzir veloc de forma compatível c/ segurança ao ultrapassar ciclista', '6386', ''],
    ['220, XIV', 'Deixar de reduzir a velocidade nas proximidades de escolas - Deixar de reduzir a velocidade nas proximidades de hospitais - Deixar de reduzir veloc na proxim estação embarque/desembarque passageiros - Deixar de reduzir veloc onde haja intensa movimentação de pedestres', '6394-1', ''],
    ['221', 'Portar no veículo placas de identificação em desacordo c/ especif/modelo Contran', '6408', ''],
    ['221, § único', 'Confec/distribuir/colocar veíc próprio/terceiro placa identif desacordo Contran', '6416', ''],
    ['222', 'Deixar de manter ligado em emerg sist ilum vermelha intermitente ainda q parado', '6424', ''],
    ['223', 'Transitar com farol desregulado perturbando visão outro condutor - Transitar com o facho de luz alta perturbando visão outro condutor', '6432-1', ''],
    ['224', 'Fazer uso do facho de luz alta dos faróis em vias providas de iluminação pública', '6440', ''],
    ['225, I', 'Deixar de sinalizar via p/ tornar visível local qdo tiver remover veíc da pista - Deixar de sinalizar a via p/ tornar visível o local qdo permanecer acostamento', '6459-1', ''],
    ['225, II', 'Deixar de sinalizar a via p/ tornar visível o local qdo a carga for derramada', '6467', ''],
    ['226', 'Deixar de retirar qualquer objeto utilizado para sinalização temporária da via', '6475', ''],
    ['227, I', 'Usar buzina que não a de toque breve como advertência a pedestre ou condutores', '6483', ''],
    ['227, II', 'Usar buzina prolongada e sucessivamente a qualquer pretexto', '6491', ''],
    ['227, III', 'Usar buzina entre as vinte e duas e as seis horas', '6505', ''],
    ['227, IV', 'Usar buzina em locais e horários proibidos pela sinalização', '6513', ''],
    ['227, V', 'Usar buzina em desacordo c/ os padrões e freqüências estabelecidas pelo Contran', '6521', ''],
    ['228', 'Usar no veículo equip c/ som em volume/freqüência não autorizados pelo Contran', '6530', ''],
    ['229', 'Usar no veíc alarme/aparelho produz som perturbe sossego púb desac norma Contran', '6548', ''],
    ['230, I', 'Conduzir o veículo com o lacre de identificação violado/falsificado - Conduzir o veículo com a inscrição do chassi violada/falsificada - Conduzir o veículo com o selo violado/falsificado - Conduzir o veículo com a placa violada/falsificada - Conduzir o veículo com qualquer outro elem de identificação violado/falsificado', '6556-1', ''],
    ['230, II', 'Conduzir o veículo transportando passageiros em compartimento de carga', '6564', ''],
    ['230, III', 'Conduzir o veículo com dispositivo antirradar', '6572', ''],
    ['230, IV', 'Conduzir o veículo sem qualquer uma das placas de identificação', '6580', ''],
    ['230, V', 'Conduzir o veículo que não esteja registrado - Conduzir o veículo registrado que não esteja devidamente licenciado', '6599-1', ''],
    ['230, VI', 'Conduzir o veículo com qualquer uma das placas sem legibilidade e visibilidade', '6602', ''],
    ['230, VII', 'Conduzir o veículo com a cor alterada - Conduzir o veículo com característica alterada', '6610-1', ''],
    ['230, VIII', 'Conduzir veículo s/ ter sido submetido à inspeção seg veicular, qdo obrigatória', '6629', ''],
    ['230, IX', 'Conduzir o veículo sem equipamento obrigatório - Conduzir o veículo com equipamento obrigatório ineficiente/inoperante', '6637-1', ''],
    ['230, X', 'Conduzir o veículo com equip obrigatório em desacordo com o estab pelo Contran', '6645', ''],
    ['230, XI', 'Conduzir o veículo com descarga livre - Conduzir o veículo com silenciador de motor defeituoso/deficiente/inoperante', '6653-1', ''],
    ['230, XII', 'Conduzir o veículo com equipamento ou acessório proibido', '6661', ''],
    ['230, XIII', 'Conduzir o veículo c/ equip do sistema de iluminação e de sinalização alterados', '6670', ''],
    ['230, XIV', 'Conduzir veíc c/ registrador instan inalt de velocidade/tempo viciado/defeituoso', '6688', ''],
    ['230, XV', 'Conduzir c/ inscr/adesivo/legenda/símbolo afixado pára-brisa e extensão traseira - Conduzir c/ inscr/adesivo/legenda/símbolo pintado pára-brisa e extensão traseira', '6696-1', ''],
    ['230, XVI', 'Conduzir veíc com vidro total/parcialmente coberto por película, painéis/pintura', '6700', ''],
    ['230, XVII', 'Conduzir o veículo com cortinas ou persianas fechadas', '6718', ''],
    ['230, XVIII', 'Conduzir o veículo em mau estado de conservação, comprometendo a segurança - Conduzir o veículo reprovado na avaliação de inspeção de segurança - Conduzir o veículo reprovado na avaliação de emissão de poluentes e ruído', '6726-1', ''],
    ['230, XIX', 'Conduzir o veículo sem acionar o limpador de pára-brisa sob chuva', '6734', ''],
    ['230, XX', 'Conduzir o veículo sem portar a autorização para condução de escolares', '6742', ''],
    ['230, XXI', 'Conduzir o veíc de carga c/ falta inscrição da tara e demais previstas no CTB', '6750', ''],
    ['230, XXII', 'Conduzir o veículo com defeito no sistema de iluminação/lâmpada queimada - Conduzir o veículo com defeito no sistema de sinalização/lâmpada queimada', '6769-1', ''],
    ['231, I', 'Transitar com o veículo danificando a via, suas instalações e equipamentos', '6777', ''],
    ['231, II, a', 'Transitar com veículo derramando a carga que esteja transportando - Transitar com veículo lançando a carga que esteja transportando - Transitar com veículo arrastando a carga que esteja transportando', '6785-1', ''],
    ['231, II, b', 'Transitar com veíc derramando/lançando combustível/lubrif que esteja utilizando', '6793', ''],
    ['231, II, c', 'Transitar c/veíc derraman/lançando/arrastando objeto possa acarretar risco acid', '6807', ''],
    ['231, III', 'Transitar com veículo produzindo fumaça, gases ou partículas em desac c/ Contran', '6815', ''],
    ['231, IV', 'Transitar c/ veíc e/ou carga c/ dimensões superiores limite legal s/ autorização - Transitar c/ veíc e/ou carga c/ dimensões superiores est p/sinalização s/autoriz', '6823-1', ''],
    ['231, V', 'Transitar com o veículo com excesso de peso PBT/PBTC - Transitar com o veículo com excesso de peso - Por Eixo - Transitar com o veículo com excesso de peso - PBT/PBTC e Por Eixo', '6831-1', ''],
    ['231, VI', 'Transitar em desacordo c/ autorização expedida p/veículo c/ dimensões excedentes - Transitar com autorização vencida, expedida p/ veículo c/ dimensões excedentes', '6840-1', ''],
    ['231, VII', 'Transitar com o veículo com lotação excedente', '6858', ''],
    ['231, VIII', 'Transitar efetuando transporte remunerado de pessoas qdo ñ licenciado p/esse fim - Transitar efetuando transporte remunerado de bens qdo não licenciado p/ esse fim', '6866-1', ''],
    ['231, IX', 'Transitar com o veículo desligado em declive - Transitar com o veículo desengrenado em declive', '6874-1', ''],
    ['231, X', 'Transitar com o veículo excedendo a CMT em até 600 kg', '6882', ''],
    ['231, X', 'Transitar com o veículo excedendo a CMT entre 601 e 1.000 kg', '6890', ''],
    ['231, X', 'Transitar com o veículo excedendo a CMT acima de 1.000 kg', '6904', ''],
    ['232', 'Conduzir veículo sem os documentos de porte obrigatório referidos no CTB', '6912', ''],
    ['233 c/c 123, I, II, III, IV', 'Deixar de efetuar registro do veículo em 30 dias, qdo for transf a propriedade - Deixar de efetuar reg do veíc em 30 dias, qdo mudar o munic de domicilio/resid - Deixar de efetuar reg de veíc em 30 dias, qdo for alterada qquer caract do veic - Deixar de efetuar registro de veículo em 30 dias, qdo houver mudança de categoria', '6920-1', ''],
    ['234', 'Falsificar ou adulterar documento de habilitação - Falsificar ou adulterar documento de identificação do veículo', '6939-1', ''],
    ['235', 'Conduzir pessoas nas partes externas do veículo - Conduzir animais nas partes externas do veículo - Conduzir carga nas partes externas do veículo', '6947-1', ''],
    ['236', 'Rebocar outro veículo com cabo flexível ou corda', '6955', ''],
    ['237', 'Trans c/veíc desac c/especificação/falta de inscr/simbologia necessária identif', '6963', ''],
    ['238', 'Recusar-se a entregar CNH/CRV/CRLV/ outros documentos', '6971', ''],
    ['239', 'Retirar do local veículo legalmente retido para regularização, sem permissão', '6980', ''],
    ['240', 'Deixar responsável de promover baixa registro de veíc irrecuperável/desmontado', '6998', ''],
    ['241', 'Deixar de atualizar o cadastro de registro do veículo - Deixar de atualizar o cadastro de habilitação do condutor', '7005-1', ''],
    ['242', 'Fazer falsa declaração de domicílio para fins de registro/licenciamento - Fazer falsa declaração de domicílio para fins de habilitação', '7013-1', ''],
    ['243', 'Deixar seguradora de comunicar ocorrência perda total veíc e devolver placas/doc', '7021', ''],
    ['244, I', 'Conduzir motocicleta, motoneta e ciclomotor sem capacete de segurança - Conduzir motocicleta, motoneta e ciclomotor sem vestuário aprovado pelo Contran', '7030-1', ''],
    ['244, II', 'Conduzir motocicleta, motoneta e ciclomotor transportando passageiro s/ capacete - Conduzir motocicleta/motoneta/ciclomotor transportando pas. fora do assento', '7048-1', ''],
    ['244, III', 'Conduzir motoc/moton/ciclomotor fazendo malabarismo/equilibrando-se em uma roda - Conduzir ciclo fazendo malabarismo ou equilibrando-se em uma roda', '7056-1', ''],
    ['244, IV', 'Conduzir motocicleta, motoneta e ciclomotor com os faróis apagados', '7064', ''],
    ['244, V', 'Conduzir motocicleta/motoneta/ciclomotor transportando criança menor de 7 anos - Conduzir motoc/moton/ciclom transp criança s/ condição cuidar própria segurança', '7072-1', ''],
    ['244, VI', 'Conduzir motocicleta, motoneta e ciclomotor rebocando outro veículo', '7080', ''],
    ['244, VII', 'Conduzir motocicleta/motoneta/ciclomotor sem segurar o guidom com ambas as mãos', '7099-1', ''],
    ['244, VIII', 'Conduzir motocicleta, motoneta e ciclomotor transportando carga incompatível - Conduzir motoc/moton/ transportando carga em desacordo c/ § 2º do Art 139-A CTB', '7102-1', ''],
    ['244, § 1º, a', 'Conduzir ciclo transportando passageiro fora da garupa/assento a ele destinado', '7110', ''],
    ['244, § 1º, b', 'Conduzir ciclo via de trâns rápido ou rodovia salvo se houver acostam/fx própria - Conduzir ciclomotor em via de trânsito rápido - Conduzir ciclomotor em rodovia salvo se houver acostamento ou faixa própria', '7129-1', ''],
    ['244, § 1º, c', 'Conduzir ciclo transportando criança s/ condição de cuidar própria segurança', '7137', ''],
    ['245', 'Utilizar a via para depósito de mercadorias, materiais ou equipamentos', '7145', ''],
    ['246', 'Deixar de sinalizar obstáculo à circulação/segurança calçada/pista-s/agravamento - Obstaculizar a via indevidamente-s/agravamento', '7153-1', ''],
    ['246', 'Deixar de sinalizar obstáculo circulação/segurança calçada/pista-agravamento 2X - Obstaculizar a via indevidamente-agravamento 2X', '7161-1', ''],
    ['246', 'Deixar de sinalizar obstáculo circulação/segurança calçada/pista-agravamento 3X - Obstaculizar a via indevidamente-agravamento 3X', '7170-1', ''],
    ['246', 'Deixar de sinalizar obstáculo circulação/segurança calçada/pista-agravamento 4X - Obstaculizar a via indevidamente-agravamento 4X', '7188-1', ''],
    ['246', 'Obstaculizar a via indevidamente-agravamento 5X', '7196-2', ''],
    ['247', 'Deixar de conduzir pelo bordo pista em fila única veíc tração/propulsão humana - Deixar de conduzir pelo bordo da pista em fila única veículo de tração animal', '7200-1', ''],
    ['248', 'Transportar em veíc destinado transp passageiros carga excedente desac art.109', '7218', ''],
    ['249', 'Deixar de manter acesas à noite as luzes posição qdo o veículo estiver parado - Deixar de manter acesas à noite as luzes de posição veic fazendo carga/descarg a', '7226-1', ''],
    ['250, I, a', 'Em movimento, deixar de manter acesa a luz baixa durante à noite', '7234', ''],
    ['250, I, b', 'Em movimento de dia, deixar de manter acesa luz baixa túnel com iluminação pública', '7242', ''],
    ['250, I, c', 'Em mov, deixar de manter acesa luz baixa veíc transp coletivo faixa/pista excl', '7250', ''],
    ['250, I, d', 'Em movimento, deixar de manter acesa luz baixa do ciclomotor', '7269', ''],
    ['250, II', 'Em mov deixar de manter acesas luzes de posição sob chuva forte/neblina/cerração', '7277', ''],
    ['250, III', 'Em movimento, deixar de manter a placa traseira iluminada à noite', '7285', ''],
    ['251, I', 'Utilizar o pisca-alerta, exceto em imobilizações ou situações de emergência', '7293', ''],
    ['251, II', 'Utilizar luz alta e baixa intermitente, exceto quando permitido pelo CTB', '7307', ''],
    ['252, I', 'Dirigir o veículo com o braço do lado de fora', '7315', ''],
    ['252, II', 'Dirigir o veículo transport pessoas à sua esquerda ou entre os braços e pernas - Dirigir o veículo transport animais à sua esquerda ou entre os braços e pernas - Dirigir o veículo transport volume à sua esquerda ou entre os braços e pernas', '7323-1', ''],
    ['252, III', 'Dirigir o veículo com incapacidade física ou mental temporária', '7331', ''],
    ['252, IV', 'Dirigir o veíc usando calçado que ñ se firme nos pés/comprometa utiliz pedais', '7340', ''],
    ['252, V', 'Dirigir o veículo com apenas uma das mãos, exceto quando permitido pelo CTB', '7358', ''],
    ['252, VI', 'Dirigir o veículo utilizando-se de fones nos ouvidos conec a aparelhagem sonora - Dirigir veículo utilizando-se de telefone celular', '7366-1', ''],
    ['253', 'Bloquear a via com veículo', '7374', ''],
    ['254, I', 'É proib ao pedestre permanecer/andar pista, exceto p/ cruzá-las onde permitido', '7382', ''],
    ['254, II', 'É proibido ao pedestre cruzar pista de rolamento de viaduto exc onde permitido - de ponte exceto onde permitido - de túneis exceto onde permitido', '7390-1', ''],
    ['254, III', 'É proib ao pedestre atravessar via área cruzamento exc onde permitido p/ sinaliz', '7404', ''],
    ['254, IV', 'É proib pedestre utilizar via em agrupam que perturbe trâns/prát esporte/desfile', '7412', ''],
    ['254, V', 'É proibido ao pedestre andar fora da faixa própria - andar fora da passarela - andar fora da passagem aérea - andar fora da passagem subterrânea', '7420-1', ''],
    ['254, VI', 'É proibido ao pedestre desobedecer a sinalização de trânsito específica', '7439', ''],
    ['255', 'Conduzir bicicleta em passeios onde não seja permitida a circulação desta - Conduzir bicicleta de forma agressiva', '7447-1', ''],
    ['218, I', 'Transitar em velocidade superior à máxima permitida em até 20%', '7455', ''],
    ['218, II', 'Transitar em velocidade superior à máxima permitida em mais de 20% até 50%', '7463', ''],
    ['218, III', 'Transitar em velocidade superior à máxima permitida em mais de 50%', '7471', ''],
    ['93 c/c 95, § 4º', 'Aprovar proj edificação pólo atrativo trânsito s/ anuência órgão/entid trânsito e Aprovar proj edificação pólo atrativo trâns s/ estacion/indicação vias de acesso', '7480-1', ''],
    ['94', 'Ñ sinalizar devida/imed obstáculo à circul/segurança veíc/pedestre pista/calçada', '7498', ''],
    ['94, § único', 'Utilizar ondulação transversal/sonorizador fora padrão/critério estab p/ Contran', '7501', ''],
    ['95', 'Iniciar obra perturbe/interrompa circulação/segurança veíc/pedestres s/permissão e Iniciar evento perturbe/interrompa circulaç/segurança veíc/pedestres s/permissão', '7510-1', ''],
    ['95, § 1º', 'Não sinalizar a execução ou manutenção da obra e Não sinalizar a execução ou manutenção do evento', '7528-1', ''],
    ['95, § 2º', 'Não avisar comunidade c/ 48h antec interdição via indicando caminho alternativo', '7536', ''],
    ['330, § 5º', 'Falta de escrituração livro registro entrada/saída e de uso placa de experiência - Atraso escrituração livro registro entrada/saída e de uso placa de experiência - Fraude escrituração livro registro entrada/saída e de uso placa de experiência - Recusa da exibição do livro registro entrada/saída e de uso placa de experiência', '7544-1', ''],
    ['244, IX', 'Conduzir motoc/moton/ efetuando transp remun mercadoria desac c/ art 139-A CTB - Conduzir motoc/moton/ efet transp remun desac normas ativid profic mototaxistas', '7552-1', ''],
    ['230, XXIII', 'Conduzir veíc de transp passag ou carga em desacordo c/ as cond do art 67-C CTB', '7560', ''],
    ['277, § 3º, c/c 165', 'Cond que se recusar a se submeter a qq dos proc prev no art. 277 do CTB', '7579', ''],
    ['184, III', 'Transitar na faixa ou via exclusiva regulam. p/ transp. públ. coletivo passag.', '7587', ''],
    ['252, VII', 'Dirigir veículo realizando cobrança de tarifa com veículo em movimento', '7595', ''],
    ['253-A, § 1º', 'Organizar as condutas previstas no caput do art. 253-A', '7609', ''],
    ['253-A', 'Usar veículo para, deliberadamente, interromper a circulação na via - restringir a circulação na via - perturbar a circulação na via', '7617-1', ''],
  ];
}

function pvSeedTabelaInfracoesSeVazia_(ss) {
  var sheet = ss.getSheetByName(SHEET_PV_TABELA_INFRACOES);
  if (!sheet || sheet.getLastRow() > 1) return;
  pvFormatarColunaComoTexto_(sheet, CABECALHO_PV_TABELA_INFRACOES, 'Codigo');
  var linhas = pvDadosRenainf_();
  sheet.getRange(2, 1, linhas.length, CABECALHO_PV_TABELA_INFRACOES.length).setValues(linhas);
}

// Rode pelo editor do Apps Script (ou pelo menu "Base de Veículos") se a
// planilha do Passivo já foi criada ANTES da tabela RENAINF existir —
// substitui o conteúdo da aba TabelaInfracoes pela tabela oficial
// completa (258 códigos). Limpa as linhas antigas primeiro, então rode
// de novo só se quiser mesmo repor a tabela do zero (perde edições
// manuais feitas direto na planilha).
function atualizarTabelaInfracoesRenainf_() {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_TABELA_INFRACOES, CABECALHO_PV_TABELA_INFRACOES);
  var ultimaLinha = sheet.getLastRow();
  if (ultimaLinha > 1) {
    sheet.getRange(2, 1, ultimaLinha - 1, CABECALHO_PV_TABELA_INFRACOES.length).clearContent();
  }
  pvFormatarColunaComoTexto_(sheet, CABECALHO_PV_TABELA_INFRACOES, 'Codigo');
  var linhas = pvDadosRenainf_();
  sheet.getRange(2, 1, linhas.length, CABECALHO_PV_TABELA_INFRACOES.length).setValues(linhas);
  var mensagem = 'Tabela de infrações atualizada com ' + linhas.length + ' códigos oficiais (RENAINF).';
  Logger.log(mensagem);
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(mensagem, 'Passivo Veicular', 10);
  } catch (e) {
    // Rodando sem UI ativa — sem problema, a mensagem já foi gravada no Logger acima.
  }
  return mensagem;
}

function pvSeedOrgaosAutuadoresSeVazia_(ss) {
  var sheet = ss.getSheetByName(SHEET_PV_ORGAOS_AUTUADORES);
  if (!sheet || sheet.getLastRow() > 1) return;
  var linhas = [
    ['', 'DNIT', 'Federal'],
    ['', 'PRF', 'Federal']
  ];
  UFS_VALIDAS.forEach(function (uf) {
    linhas.push([uf, 'DETRAN-' + uf, 'Estadual']);
  });
  // Órgãos estaduais extras, além do DETRAN — confirmados a partir de
  // casos reais (planilha do DF). Adicione mais linhas direto na planilha
  // (aba OrgaosAutuadores) conforme for precisando de outros estados —
  // não precisa mexer em código pra isso.
  linhas.push(['DF', 'DER-DF', 'Estadual']);
  linhas.push(['SP', 'DER-SP', 'Estadual']);
  linhas.push(['RS', 'DER-RS', 'Estadual']);
  linhas.push(['GO', 'AGETOP-GO', 'Estadual']);
  sheet.getRange(2, 1, linhas.length, CABECALHO_PV_ORGAOS_AUTUADORES.length).setValues(linhas);
}

function pvInfracaoProximoId_() {
  var props = PropertiesService.getScriptProperties();
  var seq = Number(props.getProperty('PV_SEQ_INFRACAO') || '0');
  seq += 1;
  props.setProperty('PV_SEQ_INFRACAO', String(seq));
  return 'PVI-' + ('000000' + seq).slice(-6);
}

function pvEnvioProximoId_() {
  var props = PropertiesService.getScriptProperties();
  var seq = Number(props.getProperty('PV_SEQ_ENVIO') || '0');
  seq += 1;
  props.setProperty('PV_SEQ_ENVIO', String(seq));
  return 'PVE-' + ('000000' + seq).slice(-6);
}

function pvValidarInfracao_(dados) {
  if (!dados.placa) throw new Error('Informe a placa do veículo.');
  if (!validarPlaca_(normalizarPlaca_(dados.placa))) throw new Error('Placa inválida: ' + dados.placa);
  if (!dados.orgaoAutuador) throw new Error('Informe o órgão autuador.');
  if (!dados.ait) throw new Error('Informe o número do AIT (auto de infração).');
}

function pvMontarRegistroInfracao_(dados, autor, existente) {
  var agora = new Date();
  return {
    ID: existente ? existente.ID : pvInfracaoProximoId_(),
    DataCadastro: existente ? existente.DataCadastro : agora,
    Placa: normalizarPlaca_(dados.placa),
    OrgaoAutuador: normalizarTexto_(dados.orgaoAutuador),
    AIT: normalizarTexto_(dados.ait),
    Artigo: normalizarTexto_(dados.artigo),
    Codigo: normalizarTexto_(dados.codigo),
    DescricaoInfracao: normalizarTexto_(dados.descricaoInfracao),
    DataInfracao: normalizarTexto_(dados.dataInfracao),
    StatusCancelamento: dados.statusCancelamento || PV_STATUS_CANCELAMENTO[0],
    Observacoes: normalizarTexto_(dados.observacoes),
    CadastradoPor: existente ? existente.CadastradoPor : autor,
    UltimaAtualizacao: agora,
    AtualizadoPor: autor
  };
}

function pvMapaVeiculosPorPlaca_() {
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_VEICULOS, CABECALHO_PV_VEICULOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var mapa = {};
  for (var i = 1; i < valores.length; i++) {
    var registro = linhaParaObjeto_(cabecalho, valores[i]);
    if (registro.Placa) mapa[registro.Placa] = registro;
  }
  return mapa;
}

function getListasDebitosPassivo() {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');

  // Devolve como array de arrays [Artigo, Descricao, Codigo] em vez de 258
  // objetos com chave repetida — google.script.run trava (nunca chama nem
  // sucesso nem erro) com respostas grandes cheias de objetos, o mesmo bug
  // que já tinha acontecido antes na aba TEP. Array simples é bem mais
  // leve pra serializar/enviar. Gravidade não vai porque não é usada em
  // lugar nenhum do cliente.
  var sheetTabela = getOrCreateSheetPassivo_(SHEET_PV_TABELA_INFRACOES, CABECALHO_PV_TABELA_INFRACOES);
  var valoresTabela = sheetTabela.getDataRange().getValues();
  var tabelaInfracoes = [];
  for (var i = 1; i < valoresTabela.length; i++) {
    if (!valoresTabela[i][0]) continue;
    tabelaInfracoes.push([
      String(valoresTabela[i][0] || ''),
      String(valoresTabela[i][1] || ''),
      String(valoresTabela[i][2] || '')
    ]);
  }

  var sheetOrgaos = getOrCreateSheetPassivo_(SHEET_PV_ORGAOS_AUTUADORES, CABECALHO_PV_ORGAOS_AUTUADORES);
  var valoresOrgaos = sheetOrgaos.getDataRange().getValues();
  var orgaosFederais = [];
  var orgaosPorUF = {};
  for (var j = 1; j < valoresOrgaos.length; j++) {
    var linha = valoresOrgaos[j];
    if (!linha[1]) continue;
    var uf = normalizarUF_(linha[0]);
    if (!uf) {
      orgaosFederais.push(linha[1]);
    } else {
      if (!orgaosPorUF[uf]) orgaosPorUF[uf] = [];
      orgaosPorUF[uf].push(linha[1]);
    }
  }

  return {
    statusCancelamento: PV_STATUS_CANCELAMENTO,
    tabelaInfracoes: tabelaInfracoes,
    orgaosFederais: orgaosFederais,
    orgaosPorUF: orgaosPorUF
  };
}

function cadastrarInfracaoPassivo(dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarInfracao_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var registro = pvMontarRegistroInfracao_(dados, perfil.email);
  sheet.appendRow(CABECALHO_PV_INFRACOES.map(function (campo) { return registro[campo]; }));
  return { ok: true, id: registro.ID };
}

function listarInfracoesPassivo(filtros) {
  filtros = filtros || {};
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];

  var sheetEnvios = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var valoresEnvios = sheetEnvios.getDataRange().getValues();
  var enviosPorInfracao = {};
  for (var e = 1; e < valoresEnvios.length; e++) {
    var idInf = valoresEnvios[e][1];
    if (!idInf) continue;
    if (!enviosPorInfracao[idInf]) enviosPorInfracao[idInf] = [];
    enviosPorInfracao[idInf].push(valoresEnvios[e][2]);
  }

  var mapaVeiculos = pvMapaVeiculosPorPlaca_();
  var busca = filtros.busca ? normalizarTexto_(filtros.busca).toUpperCase() : '';
  var resultado = [];
  var agora = new Date();

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0]) continue;
    var registro = linhaParaObjeto_(cabecalho, linha);

    if (filtros.placa && normalizarPlaca_(registro.Placa) !== normalizarPlaca_(filtros.placa)) continue;
    if (filtros.orgaoAutuador && registro.OrgaoAutuador !== filtros.orgaoAutuador) continue;
    if (filtros.status && registro.StatusCancelamento !== filtros.status) continue;
    if (busca) {
      var alvo = [registro.Placa, registro.AIT, registro.Artigo, registro.Codigo, registro.OrgaoAutuador].join(' ').toUpperCase();
      if (alvo.indexOf(busca) === -1) continue;
    }

    var datasEnvio = (enviosPorInfracao[registro.ID] || []).map(function (d) { return new Date(d); });
    var qtdEnvios = datasEnvio.length;
    var dataUltimoEnvio = qtdEnvios ? new Date(Math.max.apply(null, datasEnvio)) : null;
    var diasSemResposta = dataUltimoEnvio ? Math.floor((agora - dataUltimoEnvio) / 86400000) : null;
    registro.QtdEnvios = qtdEnvios;
    registro.DataUltimoEnvio = dataUltimoEnvio ? Utilities.formatDate(dataUltimoEnvio, 'GMT-3', 'dd/MM/yyyy') : '';
    registro.SemResposta = registro.StatusCancelamento === 'ENVIADO' && diasSemResposta !== null && diasSemResposta >= PV_DIAS_SEM_RESPOSTA;

    var veiculo = mapaVeiculos[registro.Placa];
    registro.MarcaVeiculo = veiculo ? veiculo.Marca : '';
    registro.ModeloVeiculo = veiculo ? veiculo.Modelo : '';
    registro.ChassiVeiculo = veiculo ? veiculo.Chassi : '';
    registro.RenavamVeiculo = veiculo ? veiculo.Renavam : '';
    registro.AnoVeiculo = veiculo ? (veiculo.AnoFabricacao + '/' + veiculo.AnoModelo) : '';

    registro.DataCadastro = registro.DataCadastro ? Utilities.formatDate(new Date(registro.DataCadastro), 'GMT-3', 'dd/MM/yyyy') : '';
    registro.UltimaAtualizacao = registro.UltimaAtualizacao ? Utilities.formatDate(new Date(registro.UltimaAtualizacao), 'GMT-3', 'dd/MM/yyyy HH:mm') : '';
    resultado.push(registro);
  }

  resultado.sort(function (a, b) { return String(b.ID).localeCompare(String(a.ID)); });
  return resultado;
}

function atualizarInfracaoPassivo(id, dados) {
  var perfil = exigirPerfilEditor_();
  pvValidarInfracao_(dados);
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      var existente = linhaParaObjeto_(cabecalho, valores[i]);
      var registro = pvMontarRegistroInfracao_(dados, perfil.email, existente);
      var linha = CABECALHO_PV_INFRACOES.map(function (campo) { return registro[campo]; });
      sheet.getRange(i + 1, 1, 1, CABECALHO_PV_INFRACOES.length).setValues([linha]);
      return { ok: true };
    }
  }
  throw new Error('Infração não encontrada.');
}

function excluirInfracaoPassivo(id) {
  exigirPerfilAdmin_();
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheet.getDataRange().getValues();
  var idxId = CABECALHO_PV_INFRACOES.indexOf('ID');
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === id) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  throw new Error('Infração não encontrada.');
}

// Cada clique em "Registrar envio" grava uma linha nova (data + quem
// enviou) em vez de só incrementar um contador — assim dá pra mostrar
// "2ª via enviada em 12/03/2025" e sinalizar "sem resposta" sozinho
// (ver PV_DIAS_SEM_RESPOSTA) sem a pessoa ter que lembrar de marcar isso
// manualmente.
function registrarEnvioCancelamentoPassivo(idInfracao, observacoes) {
  var perfil = exigirPerfilEditor_();
  var sheetInfracoes = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES, CABECALHO_PV_INFRACOES);
  var valores = sheetInfracoes.getDataRange().getValues();
  var cabecalho = valores[0];
  var idxId = cabecalho.indexOf('ID');
  var idxStatus = cabecalho.indexOf('StatusCancelamento');
  var idxAtualizacao = cabecalho.indexOf('UltimaAtualizacao');
  var idxAtualizadoPor = cabecalho.indexOf('AtualizadoPor');
  var linhaEncontrada = -1;
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][idxId] === idInfracao) { linhaEncontrada = i; break; }
  }
  if (linhaEncontrada === -1) throw new Error('Infração não encontrada.');

  var sheetEnvios = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var agora = new Date();
  sheetEnvios.appendRow([pvEnvioProximoId_(), idInfracao, agora, perfil.email, normalizarTexto_(observacoes)]);

  // Só o primeiro envio empurra o status de PENDENTE pra ENVIADO
  // automaticamente — os demais (2º, 3º...) ficam só no histórico, porque
  // a partir daí quem decide se já foi recebida, cancelada ou negada é a
  // pessoa, mudando o status manualmente pela tela de edição.
  if (valores[linhaEncontrada][idxStatus] === 'PENDENTE') {
    sheetInfracoes.getRange(linhaEncontrada + 1, idxStatus + 1).setValue('ENVIADO');
  }
  sheetInfracoes.getRange(linhaEncontrada + 1, idxAtualizacao + 1).setValue(agora);
  sheetInfracoes.getRange(linhaEncontrada + 1, idxAtualizadoPor + 1).setValue(perfil.email);

  return { ok: true };
}

function listarEnviosDaInfracaoPassivo(idInfracao) {
  var perfil = getPerfilUsuarioAtual_();
  if (perfil.perfil === 'sem_acesso') throw new Error('Você não tem acesso a este painel.');
  var sheet = getOrCreateSheetPassivo_(SHEET_PV_INFRACOES_ENVIOS, CABECALHO_PV_INFRACOES_ENVIOS);
  var valores = sheet.getDataRange().getValues();
  var cabecalho = valores[0];
  var envios = [];
  for (var i = 1; i < valores.length; i++) {
    if (valores[i][1] === idInfracao) {
      var e = linhaParaObjeto_(cabecalho, valores[i]);
      envios.push({
        ID: e.ID,
        DataEnvio: e.DataEnvio ? Utilities.formatDate(new Date(e.DataEnvio), 'GMT-3', 'dd/MM/yyyy HH:mm') : '',
        RegistradoPor: e.RegistradoPor,
        Observacoes: e.Observacoes
      });
    }
  }
  envios.sort(function (a, b) { return b.ID.localeCompare(a.ID); });
  return envios;
}

