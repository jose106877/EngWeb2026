const mongoose = require('mongoose')

const regulamentoSchema = new mongoose.Schema
({
    _id: {type: String, required: true},
    nome: {type: String, required: true},
    link: {type: String, required: true},
    ano: {type: String, required: true},
    departamento: {type: String, required: true},
    privacidade: {type: String, required: true}
})


const Regulamento = mongoose.model('Regulamento', regulamentoSchema, 'regulamentos')
module.exports = Regulamento
