var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// modelos referenciados
var Plant = require('../models/Plant.js');

//modelo de la entidad tratamienro a embeber en enfermedad
var treatmentSchema = new Schema({
    codTreatment:{
        type: String, 
        required: true, 
    },
    period: {
        type: String, 
        required: true
    },
    application: {
        type: String, 
        required: true
    },
    comment: {
        type: String, 
        required: false
    }
})

//modelo de las entidades a embeber en sintoma: enfermedad
var diseaseSchema = new Schema({
    codDisease: {
        type: String, 
        required: true, 
    },
    name: {
        type: String, 
        required: true
    },
    cause: {
        type: String, 
        enum: ['Cuidados erróneos', 'Patógeno', 'Ciclo de vida']
    },
    description: {
        type: String, 
        required: true
    },
    treatment:{
        type: treatmentSchema,
    }
})


//modelo de SINTROMAS
var SymptomSchema = new Schema({
    codSymptom: {
        type: String, 
        required: true, 
        index:{unique:true}
    },
    title: {
        type: String, 
        required: true
    },
    description: {
        type: String, 
        required: true
    },
    disease: {
        type: diseaseSchema,
    },
    plants:[{
        type: Schema.ObjectId,
        ref: 'Plant',
        default: null
    }]
})


//Exportación del modelo
module.exports = mongoose.model('Symptom', SymptomSchema);