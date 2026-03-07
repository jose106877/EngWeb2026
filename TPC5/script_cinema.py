import json


def open_json(filename):
    with open(filename, encoding="utf-8") as f:
        data = json.load(f)
    return data


def new_file(filename, content):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(content, f, ensure_ascii=False, indent=2)


cinema = open_json("cinema.json")
atores = []
atores_por_nome = {}
generos = []
generos_por_nome = {}

for i, filme in enumerate(cinema["filmes"], start=1):
    filme["id"] = i
    novo_cast = []
    novos_generos = []
    atores_no_filme = set()
    generos_no_filme = set()
    filme_ref = {
        "id": filme["id"],
        "title": filme["title"]
    }

    for nome_ator in filme.get("cast", []):
        if nome_ator not in atores_por_nome:
            ator = {
                "id": len(atores) + 1,
                "nome": nome_ator,
                "numFilmes": 0,
                "filmes": []
            }
            atores.append(ator)
            atores_por_nome[nome_ator] = ator

        ator = atores_por_nome[nome_ator]

        novo_cast.append({
            "id": ator["id"],
            "nome": ator["nome"]
        })

        if nome_ator not in atores_no_filme:
            ator["numFilmes"] += 1
            ator["filmes"].append(filme_ref)
            atores_no_filme.add(nome_ator)

    for nome_genero in filme.get("genres", []):
        if nome_genero not in generos_por_nome:
            genero = {
                "id": len(generos) + 1,
                "nome": nome_genero,
                "numFilmes": 0,
                "filmes": []
            }
            generos.append(genero)
            generos_por_nome[nome_genero] = genero

        genero = generos_por_nome[nome_genero]

        novos_generos.append({
            "id": genero["id"],
            "nome": genero["nome"]
        })

        if nome_genero not in generos_no_filme:
            genero["numFilmes"] += 1
            genero["filmes"].append(filme_ref)
            generos_no_filme.add(nome_genero)

    filme["cast"] = novo_cast
    filme["genres"] = novos_generos

cinema["atores"] = atores
cinema["generos"] = generos

new_file("cinema_completo.json", cinema)
