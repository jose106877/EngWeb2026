## EngWeb2026

- **Título**: TPC2
- **Data**: 11/02/2026
- **Autor**: José Miguel Fernandes Cação
- **UC**: Engenharia Web

## Autor

- A106877
- José Miguel Fernandes Cação
- <img src="../foto.jpeg" alt="foto" width="300">

## Resumo

Este trabalho consiste na criação de um servidor aplicacional para o dataset `dataset_reparacoes.json`, seguindo o modelo abordado em `Semana2/AulaTP`.

O dataset é servido por um `json-server` e a aplicação Node.js consome essa API de dados para gerar páginas HTML dinâmicas com informação sobre:

- reparações;
- tipos de intervenção;
- modelos de viaturas intervencionados.

O servidor aplicacional foi desenvolvido com o módulo nativo `http`, produzindo o HTML diretamente no código, no mesmo estilo dos exemplos da aula prática.

## Rotas implementadas

### GET

- `/` - página inicial com links para os serviços disponíveis;
- `/reparacoes` - tabela HTML com os dados das reparações;
- `/intervencoes` - tabela HTML com os diferentes tipos de intervenção, sem repetições e com o número de vezes que foram realizadas;
- `/viaturas` - tabela HTML com os modelos de viatura intervencionados e o número de vezes que cada modelo foi reparado.


## Lista de Resultados

- `document.pdf` - enunciado do TPC2
- `dataset_reparacoes.json` - dataset base das reparações
- `server.js` - servidor aplicacional Node.js
- `package.json` - configuração do projeto e dependências
- `README.md` - documentação do trabalho
