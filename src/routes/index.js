var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  	res.render('index', { title: 'Plantarium' });
});

/* GET session page. */
router.get('/session', function(req, res, next) {
  	res.render('session', { title: 'Plantarium' });
});

/* GET profile subscriptor page. */
router.get('/profileS', verifyToken, function(req, res, next) {
  	res.render('profileS', { title: 'Plantarium', locals: res.locals});
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

module.exports = router;
