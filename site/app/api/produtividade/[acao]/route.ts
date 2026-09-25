import { tratar } from "@/lib/produtividade/api";

/**
 * API da produtividade do Setor de Passivo Veicular.
 * As regras de acesso de cada ação estão em lib/produtividade/api.ts e acoes.ts.
 */

export const dynamic = "force-dynamic";

type Contexto = { params: Promise<{ acao: string }> };

export async function GET(request: Request, { params }: Contexto) {
  return tratar(request, (await params).acao, "GET");
}

export async function POST(request: Request, { params }: Contexto) {
  return tratar(request, (await params).acao, "POST");
}
