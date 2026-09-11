/**
 * As 45 colunas da aba "Veiculos", lado a lado com o campo correspondente
 * no banco.
 *
 * Este arquivo é a ÚNICA fonte de verdade dessa correspondência: tanto a
 * importação quanto (mais pra frente) as telas leem daqui. Mudou o nome de
 * uma coluna ou o tamanho de um campo? Muda aqui e no arquivo
 * db/01-criar-tabelas.sql, e mais nenhum lugar.
 *
 * "limite" é o tamanho máximo declarado no banco (VARCHAR(n)). Ele existe
 * aqui pra que a importação AVISE quando um texto não couber, em vez de o
 * banco cortar o dado pela metade sem ninguém perceber.
 */

export type TipoColuna =
  | "texto" // VARCHAR
  | "simnao" // VARCHAR(3) que só aceita SIM/NÃO e nunca fica vazio
  | "inteiro" // INT / SMALLINT
  | "decimal" // DECIMAL(12,2)
  | "data"; // DATETIME

export interface Coluna {
  /** Nome exato do cabeçalho na linha 1 da aba "Veiculos". */
  planilha: string;
  /** Nome do campo na tabela do banco. */
  banco: string;
  tipo: TipoColuna;
  /** Só para tipo "texto"/"simnao": tamanho máximo aceito pelo banco. */
  limite?: number;
}

export const COLUNAS: Coluna[] = [
  // Identificação
  { planilha: "ID", banco: "id", tipo: "texto", limite: 12 },
  { planilha: "DataCadastro", banco: "data_cadastro", tipo: "data" },
  { planilha: "StatusCadastro", banco: "status_cadastro", tipo: "texto", limite: 12 },

  // Processo / doação
  { planilha: "Ano", banco: "ano", tipo: "inteiro" },
  { planilha: "Mes", banco: "mes", tipo: "texto", limite: 12 },
  { planilha: "UF", banco: "uf", tipo: "texto", limite: 10 },
  { planilha: "Ente", banco: "ente", tipo: "texto", limite: 20 },
  { planilha: "Donataria", banco: "donataria", tipo: "texto", limite: 200 },
  { planilha: "CNPJDonataria", banco: "cnpj_donataria", tipo: "texto", limite: 20 },
  { planilha: "TermoDoacao", banco: "termo_doacao", tipo: "texto", limite: 120 },
  { planilha: "NumeroProcesso", banco: "numero_processo", tipo: "texto", limite: 40 },
  { planilha: "NumeroSei", banco: "numero_sei", tipo: "texto", limite: 30 },
  { planilha: "Contrato", banco: "contrato", tipo: "texto", limite: 60 },
  { planilha: "Aditivo", banco: "aditivo", tipo: "simnao", limite: 3 },
  { planilha: "NumeroAditivo", banco: "numero_aditivo", tipo: "texto", limite: 60 },
  { planilha: "QtdVeiculosContrato", banco: "qtd_veiculos_contrato", tipo: "inteiro" },
  { planilha: "QtdVeiculosAditivo", banco: "qtd_veiculos_aditivo", tipo: "inteiro" },
  { planilha: "MotivoInclusaoPosterior", banco: "motivo_inclusao_posterior", tipo: "texto", limite: 300 },

  // Veículo
  { planilha: "Marca", banco: "marca", tipo: "texto", limite: 60 },
  { planilha: "Descricao", banco: "descricao", tipo: "texto", limite: 160 },
  { planilha: "AnoModelo", banco: "ano_modelo", tipo: "texto", limite: 9 },
  { planilha: "Chassi", banco: "chassi", tipo: "texto", limite: 24 },
  { planilha: "Renavam", banco: "renavam", tipo: "texto", limite: 15 },
  { planilha: "Placa", banco: "placa", tipo: "texto", limite: 10 },
  { planilha: "ValorVeiculo", banco: "valor_veiculo", tipo: "decimal" },

  // Endereço da donatária
  { planilha: "CEP", banco: "cep", tipo: "texto", limite: 10 },
  { planilha: "Logradouro", banco: "logradouro", tipo: "texto", limite: 160 },
  { planilha: "Numero", banco: "numero", tipo: "texto", limite: 20 },
  { planilha: "Complemento", banco: "complemento", tipo: "texto", limite: 80 },
  { planilha: "Bairro", banco: "bairro", tipo: "texto", limite: 100 },
  { planilha: "Municipio", banco: "municipio", tipo: "texto", limite: 100 },

  // Situação da transferência
  { planilha: "Transferido", banco: "transferido", tipo: "simnao", limite: 3 },
  { planilha: "DataTransferencia", banco: "data_transferencia", tipo: "data" },
  { planilha: "ATPVeEmitido", banco: "atpve_emitido", tipo: "simnao", limite: 3 },
  { planilha: "DataEmissaoATPVe", banco: "data_emissao_atpve", tipo: "data" },
  { planilha: "ATPVeEnviado", banco: "atpve_enviado", tipo: "simnao", limite: 3 },
  { planilha: "DataEnvioATPVe", banco: "data_envio_atpve", tipo: "data" },
  { planilha: "DataEmissaoSegundaViaATPVe", banco: "data_emissao_segunda_via", tipo: "data" },

  // Lixeira (exclusão lógica)
  { planilha: "Excluido", banco: "excluido", tipo: "simnao", limite: 3 },
  { planilha: "ExcluidoPor", banco: "excluido_por", tipo: "texto", limite: 120 },
  { planilha: "DataExclusao", banco: "data_exclusao", tipo: "data" },

  // Auditoria
  { planilha: "Observacoes", banco: "observacoes", tipo: "texto", limite: 300 },
  { planilha: "CadastradoPor", banco: "cadastrado_por", tipo: "texto", limite: 120 },
  { planilha: "UltimaAtualizacao", banco: "ultima_atualizacao", tipo: "data" },
  { planilha: "AtualizadoPor", banco: "atualizado_por", tipo: "texto", limite: 120 },
];
