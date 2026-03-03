import json, os, shutil

def open_json(filename):
    with open(filename, encoding = "utf-8") as f:
        data = json.load(f)
    return data

def mk_dir(relative_path):
    if not os.path.exists(relative_path):
        os.mkdir(relative_path)
    else:
        shutil.rmtree(relative_path)
        os.mkdir(relative_path)


def new_file(filename, content):
    with open(filename, "w", encoding="utf-8") as f:
        f.write(content)


# ----------------- Pagina Principal -----------------
html = f'''
<html>
    <head>
        <title>Reparações</title>
        <meta charset="utf-8"/>
    </head>
    <body>
        <h3>Reparaçẽs</h3>
        <ul>
            <li><a href="listaReparacoes.html">Listagem das Reparações</a></li>
            <li><a href="listaIntervencao.html">Listagem de Tipos de Intervenção</a></li>
            <li href="listaViaturas.html">Listagem de Viaturas</li>
        </ul>
    </body>
</html>
'''

mk_dir("output")
new_file("./output/index.html", html)


dados = open_json("dataset_reparacoes.json")
reparacoes = dados["reparacoes"]
lista_links = ""
lista_intervencoes = ""
codigos_intervencao = set()
intervencoes = {}

reparacoes_ordenadas = reparacoes
reparacoes_ordenadas.sort(key = lambda r: r["nome"])

for reparacao in reparacoes_ordenadas:
    for intervencao in reparacao["intervencoes"]:
        codigos_intervencao.add(intervencao["codigo"])
    lista_links += f'''
    <li>
        <a href="{reparacao["nome"]}.html">{reparacao["nome"]}</a>
    </li>
'''
    
codigos_ordenados = sorted(codigos_intervencao)

for codigo in codigos_ordenados:
    lista_intervencoes += f'''
    <li>
        <a href="{codigo}.html">{codigo}</a>
    </li>
'''

html = f'''
<html>
    <head>
        <title>Reparações</title>
        <meta charset="utf-8"/>
    </head>
    <body>
        <h3>Reparaçẽs</h3>
        <ul>
        {lista_links}
        </ul>
    </body>
</html>
'''

new_file("./output/listaReparacoes.html", html)

html = f'''
<html>
    <head>
        <title>Reparações</title>
        <meta charset="utf-8"/>
    </head>
    <body>
        <h3>Reparaçẽs</h3>
        <ul>
        {lista_intervencoes}
        </ul>
    </body>
</html>
'''

new_file("./output/listaIntervencao.html", html)

# ----------------- Paginas Individuias -----------------

for reparacao in reparacoes:
    viatura = reparacao["viatura"]
    html = f'''
    <html>
        <head>
            <title>{reparacao["nome"]}</title>
            <meta charset="utf-8"/>
        </head>
        <body>
            <h2>{reparacao["nome"]}</h2>
            <table border="1">
                <tr>
                    <td>Data</td><td>{reparacao["data"]}</td>
                </tr>
                <tr>
                    <td>Nif</td><td>{reparacao["nif"]}</td>
                </tr>
                <tr>
                    <td>Nome</td><td>{reparacao["nome"]}</td>
                </tr>
                <tr>
                    <td>Marca</td><td>{viatura["marca"]}</td>
                </tr>
                <tr>
                    <td>Modelo</td><td>{viatura["modelo"]}</td>
                </tr>
                <tr>
                    <td>Número Intervenções</td><td>{reparacao["nr_intervencoes"]}</td>
                </tr>
            </table>
            <hr/>
            <adress>
                <a href="index.html">Voltar ao índice</a>
            </adress>
        </body>
    </html>
    ''' 
    new_file(f"./output/{reparacao["nome"]}.html", html)
    


# -------------------

for reparacao in reparacoes:
    for intervencao in reparacao["intervencoes"]:
        codigo = intervencao["codigo"]

        if codigo not in intervencoes:
            intervencoes[codigo] = {
                "nome" : intervencao["nome"],
                "descricao": intervencao["descricao"],
                "reparacoes": []
            }
        intervencoes[codigo]["reparacoes"].append(reparacao)

for codigo, dados in intervencoes.items():

    lista_reparacoes = ""

    for reparacao in dados["reparacoes"]:
        lista_reparacoes += f'''
        <li>
            <a href="{reparacao["nome"]}.html">
                {reparacao["data"]} – {reparacao["viatura"]["marca"]} {reparacao["viatura"]["modelo"]}
            </a>
        </li>
        '''

    html = f'''
    <html>
        <head>
            <title>{codigo}</title>
            <meta charset="utf-8"/>
        </head>
        <body>
            <h2>{codigo} – {dados["nome"]}</h2>

            <p>{dados["descricao"]}</p>

            </hr>

            <h3>Reparações onde foi realizada</h3>
            <ul>
                {lista_reparacoes}
            </ul>

            <hr/>
            <address>
                <a href="/listaIntervencao.html">Voltar à lista de intervenções</a>
            </address>
        </body>
    </html>
    '''

    new_file(f'./output/{codigo}.html', html)

