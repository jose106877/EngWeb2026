# AEEUM — Split Static Assets

## File structure

```
static.js                          ← Updated static resource module (see below)
views/
  layout.pug                       ← Loads all CSS + JS modules via <link>/<script>
  index.pug                        ← Includes all section partials
  partials/                        ← One .pug file per page section

static/
  stylesheets/                     ← CSS split by section
    base.css                       design tokens (:root vars) + global reset
    layout.css                     .container, .section, .section-head, typography
    hero.css                       hero, main nav, quick-glass sticky nav
    buttons.css                    .btn, .btn-primary, .btn-secondary
    cards.css                      .glass-card
    sobre.css                      Sobre Nós cards + tilt effect
    historia.css                   letter stack, year chips, timeline
    equipa.css                     teamv2 tabs + member cards
    departamentos.css              department-panel detail view
    atividades.css                 activities tabs + feed host
    documentos.css                 docs-shell, filter toolbar, doc-card grid
    presidentes.css                presidents list + photo panel
    socios.css                     lanyard badge, vantagens, partners ticker
    forms.css                      .text-link + .support-form
    footer.css                     footer + voluntários cards
    responsive.css                 @media, prefers-reduced-motion, keyframes  ← ALWAYS LAST

  javascripts/                     ← JS split by feature (load in this exact order)
    data.js                        static data arrays — no DOM, load first
    shared.js                      DOM refs + utility helpers (lerp, formatDate…)
    scroll.js                      smooth anime-style scrolling
    scroll-recovery.js             overflow lock safeguard
    quick-nav.js                   sticky glass nav bar
    team.js                        team member tabs
    departments.js                 department detail panel
    activities.js                  Instagram activity feed
    support.js                     student support form
    documents.js                   documents filter toolbar
    presidents.js                  presidents showcase
    history.js                     history timeline
    reveal.js                      scroll reveal + tilted cards
    hero.js                        hero text animation + cursor parallax
    lanyard.js                     sócios lanyard physics
    app.js                         bootstrap — calls all init functions, LOAD LAST
```

---

## How static.js works now

The old `static.js` had a hardcoded list of three files and manual `if/else` MIME branches.
The new version uses a **MIME_MAP** — an array of `{ pattern, dir, mime }` entries.

**To add a new static file** (e.g. a new image or a new JS module):
```js
// In static.js, add one line to MIME_MAP:
{ pattern: /\/my-new-file\.png$/, dir: 'public', mime: 'image/png' },
```
That's it. No other changes needed.

The new module also:
- Resolves `static/stylesheets/*.css` and `static/javascripts/*.js` by URL path directly
- Sets `Cache-Control: public, max-age=3600` in production, `no-cache` in dev
- Logs missing files properly to the console

**With Express** you can replace the custom static module entirely with:
```js
app.use('/static', express.static(path.join(__dirname, 'static')))
app.use('/public', express.static(path.join(__dirname, 'public')))
```
…but keeping `static.js` lets you control caching, logging and error format.

---

## Can you use W3.CSS without changing the look?

**Short answer: no — and you wouldn't want to.**

W3.CSS is a standalone utility stylesheet (like a lighter Tailwind). Adding it alongside your existing custom CSS would cause conflicts:

- W3.CSS ships its own `.container`, `.btn`, `.card`, color classes and resets.
  These **will collide** with your `base.css`, `buttons.css` and `cards.css`.
- Your design is built on a precise custom token system (`--brand`, `--ink`, glass
  effects, `--shadow`). W3.CSS doesn't know about any of that.
- The visual result *would* change, even if subtly — you'd spend time debugging
  specificity fights rather than gaining anything.

**What W3.CSS is actually good for:**
Rapid prototypes where you have *no* existing styles and want ready-made grids,
modals or responsive helpers without writing any CSS.

**What to do instead if you want to clean up the CSS:**
The split you already have is the right move. If you want utility-style organisation
on top of it, consider adding a `utilities.css` file with small helpers:

```css
/* utilities.css */
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
.mt-auto         { margin-top: auto; }
.text-center     { text-align: center; }
```

This gives you the utility mindset without any conflicts.

---

## Compiling Pug → HTML

```bash
# One-off
npx pug views/index.pug --out dist/

# Watch mode
npx pug views/index.pug --out dist/ --watch
```

## Express setup

```js
const express  = require('express')
const path     = require('path')
const staticM  = require('./static')   // optional — or use express.static below
const app      = express()

app.set('views', './views')
app.set('view engine', 'pug')

// Option A — keep custom static.js
app.use((req, res, next) => {
  if (staticM.staticResource(req)) return staticM.serveStaticResource(req, res)
  next()
})

// Option B — use Express built-in (simpler)
// app.use('/static', express.static(path.join(__dirname, 'static')))
// app.use('/public', express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => res.render('index'))
app.listen(3000, () => console.log('AEEUM running on http://localhost:3000'))
```
