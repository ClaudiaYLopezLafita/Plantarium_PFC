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
    subscriptionIdent:{
        type: Schema.Types.ObjectId, 
        ref: 'Subscription', 
        required: true
    },
    plants: [
        {
            type: Schema.Types.ObjectId, 
            ref: 'Plant',  
            default: null
        }
    ]
});

//Exportación del modelo
module.exports = mongoose.model('Garden', GardenSchema);