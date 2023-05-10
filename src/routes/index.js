var express = require('express');
var router = express.Router();
var User = require('../models/User')
var moment = require('moment')
const ROLE_ADMIN = 'admin';

/* GET eror page. */
router.get('/error', function(req, res, next) {
	res.render('errorPage', { title: 'Plantarium', btnNav: 'Session' });
});

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', { title: 'Plantarium', btnNav: 'Session' });
});

/* GET About US page. */
router.get('/about', function(req, res, next) {
	res.render('about', { title: 'Plantarium', btnNav: 'Session'  });
});

/* GET Contact US password page. */
router.get('/contact', function(req, res, next) {
	res.render('contact', { title: 'Plantarium' , btnNav: 'Session'});
});

/* GET session page. */
router.get('/session', function(req, res, next) {
	res.render('session', { title: 'Plantarium', btnNav: 'Session' });
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

router.get('/logout', function(req, res, next) {
	res.clearCookie('userid');
	res.clearCookie('token');
	res.render('session', { title: 'Plantarium', btnNav: 'Session' });
});

/*GET statics summary page */
router.get('/statics', verifyCookiesToken ,async (req, res, ne) =>{
	res.render('statics', { title: 'Plantarium', btnNav: 'Logout' });
});

module.exports = router;
