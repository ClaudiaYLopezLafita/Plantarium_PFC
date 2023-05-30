var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// modelos referenciados
var Plant = require('../models/Plant.js');

//Modelado de la entidad
var AttendanceSchema= new Schema({
    codAttendace: {
        type: String, 
        required:true, 
        index:{unique:true}
    },
    water: {
        type: String, 
        enum: ['Poco frecuente', 'Frecuente', 'Muy Frecuente'], 
        default: 'Frecuente'
    },
    soil: {
        type: String, 
        required: true
    },
    compost: {
        type: String, 
        required: true
    },
    moisture: {
        type: String, 
        required: false
    },
    temperature: {
        type: String, 
        required: true
    },
    lightning: {
        type: String, 
        enum: ['Alta', 'Moderada', 'Baja'], 
        default: 'Moderada'
    },
    comment: {
        type: String, 
        required: true
    },
    plant: {
        type: Schema.ObjectId, 
        ref: 'Plant', 
        required: false
    }

});

//Exportación del modelo
module.exports = mongoose.model('Attendance', AttendanceSchema);