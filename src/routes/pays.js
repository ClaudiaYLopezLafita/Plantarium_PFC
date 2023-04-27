var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

//modelos
const Pay = require('../models/Pay')
const User = require('../models/User')
const Subscription = require('../models/Subscription')

var db = mongoose.connection;

/* POST new user */
router.post('/', async (req, res) =>{
    const {codPay, date, amount, subscription, user} = req.body;

    const userInfo = await User.findOne({ user });
    if(userInfo){
        // Registrar pago
        const pay = await Pay.create(req.body);

        userInfo.payments.push(pay);

        userInfo.save( async (err) => {
            if (err) res.status(500).send(err);
                    else {
                        pay.save(function(err) {
                        if (err) res.status(500).send(err);
                        res.sendStatus(200);
                        });
                    }
        })
    } 

})

module.exports = router;