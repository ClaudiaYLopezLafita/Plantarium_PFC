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
    const userId = req.body.id;
    try {
        const userinfo = await User.findById(userId).populate('subscription');
        if (userinfo) {
            const codSubscription = generateRandomNumSubscription(userinfo.username);
            const newSubscriptions = await Subscription.create({
                codSubscription,
                userId
            });
            userinfo.subscription = newSubscriptions._id;
            userinfo.save();
            const subscriptionExist = await Subscription.findOne({codSubscription: codSubscription});
            createGarden(subscriptionExist._id);
            res.status(200).send("Suscripcion realizada correctamente");
            
        } else {
            res.status(500).send("Usuario no localizado");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Subscripcion no realizada")
    }
})

router.post('/delete', async ( req, res, next) =>{
    try {
        const id = req.body.id;
        deleteGarden(id)
        await Subscription.findByIdAndRemove(id);
    } catch (error) {
        return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			message: 'Por favor intentelo más tarde'})
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

async function createGarden(id) {
    try {
        const response = await axios.post('http://localhost:5000/gardens', {
            subscriptionId: id
        });
        console.log(response.data);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

async function deleteGarden(id) {
    try {
        const response = await axios.post('http://localhost:5000/gardens/delete', {
            subscriptionId: id
        });
        console.log(response.data);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
}

module.exports = router;