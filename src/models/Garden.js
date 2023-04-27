var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Plant = require('../models/Plant.js');

var GardenSchema = new Schema({
    codGarden: {
        type: String, 
        required:true, 
        index:{unique:true}
    },
    name: {
        type: String, 
        required: false 
    },
    plants: [
        {
            type: Schema.ObjectId, 
            ref: 'Plant',  
            default: null
        }
    ]
});

//Exportación del modelo
module.exports = mongoose.model('Garden', GardenSchema);