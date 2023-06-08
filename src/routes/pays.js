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
    const {user} = req.body;
    
    try {
        const userinfo = await User.findById(user).populate(
            {
                path: 'subscription',
                model: 'Subscription',
                select: '' 
            }
        );
        
        if (userinfo) {
            const codigo = createCodigo(userinfo.username)
            const newPay = await Pay.create({
                codPay: codigo,
                subscription: userinfo.subscription._id,
                user
            });
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

function createCodigo(username){
    // Obtenemos los tres primeros caracteres de la cadena
    const tresPrimeros = username.slice(0, 3);

    // Obtenemo la fecha actual en formato yyyy-mm-dd
    const fechaActual = new Date().toISOString().slice(0, 10);

    // Concatenamos los tres primeros caracteres con la fecha actual
    const codigo = `${tresPrimeros}-${fechaActual}`.toUpperCase();

    return codigo
}

module.exports = router;