const axios = require("axios");

const alunosUrl = "http://localhost:3000/alunos";

function pagina(titulo, corpo) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8"/>
        <title>${titulo}</title>
        <link rel="stylesheet" href="https://www.w3schools.com/w3css/4/w3.css"/>
    </head>
    <body class="w3-light-grey">
        <div class="w3-container w3-teal">
            <h1>${titulo}</h1>
        </div>

        <div class="w3-container w3-margin-top">
            ${corpo}
        </div>
    </body>
    </html>
    `;
}

function link(href, texto) {
    return `<a href="${href}">${texto}</a>`;
}

function card(titulo, conteudo) {
    return `
    <div class="w3-card-4 w3-white w3-margin-bottom">
        <header class="w3-container w3-teal">
            <h3>${titulo}</h3>
        </header>
        <div class="w3-container w3-padding">
            ${conteudo}
        </div>
    </div>
    `;
}

function lista(items) {
    if (items.length === 0) {
        return `<p><i>Sem registos.</i></p>`;
    }

    return `
    <ul class="w3-ul w3-hoverable">
        ${items.map(i => `<li>${i}</li>`).join("")}
    </ul>
    `;
}

function tabela(headers, rows) {
    return `
    <table class="w3-table-all w3-hoverable">
        <tr class="w3-teal">
            ${headers.map(h => `<th>${h}</th>`).join("")}
        </tr>
        ${rows.map(r => `
            <tr>
                ${r.map(c => `<td>${c}</td>`).join("")}
            </tr>
        `).join("")}
    </table>
    `;
}

function botaoVoltar() {
    return `<a class="w3-button w3-teal w3-margin-top" href="/">Voltar</a>`;
}

async function getAlunos() {
    const resp = await axios.get(alunosUrl + "?_sort=nome");
    return resp.data;
}

async function getCursos() {
    const alunos = await getAlunos();
    const cursosMap = new Map();

    alunos.forEach(a => {
        if (!cursosMap.has(a.curso)) {
            cursosMap.set(a.curso, {
                curso: a.curso,
                anos: new Set(),
                instrumentos: new Set(),
                numAlunos: 0
            });
        }

        const curso = cursosMap.get(a.curso);
        curso.anos.add(a.anoCurso);
        curso.instrumentos.add(a.instrumento);
        curso.numAlunos += 1;
    });

    return [...cursosMap.values()]
        .map(c => ({
            curso: c.curso,
            anos: [...c.anos].sort((a, b) => Number(a) - Number(b)).join(", "),
            instrumentos: [...c.instrumentos].sort((a, b) => a.localeCompare(b)).join(", "),
            numAlunos: c.numAlunos
        }))
        .sort((a, b) => a.curso.localeCompare(b.curso));
}

async function getInstrumentos() {
    const alunos = await getAlunos();
    const instrumentosMap = new Map();

    alunos.forEach(a => {
        if (!instrumentosMap.has(a.instrumento)) {
            instrumentosMap.set(a.instrumento, {
                instrumento: a.instrumento,
                cursos: new Set(),
                numAlunos: 0
            });
        }

        const instrumento = instrumentosMap.get(a.instrumento);
        instrumento.cursos.add(a.curso);
        instrumento.numAlunos += 1;
    });

    return [...instrumentosMap.values()]
        .map(i => ({
            instrumento: i.instrumento,
            cursos: [...i.cursos].sort((a, b) => a.localeCompare(b)).join(", "),
            numAlunos: i.numAlunos
        }))
        .sort((a, b) => a.instrumento.localeCompare(b.instrumento));
}

module.exports = {
    pagina,
    link,
    card,
    lista,
    tabela,
    botaoVoltar,
    getAlunos,
    getCursos,
    getInstrumentos
};
