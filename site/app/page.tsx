export default function Home() {
  return (
    <main>
      <div className="cartao">
        <span className="etiqueta">Em construção</span>
        <h1>Sistema de Gestão de Patrimônio</h1>
        <p className="subtitulo">SGP/COLOG — Veículos doados</p>

        <p>
          Este é o começo da nova versão do sistema, que vai substituir a
          planilha e o Apps Script por um site próprio com banco de dados.
        </p>

        <p>
          Por enquanto esta página só existe para confirmar que a publicação
          automática está funcionando: cada alteração enviada ao repositório
          aparece aqui sozinha, sem ninguém precisar subir arquivo na mão.
        </p>

        <div className="aviso">
          <strong>O sistema atual continua no ar, sem nenhuma mudança.</strong>{" "}
          Nada aqui interfere na planilha nem no site do Apps Script que a
          equipe usa hoje.
        </div>
      </div>

      <p className="rodape">Serviço de Gestão de Patrimônio · Coordenação de Logística</p>
    </main>
  );
}
