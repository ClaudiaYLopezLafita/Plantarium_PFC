var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/User')
var db = mongoose.connection;

//para la generación de token y guardado en cookie
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
// se debe usar el middleware cookie-parser para manejar las cookies
router.use(cookieParser());
//libraria para el tratamiento de fechas
const moment = require('moment');


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

/* POST CREATE user */
router.post('/', async (req, res) => {

  const { username, password, creationdate, role, 
    fullname, email, birthdate, address, phone, locality } = req.body;

    try {
      // Comprobar si el usuario ya está registrado
      const emailExists = await User.findOne({ email });
      const usernameExists = await User.findOne({ username });
      if (emailExists) return res.status(401).send('Usuario ya creado');
      if (usernameExists) return res.status(401).send('Nombre de usuario ya existente');

      // Registrar usuario
      const user = await User.create(req.body);

      // Crear payload y token de usuario
      const payloadUser = { username: user.username, userId: user._id, role: user.role };
      const token = jwt.sign(payloadUser, process.env.JWT_SECRET, { expiresIn: '1d' });

      res.status(200).send(`Usuario creado ${token}`);
            
    } catch (error) {
      console.error(error);
      res.status(500).send('Error interno del servidor');
    }

})

/* POST login User */
router.post('/signin', async (req, res) => {
  try {
    // datos a capturar
    const { email, password } = req.body;

    // localización del usuario
    const user = await User.findOne({ email });

    // si no se localiza
    if (!user) {
      return res.status(401).send('El usuario no existe');
    }

    // se localiza y se comprueba contraseña
    const comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return res.status(401).send('Contraseña incorrecta');
    }
    //capturanos la direccion de la foto de perfil
    const imageUrl = user.photo;
    const fecha = moment(user.birthdate).format('DD/MM/YYYY');

    // Crear payload y token de usuario
    const payloadUser = { name: user.username, userId: user._id, role: user.role };
    const token = jwt.sign(payloadUser, process.env.JWT_SECRET, { expiresIn: '30m' });

    // guardar el token en las cookies
    res.cookie('token', token, { maxAge: 1800000, httpOnly: true });

    if (user.role !== ROLE_ADMIN) {
      res.render('profileS', { title: 'Plantarium',  user: user, btnNav: 'Logout', imageUrl, fechaNac: fecha }); // Se pasa el token a la vista
    } else {
      res.render('profileA', { title: 'Plantarium', user: user, btnNav: 'Logout', imageUrl, fechaNac: fecha }); // Se pasa el token a la vista
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

/* GET logout User*/
router.get('/logout', async (req, res) => {
  try {
    res.clearCookie('token'); // Elimina la cookie 'token'
    res.redirect('/'); // Redirige a la página principal
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});


module.exports = router;
