var express = require('express');
var router = express.Router();
var User = require('../models/User')
var moment = require('moment')

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

/* GET profile subscriptor page. */
router.get('/profileS', verifyToken, function(req, res, next) {
	res.render('profileS', { title: 'Plantarium', locals: res.locals});
});

/* GET profile Admin page. */
router.get('/profileA', verifyToken, function(req, res, next) {
	res.render('profileA', { title: 'Plantarium', locals: res.locals});
});


async function verifyToken(req, res, next) {
	
	try {
		if (!req.headers.authorization) {
			return res.status(401).send('Unauhtorized Request');
		}
		let token = req.headers.authorization.split(' ')[1];
		if (token === 'null') {
			return res.status(401).send('Unauhtorized Request');
		}
		const payloadUser = await jwt.verify(token, process.env.JWT_SECRET);
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
	const birthdate = moment(user.birthdate, "ddd MMM DD YYYY HH:mm:ss [GMT]ZZ").format("YYYY-MM-DD");

	if (user) {
		res.render('user/editA', { title: 'Plantarium', btnNav: 'Logout', user: user, fecha: birthdate });
		return;
	}
	
	res.status(404).send('User not found');
	
});

router.get('/logout', function(req, res, next) {
	res.clearCookie('userid');
	res.clearCookie('token');
	res.render('session', { title: 'Plantarium', btnNav: 'Session' });
});
module.exports = router;
