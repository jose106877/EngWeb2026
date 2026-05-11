const express = require('express')
const router = express.Router()
const createUpload = require('../middleware/upload')
const upload = createUpload('departamento_fundo', 'imagem')
const departamentoController = require('../controllers/departamentoController')


// Adicionar um departamento novo
router.post('/departamentos', upload.single('imagem'), departamentoController.createDepartamento)

// Consultar todos os departamentos
router.get('/departamentos', departamentoController.getAllDepartamentos)

// Consultar um departamento
router.get('/departamentos/:_id', departamentoController.getDepartamentoById)

// Consultar todas as pessoas de um certo departamento
router.get('/departamentos/:_id/pessoas', departamentoController.getPessoasByDepartamento)

// Consultar a organização de participantes de um certo departamento
router.get('/departamentos/:_id/participantes', departamentoController.getParticipantesByDepartamento)

// Consultar todos os regulamentos de um certo departamento
router.get('/departamentos/:_id/regulamentos', departamentoController.getRegulamentosByDepartamento)

// Consultar todas as atividades de um certo departamento
router.get('/departamentos/:_id/atividades', departamentoController.getAtividadesByDepartamento)

// Atualizar informação de um departamento
router.put('/departamentos/:_id', upload.single('imagem'), departamentoController.updateDepartamento)

// Apagar um departamento
router.delete('/departamentos/:_id', departamentoController.deleteDepartamento)

module.exports = router
