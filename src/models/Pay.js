var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var User = require('../models/User.js');
var Subscription = require('../models/Subscription.js');

// esquema de la entidad pago
var PaySchema = new Schema({
    codPay:{
        type:String, 
        required:true, 
        index:{unique:true}
    },
    date:{
        type:Date, 
        required: true, 
        index:{unique: true}, 
        default: Date.now
    },
    amount: {
        type: Number, 
        required: true, 
        default: 5.95
    },
    subscription:{
        type: Schema.Types.String, 
        ref: 'Subscription', 
        required: false
    },
    user:{
        type: Schema.Types.String, 
        ref: 'User', 
        required: true
    }
});

//Exportación del modelo
module.exports = mongoose.model('Pay', PaySchema);