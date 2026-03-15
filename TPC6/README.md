## EngWeb2026

- **Título**: TPC6
- **Data**: 11/03/2026
- **Autor**: José Miguel Fernandes Cação
- **UC**: Engenharia Web

## Autor
- A106877
- José Miguel Fernandes Cação
- <img src="../foto.jpeg" alt="foto" width="300">

## Resumo

Este trabalho expande o ecossistema cinema dos TPC anteriores com uma API mínima em Node/Mongoose que alimenta uma interface Express/Pug. A pasta `cinemaApp/api_dados` define o servidor REST que expõe filmes, atores e géneros a partir dos ficheiros JSON preparados (baseados em `cinema.json`), enquanto `cinemaApp/interface` consome essa API usando `axios` para mostrar listas e detalhes de cada recurso. O `docker-compose.yml` reúne MongoDB, API e interface numa rede dedicada, poupando configuração manual.

## Rotas implementadas

### GET

- `/filmes` - lista de filmes (permite `_select`, `_sort`, `_order`, `_q` e filtros por campo).
- `/filmes/:id` - detalhe de um filme por `id` lógico ou `_id`.
- `/atores` - lista de atores com número de filmes.
- `/atores/:id` - detalhe de um ator com os filmes associados.
- `/generos` - lista de géneros com contagem de filmes.
- `/generos/:id` - detalhe de um género.

## Lista de Resultados

- `cinemaApp/api_dados/myServer_sel_proj.js` – servidor Express+Mongoose com filtros, ordenação, `_select`, pesquisa textScore e rotas genéricas.
- `cinemaApp/api_dados/script_cinema.py` – gera os ficheiros JSON de filmes, atores e géneros a partir de `cinema.json`.
- `cinemaApp/api_dados/filmes.json`, `atores.json`, `generos.json` – dados usados pelo servidor/MongoDB.
- `cinemaApp/api_dados/Dockerfile` e `Dockerfile.mongo` – imagens Node e Mongo para a API e a base de dados.
- `cinemaApp/api_dados/mongo-init/import.sh` – importa os JSON e cria índices.
- `cinemaApp/interface/app.js`, `routes/index.js` – aplicação Express/Pug que consome a API com `axios`.
- `cinemaApp/interface/views/` – templates Pug para listagens e detalhes.
- `cinemaApp/interface/Dockerfile.interface` – imagem da interface (porta 7790).
- `docker-compose.yml` – coordenador dos três serviços numa rede `cinema-network`.
- `semana6-prática.pdf` – enunciado e requisitos do TPC6.
