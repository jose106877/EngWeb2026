const mongoose = require('mongoose')

const pessoaSchema = new mongoose.Schema
({
    _id: {type: String, required: true},
    nome: {type: String, required: true},
    foto: {type: String, required: true},
    ano: {type: String, required: true},
    cargo: {type: String, required: true},
    privacidade: {type: String, required: true}
})


const Pessoa = mongoose.model('Pessoa', pessoaSchema, 'pessoas')
module.exports = Pessoa
