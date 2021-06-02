﻿'use strict';
var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
const { Get } = require('./GetConst');
const core_ID = Get('ID');
const core_password = Get('password');
const table_license = ['Mtable', 'Ltable'];
const criticalNumber_license = ['critical_value'];
const criticalNumber = [
	'mode',
	'PR',
	'A1',
	'A2',
	'A3',
	'A4',
	'A5',
	'A6',
	'A7',
	'A8',
	'A9',
	'A10',
	'B1',
	'B2',
	'B3',
	'B4',
	'B5',
	'C1_1',
	'C1_2',
	'C2',
	'C3',
	'C4',
	'C5_1',
	'C5_2',
	'C5_3',
	'C6_1',
	'C6_2',
	'C6_3',
	'C7',
	'C8',
	'C9',
	'C10_1',
	'C10_2',
	'C10_3',
]; //33
/**************************************
./Update/table
1. 測帳密
2. 測權限
3. 刪表格
4. 資料處理 (csv to string)
5  存資料
  **************************************/

function removeTable(db, where) {
	return new Promise((resolve, reject) => {
		var table = db.db('data').collection(where);
		table.deleteMany({}, function (err, result) {
			if (err) {
				reject({ result: '伺服器連線錯誤' });
				throw err;
			}
			resolve({ result: 'remove完成' });
			//console.log("移除完成");
		});
	});
}

function CsvToJsonListTable(CsvString, where) {
	var jsonList = [];
	var jsons = CsvString.split('\r\n');
	for (var i in jsons) {
		var elements = jsons[i].split(',');
		var json = {};
		if (where == 'Ltable' && elements.length >= 7) {
			json['No'] = elements[0];
			json['filepath'] = elements[1];
			json['ans'] = elements[2];
			json['X'] = elements[3];
			json['Y'] = elements[4];
			json['Difficulty'] = elements[5];
			json['human'] = elements[6];
			jsonList.push(json);
		} else if (elements.length >= 6) {
			json['filepath'] = elements[0];
			json['names'] = elements[1];
			json['win'] = elements[2];
			json['hand'] = elements[3];
			json['ans3'] = elements[4];
			json['ans4'] = elements[5];
			jsonList.push(json);
		}
	}
	//console.log(jsonList);
	return jsonList;
}

function InsertJsonList(db, where, jsonList) {
	return new Promise((resolve, reject) => {
		//console.log("insert start");
		var table = db.db('data').collection(where);
		table.insertMany(jsonList, function (err, result) {
			if (err) {
				reject({ result: '伺服器連線錯誤' });
				//console.log(err.message);
				throw err;
			}
			resolve({ result: 'success' });
			//console.log("insert success");
		});
	});
}

router.post('/table', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	var data = req.body.data;
	var where = req.body.where;
	//console.log(data);
	if (core_ID == ID && core_password == password) {
		MongoClient.connect(
			Get('mongoPath') + 'data',
			{ useNewUrlParser: true, useUnifiedTopology: true },
			function (err, db) {
				if (err) {
					res.json({ result: '伺服器連線錯誤' });
					throw err;
				}
				if (table_license.indexOf(where) > -1)
					removeTable(db, where)
						.then((pkg) =>
							InsertJsonList(db, where, CsvToJsonListTable(data, where))
						)
						.then((pkg) => res.json(pkg))
						.catch((error) => res.json(error))
						.finally((pkg) => db.close());
				else res.json({ result: '無此操作權限' });
			}
		);
	} else res.json({ result: '帳號或密碼錯誤' });
});

/**************************************
./Update/criticalNumber
1. 測帳密
2. 測權限
3. 刪表格
4. 資料處理 (csv to string)
5  存資料
  **************************************/
function CsvToJsonListCritialNumber(CsvString, where) {
	var jsonList = [];
	var jsons = CsvString.split('\r\n');
	for (var i in jsons) {
		var elements = jsons[i].split(',');
		//console.log(elements);
		if (where == 'critical_value' && elements.length >= criticalNumber.length) {
			var json = {};
			for (var j in criticalNumber) {
				json[criticalNumber[j]] = elements[j];
			}
			jsonList.push(json);
		}
	}
	//console.log(jsonList);
	return jsonList;
}

router.post('/criticalNumber', function (req, res) {
	var ID = req.body.ID;
	var password = req.body.password;
	var data = req.body.data;
	var where = req.body.where;
	//console.log(data);
	if (core_ID == ID && core_password == password) {
		MongoClient.connect(
			Get('mongoPath') + 'data',
			{ useNewUrlParser: true, useUnifiedTopology: true },
			function (err, db) {
				if (err) {
					res.json({ result: '伺服器連線錯誤' });
					throw err;
				}
				if (criticalNumber_license.indexOf(where) > -1)
					removeTable(db, where)
						.then((pkg) =>
							InsertJsonList(db, where, CsvToJsonListCritialNumber(data, where))
						)
						//.then(pkg => console.log(CsvToJsonListCritialNumber(data, where)))
						.then((pkg) => res.json(pkg))
						.catch((error) => res.json(error))
						.finally((pkg) => db.close());
				else res.json({ result: '無此操作權限' });
			}
		);
	} else res.json({ result: '帳號或密碼錯誤' });
});

/**************************************
./Update/auth
1. 測帳密
2. 依照輸入更新各帳號權限
  **************************************/

const updateAuth = (id, auth, table) => {
	return new Promise((resolve, reject) => {
		const findThing = { ID: id };
		const update = { $set: { auth: auth } };
		table.updateOne(findThing, update, function (err, result) {
			if (err) {
				reject({ result: '伺服器連線錯誤' });
				throw err;
			}
			resolve({ result: 'success' });
		});
	});
};

router.post('/auth', (req, res) => {
	const ID = req.body.ID;
	const password = req.body.password;
	const mode = req.body.mode; //one 是一人, many是多人
	const peopleId = req.body.peopleId; //多人時用波浪號分隔Id
	const auth = req.body.auth;
	if (core_ID != ID || core_password != password) {
		res.json({ result: '帳號或密碼錯誤' });
		return;
	}
	MongoClient.connect(
		Get('mongoPath') + 'EW',
		{ useNewUrlParser: true, useUnifiedTopology: true },
		async (err, db) => {
			if (err) {
				res.json({ result: '伺服器連線錯誤' });
				throw err;
			}
			var table = db.db('EW').collection('personal_information');
			switch (mode) {
				case 'one':
					try {
						const result = await updateAuth(peopleId, auth, table);
						res.json(result);
					} catch (err) {
						res.json(err);
					}
					db.close();
					break;
				case 'many':
					const peopleIdList = peopleId.split('~');
					try {
						for (let id of peopleIdList) {
							await updateAuth(id, auth, table);
						}
						res.json({ result: 'success' });
					} catch (err) {
						res.json(err);
					}
					db.close();
					break;
				default:
					res.json({ result: '無此操作權限' });
					break;
			}
		}
	);
});

module.exports = router;
