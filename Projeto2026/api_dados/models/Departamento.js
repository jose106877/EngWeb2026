const mongoose = require('mongoose')

const participanteDepartamentoSchema = new mongoose.Schema
({
    pessoa: { type: String, ref: 'Pessoa', required: true },
    cargo: { type: String, default: '' },
    ordem: { type: Number, default: 0 }
}, { _id: false })

const departamentoSchema = new mongoose.Schema
({
    _id: {type: String, required: true},
    nome: {type: String, required: true},
    descricao: {type: String, required: true},
    link_fundo: {type: String, required: true},
    parte_da_direcao: {type: String, required: true},
    regulamentos: [{ type: String, ref: 'Regulamento' }],
    atividades: [{ type: String, ref: 'Atividade' }],
    pessoas: [{ type: String, ref: 'Pessoa' }],
    participantes: { type: [participanteDepartamentoSchema], default: [] },
    privacidade: {type: String, required: true}
})


const Departamento = mongoose.model('Departamento', departamentoSchema, 'departamentos')
module.exports = Departamento
