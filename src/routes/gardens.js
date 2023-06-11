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

  const subscriptionIdent = req.body.subscriptionId;
  console.log("SUBSCRIPTION: " + subscriptionIdent);

  try {
    const subscriptionExist = await Subscription.findById(subscriptionIdent);
    const userInfo = await User.findOne({subscription: subscriptionIdent})
    console.log(userInfo)

    if(subscriptionExist){
        const codGarden = generateCodGarden();
        console.log(codGarden)
        const name = generateNameGarden(userInfo.username);
        console.log(name)

        const newGarden = await Garden.create({
          codGarden,
          name,
          subscriptionIdent
        });
        subscriptionExist.garden = newGarden._id;
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
      const subscriptionExist = await Subscription.findById(userExist.subscription)

      if(subscriptionExist){
        const gardenExist = await Garden.findOne({subscriptionIdent: subscriptionExist._id})
        .populate([{
          path: 'plants',
          model: 'Plant',
          select: ' -codSupplier' 
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

/* GET delete garden */
router.post('/delete', async (req, res, next) =>{
  try {
    //capturamos el identificador de jardin
    const subsId = req.body.subscriptionId;

    const gardenExist = await Garden.findOne({subscriptionIdent: subsId})
    // borramos las referencias del jardin en el array de plantas
    await Plant.updateMany(
      { gardens: gardenExist._id }, // Filtramos las plants que tienen el ID del jardin
      { $pull: { gardens: gardenExist._id } } // Eliminamos el ID del jardin del array de gardens
    );

    await Garden.findByIdAndRemove(gardenExist._id);
  } catch (error) {
    return res.status(500).send('Problemas en el servidor')
  }
})

/* POST insert plant */
router.post('/insert-plant', async (req, res, next) =>{
  // capturar el cookie con id user
  const {idPlant} = req.body;
  const iduser = req.cookies.userid
  try {
    const userExist = await User.findById(iduser);
    if(userExist){
      const subscriptionExist = await Subscription.findById(userExist.subscription)
      if(subscriptionExist){
        const gardenExist = await Garden.findOne({subscriptionIdent: subscriptionExist._id}).populate([
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
          //añadimos el id del jardin al array de gardens de la planta
          const planta = await Plant.findById(idPlant);
          planta.gardens.push(gardenExist._id);

          await planta.save()
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