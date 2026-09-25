/**
 * Produtividade do Setor de Passivo Veicular — dados fixos.
 *
 * Os ids das atividades são os mesmos da versão em arquivo (index.html), para
 * que uma cópia de segurança daquela versão possa ser trazida para cá depois.
 */

export const SIGLAS_UF = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export const CATEGORIAS = ["processos", "consultas", "oficios", "diligencias", "veiculos"] as const;

export type Papel = "servidor" | "coordenacao";

/** ufPadrao: ao escolher a atividade, a UF já vem preenchida ("" = nacional). */
export const ATIVIDADES_PADRAO: {
  id: string;
  categoria: (typeof CATEGORIAS)[number];
  curto: string;
  nome: string;
  ufPadrao?: string;
}[] = [
  { id: "utm", categoria: "processos", curto: "Diligências da UTM", nome: "Processos analisados para cumprimento de diligências da Unidade de Triagem de Multas da Secretaria Executiva" },
  { id: "apoio_tecnico", categoria: "consultas", curto: "Apoio técnico: pendências, boletos e CRLV", nome: "Apoio técnico: consulta de pendências para regularização de veículos, mediante pesquisa em sistemas oficiais e emissão de boletos e espelhos de CRLV" },
  { id: "detran_digital", categoria: "consultas", curto: "Consulta no Detran Digital", nome: "Consulta de veículos no sistema Detran Digital, para atualização da situação financeira e administrativa" },
  { id: "redelog", categoria: "consultas", curto: "Demandas da RedeLog", nome: "Atendimento de demandas da RedeLog" },
  { id: "instrucao_baixa", categoria: "processos", curto: "Instrução para baixa definitiva", nome: "Instrução processual para baixa definitiva de registro de veículos irrecuperáveis" },
  { id: "autorizacao_baixa", categoria: "processos", curto: "Autorização de baixa definitiva", nome: "Autorizações para baixa definitiva de registro de veículos irrecuperáveis" },
  { id: "oficio_ait", categoria: "oficios", curto: "Ofício: cancelamento de auto de infração", nome: "Ofício de solicitação de cancelamento de auto de infração de trânsito" },
  { id: "oficio_ipva", categoria: "oficios", curto: "Ofício: exclusão de débitos de IPVA", nome: "Ofício de solicitação de exclusão de débitos de IPVA" },
  { id: "diligencia_df", categoria: "diligencias", curto: "Diligência ao Detran-DF", nome: "Diligência com deslocamento ao Detran-DF", ufPadrao: "DF" },
  { id: "relatorio_anual", categoria: "diligencias", curto: "Relatório anual do passivo", nome: "Relatório anual de acompanhamento do passivo", ufPadrao: "" },
  { id: "prescricao", categoria: "oficios", curto: "Prescrição de licenciamento", nome: "Solicitação de prescrição de licenciamento" },
  { id: "notificacao", categoria: "processos", curto: "Notificação de cobrança", nome: "Processo de notificação de cobrança" },
  { id: "taxas", categoria: "oficios", curto: "Pagamento de taxas", nome: "Solicitação de pagamento de taxas (licenciamento, cancelamento de comunicado de venda, 2ª via de ATPV-e)" },
  { id: "transferido", categoria: "veiculos", curto: "Veículo transferido", nome: "Veículo transferido" },
  { id: "baixado", categoria: "veiculos", curto: "Veículo baixado", nome: "Veículo baixado" },
];

export const CONFIG_PADRAO: Record<string, string> = {
  setor_nome: "Setor de Passivo Veicular",
  setor_unidade: "Diretoria de Gestão do Fundo Nacional de Segurança Pública",
};

/** Quanto tempo uma entrada vale sem uso. */
export const HORAS_SESSAO = 12;
/** Erros de senha seguidos antes de travar a conta por um tempo. */
export const MAX_FALHAS = 5;
export const MINUTOS_BLOQUEIO = 15;
export const TAMANHO_MINIMO_SENHA = 8;
