var express = require('express');
var router = express.Router();
const mongoose = require('mongoose')
const User = require('../models/User')
var db = mongoose.connection;

/* GET ALL users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* POST new user */
router.post('/', (req, res) => {
    User.create(req.body)
    .then(
      user => res.json(user)
    ).catch((err)=>{
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    })
  }
);

/* POST login User */
router.post('/signin', async (req,res) =>{
  const{ email, password} = req.body;
  const user = await User.findOne({email})
  
  if(!user) return res.status(401).send("El usuario no existe");
  if(user.password !== password) return res.status(401).send("Contraseña erronea");

  jwt.sign({_id: user.username}, "secretkey");
})

module.exports = router;
