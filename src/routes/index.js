var express = require('express');
var router = express.Router();
var User = require('../models/User')
var Supplier = require('../models/Supplier')
var moment = require('moment')
const axios = require('axios');
const ROLE_ADMIN = 'admin';

/* GET eror page. */
router.get('/error', function(req, res, next) {
	res.render('error', { title: 'Plantarium', btnNav: 'Session' });
});

/* GET eror page. */
router.get('/error-info', function(req, res, next) {
	res.render('error-info', { title: 'Plantarium' });
});

/* GET home page. */
router.get('/', function(req, res, next) {
	if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
		res.render('index', { title: 'Plantarium', btnNav: 'Logout', userCookie: req.cookies.userid });
	}else{
		res.render('index', { title: 'Plantarium', btnNav: 'Session', userCookie: "" });
	}
});

/* GET About US page. */
router.get('/about', function(req, res, next) {
	if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
		res.render('about', { title: 'Plantarium', btnNav: 'Logout', userCookie: req.cookies.userid });
	}else{
		res.render('about', { title: 'Plantarium', btnNav: 'Session', userCookie: "" });
	}
});

/* GET Contact US password page. */
router.get('/contact', function(req, res, next) {
	if(req.cookies.userid!="undefined" && req.cookies.userid!=undefined){
		res.render('contact', { title: 'Plantarium', btnNav: 'Logout', userCookie: req.cookies.userid });
	}else{
		res.render('contact', { title: 'Plantarium', btnNav: 'Session', userCookie: "" });
	}
});

/* GET session page. */
router.get('/session', function(req, res, next) {
	res.render('session', { title: 'Plantarium', btnNav: 'Session' });
});

/*GET plants page */
router.get('/filePlant', async (req, res, ne) =>{
	res.render('filePlant', { title: 'Plantarium', btnNav: 'Session' });
});

/* GET reset password page. */
router.get('/reset', function(req, res, next) {
	res.render('reset', { title: 'Plantarium', btnNav: 'Session' });
});

/* GET edit user admin page. */
router.get('/plants', function(req, res, next) {
	res.render('plants', { title: 'Plantarium', btnNav: 'Session' });
	
});

/* GET profile Subscriptor page. */
router.get('/profileS', verifyToken, function(req, res, next) {
	res.render('profileS', { title: 'Plantarium', locals: res.locals});
});

/* GET profile Admin page. */
router.get('/profileA', verifyToken, function(req, res, next) {
	res.render('profileA', { title: 'Plantarium', locals: res.locals});
});

/* GET edit user edit admin page. */
router.get('/user/editA', verifyCookiesToken , async function(req, res, next) {
	
	const userid = req.cookies.userid;
	console.log("userid:" + userid);
	var user = await User.findById(userid);
	console.log("MY userBD fullname USER ID: " + user.fullname);
	console.log(user);

	if (user) {
		verifyRoleUser(res, user, true);
		const birthdate = moment(user.birthdate, "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ").format("YYYY-MM-DD");
		res.render('user/editA', { title: 'Plantarium', btnNav: 'Logout', user: user, fecha: birthdate });
		return;
	}
	
	res.status(404).send('User not found');
	
});

/* GET edit user edit subscriptor page. */
router.get('/user/editS', verifyCookiesToken , async function(req, res, next) {
	
	const userid = req.cookies.userid;
	console.log("userid:" + userid);
	var user = await User.findById(userid);
	console.log("MY userBD fullname USER ID: " + user.fullname);
	console.log(user);

	if (user) {
		verifyRoleUser(res, user, false);
		const birthdate = moment(user.birthdate, "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ").format("YYYY-MM-DD");
		res.render('user/editS', { title: 'Plantarium', btnNav: 'Logout', user: user, fecha: birthdate });
		return;
	}
	
	res.status(404).send('User not found');
	
});

/* CLOSE Session and delete cookie */
router.get('/logout', function(req, res, next) {
	res.clearCookie('userid');
	res.clearCookie('token');
	res.render('session', { title: 'Plantarium', btnNav: 'Session' });
});

/*GET statics summary page */
router.get('/statics', verifyCookiesToken ,async (req, res, ne) =>{
	res.render('statics', { title: 'Plantarium', btnNav: 'Logout' });
});

/* GET list page supplier only admin*/
router.get('/suppliers', verifyCookiesToken , function(req, res, next){
	res.render('suppliers', { title: 'Plantarium', btnNav: 'Logout'});
})
/* GET edit page supplier only admin*/
router.get('/new-supplier', verifyCookiesToken , async (req, res, next) =>{
	const listPlants = await listerPlantas();
	res.render('new-supplier', { title: 'Plantarium', btnNav: 'Logout', plantas: listPlants});
})

/* GET edit page supplier only admin*/
router.get('/edit-supplier', verifyCookiesToken , function(req, res, next){
	res.render('edit-supplier', { title: 'Plantarium', btnNav: 'Logout'});
})

/*GET garden page subscriptor*/
router.get('/garden',verifyCookiesToken, async (req, res, ne) =>{
	res.render('garden', { title: 'Plantarium', btnNav: 'Logout' });
});

/* GET list page plants only admin*/
router.get('/new-plant', verifyCookiesToken,  async (req, res, next) => {
	try {
		const proveedores = await listerProveedores();
		const sintomas = await listerSintomas();
		const cuidados = await listerCuidados();
		res.render('new-plant', { title: 'Plantarium', btnNav: 'Logout', 
		suppliers: proveedores, symptoms: sintomas, attendances: cuidados});

	} catch (error) {
		console.error(`Error: ${error}`);
	}
})

/* GET edit plant*/
router.get('/edit-plant', verifyCookiesToken, async (req, res, next) => {
	try {
		
		res.render('edit-plant', { title: 'Plantarium', btnNav: 'Logout'});

	} catch (error) {
		console.error(`Error: ${error}`);
	}
})

/* GET graphic plant*/
router.get('/grafic-plants', verifyCookiesToken, async (req, res, next) => {		
	res.render('grafic-plants', { title: 'Plantarium', btnNav: 'Logout'});
})

/* GET graphic subscriotion*/
router.get('/grafic-subscriptions', verifyCookiesToken, async (req, res, next) => {		
	res.render('grafic-subscriptions', { title: 'Plantarium', btnNav: 'Logout'});
})

/* GET graphic PAYS*/
router.get('/grafic-pays', verifyCookiesToken, async (req, res, next) => {		
	res.render('grafic-pays', { title: 'Plantarium', btnNav: 'Logout'});
})

// Deniega el acceso en el caso de que no cumpla que sea administrador con rol administrador, 
// o que no sea administrador con rol no administrador
// Recibe el res, el usuario user y un boolean isAdmin donde programando se le indica si es 
// usuario administrador o no
function verifyRoleUser(res, user, isAdmin) {
	if (!(isAdmin && user.role === ROLE_ADMIN) && !(!isAdmin && user.role !== ROLE_ADMIN))  {
		res.status(401).send('Access not allowed!');
	}
}

async function verifyToken(req, res, next) {
	
	try {
		if (!req.headers.authorization) {
			return res.status(401).send('Unauhtorized Request');
		}
		let token = req.headers.authorization.split(' ')[1];
		if (token === 'null') {
			// return res.render('errorPage', { title: 'Plantarium', btnNav: 'Session', 
			// numError: '401', title_error: 'Unauhtorized Request', message: 'To access the page, log in or register.' })
			return res.status(401).send('Unauhtorized Request');
		}
		const payloadUser = await jwt.verify(token, process.env.JWT_SECRET);
		console.log(payloadUser)
		if (!payloadUser) {
			return res.status(401).send('Unauhtorized Request');
		}
		req.userId = payloadUser.userId;
		next();
	} catch(e) {
		//console.log(e)
		return res.status(401).send('Unauhtorized Request');
	}
}

/**
 * Funcion que captura la cookie que se genera al loguear y se pueda navegar
 * entre páginas. 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
function verifyCookiesToken(req, res, next){
	console.log("userid: " + req.cookies.userid);

	if(req.cookies.userid=="undefined" || req.cookies.userid==undefined){
		return res.status(401).send('Unauthorized Request');
	}
	
	next()
}

async function listerProveedores(){
	try {
		const response = await axios.get('http://localhost:5000/suppliers/lister');
		const proveedores = response.data
		return proveedores;
	} catch (error) {
		console.error(`Error: ${error}`);
	}
}

async function listerSintomas(){
	try {
		const response = await axios.get('http://localhost:5000/symptoms');
		const sintomas = response.data
		return sintomas;
	} catch (error) {
		console.error(`Error: ${error}`);
	}
}

async function listerCuidados(){
	try {
		const response = await axios.get('http://localhost:5000/attendances');
		const cuidados = response.data
		return cuidados;
	} catch (error) {
		console.error(`Error: ${error}`);
	}
}

async function listerPlantas(){
	try {
		const response = await axios.get('http://localhost:5000/plants/lister-plants');
		const plantas = response.data
		return plantas;
	} catch (error) {
		console.error(`Error: ${error}`);
	}
}

module.exports = router;
