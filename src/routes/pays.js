var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

//modelos
const Pay = require('../models/Pay')
const User = require('../models/User')
const Subscription = require('../models/Subscription')

var db = mongoose.connection;

/* POST new Pay */
router.post('/', async (req, res) =>{
    const {codPay, date, amount, subscription, user} = req.body;
    console.log(user)
    try {
        const userinfo = await User.findOne({ _idusername: user });
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