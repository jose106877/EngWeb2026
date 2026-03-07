## EngWeb2026

- **Titulo**: TPC3
- **Data**: 17/02/2026
- **Autor**: Jose Miguel Fernandes Cacao
- **UC**: Engenharia Web

## Autor

- A106877
- Jose Miguel Fernandes Cacao
- <img src="../foto.jpeg" alt="foto" width="300">

## Resumo

Este trabalho consiste na criacao de um servidor aplicacional para o dataset `db.json` da Escola de Musica.

O dataset e servido por `json-server` e a aplicacao Node.js consome essa API de dados para gerar paginas HTML dinamicas com W3.CSS para:

- listar todos os alunos;
- listar os cursos existentes e respetiva informacao agregada;
- listar os instrumentos existentes e a sua distribuicao pelos cursos.

## Rotas implementadas

### GET

- `/` - pagina principal com links para os servicos disponiveis;
- `/alunos` - tabela HTML com os dados de todos os alunos;
- `/cursos` - tabela HTML com os cursos, anos presentes, numero de alunos e instrumentos associados;
- `/instrumentos` - tabela HTML com os instrumentos, numero de alunos e cursos associados.

## Lista de Resultados

- `db.json` - dataset base da Escola de Musica
- `myUtil.js` - funcoes auxiliares para HTML e acesso aos dados
- `server.js` - servidor aplicacional Node.js
- `package.json` - configuracao do projeto e dependencias
- `README.md` - documentacao do trabalho
