/**
 * Página inicial do site: um painel de acesso para cada sistema.
 * O de veículos doados ainda está em construção (migração do Apps Script);
 * o da produtividade do Passivo Veicular já funciona em /produtividade.
 */
export default function Home() {
  return (
    <main className="largo">
      <h1>Escolha o sistema</h1>
      <p className="subtitulo">Cada um tem o seu próprio acesso.</p>

      <div className="paineis">
        <section className="cartao painel">
          <span className="etiqueta">Em construção</span>
          <h2>Veículos doados</h2>
          <p className="painel-sub">Sistema de Gestão de Patrimônio — SGP/COLOG</p>
          <p>
            Nova versão do controle de veículos doados, que vai substituir a
            planilha e o Apps Script por um site próprio com banco de dados.
          </p>
          <p className="painel-nota">
            O sistema atual continua no ar, sem nenhuma mudança. Nada aqui
            interfere na planilha nem no site do Apps Script que a equipe usa hoje.
          </p>
          <span className="painel-botao inativo" aria-disabled="true">Em breve</span>
        </section>

        <section className="cartao painel passivo">
          <span className="etiqueta disponivel">Disponível</span>
          <h2>Passivo Veicular</h2>
          <p className="painel-sub">Produtividade do Setor de Passivo Veicular</p>
          <p>
            Registro e acompanhamento das atividades do setor, com um acesso
            para cada servidor e outro para a coordenação.
          </p>
          {/* Link comum (não next/link): /produtividade é uma página própria, fora do React. */}
          <a className="painel-botao" href="/produtividade">
            Entrar no Passivo
          </a>
        </section>
      </div>

      <p className="rodape">Serviço de Gestão de Patrimônio · Coordenação de Logística</p>
    </main>
  );
}
