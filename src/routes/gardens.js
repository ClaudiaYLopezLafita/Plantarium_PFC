var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
//modelos usados
const Plant = require('../models/Plant')
const Garden = require('../models/Garden')
const Subscription = require('../models/Subscription')
//conexion bbdd
var db = mongoose.connection;

/* GET ALL gardens listing. */
router.get('/',function(req, res, next) {
    Garden.find()
      .then(gardens => res.status(200).json(gardens))
      .catch(err => res.status(500).json({ message: err }));
  });
  
/* POST create garden */
router.post('/', async (req, res, next) => {

  const { codGarden, name, subscription} = req.body;
  console.log(subscription)
  try {
    const subscriptionExist = await Subscription.findOne({codSubscription: subscription})
    if(subscriptionExist){
        const newGarden = await Garden.create(req.body);
        res.status(200).send("Jardin creado correctamente");
    } else {
        res.status(404).send("Subscripcion no localizado");
    }
  } catch (error) {
      console.error(error);
      res.status(500).send("Jardin no creado error en el servidor")
  }

});

module.exports = router;