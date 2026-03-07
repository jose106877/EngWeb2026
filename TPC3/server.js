const http = require("http");
const u = require("./myUtil");

const myServer = http.createServer(async function (req, res) {
    const d = new Date().toISOString().substring(0, 16);
    console.log(req.method + " " + req.url + " " + d);

    switch (req.method) {
        case "GET":
            if (req.url === "/") {
                const corpo = u.card("Servicos", u.lista([
                    u.link("/alunos", "Lista de alunos"),
                    u.link("/cursos", "Lista de cursos"),
                    u.link("/instrumentos", "Lista de instrumentos")
                ]));

                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(u.pagina("Escola de Musica", corpo));
            }
            else if (req.url === "/alunos") {
                try {
                    const alunos = await u.getAlunos();
                    const tabela = u.tabela(
                        ["ID", "Nome", "Data de Nascimento", "Curso", "Ano", "Instrumento"],
                        alunos.map(a => [
                            a.id,
                            a.nome,
                            a.dataNasc,
                            a.curso,
                            a.anoCurso,
                            a.instrumento
                        ])
                    );

                    const corpo = u.card("Lista de Alunos", tabela) + u.botaoVoltar();
                    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(u.pagina("Alunos", corpo));
                }
                catch (error) {
                    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(u.pagina("Erro", `<p>Erro ao carregar os alunos.</p>${u.botaoVoltar()}`));
                }
            }
            else if (req.url === "/cursos") {
                try {
                    const cursos = await u.getCursos();
                    const tabela = u.tabela(
                        ["Curso", "Anos", "Numero de Alunos", "Instrumentos"],
                        cursos.map(c => [
                            c.curso,
                            c.anos,
                            c.numAlunos,
                            c.instrumentos
                        ])
                    );

                    const corpo = u.card("Lista de Cursos", tabela) + u.botaoVoltar();
                    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(u.pagina("Cursos", corpo));
                }
                catch (error) {
                    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(u.pagina("Erro", `<p>Erro ao carregar os cursos.</p>${u.botaoVoltar()}`));
                }
            }
            else if (req.url === "/instrumentos") {
                try {
                    const instrumentos = await u.getInstrumentos();
                    const tabela = u.tabela(
                        ["Instrumento", "Numero de Alunos", "Cursos"],
                        instrumentos.map(i => [
                            i.instrumento,
                            i.numAlunos,
                            i.cursos
                        ])
                    );

                    const corpo = u.card("Lista de Instrumentos", tabela) + u.botaoVoltar();
                    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(u.pagina("Instrumentos", corpo));
                }
                catch (error) {
                    res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
                    res.end(u.pagina("Erro", `<p>Erro ao carregar os instrumentos.</p>${u.botaoVoltar()}`));
                }
            }
            else {
                res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
                res.end(u.pagina("Rota nao suportada", `<p>Pedido nao encontrado: ${req.url}</p>${u.botaoVoltar()}`));
            }
            break;

        default:
            res.writeHead(405, { "Content-Type": "text/html; charset=utf-8" });
            res.end(u.pagina("Metodo nao suportado", `<p>Metodo nao suportado: ${req.method}</p>${u.botaoVoltar()}`));
    }
});

myServer.listen(25001);

console.log("Servidor a escutar na porta 25001...");
