var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const axios = require('axios');

//modelos
const Subscription = require('../models/Subscription');
const Pay = require('../models/Pay')
const User = require('../models/User')
const Garden = require('../models/Garden')

var db = mongoose.connection;

// /* GET ALL subscriptions listing. */
router.get('/',function(req, res, next) {
    Subscription.find()
        .then(subscriptions => res.status(200).json(subscriptions))
        .catch(err => res.status(500).json({ message: err }));
});

/* POST create subscription */ 
router.post('/', async (req, res) =>{
    // console.log(req.body)
    const user = req.body.username;
    try {
        const userinfo = await User.findOne({ username: user }).populate('subscription');
        if (userinfo) {
            const codSubscription = generateRandomNumSubscription(user);
            const newSubscriptions = await Subscription.create({
                codSubscription,
                user
            });
            userinfo.subscription = codSubscription;
            userinfo.save();
            createGarden(codSubscription);
            res.status(200).send("Suscripcion realizada correctamente");
            
        } else {
            res.status(500).send("Usuario no localizado");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Subscripcion no realizada")
    }
})

function generateRandomNumSubscription(username) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    // Obtener los tres primeros caracteres del nombre de usuario
    const truncatedUsername = username.substring(0, 3).toUpperCase(); 
    for (let i = 0; i < 8; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        code += characters.charAt(randomIndex);
    }
    // Agregar los caracteres generados al nombre de usuario truncado
    const result = `${truncatedUsername}-${code}`
    return result; 
}

async function createGarden(subscription) {
    try {
        const response = await axios.post('http://localhost:5000/gardens', {
            subscription: subscription
        });
        console.log(response.data);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

module.exports = router;