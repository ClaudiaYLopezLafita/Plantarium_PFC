var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var User = require('../models/User.js');
var Garden = require('../models/Garden.js');
var Pay = require('../models/Pay.js');
var User = require('../models/User.js');

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
    payments:[{
        type: Schema.Types.ObjectId,
        ref: 'Pay', 
        required:false,
        default: null
    }],
    garden:{
        type:Schema.Types.ObjectId, 
        ref: 'Garden', 
        required: false
    },
    userId:{
        type:Schema.Types.ObjectId, 
        ref: 'User', 
        required: true
    }
});

//Exportación del modelo
module.exports = mongoose.model('Subscription', SubscriptionSchema);