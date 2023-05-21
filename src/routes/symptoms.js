var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')

//modelos usados
const Symptom = require('../models/Symptom')
const Plant = require('../models/Plant')

//conexion bbdd
var db = mongoose.connection;

/* GET ALL Symptoms */
router.get('/', async (req,res,next)=>{
    Symptom.find()
    .then(
        symptoms => {
            return res.status(200).json(symptoms);
        }
    )
    .catch(err => res.status(500).json({ message: err }));
})

/* POST create Symptom */
router.post('/', async (req,res,next)=>{
    const {title, description, disease, plants} = req.body;
    try {

        const codSymptom = generateCodSymptom(title);

        const newSymptom = Symptom.create({
            codSymptom,
            title,
            description,
            disease,
            plants
        })

        return res.status(200).json(newSymptom);
        
    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

/* UPDATE Symptom */
router.put('/', async(req,res,next)=>{
    const {id, title, description, disease, plants} = req.body;
    try {
        const symptomExist = await Symptom.findById(id);

        if(symptomExist){
            
            // Agregar la nueva planta al array existente
            if (plants && plants.length > 0) {
                // operador spread para agregar todos los elementos
                symptomExist.plants.push(...plants);
            }
            //actualizamos los datos
            const symptom = await Symptom.findByIdAndUpdate(id, {title, description, disease, plants})
            return res.status(200).send('Sintoma actualizado correctamente');
        }else{
            return res.status(404).send('Sintoma no localizado');
        }
    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

/* DELETE remove attendance */
router.delete('/', async(req, res, next)=>{
    const { id } = req.body;

    try {
        const symptomExist = await Symptom.findById(id);

        if(symptomExist){
            const symptom = await Symptom.findByIdAndRemove(id);
            return res.status(200).send("Síntoma borrada con exito");
        }else{
            return res.status(404).send("Sintoma no existente en la base de datos");
        }

    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

function generateCodSymptom(cadena){
    // Dividir la cadena en palabras
    const palabras = cadena.split(' ');

     // Obtener las tres  letras  convertirlas en mayúsculas
    const primeraPalabra = palabras[0].slice(0, 3).toUpperCase();
    const ultimaPalabra = palabras[palabras.length - 1].slice(0, 3).toUpperCase();

    const codigo = `${primeraPalabra}${ultimaPalabra}`

    // Unir las tres primeras letras de cada palabra en un solo código
    return codigo
}

module.exports = router;