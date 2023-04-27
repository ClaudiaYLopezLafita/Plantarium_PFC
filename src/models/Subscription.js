var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var User = require('../models/User.js');
var Garden = require('../models/Garden.js');

//esquema de la
var SubscriptionSchema = new Schema({
    codSubscription: {
        type: String, 
        required: true, 
        index:{unique: true}
    },
    date: {
        type: Date, 
        required: true, 
        default: Date.now
    },
    type: {
        type: String, 
        enum: ['premium', 'general'], 
        default: 'general'
    },
    numCard:{
        type: Number, 
        required:false
    },
    garden:{
        type:Schema.ObjectId, 
        ref: 'Garden', 
        required: true
    }
});

//Exportación del modelo
module.exports = mongoose.model('Subscription', SubscriptionSchema);