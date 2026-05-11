const mongoose = require('mongoose')

const atividadeSchema = new mongoose.Schema
({
    _id: {type: String, required: true},
    titulo: {type: String, required: true},
    link: {type: String, required: true},
    data: {type: Date, required: true},
    nome_destaque: {type: String, default: ''},
    imagem_destaque: {type: String, default: ''},
    mostrar_no_carrossel: {type: Boolean, default: false},
    ordem_carrossel: {type: Number, default: 0},
    privacidade: {type: String, required: true}
})


const Atividade = mongoose.model('Atividade', atividadeSchema, 'atividades')
module.exports = Atividade
