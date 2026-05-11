const express = require('express')
const router = express.Router()
const createUpload = require('../middleware/upload')
const upload = createUpload('patrocinadores', 'imagem')
const patrocinadorController = require('../controllers/patrocinadorController')


// Novo patrocinador
router.post('/patrocinadores', upload.single('imagem'), patrocinadorController.createPatrocinador)

// Listar publicações
router.get('/patrocinadores', patrocinadorController.getAllPatrocinadores)

// Consultar uma patrocinador
router.get('/patrocinadores/:_id', patrocinadorController.getPatrocinadorById)

// Alterar uma patrocinador
router.put('/patrocinadores/:_id', upload.single('imagem'), patrocinadorController.updatePatrocinador)

// Apagar uma patrocinador
router.delete('/patrocinadores/:_id', patrocinadorController.deletePatrocinador)

module.exports = router
