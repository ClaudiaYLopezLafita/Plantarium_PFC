const mongoose = require('mongoose')
var express = require('express');
var router = express.Router();
//modelos usados
const Plant = require('../models/Plant')
const Garden = require('../models/Garden')
const Supplier = require('../models/Supplier')
const Symptom = require('../models/Symptom')
const Attendance = require('../models/Attendance');

//conexion bbdd
var db = mongoose.connection;

/* PLANTAS POR CATEGORÍA */
router.get('/categoriPlant', async(req, res, next) =>{
        try {
            
            const result = await Plant.aggregate([
                {
                    $unwind: {
                        path: "$categories",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: {
                        $ifNull: ["$categories", 0]
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
                ]).exec();
              
            console.log(result)
            res.render('grafic-plants', { title: 'Plantarium', btnNav: 'Logout',  data: result}); // Devolver los resultados como JSON
        } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
        } 
} )

module.exports = router;