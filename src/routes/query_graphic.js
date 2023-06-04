const mongoose = require('mongoose')
var express = require('express');
var router = express.Router();
//modelos usados
const Plant = require('../models/Plant')
const Pay = require('../models/Pay')
const Subscription = require('../models/Subscription');

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

/* NUMERO DE SUSCRIPCIONES POR MES DE CADA TIPO */
router.get('/subscriptions', async(req, res, next) =>{
    try {
        const result = await Subscription.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: '$date' },
                        type: '$type'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    monthName: {
                        $let: {
                        // declaramos una variable con los meses
                            vars: {
                                monthsInString: [
                                'January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'
                                ]
                            },
                            in: {
                            // para obtener el nombre del mes correspondiente al número de mes en
                            // el _id.month
                                $arrayElemAt: ['$$monthsInString', '$_id.month']
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: '$monthName',
                    type: '$_id.type',
                    count: 1
                }
            }
        ]).exec(); 
        
        console.log(result);

        res.render('grafic-subscriptions', { title: 'Plantarium', btnNav: 'Logout',  data: result}); // Devolver los resultados como JSON

    } catch (error) {
        console.log(error);
        res.status(500).send('Error en el servidor');
    }
})

/* RESUMEN DE GANANCIAS */
router.get('/summary-pays', async (req, res, next)=>{
    try {
        const result = await Pay.aggregate([
            {
                $group: {
                //agrupamos por meses
                    _id: {
                        month: { $month: '$date' }
                    },
                    // sumamos la cantidad de cada mes
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: {
                        //definimos una variable 
                        $let: {
                            vars: {
                                monthsInString: [
                                    'January', 'February', 'March', 'April', 'May', 'June',
                                    'July', 'August', 'September', 'October', 'November', 'December'
                                ]
                            },
                            in: {
                                //obtener el nombre del mes correspondiente al valor numérico del mes 
                                $arrayElemAt: ['$$monthsInString', { $subtract: ['$_id.month', 1] }]
                            }
                        }
                    },
                    totalAmount: 1
                }
            },
            {
                $sort: { month: 1 }
            }
        ]).exec()
        res.render('grafic-pays', { title: 'Plantarium', btnNav: 'Logout',  data: result}); // Devolver los resultados como JSON

    } catch (error) {
        console.log(error);
        res.status(500).send('Error en el servidor');
    }
})
module.exports = router;