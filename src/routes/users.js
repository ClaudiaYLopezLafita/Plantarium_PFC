var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/User')
var db = mongoose.connection;
const jwt = require('jsonwebtoken');

//validaciones back
const { body, validationResult } = require('express-validator');

//Para la encriptación del password
var bcrypt = require('bcryptjs');
const ROLE_ADMIN = 'admin';

/* GET ALL users listing. */
router.get('/',function(req, res, next) {
  // guion para orden decreciente
  User.find().select('-password').select('-_id').sort('-creationdate').exec()
    .then(users => res.status(200).json(users))
    .catch(err => res.status(500).json({ message: err }));
});

/* POST new user */
router.post('/', async (req, res) => {

  // Finds the validation errors in this request and wraps them in an object with handy functions
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {username,password,creationdate, role,
        fullname,email, birthdate, address, phone, locality} = req.body;

  //comprobamos si el usuario esta registrado
  const emailExists = await User.findOne({ email });
  const usernameExists = await User.findOne({ username });
  if (emailExists) return res.status(401).send('Usurario ya creado');
  if (usernameExists) return res.status(401).send('Nombre de usario ya existente');

  // Registrar usuario
  const user = await User.create(req.body);

  // Crear payload y token de usuario
  const payloadUser = { name: user.username, userId: user._id, role: user.role };
  const token = jwt.sign(payloadUser, process.env.JWT_SECRET, { expiresIn: '1d' });

  res.status(200).send('Usurario creado '+token)
})

/* POST login User */
router.post('/signin', async (req,res) =>{
  
  //datos a capturar
  const {email, password} = req.body;

  // localización del usuario
  const user = await User.findOne({email});
  console.log(user)
  // si no se localiza
  if(!user) return res.status(401).send('El usuario no existe');

  //se localiza y se compueba contraseña
  let comparePassword = bcrypt.compareSync(password, user.password)
  if (!comparePassword) return res.status(401).send('Contraseña incorrecta')

  // Crear payload y token de usuario
  const payloadUser = { name: user.username, userId: user._id, role: user.role };
  const token = jwt.sign(payloadUser, process.env.JWT_SECRET, { expiresIn: '1d' });

  // if(user.role!==ROLE_ADMIN) return res.status(200).send('Usurario subscriber logueado '+token)

  if(user.role!==ROLE_ADMIN){
    res.render('profileS', { title: 'Plantarium'});
    // res.redirect('http://localhost:5000/profileS');
  }else{
    res.render('profileA', { title: 'Plantarium'});
  }

  // res.status(200).send('Usurario Admin logueado: '+token)  
  // return res.status(200).json({token});

})

module.exports = router;
