const Departamento = require('../models/Departamento')

function normalizeArrayField(value)
{
    if(Array.isArray(value))
        return value.filter(Boolean)
    if(value === undefined || value === null || value === '')
        return []
    return [value]
}

function parseStructuredField(value)
{
    if(Array.isArray(value))
        return value

    if(typeof value === 'string')
    {
        const trimmed = value.trim()
        if(!trimmed)
            return []

        try
        {
            const parsed = JSON.parse(trimmed)
            return Array.isArray(parsed) ? parsed : []
        }catch(error){
            return []
        }
    }

    return []
}

function normalizeParticipantes(value, fallbackPessoas = [])
{
    const parsed = parseStructuredField(value)

    if(parsed.length)
    {
        return parsed
            .map((item, index) =>
            {
                const pessoa = item?.pessoa || item?.pessoaId || item?.value
                if(!pessoa)
                    return null

                const ordem = Number(item?.ordem)

                return {
                    pessoa: String(pessoa),
                    cargo: String(item?.cargo || '').trim(),
                    ordem: Number.isFinite(ordem) ? ordem : index
                }
            })
            .filter(Boolean)
            .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0))
    }

    return normalizeArrayField(fallbackPessoas).map((pessoa, index) => ({
        pessoa: String(pessoa),
        cargo: '',
        ordem: index
    }))
}

function buildDepartamentoPayload(req, preserveMissingRelations = false)
{
    const payload = {...req.body}

    ['regulamentos', 'atividades'].forEach((fieldName) =>
    {
        if(Object.prototype.hasOwnProperty.call(req.body, fieldName))
        {
            payload[fieldName] = normalizeArrayField(req.body[fieldName])
        }else if(!preserveMissingRelations){
            payload[fieldName] = []
        }
    })

    if(
        Object.prototype.hasOwnProperty.call(req.body, 'participantes') ||
        Object.prototype.hasOwnProperty.call(req.body, 'pessoas')
    )
    {
        payload.participantes = normalizeParticipantes(req.body.participantes, req.body.pessoas)
        payload.pessoas = payload.participantes.map((participante) => participante.pessoa)
    }else if(!preserveMissingRelations){
        payload.participantes = []
        payload.pessoas = []
    }

    if(req.file)
        payload.link_fundo = `/media/departamento_fundo/${req.file.filename}`

    return payload
}

function buildDepartamentoUpdatePayload(req)
{
    const payload = buildDepartamentoPayload(req, true)
    delete payload._id
    return payload
}

function buildParticipantesResponse(departamento)
{
    const participantes = Array.isArray(departamento?.participantes) ? departamento.participantes : []

    if(participantes.length)
    {
        return [...participantes]
            .sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0))
            .map((participante) =>
            {
                const pessoa = participante.pessoa || {}
                return {
                    pessoa,
                    cargo: participante.cargo || pessoa.cargo || '',
                    ordem: participante.ordem || 0
                }
            })
    }

    const fallbackPessoas = Array.isArray(departamento?.pessoas) ? departamento.pessoas : []
    return fallbackPessoas.map((pessoa, index) => ({
        pessoa,
        cargo: pessoa?.cargo || '',
        ordem: index
    }))
}

const departamentoController =
{
    createDepartamento: async function(req, res)
    {
        try
        {
            const newDepartamento = new Departamento(buildDepartamentoPayload(req))
            await newDepartamento.save()
            res.status(201).json(newDepartamento)
        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    getAllDepartamentos: async function(req, res)
    {
        try
        {
            const departamentos = await Departamento.find()
            res.json(departamentos)
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getDepartamentoById: async function(req, res)
    {
        try
        {
            const departamento = await Departamento.findById(req.params._id)
            if(!departamento)
            {
                res.status(404).json({message: 'Departamento não encontrado...'})
            }else{
                res.json(departamento)
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    updateDepartamento: async function(req, res)
    {
        try
        {
            const departamento = await Departamento.findByIdAndUpdate(req.params._id, buildDepartamentoUpdatePayload(req), {new: true})
            if(!departamento)
            {
                res.status(404).json({message: 'Departamento não encontrado...'})
            }else{
                res.json(departamento)
            }
        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    deleteDepartamento: async function(req, res)
    {
        try
        {
            const departamento = await Departamento.findByIdAndDelete(req.params._id)
            if(!departamento)
            {
                res.status(404).json({message: 'Departamento não encontrado...'})
            }else{
                res.json(departamento)
            }
        }catch(error){
            res.status(400).json({message: error.message})
        }
    },


    getPessoasByDepartamento: async function(req, res)
    {
        try
        {
            const departamento = await Departamento
                .findById(req.params._id)
                .populate('pessoas')

            if(!departamento)
            {
                res.status(404).json({message: 'Departamento não encontrado...'})
            }else{
                res.json(departamento.pessoas)
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getParticipantesByDepartamento: async function(req, res)
    {
        try
        {
            const departamento = await Departamento
                .findById(req.params._id)
                .populate('pessoas')
                .populate('participantes.pessoa')

            if(!departamento)
            {
                res.status(404).json({message: 'Departamento não encontrado...'})
            }else{
                res.json(buildParticipantesResponse(departamento))
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getRegulamentosByDepartamento: async function(req, res)
    {
        try
        {
            const departamento = await Departamento.findById(req.params._id).populate('regulamentos')
            if(!departamento)
            {
                res.status(404).json({message: 'Departamento não encontrado...'})
            }else{
                res.json(departamento.regulamentos)
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    },


    getAtividadesByDepartamento: async function(req, res)
    {
        try
        {
            const departamento = await Departamento.findById(req.params._id).populate('atividades')
            if(!departamento)
            {
                res.status(404).json({message: 'Departamento não encontrado...'})
            }else{
                res.json(departamento.atividades)
            }
        }catch(error){
            res.status(500).json({message: error.message})
        }
    }
}

module.exports = departamentoController
