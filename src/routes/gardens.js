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

  const subscription = req.body.subscription;
  // console.log("SUBSCRIPTION: " + subscription);

  try {
    const subscriptionExist = await Subscription.findOne({codSubscription: subscription}).populate();
    console.log(subscriptionExist)

    if(subscriptionExist){
        const codGarden = generateCodGarden();
        const name = generateNameGarden(subscriptionExist.user);
        // const subscription = subscriptionExist.codSubscription;
        const newGarden = await Garden.create({
          codGarden,
          name,
          subscription
        });
        subscriptionExist.garden = codGarden;
        subscriptionExist.save();
        res.status(200).send("Jardin creado correctamente");
    } else {
        res.status(404).send("Subscripcion no localizado");
    }
  } catch (error) {
      console.error(error);
      res.status(500).send("Jardin no creado error en el servidor")
  }

});

function generateCodGarden(){
  let codGarden = 'GAR';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code =''
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  codGarden = `${codGarden}-${code}`
  return codGarden;
}

function generateNameGarden(username){
  let name = `El jardin de ${username}`;
  return name;
}
module.exports = router;