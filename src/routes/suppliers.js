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
            res.render('suppliers', { title: 'Plantarium', btnNav: 'Session', proveedores: suppliers });
        }
    )
    .catch(err => res.status(500).json({ message: err }));
})

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
            const {name, email, url, address, phone, locality, plants} = req.body;
            const codSupplier = generateCodigo(name);
            const newSupplier = Supplier.create({
                codSupplier,
                name, 
                email,
                address, 
                url, 
                phone, 
                locality, 
                plants
            })

            return res.status(200).send('Supplier creado correctamente')
        }
        
    } catch (error) {
        return res.status(500).json({ message: error })
    }
})

/* POST update suppliers */
router.post('/update', async (req, res, next)=>{
    const {_id, codSupplier, name, email, url, 
        address, phone, locality, plants} = req.body;
    try {
        
        const supplierExist = await Supplier.findById(_id);

        if(!supplierExist){
            return res.status(404).send('Supplier no encontrado')
        } else{
            const supplierUpdate = await Supplier.findByIdAndUpdate(_id, req.body )
            return res.status(200).send('Supplier modificado correctamentr')
        }
        
    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

/* POST delete suppliers */
router.post('/delete', async (req, res, next)=>{
    const {_id} = req.body;
    try {
        
        const supplierExist = await Supplier.findById(_id);

        if(!supplierExist){
            return res.status(404).send('Supplier no encontrado')
        } else{
            const supplierDelete= await Supplier.findByIdAndRemove(_id)
            return res.status(200).send('Supplier borrado correctamente correctamentr')
        }
        
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