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
router.get('/list', async(req, res, next) => {
    Plant.find()
    .then(
        plantas => {
            if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
                res.render('plants', { title: 'Plantarium', btnNav: 'Logout', plants: plantas, userCookie: req.cookies.userid });
            }else{
                res.render('plants', { title: 'Plantarium', btnNav: 'Session', plants: plantas, userCookie: "" });
            }
        }
        )
    .catch(err => res.status(500).json({ message: err }));
});

/* GET only one plant */
router.get('/list/:id', async (req, res, next) => {
    console.error(req.params.id);
    try {
        const plantExist = await Plant.findById(req.params.id).populate(
            [{
                path: 'suppliers',
                model: 'Supplier',
                select: '-_id -codSupplier' 
            },
            {
                path: 'attendance',
                model: 'Attendance',
                select: '-_id -codAttendace'
            }
            ]
        );
        if (plantExist) {
            // res.status(200).json(plantExist)
            var categorias = plantExist.categories;
            const listaCategorias = categorias.join(" | ")
            if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
                res.render('filePlant', { title: 'Plantarium', btnNav: 'Logout',  planta: plantExist, categories: listaCategorias, userCookie: req.cookies.userid });
            }else{
                res.render('filePlant', { title: 'Plantarium', btnNav: 'Session',  planta: plantExist, categories: listaCategorias, userCookie: "" });
            }
        } else {
            res.status(404).send('Plant not found');
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('Internal server error');
    }
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

/* UPDATE plant */ 
router.post('/update', async (req, res, next)=>{
    const {id, sciName, comName, genus, family,
        distribution, habitat, description, curiosities, precautions,
        categories,images, status } = req.body;
    try {
        const plantExist = await Plant.findById(id);
        if(plantExist){
            const plantUpdate = await Plant.findByIdAndUpdate(id, req.body);
            return res.status(200).send('Planta Actualizada correctamente')
        }
    } catch (error) {
        console.error(`Error: ${error}`);
    }
})

//Busqueda: categoria -- { categories: { $all: [category] } }
/*Busqueda por seach --                 
{   
    $or: [
        { description: { $regex: word, $options: 'i' } },
        { comName: { $regex: word, $options: 'i' } }
    ]
}
*/
/* FILTER plants */
router.post('/filter', async (req, res, next)=>{
    const { category, search} = req.body;
    console.log(req.body)
    const word = "/"+search+"/"
    console.log(word)
    try {
        const plants = await Plant.find(
            {
                $or: [
                    { categories: { $all: [category] } },
                    {
                        $or: [
                        { description: { $regex: word , $options: 'i' } },
                        { comName: { $regex: word, $options: 'i' } }
                        ]
                    }
                ]
            }
        )
        res.status(200).json(plants);
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