var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// modelos referenciados
var Plant = require('../models/Plant.js');

// modelado de la entidad
var SupplierSchema = new Schema({
    codSupplier: {
        type: String, 
        required: true, 
        index:{unique:true}
    },
    name: {
        type: String, 
        required: true
    },
    address: {
        type: String, 
        required: true
    },
    email: {
        type: String, 
        required: true
    },
    url: {
        type: String, 
        required: true
    },
    phone: {
        type: Number, 
        required: false
    },
    locality: {
        type: String, 
        required: true
    },
    plants: [
        {
            type: Schema.ObjectId, 
            ref: 'Plant',  
            default: null
        }
    ]
    // coordinates:{ 
    //     type: "Point", 
    //     required: true
    // },
});

//Exportación del modelo
module.exports = mongoose.model('Supplier', SupplierSchema);