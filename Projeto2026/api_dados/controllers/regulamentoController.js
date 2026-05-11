const Regulamento = require('../models/Regulamento')

function buildRegulamentoPayload(req)
{
    const payload = {...req.body}

    if(req.file)
        payload.link = `/download/documentos/${req.file.filename}`

    return payload
}

function buildRegulamentoUpdatePayload(req)
{
    const payload = buildRegulamentoPayload(req)
    delete payload._id
    return payload
}

const regulamentoController = 
{
    createRegulamento: async function(req, res) 
    {
        try
        {
            const newRegulamento = new Regulamento(buildRegulamentoPayload(req))
            await newRegulamento.save()
            res.status(201).json(newRegulamento)

        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    getAllRegulamentos: async function(req, res) 
    {
        try
        {
            const regulamentos = await Regulamento.find()
            res.json(regulamentos)

        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getRegulamentoById: async function(req, res) 
    {
        try
        {
            const regulamento = await Regulamento.findById(req.params._id)
            if(!regulamento)
            {
                res.status(404).json({message: "Regulamento não encontrado..."})

            }else{
                res.json(regulamento)
            }

        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    updateRegulamento: async function(req, res) 
    {
        try
        {
            const regulamento = await Regulamento.findByIdAndUpdate(req.params._id, buildRegulamentoUpdatePayload(req), {new: true})
            if(!regulamento)
            {
                res.status(404).json({message: "Regulamento não encontrado..."})

            }else{
                res.json(regulamento)
            }

        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    deleteRegulamento: async function(req, res) 
    {
        try
        {
            const regulamento = await Regulamento.findByIdAndDelete(req.params._id)
            if(!regulamento)
            {
                res.status(404).json({message: "Regulamento não encontrado..."})

            }else{
                res.json(regulamento)
            }

        }catch(error){
            res.status(400).json({message: error.message})
        }
    }
}

module.exports = regulamentoController
