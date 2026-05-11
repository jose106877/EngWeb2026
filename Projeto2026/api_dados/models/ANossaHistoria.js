const mongoose = require('mongoose')

const aNossaHistoriaSchema = new mongoose.Schema
({
    _id: {type: String, required: true},
    ano: {type: String, required: true},
    link: {type: String, required: true},
    privacidade: {type: String, required: true}
})


const ANossaHistoria = mongoose.model('ANossaHistoria', aNossaHistoriaSchema, 'a_nossa_historia')
module.exports = ANossaHistoria
