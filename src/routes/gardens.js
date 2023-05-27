var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
//modelos usados
const Plant = require('../models/Plant')
const Garden = require('../models/Garden')
const Subscription = require('../models/Subscription')
const User = require('../models/User')
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
    // console.log(subscriptionExist)

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
      res.status(500).send("Jardin no creado error en el servidor")
  }

});

/* GET single garden */
router.get('/:id', async (req, res, next) =>{
  try {
    const userExist = await User.findById(req.params.id);

    if(userExist){
      const subscriptionExist = await Subscription.findOne({codSubscription: userExist.subscription})

      if(subscriptionExist){
        const gardenExist = await Garden.findOne({subscription: subscriptionExist.codSubscription})
        .populate([{
          path: 'plants',
          model: 'Plant',
          select: '-_id -codSupplier' 
        }])

        if(gardenExist){
          res.render('garden', { title: 'Plantarium', btnNav: 'Logout',  garden: gardenExist});
        }
      }
    }
  } catch (error) {
    return res.status(500).send('Problemas en el servidor')
  }
})

/* POST insert plant */
router.post('/insert-plant', async (req, res, next) =>{
  // capturar el cookie con id user
  const {idPlant} = req.body;
  const iduser = req.cookies.userid
  console.log('COOKIE: '+iduser)
  try {
    const userExist = await User.findById(iduser);

    if(userExist){
      const subscriptionExist = await Subscription.findOne({codSubscription: userExist.subscription})
      
      if(subscriptionExist){
        
        const gardenExist = await Garden.findOne({subscription: subscriptionExist.codSubscription}).populate([
            {
            path: 'plants',
            model: 'Plant',
            select: '' 
          }
        ])
        if(gardenExist){
          // Agregar la nueva planta al array existente
          if (gardenExist.plants && gardenExist.plants.length > 0) {
            // operador spread para agregar todos los elementos que vengan
            gardenExist.plants.unshift(idPlant);
          }else{
            gardenExist.plants.push(idPlant);
          }
          await gardenExist.save()

          const planta = await Plant.findById(idPlant);
          planta.gardens.push(gardenExist._id);

          await planta.save()
          // res.render('garden', { title: 'Plantarium', btnNav: 'Logout',  garden: gardenExist});
          // return res.status(200).send('Planta insertada')
          res.redirect(req.get('referer'));
        }
      }
    }
  } catch (error) {
    return res.status(500).send('Problemas en el servidor')
  }
})

/* DELETE plant in garder */
router.post('/delete-plant', async (req, res, next) =>{

  const{idPlant, idGarden} = req.body
  try {
    const gardenExist = await Garden.findById(idGarden);
    // console.log(gardenExist)
    if(gardenExist){
      //borramos la planta del array de plants del jardin
      const plantArray = gardenExist.plants;
      const indice = plantArray.indexOf(idPlant);
      plantArray.splice(indice);

      // borramos el jardin del array de jardines de la planta
      const plant = await Plant.findOne({codPlant: idPlant})
      const gardenArray = plant.gardens
      const indiceP = gardenArray.indexOf(idGarden);
      gardenArray.splice(indiceP)

      await gardenExist.save();
      await plant.save()
      res.redirect(req.get('referer'));      
    }else{
      return res.status(404).send('Garden no localizado')
    }
  } catch (error) {
    return res.status(500).send('Problemas en el servidor')
  }

})

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