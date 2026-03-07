## EngWeb2026

- **Título**: TPC5
- **Data**: 07/03/2026
- **Autor**: José Miguel Fernandes Cação
- **UC**: Engenharia Web

## Autor
- A106877
- José Miguel Fernandes Cação
- <img src="../foto.jpeg" alt="foto" width="300">

## Resumo

Este trabalho consiste na criação de uma aplicação web para exploração de um dataset de filmes, no âmbito do TPC5, a partir do ficheiro `cinema.json`.

Foi criada uma aplicação em Node.js com Express e Pug que consome um `json-server` com os dados preparados em `cinema_completo.json` e responde a pedidos HTTP, gerando páginas HTML dinâmicas para listagem e detalhe de filmes, atores e géneros.

Para preparar o dataset foi desenvolvido o script Python `script_cinema.py`, que:

- acrescenta `id` a cada filme;
- transforma o `cast` em objetos com `id` e `nome`;
- transforma os `genres` em objetos com `id` e `nome`;
- cria as coleções `atores` e `generos`;
- calcula `numFilmes` para cada ator e género;
- associa a cada ator e género a lista de filmes em que participa ou a que pertence.

O servidor responde aos seguintes serviços:

## Rotas implementadas

### GET

- `/` ou `/filmes` - lista de filmes;
- `/filmes/:id` - página de detalhe de um filme;
- `/atores` - lista de atores;
- `/atores/:id` - página de detalhe de um ator;
- `/generos` - lista de géneros;
- `/generos/:id` - página de detalhe de um género.

## Execução

1. Gerar o ficheiro preparado para o `json-server`:

```bash
python3 script_cinema.py
```

2. Correr o `json-server` com o dataset preparado:

```bash
json-server --watch cinema_completo.json
```

3. Iniciar a aplicação Express:

```bash
npm start
```

A aplicação fica disponível por defeito em `http://localhost:3007`.

## Lista de Resultados

- `cinema.json` - dataset original dos filmes
- `cinema_completo.json` - dataset preparado para utilização com `json-server`
- `script_cinema.py` - script Python de processamento do dataset
- `app.js` - configuração da aplicação Express
- `routes/index.js` - definição das rotas da aplicação
- `views/index.pug` - listagem de filmes
- `views/filme.pug` - detalhe de um filme
- `views/atores.pug` - listagem de atores
- `views/ator.pug` - detalhe de um ator
- `views/generos.pug` - listagem de géneros
- `views/genero.pug` - detalhe de um género
- `views/layout.pug` - layout base das páginas
- `public/` - ficheiros estáticos da aplicação
- `package.json` - metadados e dependências da aplicação
