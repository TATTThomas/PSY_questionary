'use strict';
var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
const { Get } = require('./GetConst');
const core_ID = Get('ID');
const core_password = Get('password');

/**************************************
 ./
  **************************************/
router.get('/', function (req, res) {
	res.render('signPage');
});

/**************************************
 ./login
  **************************************/
 function logincheckID(db, ID, password) {
	return new Promise((resolve, reject) => {
		var table = db.db('EW').collection('superuser_list');
		table.findOne(
			{ ID: ID },
			{ projection: { _id: 0 } },
			function (err, result) {
				if (err) {
					reject({ message: 'Server connection error' });
					throw err;
				}
				if (result == null) reject({ message: 'Account does not exist' });
				else if (result.password == password)
					result.first
						? resolve({ walk: 'first' })
						: resolve({ walk: 'Notfirst' });
				else reject({ message: 'Wrong password' });
			}
		);
	});
}
function loginFirstRender(db, res, ID, password) {
	return new Promise((resolve, reject) => {
		var table = db.db('EW').collection('superuser_list');
		table.updateOne(
			{ ID: ID },
			{ $set: { first: false } },
			function (err, result) {
				if (err) {
					reject({ message: 'Server connection error' });
					throw err;
				}
				res.render('changePwd', { ID: ID, password: password });
				resolve({});
			}
		);
	});
}
function loginNotFirstRender(db, res, ID, password) {
	return new Promise((resolve, reject) => {
		var table = db.db('EW').collection('superuser_list');
		table.findOne(
			{ ID: ID },
			{ projection: { _id: 0 } },
			function (err, result) {
				if (err) {
					reject({ message: 'Server connection error' });
					throw err;
				}
				if (result != null) {
					res.render('switchPage', {
						ID: ID,
						password: password,
						data: JSON.stringify(result),
					});
					//console.log({ ID: ID, password: password, data: JSON.stringify(result) });
				} else res.render('changePwd', { ID: ID, password: password });
				resolve({});
			}
		);
	});
}

router.post('/login', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	if (core_ID == ID && core_password == password)
		res.render('switchPage', { ID: ID, password: password });
	else 
		MongoClient.connect(
			Get('mongoPath') + 'EW',
			{ useNewUrlParser: true, useUnifiedTopology: true },
			function (err, db) {
				if (err) {
					res.render('warming', { message: 'Server connection error' });
					throw err;
				}
				logincheckID(db, ID, password)
					.then((pkg) => {
						if (pkg.walk == 'first')
							loginFirstRender(db, res, ID, password)
								.catch((error) => res.render('warming', error))
								.finally((pkg) => db.close());
						else
							loginNotFirstRender(db, res, ID, password)
								.catch((error) => res.render('warming', error))
								.finally((pkg) => db.close());
					})
					.catch((error) => res.render('warming', error));
			}
		);
});

/**************************************
 ./base
  **************************************/
router.post('/base', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	if (core_ID == ID && core_password == password)
		res.render('basePage', { ID: ID, password: password });
	else res.render('warming', { message: '帳號或密碼錯誤' });
});
/**************************************
 ./GQ
  **************************************/
router.post('/GQ', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	if (core_ID == ID && core_password == password)
		res.render('GQPage', { ID: ID, password: password });
	else res.render('warming', { message: '帳號或密碼錯誤' });
});

/**************************************
 ./QQ
  **************************************/
router.post('/QQ', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	if (core_ID == ID && core_password == password)
		res.render('QQPage', { ID: ID, password: password });
	else res.render('warming', { message: '帳號或密碼錯誤' });
});

/**************************************
 ./CQ
  **************************************/
router.post('/CQ', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	if (core_ID == ID && core_password == password)
		res.render('CQPage', { ID: ID, password: password });
	else res.render('warming', { message: '帳號或密碼錯誤' });
});

module.exports = router;
