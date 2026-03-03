## EngWeb2026

- **Título**: TPC4
- **Data**: 25/02/2026
- **Autor**: José Miguel Fernandes Cação
- **UC**: Engenharia Web

## Autor
- A106877
- José Miguel Fernandes Cação
- <img src="foto.jpeg" alt="foto" width="300">

## Resumo

Este trabalho consiste na criação de uma aplicação web para gestão de Exames Médico-Desportivos (EMD), no âmbito do TPC4 descrito em `semana4.pdf`, a partir do dataset `emd.json`.

Foi criado um servidor aplicacional em Node.js (`server.js`) que consome um `json-server` com os dados dos exames e responde a pedidos HTTP, gerando páginas HTML dinâmicas com templates em Pug.

O servidor responde aos seguintes serviços:

## Rotas implementadas

### GET

- `/` ou `/emd` - lista de exames;
- `/emd?sort=nome` - lista ordenada por nome do atleta;
- `/emd?sort=data` - lista ordenada por data do exame;
- `/emd/registo` - formulário de criação de um novo exame;
- `/emd/stats` - página com as distribuições dos registos por sexo, modalidade, clube, resultado e federado;
- `/emd/editar/:id` - formulário de edição de um exame;
- `/emd/apagar/:id` - apaga um exame e redireciona para a listagem;
- `/emd/:id` - página de detalhe de um exame.

### POST

- `/emd` - cria um novo registo;
- `/emd/:id` - atualiza um registo existente.


## Lista de Resultados
- `emd.json` — dataset original dos exames médico-desportivos
- `emd_db.json` — dataset preparado para utilização com `json-server`
- `server.js` — servidor aplicacional Node.js 
- `templates.js` — funções de renderização das views Pug
- `static.js` — serviço de ficheiros estáticos
- `views/` — templates Pug (index, emd, form, stats, layout)
- `public/` — ficheiros estáticos (CSS, imagens)
- `script_emd.py` — script Python auxiliar de processamento do dataset
- `semana4.pdf` — enunciado do TPC4
