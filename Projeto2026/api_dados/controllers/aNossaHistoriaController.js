const ANossaHistoria = require('../models/ANossaHistoria')

function buildANossaHistoriaPayload(req)
{
    const payload = {...req.body}

    if(req.file)
        payload.link = `/media/a_nossa_historia/${req.file.filename}`

    return payload
}

function buildANossaHistoriaUpdatePayload(req)
{
    const payload = buildANossaHistoriaPayload(req)
    delete payload._id
    return payload
}

const anossahistoriaController = 
{
    createANossaHistoria: async function(req, res) 
    {
        try
        {
            const link = req.file ? `/media/a_nossa_historia/${req.file.filename}` : null
            const newANossaHistoria = new ANossaHistoria({...req.body, link})

            await newANossaHistoria.save()
            res.status(201).json(newANossaHistoria)

        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    getAllANossaHistorias: async function(req, res) 
        {
    try
            {
    const anossahistorias = await ANossaHistoria.find()
    res.json(anossahistorias)
            }catch(error){
    res.status(500).json({message: error.message})
            }
        },
    getANossaHistoriaById: async function(req, res) 
        {
    try
            {
    const anossahistoria = await ANossaHistoria.findById(req.params._id)
    if(!anossahistoria)
                {
    res.status(404).json({message: "A Nossa Historia não encontrada..."})
                }else{
    res.json(anossahistoria)
                }
            }catch(error){
    res.status(500).json({message: error.message})
            }
        },
    updateANossaHistoria: async function(req, res) 
        {
    try
            {
    const anossahistoria = await ANossaHistoria.findByIdAndUpdate(req.params._id, buildANossaHistoriaUpdatePayload(req), {new: true})
    if(!anossahistoria)
                {
    res.status(404).json({message: "A Nossa História não encontrada..."})
                }else{
                    res.json(anossahistoria)
                }
            }catch(error){
                res.status(400).json({message: error.message})
            }
    },

    deleteANossaHistoria: async function(req, res) 
    {
        try
        {
        const anossahistoria = await ANossaHistoria.findByIdAndDelete(req.params._id)
        if(!anossahistoria)
            {
                res.status(404).json({message: "A Nossa História não encontrada..."})
            }else{
                res.json(anossahistoria)
            }
        }catch(error){
            res.status(400).json({message: error.message})
        }
    }
}
module.exports = anossahistoriaController
