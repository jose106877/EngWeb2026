const express = require('express')
const router = express.Router()
const createUpload = require('../middleware/upload')
const upload = createUpload('a_nossa_historia', 'imagem')
const aNossaHistoriaController = require('../controllers/aNossaHistoriaController')


// Nova entrada em "A Nossa Historia"
router.post('/anossahistoria', upload.single('imagem'), aNossaHistoriaController.createANossaHistoria)

// Listar entradas em "A Nossa Historia"
router.get('/anossahistoria', aNossaHistoriaController.getAllANossaHistorias)

// Consultar uma entrada em "A Nossa Historia"
router.get('/anossahistoria/:_id', aNossaHistoriaController.getANossaHistoriaById)

// Alterar uma entrada em "A Nossa Historia"
router.put('/anossahistoria/:_id', upload.single('imagem'), aNossaHistoriaController.updateANossaHistoria)

// Apagar uma entrada em "A Nossa Historia"
router.delete('/anossahistoria/:_id', aNossaHistoriaController.deleteANossaHistoria)

module.exports = router
