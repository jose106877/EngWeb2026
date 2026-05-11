const express = require('express')
const router = express.Router()
const createUpload = require('../middleware/upload')
const upload = createUpload('pessoas', 'imagem')
const pessoaController = require('../controllers/pessoaController')


// Nova pessoa
router.post('/pessoas', upload.single('imagem'), pessoaController.createPessoa)

// Listar publicações
router.get('/pessoas', pessoaController.getAllPessoas)

// Consultar uma pessoa
router.get('/pessoas/:_id', pessoaController.getPessoaById)

// Alterar uma pessoa
router.put('/pessoas/:_id', pessoaController.updatePessoa)

// Apagar uma pessoa
router.delete('/pessoas/:_id', pessoaController.deletePessoa)

module.exports = router