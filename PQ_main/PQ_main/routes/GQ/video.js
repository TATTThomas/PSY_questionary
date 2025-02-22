'use strict';
var express = require('express');
var router = express.Router();
const { Get } = require('../GetConst');
var MongoClient = require('mongodb').MongoClient;

/**********************
 const
 各模式之抽取
 ***********************/

const practicePullCount = 5;

const PullList = {
	1: [2, 8, 16, 14],
	2: [2, 10, 18, 10],
	3: [2, 12, 18, 8],
	4: [4, 14, 20, 2],
	5: [6, 16, 16, 2],
	6: [8, 16, 16, 0],
	7: [10, 18, 12, 0],
	8: [12, 20, 8, 0],
	9: [18, 22, 0, 0],
	10: [22, 18, 0, 0],
}; //40 for each ,[9,6,3,0] for Difficulty

const humanList = [
	'C01',
	'C04',
	'C05',
	'C06',
	'C07',
	'C08',
	'C09',
	'C10',
	'C11',
	'C12',
	'C13',
];

/**********************
 ./GQ/video/getLtableList
 獲得對應的影片資源 
 ***********************/
//convert list
function convertList(situation, level) {
	var list;
	if (situation == 'practice') {
		if (level < 3) list = [0, 0, 0, practicePullCount];
		else if (level < 6) list = [0, 0, practicePullCount, 0];
		else if (level < 9) list = [0, practicePullCount, 0, 0];
		else list = [practicePullCount, 0, 0, 0];
	} else {
		list = PullList[level];
	}
	return list;
}
//根據範圍, 數量回傳, 隨機數字陣列
function getUnReapetRandomList(length, count) {
	var returnList = [];
	for (var i = 0; i < count; i++) {
		var item = Math.floor(Math.random() * length);
		if (returnList.indexOf(item) == -1) returnList.push(item);
		else i--;
	}
	//console.log(returnList);
	return returnList;
}
//特定人,特定難度,選幾個
function getListByHuman(db, num, Difficulty, human, ReturnList) {
	if (num > 0)
		return new Promise((resolve, reject) => {
			var table = db.db('data').collection('Ltable');
			table
				.find(
					{ $and: [{ human: human }, { Difficulty: Difficulty }] },
					{ projection: { _id: 0 } }
				)
				.toArray(function (err, result) {
					if (err) {
						reject({ result: '伺服器連線錯誤' });
						throw err;
					}
					if (result.length > num) {
						var Rlist = getUnReapetRandomList(result.length, num);
						var newList = [];
						for (var i in Rlist) newList.push(result[Rlist[i]]);
						resolve(ReturnList.concat(newList));
					} else if (result.length == num) resolve(ReturnList.concat(result));
					else {
						if (result.length == 0) getList(db, num, Difficulty, ReturnList);
						else {
							for (var i = 0; i < num - result.length; i++)
								result.push(result[i]);
							resolve(ReturnList.concat(result));
						}
					}
				});
		});
	else
		return new Promise((resolve, reject) => {
			resolve(ReturnList);
		});
}
//不特定人,特定難度,選幾個
function getList(db, num, Difficulty, ReturnList) {
	// console.log(ReturnList);
	if (num > 0)
		return new Promise((resolve, reject) => {
			var table = db.db('data').collection('Ltable');
			table
				.find({ Difficulty: Difficulty }, { projection: { _id: 0 } })
				.toArray(function (err, result) {
					if (err) {
						reject({ result: '伺服器連線錯誤' });
						throw err;
					}
					if (result.length > num) {
						var Rlist = getUnReapetRandomList(result.length, num);
						var newList = [];
						for (var i in Rlist) newList.push(result[Rlist[i]]);
						resolve(ReturnList.concat(newList));
					} else if (result.length == num) resolve(ReturnList.concat(result));
					else if (result.length > 0) {
						for (var i = 0; i < num - result.length; i++)
							result.push(result[i]);
						resolve(ReturnList.concat(result));
					} else {
						reject({ result: '查無資料' });
					}
				});
		});
	else
		return new Promise((resolve, reject) => {
			resolve(ReturnList);
		});
}

router.post('/getLtableList', function (req, res) {
	var mode = req.body.mode;
	var level = req.body.Difficulty;
	var situation = req.body.situation;
	//console.log(mode);
	//獲取各個難度抽題數
	var list = convertList(situation, level);

	MongoClient.connect(
		Get('mongoPath') + 'EW',
		{ useNewUrlParser: true, useUnifiedTopology: true },
		function (err, db) {
			if (err) {
				res.json({ result: '伺服器連線錯誤' });
				throw err;
			}
			//分成單人和多人, 利用上方獲得的資訊進行抽題
			if (mode == 'one') {
				var human = humanList[Math.floor(Math.random() * humanList.length)];
				getListByHuman(db, list[0], '9', human, [])
					.then((pkg) => getListByHuman(db, list[1], '6', human, pkg))
					.then((pkg) => getListByHuman(db, list[2], '3', human, pkg))
					.then((pkg) => getListByHuman(db, list[3], '0', human, pkg))
					.then((pkg) => res.json({ result: 'success', data: pkg }))
					.catch((error) => res.json(error))
					.finally((pkg) => db.close());
			} else {
				getList(db, list[0], '9', [])
					.then((pkg) => getList(db, list[1], '6', pkg))
					.then((pkg) => getList(db, list[2], '3', pkg))
					.then((pkg) => getList(db, list[3], '0', pkg))
					.then((pkg) => res.json({ result: 'success', data: pkg }))
					.catch((error) => res.json(error))
					.finally((pkg) => db.close());
			}
		}
	);
});

/**********************
 ./GQ/video/getMtableList
 獲得對應的影片資源
 ***********************/

function getMList(db, count, diff) {
	return new Promise((resolve, reject) => {
		const params = diff == 0 ? {} : { Difficulty: diff };
		var table = db.db('data').collection('Mtable');
		table
			.find(params, { projection: { _id: 0, Difficulty: 0 } })
			.toArray(function (err, result) {
				if (err) {
					reject({ result: '伺服器連線錯誤' });
					throw err;
				}
				if (result.length >= count) {
					var ReListOrder = getUnReapetRandomList(result.length, count);
					var ReList = [];
					for (var i in ReListOrder) ReList.push(result[ReListOrder[i]]);
					resolve({ result: 'success', data: ReList });
				} else reject({ result: '影片資源不足' });
			});
	});
}

router.post('/getMtableList', function (req, res) {
	var count = req.body.count;
	var diff = req.body.diff;
	MongoClient.connect(
		Get('mongoPath') + 'EW',
		{ useNewUrlParser: true, useUnifiedTopology: true },
		function (err, db) {
			if (err) {
				res.json({ result: '伺服器連線錯誤' });
				throw err;
			}
			getMList(db, count, diff)
				.then((pkg) => res.json(pkg))
				.catch((error) => res.json(error))
				.finally((pkg) => db.close());
		}
	);
});

module.exports = router;
