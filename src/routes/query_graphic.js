const mongoose = require('mongoose')

//modelos usados
const Plant = require('../models/Plant')
const Garden = require('../models/Garden')
const Supplier = require('../models/Supplier')
const Symptom = require('../models/Symptom')
const Attendance = require('../models/Attendance');

//conexion bbdd
var db = mongoose.connection;

const numPlantForCategorie = Plant.aggregate([
    {
        // agrupamos por categoriad
        $group: {
        _id: '$categories',
        count: { $sum: 1 }
        }
    },
    {
        // un registro por categoría
        $unwind: '$_id'
    },
    {
        // ordenación
        $sort: {
        _id: 1
        }
    }
])
.exec((err, result) => {
    if (err) {
        reject(err);
    } else {
        console.log(result);
        resolve(result);
    }
});

module.exports = {numPlantForCategorie}