const Pessoa = require('../models/Pessoa')

const pessoaController = 
{
    createPessoa: async function(req, res) 
    {
        try
        {
            const newPessoa = new Pessoa(req.body)
            await newPessoa.save()
            res.status(201).json(newPessoa)

        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    getAllPessoas: async function(req, res) 
    {
        try
        {
            const pessoas = await Pessoa.find()
            res.json(pessoas)

        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getPessoaById: async function(req, res) 
    {
        try
        {
            const pessoa = await Pessoa.findById(req.params._id)
            if(!pessoa)
            {
                res.status(404).json({message: "Pessoa não encontrada..."})

            }else{
                res.json(pessoa)
            }

        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    updatePessoa: async function(req, res) 
    {
        try
        {
            const payload = {...req.body}
            delete payload._id
            const pessoa = await Pessoa.findByIdAndUpdate(req.params._id, payload, {new: true})
            if(!pessoa)
            {
                res.status(404).json({message: "Pessoa não encontrada..."})

            }else{
                res.json(pessoa)
            }

        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    deletePessoa: async function(req, res) 
    {
        try
        {
            const pessoa = await Pessoa.findByIdAndDelete(req.params._id)
            if(!pessoa)
            {
                res.status(404).json({message: "Pessoa não encontrada..."})

            }else{
                res.json(pessoa)
            }

        }catch(error){
            res.status(400).json({message: error.message})
        }
    }
}

module.exports = pessoaController
