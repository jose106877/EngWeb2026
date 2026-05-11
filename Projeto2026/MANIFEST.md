# AEEUM Site

- **Titulo**: Manifesto do projeto Site AEEUM
- **Data**: 10/05/2026
- **Autores**: Jose Miguel Fernandes Cacao, Gonçalo Duarte Coutinho Martins
- **UC**: Engenharia Web

## Autores

- A106877 Jose Miguel Fernandes Cacao
- A106914 Gonçalo Duarte Coutinho Martins

## Resumo

Projeto web da AEEUM com frontend publico e area de administracao para gerir
conteudos institucionais. O sistema integra uma API Express/MongoDB para
atividades, departamentos, pessoas, patrocinadores, regulamentos, historia e
textos livres, um servico de autenticacao para controlo de acesso, e um gateway
Nginx que unifica as rotas num unico ponto de entrada. O frontend usa Pug e
assets estaticos (JS/CSS) para renderizar as secoes publicas e o backoffice,
incluindo apoio ao aluno com envio de email. A infraestrutura e dockerizada com
MongoDB e scripts de seed/importacao, permitindo deploy local consistente.

## Lista de Resultados

- `README.md` - requisitos e especificacao do site
- `requisitos.txt` - notas complementares de requisitos
- `.env` - configuracao local (tokens, SMTP, etc.)
- `docker-compose.yml` - orquestracao dos servicos (gateway, api, auth, interface, db)

- `api_dados/` - API principal (Express + MongoDB)
  - `Dockerfile` - imagem do servico
  - `package.json` - dependencias e scripts
  - `server.js` - bootstrap do servidor e middlewares
  - `swagger.yaml` - documentacao da API
  - `controllers/` - logica de dominio
    - `atividadeController.js` - feed e importacao de atividades
    - `departamentoController.js` - departamentos
    - `pessoaController.js` - pessoas e equipa
    - `regulamentoController.js` - documentos e regulamentos
    - `supportController.js` - apoio ao aluno (email)
    - `textoSoltoController.js` - textos livres
    - `aNossaHistoriaController.js` - historia
    - `patrocinadorController.js` - patrocinadores
    - `packageController.js` - pacotes / exportacoes
  - `routes/` - rotas REST
    - `atividadesRouter.js` - endpoints de atividades
    - `departamentosRouter.js` - endpoints de departamentos
    - `pessoasRouter.js` - endpoints de pessoas
    - `regulamentosRouter.js` - endpoints de regulamentos
    - `supportRouter.js` - endpoint do apoio ao aluno
    - `textoSoltoRouter.js` - endpoints de textos soltos
    - `aNossaHistoriaRouter.js` - endpoints da historia
    - `patrocinadoresRouter.js` - endpoints de patrocinadores
    - `packagesRouter.js` - endpoints de pacotes
  - `models/` - modelos Mongoose
    - `Atividade.js`, `Departamento.js`, `Pessoa.js`
    - `Regulamento.js`, `Patrocinador.js`, `ANossaHistoria.js`, `TextoSolto.js`
  - `middleware/` - upload e controlos de acesso
  - `transport/` - middleware de pacotes e respostas

- `interface/` - frontend publico e backoffice
  - `Dockerfile` - imagem do servico
  - `package.json` - dependencias e scripts
  - `server.js` - servidor da interface
  - `adminSections.js` - configuracao dos formularios de admin
  - `auth.js` - helpers de autenticacao
  - `routes/` - proxy e rotas internas
  - `views/` - templates Pug
    - `index.pug`, `layout.pug`, `login.pug`, `error.pug`
    - `admin_index.pug`, `admin_layout.pug`, `admin_entity_form.pug`
    - `partials_index/` - seccoes do site (hero, apoio, historia, etc.)
    - `partials_admin/` - componentes de admin
  - `static/` - assets do frontend
    - `javascripts/` - logica do site e admin
      - `support.js`, `admin_instagram_picker.js`, `activities.js`, `shared.js`
    - `stylesheets/` - estilos globais e por seccao

- `auth/` - servico de autenticacao e autorizacao
  - `Dockerfile` - imagem do servico
  - `package.json` - dependencias e scripts
  - `server.js` - servidor de auth
  - `swagger.yaml` - documentacao do auth
  - `routes/users.js` - endpoints de login e validacao
  - `controllers/usersController.js` - logica de sessao e permissao
  - `models/User.js` - modelo de utilizador
  - `services/tokens.js` - geracao e validacao de tokens
  - `middleware/` - validacao de autenticacao

- `gateway/` - reverse proxy Nginx para unificar acessos
  - `Dockerfile` - imagem do gateway
  - `nginx.conf` - configuracao de rotas e proxy

- `db/` - configuracao do MongoDB e seed
  - `Dockerfile` - imagem da base de dados
  - `db.json` - dados base
  - `mongo-init/import.sh` - importacao inicial

- `media/` - ficheiros carregados (imagens, documentos)
  - `a_nossa_historia/`, `departamento_fundo/`, `documentos/`
  - `patrocinadores/`, `pessoas/`
