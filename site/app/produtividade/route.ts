import { paginaProdutividade } from "@/lib/produtividade/pagina";

/**
 * /produtividade — sistema de produtividade do Setor de Passivo Veicular.
 * A página não carrega dados; tudo passa pela API, que confere quem entrou.
 */

export const dynamic = "force-dynamic";

// Muda a cada publicação, para o navegador buscar o app.js e o app.css novos.
const VERSAO = (process.env.VERCEL_GIT_COMMIT_SHA || "local").slice(0, 10);

export function GET() {
  return new Response(paginaProdutividade(VERSAO), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join("; "),
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "same-origin",
    },
  });
}
