const express = require('express')
const router = express.Router()
const textoSoltoController = require('../controllers/textoSoltoController')

// Consultar todos os textos
router.get('/texto-solto', textoSoltoController.get)

// Consultar o slogan
router.get('/texto-solto/slogan', textoSoltoController.getSlogan)

// Consultar a carta à comunidade
router.get('/texto-solto/carta-comunidade', textoSoltoController.getCartaComunidade)

// Consultar as vantagens de sócio
router.get('/texto-solto/vantagens-socio', textoSoltoController.getVantagensSocio)

// Consultar o link de candidatura para voluntários
router.get('/texto-solto/link-voluntario', textoSoltoController.getLinkVoluntario)

// Consultar o link de candidatura para colaboradores
router.get('/texto-solto/link-colaborador', textoSoltoController.getLinkColaborador)

// Atualizar todos os textos
router.put('/texto-solto', textoSoltoController.update)

module.exports = router
