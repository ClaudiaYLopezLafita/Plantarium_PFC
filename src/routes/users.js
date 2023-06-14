var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const axios = require('axios');

//modelos usados
const User = require('../models/User')
const Subscription = require('../models/Subscription')
//conexion bbdd
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
  [//definimos las validaciones     
    check('username').isAlphanumeric().withMessage('Nombre de usuario alfanumérico con mínimo 5 caratéres'),
    check('email').exists().isEmail().withMessage('El email debe ser válido'),
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
    check('birthdate').exists().custom((value) => {
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
    .withMessage('La contraseña debe tener al menos 7 caracteres, una letra minúscula, una letra mayúscula, un carácter especial y un número'),
    check('termino_politicas').custom(value => value === 'on').withMessage('Debes aceptar los Términos y Política de Privacidad'),
  ],
  async (req, res) => {

    try {
      //compromabamos las validaciones
      const errors = validationResult(req).array();
      if (errors.length > 0 ) {
        // redirigimos con los alerts de fallos
        res.render('session', {title: 'Plantarium', btnNav: 'Session', errors: errors, 
        messageEmail:undefined, messageUsernmae: undefined});
      }else{
        //capturamos los datos del formulario
        const { username, password, creationdate, role, 
          fullname, email, birthdate, address, phone, locality } = req.body;

        // Comprobar si el usuario ya está registrado
        const emailExists = await User.findOne({ email });
        const usernameExists = await User.findOne({ username });
        if (emailExists) return res.render('session', {title: 'Plantarium', btnNav: 'Session', 
            messageEmail: 'Usuario ya registrado, inicie sesión', errors: undefined});
        if (usernameExists) return res.render('session', {title: 'Plantarium', btnNav: 'Session', 
            messageUsernmae: 'Nombre de usuario en uso, pruebe otro', errors: undefined});

        // Registrar usuario
        const user = await User.create(req.body);
        
        // buscamos al usuario ya creado
        const userCreate = await User.findOne({ email });
        //comprobamos que existr
        if(userCreate){
          //capturamos su rol
          const role = userCreate.role;
          // Crear payload y token de usuario
          const payloadUser = { name: userCreate.username, userId: userCreate._id, role: userCreate.role };
          const token = jwt.sign(payloadUser, process.env.JWT_SECRET, { expiresIn: '30m' });

          // si no es admin
          if (role !== ROLE_ADMIN){
            createSubscription(userCreate._id);

            // guardar el token en las cookies
            res.cookie('token', token, { maxAge: 1800000, httpOnly: true });
            // crear una cookie
            res.cookie('userid', payloadUser.userId, { maxAge: 1800000, httpOnly: true });
            //capturanos la direccion de la foto de perfil
            const imageUrl = userCreate.photo;
            const fecha = moment(userCreate.birthdate).format('DD/MM/YYYY');
            //redirigimos al perfil
            res.render('profileS', { title: 'Plantarium',  user: userCreate, btnNav: 'Logout', imageUrl, fechaNac: fecha });
          }
        }    
      }
    } catch (error) {
      console.error(error);
      return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
        message: 'Por favor intentelo más tarde'})
    }

  }
)

// /* UPDATE user*/
// router.post('/update', async (req, res, next)=>{
//   const { _id, username, fullname, email, 
//     phone, birthdate, address, locality, subscription } = req.body;

//   try {
//     const user = await User.findById(_id);
//     if(user){
//       // Comprobamos el rol de usuario 
//       if(user.role !== ROLE_ADMIN){

//       }else{
//         const updatedUser = await User.findByIdAndUpdate(_id, req.body);
//         //capturamos el usuario actualizado
//         const updateData = await User.findById(_id);
//         const imageUrl = updateData.photo;
//         const fecha = moment(updateData.birthdate).format('DD/MM/YYYY');
//         //redirigimos a la página de perfil
//         RedirectUsers(res, updateData, imageUrl, fecha);
//         return;
//       }
//     } else {
//       res.sendStatus(500).send('El usuario no existe');
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error interno del servidor');
//   }
// });

/* UPDATE user */
router.post('/update', async (req, res, next)=>{
  const { _id, username, fullname, email, 
    phone, birthdate, address, locality, subscription, dni, numCard } = req.body;

  try {
    const user = await User.findById(_id);
    if(user){
      // Comprobamos el rol de usuario 
      if(user.role !== ROLE_ADMIN){
          
          const subscripcionUser = await Subscription.findOne({userId: _id})

          if(subscription == user.subscription || !(subscripcionUser.type == "general" && subscription == "premium")) 
          {
            // Cuando sea la misma o cuando sea que pase de premium a general
            const updatedUser = await User.findByIdAndUpdate(_id, {
              username, fullname, email, 
              phone, birthdate, address, locality
            });
            //capturamos el usuario actualizado
            const updateData = await User.findById(_id);
            const imageUrl = updateData.photo;
            const fecha = moment(updateData.birthdate).format('DD/MM/YYYY');
            //redirigimos a la página de perfil
            RedirectUsers(res, updateData, imageUrl, fecha);
            return;
          } else {
            // Modificar el a premium
            const updatedUser = await User.findByIdAndUpdate(_id, {
              username, fullname, email, 
              phone, birthdate, address, locality, dni, numCard
            });

            // Modificamos el tipo de subscripcion
            subscripcionUser.type = "premium";
            subscripcionUser.save()

            // Crear pago
            createPay(_id);

            // redireccion de la página
            const updateData = await User.findById(_id);
            const imageUrl = updateData.photo;
            const fecha = moment(updateData.birthdate).format('DD/MM/YYYY');
            //redirigimos a la página de perfil
            RedirectUsers(res, updateData, imageUrl, fecha);
            return;
          }
          
      }else{
        const updatedUser = await User.findByIdAndUpdate(_id, req.body);
        //capturamos el usuario actualizado
        const updateData = await User.findById(_id);
        const imageUrl = updateData.photo;
        const fecha = moment(updateData.birthdate).format('DD/MM/YYYY');
        //redirigimos a la página de perfil
        RedirectUsers(res, updateData, imageUrl, fecha);
        return;
      }
    } else {
      return res.render('error-info', {title: 'Plantarium', codStatus: '401', info:'¡Usuario no localizado!',
			message: 'El usuario que intenta modificar no existe'})
			
    }
  } catch (error) {
    console.error(error);
    return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
        message: 'Por favor intentelo más tarde'})
  }
});

/* DELETE user */
router.post('/delete', async(req, res,next) =>{
  const idUser = req.body.id;
  try {
    const subscripcionUser = await Subscription.findOneAndRemove({userId:idUser})

    deleteSubscription(subscripcionUser._id)

    const userDelete = await User.findOneAndRemove({_id: idUser});
    if(userDelete){
      res.render('session', { title: 'Plantarium', btnNav: 'Session' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor');
  }
})

/* POST login User */
router.post('/signin', [
  check('email').exists().isEmail(),
  check('password').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\d\s:])([^\s]){7,}$/)
]
,async (req, res) => {
  try {
    // Mostrar un único mensaje de error
    const errorMessages = ['Email y/o contraseña incorrecto'];
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      // redirigimos con los alerts de fallos
      res.render('session', {title: 'Plantarium', btnNav: 'Session', errorLogin: errorMessages});
    }else{
      // datos a capturar
      const { email, password } = req.body;
      // localización del usuario
      const user = await User.findOne({ email });
      // si no se localiza
      if (!user) {
        res.render('session', {title: 'Plantarium', btnNav: 'Session', errorLogin: errorMessages});
      } else{
        // se localiza y se comprueba contraseña
        const comparePassword = bcrypt.compareSync(password, user.password);
        if (!comparePassword) {
          // Mostrar un único mensaje de error
          // redirigimos con los alerts de fallos
          res.render('session', {title: 'Plantarium', btnNav: 'Session', errorLogin: errorMessages});
        }else{
          //capturanos la direccion de la foto de perfil
          const imageUrl = user.photo;
          console.log(imageUrl)
          const fecha = moment(user.birthdate).format('DD/MM/YYYY');

          // Crear payload y token de usuario
          const payloadUser = { name: user.username, userId: user._id, role: user.role };
          const token = jwt.sign(payloadUser, process.env.JWT_SECRET, { expiresIn: '30m' });

          // guardar el token en las cookies
          res.cookie('token', token, { maxAge: 1800000, httpOnly: true });
          // crear una cookie
          res.cookie('userid', payloadUser.userId, { maxAge: 1800000, httpOnly: true });
        
          RedirectUsers(res, user, imageUrl, fecha);
        }
      }
    }
  } catch (error) {
    console.error(error);
    return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
        message: 'Por favor intentelo más tarde'})
  }
});

/* POST reset password */
router.post('/reset-password',
[ //definimos las validaciones
  check('email').exists().isEmail().withMessage('El email debe ser válido'),
  check('password').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^\w\d\s:])([^\s]){7,}$/)
  .withMessage('La contraseña debe tener al menos 7 caracteres, una letra minúscula, una letra mayúscula, un carácter especial y un número')
]
,async (req, res, next) => {
  
  try {
    //compromabamos las validaciones
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else{
      const { email, password, passwordCf } = req.body;
      // Verificar si el usuario existe
      const user = await User.findOne({ email });
      if (!user || user === null) {
        // verificamos que el usuario no exite
        console.log(user)

        return res.render('reset', {title: 'Plantarium', btnNav: 'Session', messageError: 'Usuario no existente', messageSuccess: undefined});
      }else{
        // Verificar si las contraseñas coinciden
        if (password !== passwordCf) {
          return res.render('reset', {title: 'Plantarium', btnNav: 'Session', messageError: 'Las constraseñas no coindicen', messageSuccess: undefined});
          // return res.status(401).send('Las contraseñas no coinciden');
        }else{
          // Encriptar la nueva contraseña
          const hashedPassword = await bcrypt.hash(password, 10);
          // console.log(hashedPassword)
          //Actualizar la contraseña del usuario
          try {
            const updatedUser = await User.findOneAndUpdate({ email: email }, { password: hashedPassword }, { new: true });
            return res.render('reset', {title: 'Plantarium', btnNav: 'Session', messageSuccess: 'Contraseña cambiada correctamente.',messageError: undefined});
          } catch (error) {
            // Manejar el posible error
            return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			      message: 'Por favor intentelo más tarde'})
          }
        }
        
      }
      
    }
    
  } catch (error) {
    return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
			message: 'Por favor intentelo más tarde'})
  }
})

/* POST back to profile user */
router.post('/back', async (req, res, next)=>{
  const userid = req.cookies.userid;
  try {
    console.log('id:' + userid);
    const user = await User.findById(userid);
    if(user){
      const imageUrl = user.photo;
      const fecha = moment(user.birthdate).format('DD/MM/YYYY');
      //redirigimos a la página de perfil
      RedirectUsers(res, user, imageUrl, fecha);
      return;
    } else {
      return res.render('error-info', {title: 'Plantarium', codStatus: '404', info:'¡Acceso no permitido!',
			message: 'El usuario no existe'})
    }
  } catch (error) {
    console.error(error);
    return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
        message: 'Por favor intentelo más tarde'})
  }
});

/**
 * Permite la redireccion a profile a partir de tipo de role
 * @param {*} res 
 * @param {*} user 
 * @param {*} imageUrl 
 * @param {*} fecha 
 */
function RedirectUsers(res, user, imageUrl, fecha)
{
  if (user.role == ROLE_ADMIN) {
    // console.log('usuario '+user+' de tipo '+user.role+' logueado')
    res.render('profileA', { title: 'Plantarium', user: user, btnNav: 'Logout', imageUrl, fechaNac: fecha });
  } else {
    // console.log('usuario '+user.username+' de tipo '+user.role+' logueado')
    res.render('profileS', { title: 'Plantarium', user: user, btnNav: 'Logout', imageUrl, fechaNac: fecha });
  }
}

async function createSubscription(_id){
  try {
    const response = await axios.post('http://localhost:5000/subscriptions', {
            id: _id
        });
  } catch (error) {
    console.error(`Error: ${error}`);
    return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
        message: 'Por favor intentelo más tarde'})
  }
}

async function createPay(_id){
  try {
    const response = await axios.post('http://localhost:5000/pays', {
            user: _id
        });
  } catch (error) {
    console.error(`Error: ${error}`);
    return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
        message: 'Por favor intentelo más tarde'})
  }
}

async function deleteSubscription(_id){
  try {
    const response = await axios.post('http://localhost:5000/subscriptions/delete', {
            id: _id
        });
  } catch (error) {
    console.error(`Error: ${error}`);
    return res.render('error-info', {title: 'Plantarium', codStatus: '500', info:'Error interno del servidor',
        message: 'Por favor intentelo más tarde'})
  }
}


module.exports = router;
