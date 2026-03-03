// treinos_server.js
// EW2025 : 2025-02-24
// by jcr

var http = require("http");
var axios = require("axios");
const { parse } = require("querystring");

var templates = require("./templates.js"); // Necessario criar e colocar na mesma pasta
var static = require("./static.js"); // Colocar na mesma pasta

// Aux functions
function collectRequestBodyData(request, callback) {
  if (request.headers["content-type"] === "application/x-www-form-urlencoded") {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => {
      callback(parse(body));
    });
  } else {
    callback(null);
  }
}

function normalizeEmdFormData(formData) {
  var emd = {
    dataEMD: formData.dataEMD,
    nome: {
      primeiro: formData["nome.primeiro"],
      último: formData["nome.último"],
    },
    idade: Number(formData.idade),
    género: formData["género"],
    morada: formData.morada,
    modalidade: formData.modalidade,
    clube: formData.clube,
    email: formData.email,
    federado: formData.federado === "true",
    resultado: formData.resultado === "true",
  };

  if (formData.id) {
    emd.id = formData.id;
  }

  return emd;
}

function countBy(list, extractor, formatter) {
  var counts = {};

  list.forEach((emd) => {
    var rawValue = extractor(emd);
    var key =
      rawValue === undefined || rawValue === null || rawValue === ""
        ? "__desconhecido__"
        : String(rawValue);

    if (!counts[key]) {
      counts[key] = {
        label: formatter ? formatter(rawValue) : key,
        value: 0,
      };
    }

    counts[key].value += 1;
  });

  return Object.values(counts).sort(
    (a, b) => b.value - a.value || a.label.localeCompare(b.label, "pt-PT"),
  );
}

function buildEmdStats(list) {
  return {
    total: list.length,
    sexo: countBy(list, (emd) => emd.género, (value) => {
      if (value === "M") return "Masculino";
      if (value === "F") return "Feminino";
      return "Desconhecido";
    }),
    modalidade: countBy(list, (emd) => emd.modalidade, (value) =>
      value ? value : "Desconhecido",
    ),
    clube: countBy(list, (emd) => emd.clube, (value) =>
      value ? value : "Desconhecido",
    ),
    resultado: countBy(list, (emd) => emd.resultado, (value) => {
      if (value === true) return "Apto";
      if (value === false) return "Não apto";
      return "Desconhecido";
    }),
    federado: countBy(list, (emd) => emd.federado, (value) => {
      if (value === true) return "Sim";
      if (value === false) return "Não";
      return "Desconhecido";
    }),
  };
}

// Server creation

var server = http.createServer((req, res) => {
  // Logger: what was requested and when it was requested
  var d = new Date().toISOString().substring(0, 16);
  console.log(req.method + " " + req.url + " " + d);
  var parsedUrl = new URL(req.url, "http://localhost:7777");
  var pathname = parsedUrl.pathname;

  // Handling request
  if (static.staticResource(req)) {
    static.serveStaticResource(req, res);
    return;
  } else {
    switch (req.method) {
      case "GET":
        // GET /emd ------------------------------------------------------------------
        if (pathname == "/" || pathname == "/emd") {
          var sort = parsedUrl.searchParams.get("sort");
          var apiUrl =
            sort == "nome"
              ? "http://localhost:3000/emd?_sort=nome.primeiro&_order=asc"
              : "http://localhost:3000/emd?_sort=dataEMD&_order=desc";

          axios
            .get(apiUrl)
            .then((resp) => {
              try {
                var html = templates.emdListPage(resp.data, d);
                res.writeHead(200, {
                  "Content-Type": "text/html; charset=utf-8",
                });
                res.end(html);
              } catch (err) {
                res.writeHead(500, {
                  "Content-Type": "text/html; charset=utf-8",
                });
                res.end("<p>Erro ao gerar a lista: " + err + "</p>");
              }
            })
            .catch((erro) => {
              res.writeHead(500, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.write("<p>Não foi possível obter a lista de EMDs.</p>");
              res.end("<p>" + erro + "</p>");
            });
          return;
        }

        // GET /emd ------------------------------------------------------------------
        else if (pathname == "/emd/registo") {
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
          });
          res.end(templates.emdFormPage(d));
          return;
        }

        // GET /emd/stats ---------------------------------------------------------
        else if (pathname == "/emd/stats") {
          axios
            .get("http://localhost:3000/emd")
            .then((resp) => {
              var stats = buildEmdStats(resp.data);
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.end(templates.statsPage(stats, d));
            })
            .catch((erro) => {
              res.writeHead(500, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.write("<p>Não foi possível obter as estatísticas.</p>");
              res.end("<p>" + erro + "</p>");
            });
          return;
        }

        // GET /emd/editar/:id ---------------------------------------------------------
        else if (/\/emd\/editar\/[0-9a-zA-Z]+$/.test(req.url)) {
          var idEmd = req.url.split("/")[3];
          axios
            .get("http://localhost:3000/emd/" + idEmd)
            .then((resp) => {
              var emd = resp.data;
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.end(templates.emdFormEditPage(emd, d));
            })
            .catch((erro) => {
              res.writeHead(505, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.write("<p>Não foi possível obter o registo...</p>");
              res.write("<p>" + erro + "</p>");
              res.end('<address><a href="/">Voltar</a></address>');
            });
          return;
        }

        // GET /emd//apagar/:id --------------------------------------------------------------
        else if (/\/emd\/apagar\/[0-9a-zA-Z_]+$/.test(req.url)) {
          var idEmd = req.url.split("/")[3];
          axios
            .delete("http://localhost:3000/emd/" + idEmd)
            .then((resp) => {
              res.writeHead(302, { Location: "/" }); // Redireciona para a lista
              res.end();
            })
            .catch((erro) => {
              res.writeHead(505, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.write("<p>Não foi possível apagar o registo...</p>");
              res.write("<p>" + erro + "</p>");
              res.end('<address><a href="/">Voltar</a></address>');
            });
          return;
        }

        // GET /emd/:id --------------------------------------------------------------
        else if (/\/emd\/[0-9a-z-A-Z]+$/.test(pathname)) {
          var idEMD = pathname.split("/")[2];

          axios
            .get("http://localhost:3000/emd/" + idEMD)
            .then((resp) => {
              var emd = resp.data;
              res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.end(templates.emdPage(emd, d)); // ou outra página de detalhe
            })
            .catch((erro) => {
              var status = erro.response?.status == 404 ? 404 : 500;
              res.writeHead(status, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.write("<p>Não foi possível obter o registo.</p>");
              res.end("<p>" + erro + "</p>");
            });
          return;
        }

        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<p>Rota GET não suportada: " + pathname + "</p>");
        return;

      case "POST":
        // POST /emd --------------------------------------------------------------------
        if (pathname == "/emd") {
          collectRequestBodyData(req, (result) => {
            if (result) {
              var emd = normalizeEmdFormData(result);

              axios
                .post("http://localhost:3000/emd", emd)
                .then(() => {
                  res.writeHead(302, { Location: "/emd" });
                  res.end();
                })
                .catch((erro) => {
                  res.writeHead(500, {
                    "Content-Type": "text/html; charset=utf-8",
                  });
                  res.write("<p>Não foi possível inserir o registo...</p>");
                  res.write("<p>" + erro + "</p>");
                  res.end('<address><a href="/">Voltar</a></address>');
                });
            } else {
              res.writeHead(502, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.write("<p>Não foi possível obter os dados do body...</p>");
              res.end('<address><a href="/">Voltar</a></address>');
            }
          });
          return;
        }

        // POST /emd/:id - Alterar um registo
        else if (/\/emd\/[0-9a-zA-Z_]+$/.test(req.url)) {
          collectRequestBodyData(req, (result) => {
            if (result) {
              var emd = normalizeEmdFormData(result);

              axios
                .put("http://localhost:3000/emd/" + emd.id, emd)
                .then((resp) => {
                  res.writeHead(201, {
                    "Content-Type": "text/html; charset=utf-8",
                  });
                  res.write(
                    "<p>Registo alterado com sucesso: " +
                      JSON.stringify(resp.data) +
                      "</p>",
                  );
                  res.end('<address><a href="/">Voltar</a></address>');
                })
                .catch((erro) => {
                  res.writeHead(503, {
                    "Content-Type": "text/html; charset=utf-8",
                  });
                  res.write("<p>Não foi possível alterar o registo...</p>");
                  res.write("<p>" + erro + "</p>");
                  res.end('<address><a href="/">Voltar</a></address>');
                });
            } else {
              res.writeHead(502, {
                "Content-Type": "text/html; charset=utf-8",
              });
              res.write("<p>Não foi possível obter os dados do body...</p>");
              res.end('<address><a href="/">Voltar</a></address>');
            }
          });
          return;
        }

      default:
        res.writeHead(405, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<p>Método não suportado: " + req.method + "</p>");
        return;
    }
  }
});

server.listen(7777, () => {
  console.log("Servidor à escuta na porta 7777...");
});
