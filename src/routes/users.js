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

module.exports = router;
