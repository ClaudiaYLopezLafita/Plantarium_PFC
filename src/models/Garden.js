var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Plant = require('../models/Plant.js');
var Subscription = require('../models/Subscription.js');

var GardenSchema = new Schema({
    codGarden: {
        type: String, 
        required:true, 
        index:{unique:true}
    },
    name: {
        type: String, 
        required: true 
    },
    subscription:{
        type: Schema.Types.String, 
        ref: 'Subscription', 
        required: true
    },
    plants: [
        {
            type: Schema.Types.String, 
            ref: 'Plant',  
            default: null,
            required: false
        }
    ]
});

//Exportación del modelo
module.exports = mongoose.model('Garden', GardenSchema);