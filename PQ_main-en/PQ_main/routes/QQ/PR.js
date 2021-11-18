﻿"use strict";
var express = require("express");
var router = express.Router();
const { Get } = require("../GetConst");
var MongoClient = require("mongodb").MongoClient;

/**********************
 ./QQ/PR/
 來到PR頁
 1.檢查帳密
 2.get 個人資料(personal_data)
 3.render data:data
 ***********************/

function CheckPassword(db, ID, password) {
  return new Promise((resolve, reject) => {
    var table = db.db("EW").collection("personal_information");
    table.findOne(
      { ID: ID },
      { projection: { _id: 0 } },
      function (err, result) {
        if (err) {
          reject({ message: "Connection to server failed" });
          throw err;
        }
        if (result == null) reject({ message: "Account does not exist." });
        else if (result.password == password) resolve(1);
        else reject({ message: "Wrong Password" });
      }
    );
  });
}

function GetPeronalData(db, ID, password) {
  return new Promise((resolve, reject) => {
    var table = db.db("EW").collection("personal_data");
    table.findOne(
      { ID: ID },
      { projection: { _id: 0, ID: 0 } },
      function (err, result) {
        if (err) {
          reject({ message: "Connection to server failed" });
          throw err;
        }
        if (result == null) reject({ message: "No data" });
        else
          resolve({
            ID: ID,
            password: password,
            gender: result.gender,
            age: result.age,
            Ghand: result.Ghand,
            Phand: result.Phand,
            name: result.name,
            nice: result.nice,
            year: result.year,
          });
      }
    );
  });
}

router.post("/", function (req, res) {
  var ID = req.body.ID;
  var password = req.body.password;
  MongoClient.connect(
    Get("mongoPath") + "EW",
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) {
        res.render("warming", { message: "Connection to server failed" });
        throw err;
      }
      CheckPassword(db, ID, password)
        .then((pkg) => GetPeronalData(db, ID, password))
        .then((pkg) => res.render("QQ/PR", pkg))
        .catch((error) => res.render("warming", error))
        .finally((pkg) => db.close());
    }
  );
});

/**********************
 ./QQ/PR/getData(AJAX)
 來到PR頁
 1.檢查帳密
 2.get 個人all最新資料(QQ.all.ID)
 ***********************/

function AjaxCheckPassword(db, ID, password) {
  return new Promise((resolve, reject) => {
    var table = db.db("EW").collection("personal_information");
    table.findOne(
      { ID: ID },
      { projection: { _id: 0 } },
      function (err, result) {
        if (err) {
          reject({ result: "Connection to server failed" });
          throw err;
        }
        if (result == null) reject({ result: "Account does not exist." });
        else if (result.password == password) resolve(1);
        else reject({ result: "Wrong Password" });
      }
    );
  });
}

function GetAllData(db, ID) {
  return new Promise((resolve, reject) => {
    var table = db.db("QQ").collection("all");
    table.findOne(
      { ID: ID },
      { projection: { _id: 0, ID: 0 } },
      function (err, result) {
        if (err) {
          reject({ result: "Connection to server failed" });
          throw err;
        }
        if (result == null) reject({ result: "No data" });
        else resolve({ result: "success", data: result });
      }
    );
  });
}

router.post("/getData", function (req, res) {
  var ID = req.body.ID;
  var password = req.body.password;
  MongoClient.connect(
    Get("mongoPath") + "EW",
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, db) {
      if (err) {
        res.json({ result: "Connection to server failed" });
        throw err;
      }
      AjaxCheckPassword(db, ID, password)
        .then((pkg) => GetAllData(db, ID))
        .then((pkg) => res.json(pkg))
        .catch((error) => res.json(error))
        .finally((pkg) => db.close());
    }
  );
});

module.exports = router;
