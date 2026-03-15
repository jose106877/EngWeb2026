var express = require("express");
var axios = require("axios");

var router = express.Router();

const API_URL = (process.env.API_URL || "http://localhost:7789")

router.get("/", function (req, res) {
  res.redirect("/filmes");
});

router.get("/filmes", function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);

  axios
    .get(API_URL + "/filmes?_select=id,title,year,cast,genres&_sort=title")
    .then(function (resp) {
      res.render("filmes", {
        title: "Filmes",
        filmes: resp.data,
        date: d,
      });
    })
    .catch(function (err) {
      next(err);
    });
});

router.get("/filmes/:id", function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);

  axios
    .get(API_URL + "/filmes/" + encodeURIComponent(req.params.id))
    .then(function (resp) {
      res.render("filme", {
        title: `Filme ${resp.data.id}`,
        filme: resp.data,
        date: d,
      });
    })
    .catch(function (err) {
      next(err);
    });
});

router.get("/atores", function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);

  axios
    .get(API_URL + "/atores?_select=id,nome,numFilmes&_sort=nome")
    .then(function (resp) {
      res.render("atores", {
        title: "Atores",
        atores: resp.data,
        date: d,
      });
    })
    .catch(function (err) {
      next(err);
    });
});

router.get("/atores/:id", function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);

  axios
    .get(API_URL + "/atores/" + encodeURIComponent(req.params.id))
    .then(function (resp) {
      res.render("ator", {
        title: `Ator ${resp.data.id}`,
        ator: resp.data,
        date: d,
      });
    })
    .catch(function (err) {
      next(err);
    });
});

router.get("/generos", function (req, res, next) {
  var d = new Date().toISOString().substring(0, 16);

  axios
    .get(API_URL + "/generos?_select=id,nome,numFilmes&_sort=nome")
    .then(function (resp) {
      res.render("generos", {
        title: "Generos",
        generos: resp.data,
        date: d,
      });
    })
    .catch(function (err) {
      next(err);
    });
});

module.exports = router;
