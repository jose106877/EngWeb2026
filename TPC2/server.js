const http = require('http');
const axios = require('axios');

http.createServer(function (req, res) {
    if (req.url == "/") {
        let html = `
            <html>
                <head>
                    <meta charset="utf-8"/>
                    <title>TPC2 - Oficina</title>
                </head>
                <body>
                    <ul>
                        <li><a href="/reparacoes">Reparações</a></li>
                        <li><a href="/intervencoes">Intervenções</a></li>
                        <li><a href="/viaturas">Viaturas</a></li>
                    </ul>
                </body>
            </html>
        `;

        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(html);
    }
    else if (req.url == "/reparacoes") {
        axios.get('http://localhost:3000/reparacoes').then(resp => {
            let html = `<html>
                            <head>
                                <meta charset="utf-8"/>
                                <title>Reparações</title>
                            </head>
                            <body>
                                <h1>Lista de Reparações</h1>
                                <table border="1">
                                    <tr>
                                        <th>Nome</th>
                                        <th>NIF</th>
                                        <th>Data</th>
                                        <th>Nr Intervenções</th>
                                        <th>Matrícula</th>
                                        <th>Marca</th>
                                        <th>Modelo</th>
                                    </tr>
                        `;

            let dados = resp.data;

            dados.forEach(reparacao => {
                html += `<tr>
                            <td>${reparacao.nome}</td>
                            <td>${reparacao.nif}</td>
                            <td>${reparacao.data}</td>
                            <td>${reparacao.nr_intervencoes}</td>
                            <td>${reparacao.viatura.matricula}</td>
                            <td>${reparacao.viatura.marca}</td>
                            <td>${reparacao.viatura.modelo}</td>
                        </tr>`;
            });

            html += `       </table>
                            <p><a href="/">Voltar</a></p>
                        </body>
                    </html>`;

            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(html);
        })
        .catch(error => {
            res.writeHead(520, {'Content-Type': 'text/html; charset=utf-8'});
            res.end("<pre>" + JSON.stringify(error) + "</pre>");
        });
    }
    else if (req.url == "/intervencoes") {
        axios.get('http://localhost:3000/reparacoes').then(resp => {
            const intervencoesMap = new Map();

            for (const reparacao of resp.data) {
                for (const intervencao of reparacao.intervencoes) {
                    if (intervencoesMap.has(intervencao.codigo)) {
                        intervencoesMap.get(intervencao.codigo).count++;
                    }
                    else {
                        intervencoesMap.set(intervencao.codigo, {
                            nome: intervencao.nome,
                            descricao: intervencao.descricao,
                            count: 1
                        });
                    }
                }
            }

            let html = `<html>
                            <head>
                                <meta charset="utf-8"/>
                                <title>Intervenções</title>
                            </head>
                            <body>
                                <h1>Lista de Intervenções</h1>
                                <table border="1">
                                    <tr>
                                        <th>Código</th>
                                        <th>Nome</th>
                                        <th>Descrição</th>
                                        <th>Nr Intervenções</th>
                                    </tr>
                        `;

            const mapOrdenado = new Map([...intervencoesMap.entries()].sort((a, b) => a[0].localeCompare(b[0])));

            for (const [codigo, info] of mapOrdenado) {
                html += `<tr>
                            <td>${codigo}</td>
                            <td>${info.nome}</td>
                            <td>${info.descricao}</td>
                            <td>${info.count}</td>
                        </tr>`;
            }

            html += `       </table>
                            <p><a href="/">Voltar</a></p>
                        </body>
                    </html>`;

            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(html);
        })
        .catch(error => {
            res.writeHead(520, {'Content-Type': 'text/html; charset=utf-8'});
            res.end("<pre>" + JSON.stringify(error) + "</pre>");
        });
    }
    else if (req.url == "/viaturas") {
        axios.get('http://localhost:3000/reparacoes').then(resp => {
            const viaturasMap = new Map();

            for (const reparacao of resp.data) {
                const chave = reparacao.viatura.marca + "||" + reparacao.viatura.modelo;

                if (viaturasMap.has(chave)) {
                    viaturasMap.get(chave).count++;
                }
                else {
                    viaturasMap.set(chave, {
                        marca: reparacao.viatura.marca,
                        modelo: reparacao.viatura.modelo,
                        count: 1
                    });
                }
            }

            let html = `<html>
                            <head>
                                <meta charset="utf-8"/>
                                <title>Viaturas</title>
                            </head>
                            <body>
                                <h1>Lista de Viaturas</h1>
                                <table border="1">
                                    <tr>
                                        <th>Marca</th>
                                        <th>Modelo</th>
                                        <th>Nr Reparações</th>
                                    </tr>
                        `;

            const mapOrdenado = new Map(
                [...viaturasMap.entries()].sort((a, b) => {
                    const marcaCmp = a[1].marca.localeCompare(b[1].marca);
                    return marcaCmp != 0 ? marcaCmp : a[1].modelo.localeCompare(b[1].modelo);
                })
            );

            for (const [, info] of mapOrdenado) {
                html += `<tr>
                            <td>${info.marca}</td>
                            <td>${info.modelo}</td>
                            <td>${info.count}</td>
                        </tr>`;
            }

            html += `       </table>
                            <p><a href="/">Voltar</a></p>
                        </body>
                    </html>`;

            res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
            res.end(html);
        })
        .catch(error => {
            res.writeHead(520, {'Content-Type': 'text/html; charset=utf-8'});
            res.end("<pre>" + JSON.stringify(error) + "</pre>");
        });
    }
    else {
        res.writeHead(520, {'Content-Type': 'text/html; charset=utf-8'});
        res.end("<p>Pedido não encontrado</p>");
    }
}).listen(7777);

console.log('Servidor a escutar na porta 7777');
