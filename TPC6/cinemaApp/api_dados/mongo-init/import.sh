#!/bin/bash
# Importa o JSON para a base de dados cinema
mongoimport --host localhost --db cinema --collection filmes --type json --file /docker-entrypoint-initdb.d/filmes.json --jsonArray
mongoimport --host localhost --db cinema --collection atores --type json --file /docker-entrypoint-initdb.d/atores.json --jsonArray
mongoimport --host localhost --db cinema --collection generos --type json --file /docker-entrypoint-initdb.d/generos.json --jsonArray

# Cria indices de texto para pesquisa nas colecoes do cinema
mongosh cinema --eval 'db.filmes.createIndex({title: "text"})'
mongosh cinema --eval 'db.atores.createIndex({nome: "text"})'
mongosh cinema --eval 'db.generos.createIndex({nome: "text"})'