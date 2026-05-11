const express = require('express')
const router = express.Router()
const createUpload = require('../middleware/upload')
const upload = createUpload('documentos', 'pdf')
const regulamentoController = require('../controllers/regulamentoController')


// Nova regulamento
router.post('/regulamentos', upload.single('ficheiro'), regulamentoController.createRegulamento)

// Listar publicações
router.get('/regulamentos', regulamentoController.getAllRegulamentos)

// Consultar uma regulamento
router.get('/regulamentos/:_id', regulamentoController.getRegulamentoById)

// Alterar uma regulamento
router.put('/regulamentos/:_id', upload.single('ficheiro'), regulamentoController.updateRegulamento)

// Apagar uma regulamento
router.delete('/regulamentos/:_id', regulamentoController.deleteRegulamento)

module.exports = router
