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
  'DataEnvioATPVe',
  // 'COMPLETO' ou 'RASCUNHO' — permite criar o processo com o veículo ainda
  // em branco (Novo Veículo > "Salvar rascunho") e completar os dados
  // depois, sem perder o lugar na fila. Recalculado a cada salvarVeiculo_/
  // salvarProcessoEditado a partir dos campos realmente preenchidos (ver
  // validarESanitizarVeiculo_) — nunca precisa ser setado manualmente.
  'StatusCadastro'
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
