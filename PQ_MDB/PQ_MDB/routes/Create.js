'use strict';
var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
const { Get } = require('./GetConst');
const core_ID = Get('ID');
const core_password = Get('password');

function validateUserCredentials(db, ID, password) {
    return new Promise((resolve, reject) => {
        var table = db.db('EW').collection('superuser_list');

        table.findOne({ ID: ID }, { projection: { _id: 0, password: 1 } }, function (err, result) {
            if (err) return reject({ result: '伺服器錯誤' });
            if (!result) return reject({ result: '帳號不存在' });

            if (result.password === password) resolve(); // 驗證成功
            else reject({ result: '密碼錯誤' }); // 驗證失敗
        });
    });
}

/**************************************
./Create/newUser
1. 測帳密
2. 得目前編號+更新
3.插入使用者
  **************************************/

function FindAndUpdateUsersNumber(db) {
	return new Promise((resolve, reject) => {
		var table = db.db('lock').collection('users');
		var findThing = { name: 'usersCount' };
		var updateThing = { $inc: { count: 1 } };
		var set = { projection: { _id: 0 } };
		table.findOneAndUpdate(findThing, updateThing, set, function (err, result) {
			if (err) {
				reject({ result: '伺服器連線錯誤' });
				throw err;
			}
			if (result.ok == 1) resolve({ result: result.value.count });
			else reject({ result: '系統錯誤,無法取得新使用者的編號' });
		});
	});
}

function FindAndUpdateSuperUsersNumber(db) {
	return new Promise((resolve, reject) => {
		var table = db.db('lock').collection('superusers');
		var findThing = { name: 'SuperUsersCount' };
		var updateThing = { $inc: { count: 1 } };
		var set = { projection: { _id: 0 } };
		table.findOneAndUpdate(findThing, updateThing, set, function (err, result) {
			if (err) {
				reject({ result: '伺服器連線錯誤' });
				throw err;
			}
			if (result.ok == 1) resolve({ result: result.value.count });
			else reject({ result: '系統錯誤,無法取得新使用者的編號' });
		});
	});
}


function randomString(digit) {
	var x = '0123456789qwertyuioplkjhgfdsazxcvbnm';
	var tmp = '';
	for (var i = 0; i < digit; i++)
		tmp += x.charAt(Math.floor(Math.random() * x.length));
	return tmp;
}

function InsertNewUser(db, pkg, tag) {
	return new Promise((resolve, reject) => {
		var new_ID = tag + '_' + pkg.result.toString();
		var random_password = randomString(8);
		var table = db.db('EW').collection('personal_information');
		table.insertOne(
			{
				ID: new_ID,
				password: random_password,
				first: true,
				auth: Get('defaultAuth'),
			},
			function (err, result) {
				if (err) {
					reject({ result: '伺服器連線錯誤' });
					throw err;
				}
				resolve({ result: 'success', ID: new_ID, password: random_password });
			}
		);
	});
}

router.post('/newUser', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	var tag = req.body.tag;
	MongoClient.connect(
		Get('mongoPath') + 'lock',
		{ useNewUrlParser: true, useUnifiedTopology: true },
		function (err, db) {
			if (err) {
				res.json({ result: '伺服器連線錯誤' });
				throw err;
			}
			if (core_ID == ID && core_password == password){
				FindAndUpdateUsersNumber(db)
				.then((pkg) => InsertNewUser(db, pkg, tag))
				.then((pkg) => res.json(pkg))
				.catch((error) => res.json(error))
				.finally((pkg) => db.close());
			}
			else{
				validateUserCredentials(db, ID, password)
				.then(() => FindAndUpdateUsersNumber(db))
				.then((pkg) => InsertNewUser(db, pkg, tag))
				.then((pkg) => res.json(pkg))
				.catch((error) => res.json(error))
				.finally((pkg) => db.close());
			}
			
		}
	);
});

function InsertNewSuperUser(db, pkg, tag) {
	return new Promise((resolve, reject) => {
		var new_ID = tag + '_' + pkg.result.toString();
		var random_password = randomString(8);
		var table = db.db('EW').collection('superuser_list');
		table.insertOne(
			{
				ID: new_ID,
				password: random_password,
				first: true,
			},
			function (err, result) {
				if (err) {
					reject({ result: '伺服器連線錯誤' });
					throw err;
				}
				resolve({ result: 'success', ID: new_ID, password: random_password });
			}
		);
	});
}

router.post('/newSuperUser', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	var tag = req.body.tag;
	MongoClient.connect(
		Get('mongoPath') + 'lock',
		{ useNewUrlParser: true, useUnifiedTopology: true },
		function (err, db) {
			if (err) {
				res.json({ result: '伺服器連線錯誤' });
				throw err;
			}
			if (core_ID == ID && core_password == password) {
				FindAndUpdateSuperUsersNumber(db)
				.then((pkg) => InsertNewSuperUser(db, pkg, tag))
				.then((pkg) => res.json(pkg))
				.catch((error) => res.json(error))
				.finally((pkg) => db.close());
			}
			else{
				validateUserCredentials(db, ID, password)
				.then(() => FindAndUpdateSuperUsersNumber(db))
				.then((pkg) => InsertNewSuperUser(db, pkg, tag))
				.then((pkg) => res.json(pkg))
				.catch((error) => res.json(error))
				.finally((pkg) => db.close());
			}
		}
	);
});

/**************************************
./Create/ManynewUser
1. 測帳密
2. 得目前編號+更新
3.插入使用者
  **************************************/

function catchError(error, res) {
	if (error) res.json({ result: '伺服器連線錯誤' });
	else res.json({ result: 'success' });
}

function createMany(tag, count, db, res) {
	var iferror = false;
	var promiseList = [];
	for (var i = 0; i < count; i++) {
		promiseList.push(
			FindAndUpdateUsersNumber(db)
				.then((pkg) => InsertNewUser(db, pkg, tag))
				.catch((error) => (iferror = true))
		);
	}
	Promise.all(promiseList).finally((pkg) => {
		catchError(iferror, res);
		db.close();
	});
}

router.post('/ManynewUser', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	var tag = req.body.tag;
	var count = req.body.count;
	MongoClient.connect(
		Get('mongoPath') + 'lock',
		{ useNewUrlParser: true, useUnifiedTopology: true },
		function (err, db) {
			if (err) {
				res.json({ result: '伺服器連線錯誤' });
				throw err;
			}
			if (core_ID == ID && core_password == password) {
                createMany(tag, count, db, res);
            } 
            else {
                // **一般帳號需通過密碼驗證**
                validateUserCredentials(db, ID, password)
                    .then(() => createMany(tag, count, db, res))
                    .catch((error) => {
                        res.json(error);
                        db.close();
                    });
            }
		}
	);
});

module.exports = router;
