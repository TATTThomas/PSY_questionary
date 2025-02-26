'use strict';
var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
const { Get } = require('./GetConst');
const core_ID = Get('ID');
const core_password = Get('password');
const jumpBoard_license = ['basePage', 'GQPage', 'CQPage', 'QQPage'];

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

function jumpBoardCheckPassword(db, ID, password) {
	return new Promise((resolve, reject) => {
		var table = db.db('EW').collection('superuser_list');
		table.findOne(
			{ ID: ID },
			{ projection: { _id: 0 } },
			function (err, result) {
				if (err) {
					reject({ message: '伺服器連線錯誤' });
					throw err;
				}
				if (result == null) reject({ message: '不存在此帳號' });
				else if (result.password == password)
					resolve({ ID: ID, password: password, data: 'NA' });
				else reject({ message: '密碼錯誤' });
			}
		);
	});
}
router.post('/jumpBoard', function (req, res) {
	//上面有設jumpBoard_license
	var ID = req.body.ID;
	var password = req.body.password;
	var goal = req.body.goal;
	if (core_ID == ID && core_password == password)
		res.render(goal, { ID: ID, password: password });
	else if (jumpBoard_license.indexOf(goal) > -1)
		MongoClient.connect(
			Get('mongoPath') + 'EW',
			{ useNewUrlParser: true, useUnifiedTopology: true },
			function (err, db) {
				if (err) {
					res.render('warming', { message: '伺服器連線錯誤' });
					throw err;
				}
				jumpBoardCheckPassword(db, ID, password)
					.then((pkg) => res.render(goal, pkg))
					.catch((error) => res.render('warming', error))
					.finally((pkg) => db.close());
			}
		);
	else res.render('warming', { message: '非法操作, 請聯絡網站管理員' });
});
module.exports = router;
