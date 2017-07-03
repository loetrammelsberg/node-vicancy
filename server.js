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
var Sync = require('sync');


app.engine('.ejs', require('ejs').__express);
app.set('views', __dirname + '/View');
app.set('view engine', 'ejs');

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

var id = '';
var name = '';
var email = '';
var vToken = '';
var language = '';


// test route to make sure everything is working (accessed at POST http://localhost:8080/api)
router.post('/', function (req, res) {
    token = req.body.token;
    flag = true;
    console.log(token);
    var result = ''
    if (flag) {
        startProcess()
        // getUsername(function () {
        //     //this will be run after findVid is finished.
        //     setTimeout(function () {
        //         res.redirect('/api');
        //     },900);
        //     // Rest of your code here.

        // });
    }
    token = '';


});
function startProcess(){
   Sync(function () {
        var result = getUsername.sync(null);
        console.log(result + "hello");
   })
}
function getUsername(callback) {
    var options = {
        url: 'https://dashboard-staging.hrofficelabs.com/api/external/credentials',
        method: "GET",
        qs: { token: token },
        headers: {
            "Content-Type": "application/json",
        },
        json: true

    }
    var username = '';
    request.get(options, function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body);
        if (response.statusCode == 200) {
            username = body.userName;
            username = trimUsername(username);
            console.log(username);
            callback(username);
            // database(username, function () {
            //     if (callback) callback();
            // });
        }
    });
    
}

function trimUsername(username) {
    var pos = username.lastIndexOf("/");
    username = username.substring(pos + 1, username.length);
    var char = username.charAt(0).toUpperCase();
    username = username.substring(1, username.length);
    username = char + username;
    return username;
}


function selectUser(username, callback) {
    var reseller = 'HROffice';
    var user = '';
    pg.defaults.ssl = true;

    pg.connect('postgres://qsxeiddqmzyjtl:Yr6gsDFcIw3QIlJH9tVSJ7f9xt@ec2-54-246-96-114.eu-west-1.compute.amazonaws.com:5432/d1fu206la3ndei', function (err, client) {
        if (err) throw err;
        console.log('Connected to postgres! Getting schemas...');
        if (username == 'Vicancy') {
            username = 'Start People';
        }
        client.query("SELECT clients.external_id,clients.name,clients.email,clients.language,resellers.token FROM resellers INNER JOIN clients on resellers.id = clients.reseller_id WHERE resellers.name = '" + reseller + "' AND clients.name = '" + username + "'", function (err, result) {

            id = result.rows[0].external_id;
            name = result.rows[0].name;
            email = result.rows[0].email;
            vToken = result.rows[0].token;
            language = result.rows[0].language;
            if (language == null) {
                language = 'nl';
            }
            user = id;
            console.log(id);
            console.log(name);
            console.log(email);
            console.log(vToken);
            console.log(language);
        });

    });
    callback(user);
    return user;
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
    res.sendFile(path.join(__dirname + '/widget.ejs'));

    //__dirname : It will resolve to your project folder.
});

app.get('/app', function (req, res) {
    res.render(path.join(__dirname + '/View/app.ejs'));

    //__dirname : It will resolve to your project folder.
});

app.get('/api', function (req, res) {
    console.log(id);
    console.log(name);
    console.log(vToken);
    console.log(language);
    res.render('widget.ejs', { id: id, name: name, vToken: vToken, email: email, language: language });
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));

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