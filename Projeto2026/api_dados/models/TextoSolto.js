const mongoose = require('mongoose')

const vantagemSocioSchema = new mongoose.Schema
({
    texto: { type: String, required: true },

}, { _id: false })

const textosoltoSchema = new mongoose.Schema
({
    slogan: {type: String, required: true},
    carta_comunidade: {type: String, required: true},
    "link-voluntario": {type: String, default: ""},
    "link-colaborador": {type: String, default: ""},
    vantagens_socio: {type: [vantagemSocioSchema], required: true, default: []}

}, { _id: false })


const TextoSolto = mongoose.model('TextoSolto', textosoltoSchema, 'texto_solto')
module.exports = TextoSolto
