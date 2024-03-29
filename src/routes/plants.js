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
router.get('/lister-plants', async(req, res, next) => {
    Plant.find()
    .then(
            plants => {
                return res.status(200).json(plants)
            }
        )
    .catch(err => res.status(500).json({ message: err }));
});

/* GET only one plant for edit plants*/
router.get('/plantas/:id', async (req, res, next) => {
    console.error(req.params.id);
    try {
        const plantExist = await Plant.findById(req.params.id).populate(
            [{
                path: 'suppliers',
                model: 'Supplier',
                select: '-codSupplier' 
            },
            {
                path: 'attendance',
                model: 'Attendance',
                select: '-codAttendace'
            }
            ,
            {
                path: 'symptoms',
                model: 'Symptom',
                select: ''
            }
            ]
        );
        if (plantExist) {
            const cuidados = await  Attendance.find()
            console.log(cuidados)
            const sintomas = await  Symptom.find()
            const proveedores = await  Supplier.find()
            console.log(cuidados)
            var categorias = plantExist.categories;
            const listaCategorias = categorias.join(" | ")
            res.render('edit-plant', { title: 'Plantarium', btnNav: 'Logout',  planta: plantExist, categories: listaCategorias,
            attendances: cuidados, symptoms: sintomas, suppliers: proveedores});
        } else {
            return res.render('error-info', {title: 'Plantarium', codStatus: '404', info:'Planta no encontreada',
			message: 'En estos momentos no podemos encontrar la planta, intentelo más tarde'})
        }
    } catch (error) {
        return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
        message: 'Por favor intentelo más tarde'})
    }
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

/* GET only one plant for show car info*/
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
            var categorias = plantExist.categories;
            const listaCategorias = categorias.join(" | ")
            if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
                res.render('filePlant', { title: 'Plantarium', btnNav: 'Logout',  planta: plantExist, categories: listaCategorias, userCookie: req.cookies.userid});
            }else{
                res.render('filePlant', { title: 'Plantarium', btnNav: 'Session',  planta: plantExist, categories: listaCategorias, userCookie: "" });
            }
        } else {
            return res.render('error-info', {title: 'Plantarium', codStatus: '404', info:'Planta no encontrada',
			message: 'La planta que buscas no se cuentra ahora mismo en nuestra base de datos'})
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			message: 'Por favor intentelo más tarde'})
    }
});

/* POST Create plants */
router.post('/', async (req, res, next) =>{
    const {sciName, comName, genus, family,
    distribution, habitat, description, curiosities, precautions,
    categories,images, attendance, gardens,suppliers, symptoms
    } = req.body;
    const imagesArray = images.split(',');
    console.log(req.body)
    try {
        const codPlant = generateCodPlant(sciName);
        console.log(codPlant)
        const newPlant = await Plant.create({
            codPlant,sciName,comName, genus, family, distribution, 
            habitat, description, curiosities, precautions,categories,
            images: imagesArray,attendance,gardens,suppliers,symptoms
        })

        const plantaIDNueva = await Plant.findById(newPlant._id)
        const idPlant = plantaIDNueva._id

        // relacionamos la planta con el cuidado
        const attendanceEx = await Attendance.findById(attendance);
        attendanceEx.plant = newPlant._id;
        await attendanceEx.save()

        //relacionamos la planta con los proveedores
        if (Array.isArray(suppliers)){
            // viene un array
            suppliers.forEach( async element => {
                const supplierEx =  await Supplier.findById(element);
                if(supplierEx){
                    const arrayPlants = supplierEx.plants || []; 
                    arrayPlants.push(idPlant)
                    await supplierEx.save()
                }
            });
        } else {
            // viene un solo elemento
            const supplierEx = await Supplier.findById(suppliers);
            if (supplierEx) {
                const arrayPlants = supplierEx.plants || []; 
                arrayPlants.push(idPlant)
                supplierEx.plants = arrayPlants;
                await supplierEx.save()
            }
        }
        
        res.redirect(req.get('referer'));
    } catch (error) {
        console.log(error)
        return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			message: 'Por favor intentelo más tarde'})
    }
})

/* DELETE plant */ 
router.post('/delete', async (req, res, next)=>{
    const {id} = req.body;
    try {
        // Eliminar la referencia a la planta en el array de plants de las entidades relacionadas
        // usado de updateMany para buscar y actualizar todas las entidades relacionadas
        await Garden.updateMany(
            { plants: id },
            // $pull se utiliza para eliminar el elemento
            { $pull: { plants: id } }
        );
        await Supplier.updateMany(
            { plants: id },
            { $pull: { plants: id } }
        );
        // elimina el campo plant de los documentos que coincidan con la consult
        await Attendance.updateMany(
            { plant: id },
            { $unset: { plant: 1 } }
        );
        await Symptom.updateMany(
            { plants: id },
            { $pull: { plants: id } }
        );

        //borramos la planta
        const plantDelete = await Plant.findByIdAndRemove(id);
        res.redirect(req.get('referer'));
    } catch (error) {
        return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			message: 'Por favor intentelo más tarde'})
    }
})

/* UPDATE plant */ 
router.post('/update', async (req, res, next)=>{
    const {id, sciName, comName, genus, family,
        distribution, habitat, description, curiosities, precautions,
        categories,images, suppliers, attendance, symptoms } = req.body;
    
        const imagesArray = images.split(',');
        
    try {
        const plantExist = await Plant.findById(id);
        if(plantExist){
            const plantUpdate = await Plant.findByIdAndUpdate(id, {
                sciName, comName, genus, family,
                distribution, habitat, description, curiosities, precautions,
                categories,images: imagesArray, suppliers, attendance, symptoms
            });
            // Actualizar referencias en la colección de suppliers
            await Supplier.updateMany(
                { _id: { $in: plantUpdate.suppliers } },
                { $pull: { plants: id } }
            );
            //buscamos en la colección de proveedores aquellos documentos cuyo _id esté presente en el array suppliers
            await Supplier.updateMany(
                { _id: { $in: suppliers } },
                { $addToSet: { plants: id } }
            );

            // Actualizar referencias en la colección de symptoms
            await Symptom.updateMany(
                { _id: { $in: plantUpdate.symptoms } },
                { $pull: { plants: id } }
            );
            //buscamos en la colección de sintomas aquellos documentos cuyo _id esté presente en el array suppliers
            await Symptom.updateMany(
                { _id: { $in: symptoms } },
                { $addToSet: { plants: id } }
            );

            // Actualizar referencia en la colección de attendance
            await Attendance.findOneAndUpdate(
                { plant: id },
                { $set: { plant: plantUpdate._id } }
            );

            const plants = Plant.find();
            res.redirect(req.get('referer'));
        }
    } catch (error) {
        return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			message: 'Por favor intentelo más tarde'})
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
        return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			message: 'Por favor intentelo más tarde'})
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
        query.sort({ comName: orden === 'DESC' ? -1 : 1 })
        query.sort({ comName: orden === 'ASC' ? 1 : -1 })

        // Ejecutamos la consulta
        const plantas = await query.exec();
        
        if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
            res.render('plants', { title: 'Plantarium', btnNav: 'Logout', plants: plantas, userCookie: req.cookies.userid });
        }else{
            res.render('plants', { title: 'Plantarium', btnNav: 'Session', plants: plantas, userCookie: "" });
        }
        // res.status(200).json(plants);
    } catch (error) {
        return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			message: 'Por favor intentelo más tarde'})
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