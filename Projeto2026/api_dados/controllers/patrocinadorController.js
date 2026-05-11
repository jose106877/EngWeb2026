const Patrocinador = require('../models/Patrocinador')

function buildPatrocinadorPayload(req)
{
    const payload = {...req.body}

    if(req.file)
        payload.logo = `/media/patrocinadores/${req.file.filename}`

    return payload
}

function buildPatrocinadorUpdatePayload(req)
{
    const payload = buildPatrocinadorPayload(req)
    delete payload._id
    return payload
}

const patrocinadorController = 
{
    createPatrocinador: async function(req, res) 
    {
        try
        {
            const newPatrocinador = new Patrocinador(buildPatrocinadorPayload(req))
            await newPatrocinador.save()
            res.status(201).json(newPatrocinador)

        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    getAllPatrocinadores: async function(req, res) 
    {
        try
        {
            const patrocinadors = await Patrocinador.find()
            res.json(patrocinadors)

        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getPatrocinadorById: async function(req, res) 
    {
        try
        {
            const patrocinador = await Patrocinador.findById(req.params._id)
            if(!patrocinador)
            {
                res.status(404).json({message: "Patrocinador não encontrado..."})

            }else{
                res.json(patrocinador)
            }

        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    updatePatrocinador: async function(req, res) 
    {
        try
        {
            const patrocinador = await Patrocinador.findByIdAndUpdate(req.params._id, buildPatrocinadorUpdatePayload(req), {new: true})
            if(!patrocinador)
            {
                res.status(404).json({message: "Patrocinador não encontrado..."})

            }else{
                res.json(patrocinador)
            }

        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    deletePatrocinador: async function(req, res) 
    {
        try
        {
            const patrocinador = await Patrocinador.findByIdAndDelete(req.params._id)
            if(!patrocinador)
            {
                res.status(404).json({message: "Patrocinador não encontrado..."})

            }else{
                res.json(patrocinador)
            }

        }catch(error){
            res.status(400).json({message: error.message})
        }
    }
}

module.exports = patrocinadorController
