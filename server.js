// server.js

// BASE SETUP
// =============================================================================
'use strict';
// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var path = require("path");
var request = require('request');
var pg = require('pg');

app.use(express.static(__dirname + '/View')); //Store all HTML files in view folder.
app.use(express.static(__dirname + '/Script')); //Store all JS and CSS in Scripts folder.
app.use(express.static(__dirname + '/Public'));

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();
// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
// router.get('/', function (req, res) {
//     res.json({ message: 'hooray! welcome to our get api!' });
// });

var token = '';

var username = '';
var flag = false;
var data = '';

var rowResult = '';
// test route to make sure everything is working (accessed at POST http://localhost:8080/api)
router.post('/', function (req, res) {
    token = req.body.token;
    flag = true;
    console.log(token);
    if (flag) {
        rowResult = getUsername();
    }
    token = '';
    console.log(rowResult);
    res.redirect('/');
});

function getUsername() {
    var options = {
        url: 'https://dashboard-staging.hrofficelabs.com/api/external/credentials',
        method: "GET",
        qs: { token: token },
        headers: {
            "Content-Type": "application/json",
        },
        json: true

    }

    request.get(options, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body);
        if (response.statusCode == 200) {
            var username = body.userName;
            username = trimUsername(username);
            rowResult = database(username);
        }

    });
    return rowResult;
}
function trimUsername(username) {
    var pos = username.lastIndexOf("/");
    username = username.substring(pos + 1, username.length);
    var char = username.charAt(0).toUpperCase();
    username = username.substring(1, username.length);
    username = char + username;
    return username;
}

function database(username) {
    pg.defaults.ssl = true;

    pg.connect('postgres://zqiwvdwbafeass:Y1u2uQf3hEehsyZNf5nt3DGDOJ@ec2-54-221-206-165.compute-1.amazonaws.com:5432/dersj7cn9ojnjq', function (err, client) {
        if (err) throw err;
        console.log('Connected to postgres! Getting schemas...');
        rowResult = selectUser(username, client);

    });
    console.log(rowResult);
}

function selectUser(username, client) {
    var rowResult = '';
    client.query("SELECT * from resellers WHERE name = '" + username + "'", function (err, result) {
        rowResult = result;
    });

    return rowResult;
}

function inserUser(username, err, client) {
    client.query("INSERT INTO resellers (name) VALUES ('" + username + "')");
    if (err) throw err;
}
// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /
app.use('/', router);

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
    //__dirname : It will resolve to your project folder.
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/get.html'));
    //__dirname : It will resolve to your project folder.
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/get.js'));
    //__dirname : It will resolve to your project folder.
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/style.css'));
    //__dirname : It will resolve to your project folder.
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);