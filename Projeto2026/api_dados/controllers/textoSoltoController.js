const TextoSolto = require('../models/TextoSolto')

const textoSoltoController =
{
    get: async function(req, res)
    {
        try
        {
            const textoSolto = await TextoSolto.findOne()
            if(!textoSolto)
            {
                res.status(404).json({message: "Texto solto não encontrado..."})
            }else{
                res.json(textoSolto)
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },

    
    getSlogan: async function(req, res)
    {
        try
        {
            const textoSolto = await TextoSolto.findOne().select('slogan')
            if(!textoSolto)
            {
                res.status(404).json({message: "Texto solto não encontrado..."})
            }else{
                res.json(textoSolto.slogan)
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getCartaComunidade: async function(req, res)
    {
        try
        {
            const textoSolto = await TextoSolto.findOne().select('carta_comunidade')
            if(!textoSolto)
            {
                res.status(404).json({message: "Texto solto não encontrado..."})
            }else{
                res.json(textoSolto.carta_comunidade)
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getVantagensSocio: async function(req, res)
    {
        try
        {
            const textoSolto = await TextoSolto.findOne().select('vantagens_socio')
            if(!textoSolto)
            {
                res.status(404).json({message: "Texto solto não encontrado..."})
            }else{
                res.json(textoSolto.vantagens_socio)
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },

    getLinkVoluntario: async function(req, res)
    {
        try
        {
            const textoSolto = await TextoSolto.findOne().select('link-voluntario')
            if(!textoSolto)
            {
                res.status(404).json({message: "Texto solto não encontrado..."})
            }else{
                res.json(textoSolto["link-voluntario"] || "")
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },

    getLinkColaborador: async function(req, res)
    {
        try
        {
            const textoSolto = await TextoSolto.findOne().select('link-colaborador')
            if(!textoSolto)
            {
                res.status(404).json({message: "Texto solto não encontrado..."})
            }else{
                res.json(textoSolto["link-colaborador"] || "")
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    update: async function(req, res)
    {
        try
        {
            const textoSolto = await TextoSolto.findOneAndUpdate({}, req.body, {new: true})
            if(!textoSolto)
            {
                res.status(404).json({message: "Texto solto não encontrado..."})
            }else{
                res.json(textoSolto)
            }
        }catch(error){
            res.status(400).json({message: error.message})
        }
    }
}

module.exports = textoSoltoController
