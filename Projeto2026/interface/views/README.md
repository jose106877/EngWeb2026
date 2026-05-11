# AEEUM — Pug Templates

## File structure

```
views/
├── layout.pug              ← HTML shell (doctype, head, scripts)
├── index.pug               ← Entry point — includes every partial in order
└── partials/
    ├── _hero.pug           ← Hero header + main navigation
    ├── _quick-nav.pug      ← Sticky glass quick-navigation bar
    ├── _sobre.pug          ← "Sobre Nós" overview cards
    ├── _historia.pug       ← "A Nossa História" letter + timeline
    ├── _equipa.pug         ← "Equipa" tab-driven member panels
    ├── _departamentos.pug  ← "Departamentos" tab-driven panels
    ├── _atividades.pug     ← "Atividades" editorial-filter feed
    ├── _documentos.pug     ← "Documentos" filterable grid
    ├── _presidentes.pug    ← "Antigos Presidentes" list + photo
    ├── _socios.pug         ← "Sócios" lanyard badge + partners
    ├── _voluntarios.pug    ← "Voluntários" guide + application
    ├── _apoio.pug          ← "Apoio ao Aluno" contact form
    └── _footer.pug         ← Footer + contacts
```

## Compiling to HTML

### One-off compile
```bash
npx pug views/index.pug --out dist/
```

### Watch mode (rebuilds on save)
```bash
npx pug views/index.pug --out dist/ --watch
```

### Express / Node.js server
```js
const express = require('express');
const app = express();

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static('public')); // serve style.css, script.js

app.get('/', (req, res) => res.render('index'));

app.listen(3000);
```

## Adding a new section

1. Create `views/partials/_my-section.pug`
2. Add one line to `views/index.pug` inside `main`:
   ```pug
   include partials/_my-section
   ```

## Removing or reordering sections

In `index.pug`, comment out or move the relevant `include` line — no other file needs to change.
