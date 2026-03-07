var express = require('express');
var axios = require('axios');
var router = express.Router();

/* GET filmes page. */
router.get(['/', '/filmes'], function(req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  axios.get("http://localhost:3000/filmes").then((resp) => {
            var filmes = resp.data;
            res.render('index', { list: filmes, date: d, title: 'Lista de Filmes' });
          })
          .catch((erro) => next(erro));
});

/* GET filmes/:id page. */
router.get('/filmes/:id', function(req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  axios.get("http://localhost:3000/filmes/" + req.params.id).then((resp) => {
            var filme = resp.data;
            res.render('filme', { filme: filme, date: d, title: filme.title });
          })
          .catch((erro) => next(erro));
});

/* GET atores page. */
router.get('/atores', function(req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  axios.get("http://localhost:3000/atores").then((resp) => {
            var atores = resp.data;
            res.render('atores', { list: atores, date: d, title: 'Lista de Atores' });
          })
          .catch((erro) => next(erro));
});

/* GET atores/:id page. */
router.get('/atores/:id', function(req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  axios.get("http://localhost:3000/atores/" + req.params.id).then((resp) => {
            var ator = resp.data;
            res.render('ator', { ator: ator, date: d, title: ator.nome });
          })
          .catch((erro) => next(erro));
});

/* GET generos page. */
router.get('/generos', function(req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  axios.get("http://localhost:3000/generos").then((resp) => {
            var generos = resp.data;
            res.render('generos', { list: generos, date: d, title: 'Lista de Géneros' });
          })
          .catch((erro) => next(erro));
});

/* GET generos/:id page. */
router.get('/generos/:id', function(req, res, next) {
  var d = new Date().toISOString().substring(0, 16);
  axios.get("http://localhost:3000/generos/" + req.params.id).then((resp) => {
            var genero = resp.data;
            res.render('genero', { genero: genero, date: d, title: genero.nome });
          })
          .catch((erro) => next(erro));
});

module.exports = router;
