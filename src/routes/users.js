var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/User')
var db = mongoose.connection;

//para la generación de token y guardado en cookie
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
// se debe usar el middleware cookie-parser para manejar las cookies
router.use(cookieParser());
//libraria para el tratamiento de fechas
const moment = require('moment');


//validaciones back
// const { body, validationResult } = require('express-validator');
const { check, validationResult } = require('express-validator');


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

/**Validacion passwrod: a contraseña tenga al menos 7 caracteres, 
 *                      una letra minúscula, una letra mayúscula,
 *                       un carácter especial y un número. */

/* POST CREATE user */
router.post('/', 
  [
    //definimos las validaciones
    check('username').isAlphanumeric().withMessage('El nombre de usuario debe ser alfanumérico'),
    check('username').isLength({ min: 5 })
    .withMessage('El nombre de usuario debe tener al menos 5 caracteres'),
    check('email').isEmail().withMessage('El email debe ser válido'),
    check('fullname').custom((value) => {
      const words = value.split(' ');
      if (words.length < 2) {
        throw new Error('El nombre completo debe tener al menos 2 palabras');
      }
      if (words.some(word => /\d/.test(word))) {
        throw new Error('El nombre completo no puede contener números');
      }
      return true;
    }),
    check('birthdate').custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date > now) {
        throw new Error('La fecha de nacimiento debe ser anterior a la fecha actual');
      }
      return true;
    }),
    check('address').notEmpty().withMessage('La dirección es requerida'),
    check('locality').notEmpty().withMessage('La localidad es requerida'),
    check('password').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\d\s:])([^\s]){7,}$/)
    .withMessage('La contraseña debe tener al menos 7 caracteres, una letra minúscula, una letra mayúscula, un carácter especial y un número')
  ],
  async (req, res) => {

    //compromabamos las validaciones
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // return res.status(422).json({ errors: errors.array() });
      return res.render('session', { errors: errors.array() });
    }

    //capturamos los datos del formulario
    const { username, password, creationdate, role, 
      fullname, email, birthdate, address, phone, locality } = req.body;
      console.log(req.body)
    try {
      // Comprobar si el usuario ya está registrado
      const emailExists = await User.findOne({ email });
      const usernameExists = await User.findOne({ username });
      if (emailExists) return res.status(401).send('Usuario ya creado');
      if (usernameExists) return res.status(401).send('Nombre de usuario ya existente');

      // Registrar usuario
      const user = await User.create(req.body);
      console.log(user)
      // Crear payload y token de usuario
      const payloadUser = { username: user.username, userId: user._id, role: user.role };
      const token = jwt.sign(payloadUser, process.env.JWT_SECRET, { expiresIn: '30m' });
      
      res.status(200).send(`Usuario creado ${token}`);
      // return res.render('profileS', { title: 'Plantarium',  user: user, btnNav: 'Logout', imageUrl, fechaNac: fecha }); // Se pasa el token a la vista
            
    } catch (error) {
      console.error(error);
      res.status(500).send('Error interno del servidor'+error);
    }

  }
)

/* UPDATE user*/
router.post('/update', async (req, res, next)=>{
  const { _id, username, fullname, email, 
    phone, birthdate, address, locality } = req.body;

  try {
    const user = await User.findById(_id);
    if(user){
      const updatedUser = await User.findByIdAndUpdate(_id, req.body);
      //capturamos el usuario actualizado
      const updateData = await User.findById(_id);
      const imageUrl = updateData.photo;
      const fecha = moment(updateData.birthdate).format('DD/MM/YYYY');
      //redirigimos a la página de perfil
      res.render('profileA', { title: 'Plantarium', user: updateData, btnNav: 'Logout', imageUrl, fechaNac: fecha }); // Se pasa el token a la vista
      return;
    } else {
      res.sendStatus(500).send('El usuario no existe');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

router.post('/delete', async(req, res,next) =>{
  const idUser = req.body.id;
  try {
    const user = await User.findById(idUser);
    // console.log(user)

    if(!user){
      res.status(500).send('El usuario no existe');
    }
    const userDelete = await User.findOneAndRemove({_id: idUser});

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
    console.log(user.role)
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
    // crear una cookie
    res.cookie('userid', payloadUser.userId, { maxAge: 1800000, httpOnly: true });
  
    if (user.role !== ROLE_ADMIN) {
      console.log('usuario '+user.username+' de tipo '+user.role+' logueado')
      res.render('profileS', { title: 'Plantarium', user: user, btnNav: 'Logout', imageUrl, fechaNac: fecha });
    } else {
      console.log('usuario '+user+' de tipo '+user.role+' logueado')
      res.render('profileA', { title: 'Plantarium', user: user, btnNav: 'Logout', imageUrl, fechaNac: fecha });
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

router.post('/back', async (req, res, next)=>{
  const userid = req.cookies.userid;
  try {
    console.log('id:' + userid);
    const user = await User.findById(userid);
    if(user){
      const imageUrl = user.photo;
      const fecha = moment(user.birthdate).format('DD/MM/YYYY');
      //redirigimos a la página de perfil
      res.render('profileA', { title: 'Plantarium', user: user, btnNav: 'Logout', imageUrl, fechaNac: fecha }); // Se pasa el token a la vista
      return;
    } else {
      res.sendStatus(500).send('El usuario no existe');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
});

module.exports = router;
