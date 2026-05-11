const express = require('express')
const router = express.Router()
const multer = require('multer')
const supportController = require('../controllers/supportController')

router.post('/apoio-aluno', multer().none(), supportController.submitSupportRequest)

module.exports = router
