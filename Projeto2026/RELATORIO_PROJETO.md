# Engenharia Web - Projeto

**Projeto:** Plataforma Web AEEUM  
**Realizado por:**
&nbsp;&nbsp;&nbsp;*Gonçalo Duarte Coutinho Martins - a106914*
&nbsp;&nbsp;&nbsp;*José Miguel Fernandes Cação - a10687*7

**2025/2026**

<div style="page-break-after: always;"></div>

## Índice

- [Engenharia Web - Projeto](#engenharia-web---projeto)
  - [Índice](#índice)
  - [1. Introdução](#1-introdução)
  - [2. Arquitetura Geral](#2-arquitetura-geral)
  - [3. Gateway](#3-gateway)
  - [4. Base de Dados](#4-base-de-dados)
  - [5. Autenticação](#5-autenticação)
  - [6. Interface](#6-interface)
  - [7. API de Dados](#7-api-de-dados)
    - [7.1 Implementação OAIS e BagIt](#71-implementação-oais-e-bagit)

<div style="page-break-after: always;"></div>

## 1. Introdução

O projeto consiste numa aplicação web para gestão e apresentação pública de conteúdos institucionais da Associação de Estudantes de Enfermagem da Universidade do Minho. A solução disponibiliza uma área pública, uma área administrativa protegida, uma API de dados, um serviço dedicado de autenticação, uma base de dados MongoDB e um gateway HTTP baseado em Nginx.

## 2. Arquitetura Geral

A aplicação é composta por cinco serviços principais, orquestrados através de Docker Compose e ligados por uma rede interna comum. O acesso externo é feito pelo gateway, exposto na porta `7789`, enquanto os restantes serviços comunicam internamente.

**Base de dados (`mongodb`)**  
Serviço MongoDB responsável pela persistência dos dados da aplicação. É inicializado a partir de `db/db.json` e utiliza um volume Docker para manter os dados entre reinícios. As coleções incluem utilizadores, pessoas, departamentos, regulamentos, atividades, patrocinadores, entradas de história e textos soltos.

**Gateway (`gateway`)**  
Serviço Nginx responsável por receber os pedidos HTTP externos e encaminhá-los para o serviço correto. Centraliza o roteamento, protege a área administrativa através de `auth_request` e evita que a interface tenha de conhecer diretamente os endereços internos da API e da autenticação.

**API de dados (`api`)**  
Serviço Express que expõe os endpoints de negócio para conteúdos institucionais. Gere modelos, ficheiros multimédia, documentos, formulários de apoio, integração com Instagram e importação/exportação de pacotes SIP, AIP e DIP.

**Autenticação (`auth`)**  
Serviço Express dedicado à autenticação, gestão de utilizadores e emissão de JSON Web Tokens. É responsável por validar sessões, guardar utilizadores e confirmar se um pedido pertence a um administrador.

**Interface (`interface`)**  
Serviço Express com views Pug, CSS e JavaScript para a área pública e administrativa. Consome a API de dados e o serviço de autenticação através do gateway, renderizando páginas públicas, formulários administrativos e operações de gestão.

## 3. Gateway

O gateway é implementado com Nginx e construído através de um `Dockerfile` próprio, usando a imagem oficial do Nginx como base. Este serviço funciona como ponto único de entrada da aplicação e encaminha pedidos com base no caminho da URL.

Os pedidos para `/api/` são enviados para a API de dados, os pedidos para `/auth/` são enviados para o serviço de autenticação, e os pedidos para `/media/` e `/download/` são encaminhados para a API de dados para servir ficheiros. Os pedidos restantes são enviados para a interface.

A área administrativa é protegida no gateway através da diretiva `auth_request`. Antes de encaminhar pedidos para `/admin`, o Nginx consulta internamente o endpoint `/users/verify-admin` do serviço de autenticação. Se o utilizador não tiver uma sessão válida ou não for administrador, o gateway redireciona para a página de login.

Esta abordagem aumenta o desacoplamento porque a interface deixa de ser a única responsável por verificar permissões administrativas. A política de entrada passa a estar concentrada no gateway, enquanto o serviço `auth` mantém a responsabilidade de validar o token e o papel do utilizador.

## 4. Base de Dados

A base de dados utiliza MongoDB e é inicializada a partir do ficheiro `db/db.json`. Os documentos usam `_id` como identificador principal, garantindo consistência com o modelo nativo do MongoDB e evitando a existência paralela de campos `id` e `_id`.

As principais coleções são:

| Coleção | Descrição |
|---|---|
| `users` | Utilizadores do sistema, incluindo credenciais, papel, estado da conta e metadados de acesso. |
| `pessoas` | Pessoas associadas à direção, presidência ou órgãos da associação. |
| `departamentos` | Departamentos e órgãos, incluindo descrição, imagem de fundo, privacidade e relações com pessoas, regulamentos e atividades. |
| `regulamentos` | Documentos e regulamentos publicados, com ligação para ficheiros PDF. |
| `atividades` | Atividades e publicações geridas localmente ou importadas do Instagram. |
| `patrocinadores` | Entidades patrocinadoras, logótipos e ligações externas. |
| `a_nossa_historia` | Entradas cronológicas com ano, imagem e estado de privacidade. |
| `texto_solto` | Conteúdo textual reutilizado na interface, como slogan, carta à comunidade e vantagens de sócio. Existe apenas um único registo na base de dados.

As relações são guardadas através de referências textuais para `_id`. Por exemplo, um departamento contém listas de `_id` de pessoas, regulamentos e atividades. Esta opção é adequada ao projeto porque os identificadores são estáveis, legíveis e usados como slugs administrativos. As imagens são guardados num volume `media` sendo que o seu path é guardado na base de dados.

## 5. Autenticação

A autenticação está isolada no serviço `auth`. O login é feito com `username` e `password`; quando as credenciais são válidas, o serviço emite um JSON Web Token assinado com `JWT_SECRET` e envia-o ao cliente através de cookie HTTP-only. Este cookie é usado nos pedidos seguintes para comprovar a identidade do utilizador.

O modelo de utilizador inclui `_id`, `username`, `password`, `nome`, `role`, estado da conta e campos auxiliares como nível de acesso e último acesso. O campo `role` distingue administradores de consumidores, permitindo que as permissões sejam derivadas do token e não tenham de ser enviadas manualmente pelos pedidos da interface.

O serviço disponibiliza endpoints para login, logout, listagem e gestão de utilizadores, bem como o endpoint `verify-admin`. Este último é usado pelo gateway para validar o acesso à área administrativa. Assim, a decisão de autorização fica centralizada: o gateway controla a entrada e o serviço `auth` valida a sessão.

## 6. Interface

A interface é um serviço Express responsável por renderizar a área pública e a área administrativa. As views são implementadas em Pug e os recursos estáticos estão organizados em ficheiros CSS e JavaScript separados por secção funcional.

A área pública apresenta conteúdos institucionais como hero, sobre, departamentos, equipa, documentos, atividades, história, presidentes, sócios, voluntários e apoio ao aluno. Estes dados são carregados a partir da API de dados e normalizados no JavaScript da interface para alimentar os módulos visuais.

A área administrativa permite gerir coleções como atividades, departamentos, patrocinadores, regulamentos e entradas de “A Nossa História”. A lógica específica da interface está organizada na pasta `interfaceLogic`, incluindo renderização de páginas administrativas, registo de secções, helpers de documentos, proxy de API, autenticação local da interface e tratamento de imagens do Instagram.

A interface não deve conhecer detalhes internos dos outros serviços. Por isso, comunica com a API e com a autenticação através do gateway, usando variáveis como `API_URL` e `AUTH_URL`.

## 7. API de Dados

A API de dados é o serviço responsável por gerir o domínio informacional da aplicação. Está organizada em modelos Mongoose, controllers, routers, middleware e módulos de transporte. Os modelos definem as coleções principais, os controllers implementam a lógica de negócio, os routers expõem os endpoints HTTP e os módulos de transporte tratam da importação e exportação de pacotes.

As principais áreas da API incluem gestão de pessoas, departamentos, regulamentos, patrocinadores, atividades, história, textos soltos e pedidos de apoio ao aluno. A API também trata uploads de imagens e documentos, guardando os ficheiros em pastas de media e expondo-os através de rotas servidas pelo gateway.

Os pedidos `POST` e `PUT` podem receber informação estruturada ou pacotes SIP. Quando recebe um SIP, a API interpreta o ZIP, extrai a metainformação e os ficheiros, transforma o conteúdo no formato interno e guarda a informação na base de dados. Os pedidos `GET` podem devolver a informação normal ou um DIP, dependendo do tipo de pedido e dos headers.

### 7.1 Implementação OAIS e BagIt

O projeto utiliza uma adaptação simples do modelo OAIS para representar pacotes de informação. O SIP é o pacote recebido para ingestão, o AIP é a versão preservada após validação e conversão para o modelo interno, e o DIP é o pacote disponibilizado em resposta a pedidos de consulta ou exportação.

O formato inspirado em BagIt é simplificado e implementado como um ficheiro ZIP. Cada pacote contém um `manifest.txt`, onde cada linha representa o caminho relativo de um ficheiro dentro do ZIP, e uma pasta `dados`, onde ficam a metainformação e os ficheiros associados.

A metainformação é guardada em XML. A tag principal corresponde ao tipo de dados, por exemplo `Atividade`, `Departamento`, `Pessoa` ou `Regulamento`. As tags internas correspondem aos campos definidos no respetivo modelo da API de dados. A obrigatoriedade dos campos é validada pelos modelos Mongoose, garantindo que o pacote respeita as regras da aplicação antes de ser persistido.

Os ficheiros associados, como imagens e PDFs, são incluídos dentro de `dados` e, durante a importação, são extraídos para as pastas de media adequadas. Durante a exportação, a API recolhe o documento e os ficheiros referenciados, gera o XML, constrói o manifesto e devolve um ZIP. Desta forma, toda a lógica de SIP, AIP, DIP e BagIt permanece concentrada na API de dados, sem expor este detalhe à interface, ao gateway ou ao serviço de autenticação.