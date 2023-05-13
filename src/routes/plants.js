var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
//modelos usados
const Plant = require('../models/Plant')
const Garden = require('../models/Garden')
const Supplier = require('../models/Supplier')
const Symptom = require('../models/Symptom')
const Attendance = require('../models/Attendance');
//conexion bbdd
var db = mongoose.connection;

/* GET ALL plants */
router.get('/',function(req, res, next) {
    //pobrar el paginator
    Plant.find()
    .then(plants => res.status(200).json(plants))
    .catch(err => res.status(500).json({ message: err }));
});

/* POST Create plants */
router.post('/', async (req, res, next) =>{
    const {sciName, comName, genus, family,
    distribution, habitat, description, curiosities, precautions,
    categories,images, status } = req.body;

    try {
        const codPlant = generateCodPlant(sciName);

        const newPlant = Plant.create({
            codPlant,
            sciName, 
            comName, 
            genus, 
            family,
            distribution, 
            habitat, 
            description, 
            curiosities, 
            precautions,
            categories,
            images, 
            status
        })

        return res.status(200).send('Planta creada correctamente')
    } catch (error) {
        console.error(`Error: ${error}`);
    }
})

/* DELETE plant */ 
router.post('/delete', async (req, res, next)=>{
    const {id} = req.body;
    try {
        const plantDelete = await Plant.findByIdAndRemove(id);
        if(plantDelete){
            return res.status(200).send('Planta borrada correctamente')
        }
    } catch (error) {
        console.error(`Error: ${error}`);
    }
})

function generateCodPlant(cadena){
    // Dividir la cadena en palabras
    const palabras = cadena.split(' ');

     // Obtener las tres primeras letras de cada palabra y convertirlas en mayúsculas
    const codigo = palabras.map((palabra) => palabra.slice(0, 3).toUpperCase());

    // Unir las tres primeras letras de cada palabra en un solo código
    return codigo.join('');
}
module.exports = router;