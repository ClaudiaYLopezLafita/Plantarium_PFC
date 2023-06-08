var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

//modelos
const Pay = require('../models/Pay')
const User = require('../models/User')
const Subscription = require('../models/Subscription')

var db = mongoose.connection;

/* GET ALL pays listing. */
router.get('/',function(req, res, next) {
    // guion para orden decreciente
        Pay.find()
        .then(pays => res.status(200).json(pays))
        .catch(err => res.status(500).json({ message: err }));
});

/* POST new Pay */
router.post('/', async (req, res) =>{
    const {codPay, subscription, user} = req.body;
    
    try {
        const userinfo = await User.findById(user).populate(
            {
                path: 'subscription',
                model: 'Subscription',
                select: '' 
            }
        );
        console.log(userinfo)
        if (userinfo) {
            const newPay = await Pay.create(req.body);
            userinfo.payments.push(newPay);
            userinfo.save();
            res.status(200).send("Pago realizado correctamente");
        } else {
            res.status(500).send("Usuario no localizado");
        }
        
    } catch (error) {
        console.error(error);
        res.status(500).send("Pago no realizado")
    }
})

module.exports = router;