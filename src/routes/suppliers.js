var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
//modelos usados
const Plant = require('../models/Plant')
const Supplier = require('../models/Supplier')

//conexion bbdd
var db = mongoose.connection;
//validaciones
const { check, validationResult } = require('express-validator');


/* GET all suppliers */
router.get('/list', async(req, res, next) =>{
    Supplier.find()
    .then(
        suppliers => {
            res.render('suppliers' ,{ title: 'Plantarium', btnNav: 'Logout', proveedores: suppliers });
        }
    )
    .catch(err => res.status(500).json({ message: err }));
})


router.get('/lister', async(req, res, next) =>{
    Supplier.find()
    .then(
        suppliers => {
            return res.status(200).json(suppliers)
        }
    )
    .catch(err => res.status(500).json({ message: err }));
})

/* GET only one supplier */
router.get('/list/:id', async (req, res, next) => {
    console.error(req.params.id);
    try {
        const sppExist = await Supplier.findById(req.params.id);
        if (sppExist) {
            const listPlants = await Plant.find();
            res.render('edit-supplier',{title: 'Plantarium', btnNav: 'Logout',proveedor: sppExist, plantas :listPlants});
        } else {
            res.status(404).send('Plant not found');
        }
    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).send('Internal server error');
    }
});

/* POST create suppliers */
router.post('/', 
[
    check('email').exists().isEmail().withMessage('El email debe ser válido'),
    check('name').exists().isString().withMessage('El nombre es obligatorio'),
    check('address').exists().isString().withMessage('La dirección es obligatorio'),
    check('locality').exists().isString().withMessage('La colaclidad es obligatorio'),
],
async (req, res, next)=>{
    //compromabamos las validaciones
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(500).json({ errors: errors.array() })
        }else{
            const {name, email, url, address, phone, locality, plants, latitude, longitude} = req.body;
            const codSupplier = generateCodigo(name);
            const coordinadas =[parseFloat(latitude), parseFloat(longitude)];
            console.log(coordinadas)
            const newSupplier = await Supplier.create({
                codSupplier,
                name, 
                email,
                address, 
                url, 
                phone, 
                locality, 
                plants,
                ubicacion: {
                    type: 'Point',
                    coordinates: coordinadas
                }
            })

            const sppCreate = await Supplier.findOne({ codSupplier });

            // Actualizamos la entidad de plant para agregar el ID del proveedor al array de suppliers
            await Plant.updateMany(
                { _id: { $in: plants } }, // Filtramos las plants que están relacionadas
                { $addToSet: { suppliers: sppCreate._id } } // Agregamos el ID del proveedor al array de suppliers
            );

            res.redirect(req.get('referer'));

        }
        
    } catch (error) {
        return res.status(500).json({ message: error })
    }
})

/* POST update suppliers */
router.post('/update', async (req, res, next)=>{
    const {_id, codSupplier, name, email, url, 
        address, phone, locality, latitude, longitude, plants} = req.body;
    try {
        
        const supplierExist = await Supplier.findById(_id);
        if(!supplierExist){
            return res.status(404).send('Supplier no encontrado')
        } else{
            // Obtener las plantas relacionadas actualmente con el proveedor
            const currentPlants = supplierExist.plants;
            const coordinadas =[parseFloat(latitude), parseFloat(longitude)];
            console.log(coordinadas)
            
            const supplierUpdate = await Supplier.findByIdAndUpdate(_id, {
                codSupplier,
                name, 
                email,
                address, 
                url, 
                phone, 
                locality, 
                plants,
                ubicacion: {
                    type: 'Point',
                    coordinates: coordinadas
                }
            } )

            // Comprobar si alguna de las plantas relacionadas ha sido eliminada del array "plants" enviado en la solicitud
            const deletedPlants = currentPlants.filter(plantId => !plants.includes(plantId));

            // Comprobar si alguna de las plantas enviadas en el array "plants" no está actualmente relacionada con el proveedor
            const addedPlants = plants.filter(plantId => !currentPlants.includes(plantId));
            
            // Eliminar las referencias al proveedor en las plantas eliminadas
            await Plant.updateMany(
                { _id: { $in: deletedPlants } },
                { $pull: { suppliers: _id } }
            );

            // Agregar las referencias del proveedor en las plantas añadidas
            await Plant.updateMany(
                { _id: { $in: addedPlants } },
                { $addToSet: { suppliers: _id } }
            );

            // Actualizar las referencias del proveedor en las plantas existentes
            await Plant.updateMany(
                { _id: { $in: currentPlants } },
                { $set: { suppliers: plants } }
            );

            const suppliers = await Supplier.find()
            res.render('suppliers', { title: 'Plantarium', btnNav: 'Logout', proveedores: suppliers });
        }
        
    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

/* POST delete suppliers */
router.post('/delete', async (req, res, next)=>{
    const {id} = req.body;
    console.log(id)
    try {
        
        const supplierExist = await Supplier.findById(id);

        if(!supplierExist){
            return res.status(404).send('Supplier no encontrado')
        } else{

            // Eliminar el ID del proveedor del array de suppliers en la entidad de planta
            await Plant.updateMany(
                { suppliers: id }, // Filtramos las plants que tienen el ID del proveedor
                { $pull: { suppliers: id } } // Eliminamos el ID del proveedor del array de suppliers
            );

            const supplierDelete= await Supplier.findByIdAndRemove(id)
            //recargamos la página
            res.redirect(req.get('referer'));
        }
        
    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

/* GET filter suppliers */
router.get('/filter', async (req, res, next)=>{
    const {search, orden} = req.query;
    try {

        // Construimos la consulta proveedores para que nos traiga todo
        const query = Supplier.find();

        // Aplica el filtro según el parámetro de búsqueda
        if (search) {
            query.or([
                { codSupplier: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ]);
        }

        // Aplica el orden según el parámetro de orden
        query.sort({ name: orden === 'DESC' ? -1 : 1 })
        query.sort({ name: orden === 'ASC' ? 1 : -1 })

        // Ejecutamos la consulta
        const suppliers = await query.exec();
        // devolvemos los filtradro
        res.render('suppliers' ,{ title: 'Plantarium', btnNav: 'Logout', proveedores: suppliers });
        
    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

function generateCodigo(cadena) {
        // Dividir la cadena en palabras
        const palabras = cadena.split(' ');
    
        // Obtener las tres primeras letras de la primera palabra y convertirlas en mayúsculas
        const primerasLetras = palabras[0].slice(0, 3).toUpperCase();
    
        // Obtener las tres últimas letras de la última palabra y convertirlas en mayúsculas
        const ultimasLetras = palabras[palabras.length - 1].slice(-3).toUpperCase();
    
        // Unir las primeras y últimas letras en un solo código y agregar "SP-" como prefijo
        const resultado = "SP-" + primerasLetras + ultimasLetras;
    
        return resultado;
}

module.exports = router;