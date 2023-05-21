var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

//modelos usados
const Plant = require('../models/Plant');
const Attendance = require('../models/Attendance');

//conexion bbdd
var db = mongoose.connection;

/* GET ALL attendances */
router.get('/', async (req, res, next) =>{
    Attendance.find()
        .then(attendances => res.status(200).json(attendances))
        .catch(err => res.status(500).json({ message: err }));
})

/* POST create attendance */
router.post('/', async (req, res, next) =>{
    const{codAttendace, water, soil, compost, moisture,
        temperature, lightning, comment, plant} = req.body;
    try {
        const plantExits = Plant.findById(plant);
        
        if(plantExits){
            const attendance = await Attendance.create(req.body);
            return res.status(200).json(attendance);
        }else{
            return res.status(404).send('Planta existente en la base de datos');
        }
    } catch (error) {
        return res.status(500).json({ message: error });
    }
}) 

/* PUT update attendance */
router.put('/', async(req, res, next)=>{
    const { id, codAttendace, water, soil, compost, moisture,
        temperature, lightning, comment, plant } = req.body;

    try {
        const attendanceExist = await Attendance.findById(id);

        if(attendanceExist){
            const attendance = await Attendance.findByIdAndUpdate(id, req.body);
            return res.status(200).send("Attendace actualizada con exito");
        }else{
            return res.status(404).send("Attendace no existente en la base de datos");
        }

    } catch (error) {
        return res.status(500).json({ message: error });
    }
})

/* DELETE remove attendance */
router.delete('/', async(req, res, next)=>{
    const { id } = req.body;

    try {
        const attendanceExist = await Attendance.findById(id);

        if(attendanceExist){
            const attendance = await Attendance.findByIdAndRemove(id);
            return res.status(200).send("Attendace borrada con exito");
        }else{
            return res.status(404).send("Attendace no existente en la base de datos");
        }

    } catch (error) {
        return res.status(500).json({ message: error });
    }
})


module.exports = router;