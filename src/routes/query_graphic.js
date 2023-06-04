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
            
            const result2 = await Plant.aggregate([
                {
                    $project: {
                        _id: 0,
                        sciName: 1,
                        gardenCount: { $size: "$gardens" }
                    }
                },
                {
                    $sort: {
                    gardenCount: -1
                    }
                },
                {
                    $limit: 5
                }
            ])
            .exec();

            console.log(result)
            console.log(result2)

            res.render('grafic-plants', { title: 'Plantarium', btnNav: 'Logout',  data: result, data2: result2}); // Devolver los resultados como JSON
        } catch (error) {
        console.error(error);
        res.status(500).send('Error en el servidor');
        } 
} )


module.exports = router;