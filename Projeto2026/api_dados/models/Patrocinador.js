const mongoose = require('mongoose')

const patrocinadorSchema = new mongoose.Schema
({
    _id: {type: String, required: true},
    nome: {type: String, required: true},
    link: {type: String, default: ''},
    logo: {type: String, required: true},
    privacidade: {type: String, required: true}
})


const Patrocinador = mongoose.model('Patrocinador', patrocinadorSchema, 'patrocinadores')
module.exports = Patrocinador
