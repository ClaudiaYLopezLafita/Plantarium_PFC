var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// modelos referenciados
var Garden = require('../models/Garden.js');
var Supplier = require('../models/Supplier.js');
var Attendance = require('../models/Attendance.js');
var Symptom = require('../models/Symptom.js');

//definicion del modelo 
var PlantSchema = new Schema({
    codPlant:{
        type: String, 
        required:true, 
        index:{unique:true}
    },
    sciName:{
        type: String, 
        required:true, 
        index:{unique:true}
    },
    comName:{
        type: String,
        required: true
    },
    genus:{
        type: String, 
        required: true
    },
    family: {
        type: String, 
        required: true
    },
    distribution: {
        type: String, 
        enum: ['Cosmopolita', 'Endémico'], 
        default: 'Cosmopolita'
    },
    habitat: {
        type: String, 
        required: true
    },
    description: {
        type: String, 
        required: true
    },
    curiosities: {
        type: String, 
        required: false
    },
    precautions: {
        type: String, 
        required: false
    },
    categories: [{
        type: String, 
        required: true
    }],
    images: [{
        type: String, 
        required: true
    }],
    status:{
        type: String, enum: 
        ['Visible', 'No visible'], 
        default: 'Visible'
    },
    attendance:{
        type: Schema.Types.String,
        ref: 'Attendance',
        required: false
    },
    gardens: [
        {
            type: Schema.Types.String, 
            ref: 'Garden',  
            default: null
        }
    ],
    suppliers: [
        {
            type: Schema.Types.String, 
            ref: 'Supplier',  
            default: null
        }
    ],
    symptoms: [
        {
            type: Schema.Types.String, 
            ref: 'Symptom',  
            default: null
        }
    ]
})

//Exportación del modelo
module.exports = mongoose.model('Plant', PlantSchema);