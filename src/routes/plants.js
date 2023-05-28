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
router.get('/plantas', async(req, res, next) => {
    Plant.find()
    .then(
        plants => {
            // res.status(200).json(plantas)
            res.render('list-plants' ,{ title: 'Plantarium', btnNav: 'Logout', plantas: plants });
        }
        )
    .catch(err => res.status(500).json({ message: err }));
});

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
            ,
            {
                path: 'symptoms',
                model: 'Symptom',
                select: '-_id'
            }
            ]
        );
        if (plantExist) {
            // res.status(200).json(plantExist)
            var categorias = plantExist.categories;
            const listaCategorias = categorias.join(" | ")
            if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
                console.log(req.cookies.userid)
                res.render('filePlant', { title: 'Plantarium', btnNav: 'Logout',  planta: plantExist, categories: listaCategorias, userCookie: req.cookies.userid, status: "2" });
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
    categories,images, } = req.body;

    try {
        const codPlant = generateCodPlant(sciName);

        const newPlant = await Plant.create({
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
        res.redirect(req.get('referer'));
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

/* GET filter planst Admin */
router.get('/filter-admin', async (req, res, next)=>{
    const {search, orden} = req.query;
    console.log(req.query)
    try {

        // Construimos la consulta plantas para que nos traiga todo
        const query = Plant.find();

        // Aplica el filtro según el parámetro de búsqueda
        if (search) {
            query.or([
                // mira que "contenga" en el código
                { codPlant: { $regex: search, $options: 'i' } },
                // mira el nombre
                { sciName: { $regex: search, $options: 'i' } }
            ]);
        }

        // Aplica el orden según el parámetro de orden
        query.sort({ sciName: orden === 'DESC' ? -1 : 1 })
        query.sort({ sciName: orden === 'ASC' ? 1 : -1 })

        // Ejecutamos la consulta
        const plants = await query.exec();
        // return res.status(200).json(plants);
        // devolvemos los filtradro
        res.render('list-plants' ,{ title: 'Plantarium', btnNav: 'Logout', plantas: plants });
        
    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

/* FILTER plants */
router.get('/filter', async (req, res, next)=>{
    const { category, search, orden} = req.query;
    console.log(req.query)
    try {
        // Construimos la consulta plantas para que nos traiga todo
        const query = Plant.find();

        // Aplica el filtro según el parámetro de búsqueda
        if (search) {
            query.or([
                // mira que "contenga" en el DESCRIPTION
                { description: { $regex: search, $options: 'i' } },
                // mira el nombre cientifico
                { sciName: { $regex: search, $options: 'i' } },
                // mira el nombre comun
                { comName: { $regex: search, $options: 'i' } }
            ]);
        }

       // Aplica el filtro por categoría
        if (category) {
        query.where('categories').in([category]);
        }
        // Aplica el orden según el parámetro de orden
        query.sort({ sciName: orden === 'DESC' ? -1 : 1 })
        query.sort({ sciName: orden === 'ASC' ? 1 : -1 })

        // Ejecutamos la consulta
        const plantas = await query.exec();
        
        if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
            res.render('plants', { title: 'Plantarium', btnNav: 'Logout', plants: plantas, userCookie: req.cookies.userid });
        }else{
            res.render('plants', { title: 'Plantarium', btnNav: 'Session', plants: plantas, userCookie: "" });
        }
        // res.status(200).json(plants);
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