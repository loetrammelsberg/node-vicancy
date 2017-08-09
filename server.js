// server.js

// BASE SETUP
// =============================================================================
'use strict';
// call the packages we need
var express = require('express');        
var app = express();            
var bodyParser = require('body-parser');
var path = require("path");
var request = require('request');
var pg = require('pg');
var Sync = require("sync");
var randomItem = require('random-item');


var con = process.env.DATABASE_URL+'?ssl=true';
pg.defaults.ssl = true;
var client = new pg.Client(con);
client.connect();


app.engine('.ejs', require('ejs').__express); //ejs Effective JavaScript, conbine HTML with JS 
app.set('views', __dirname + '/View'); //Store all ejs file in View
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/View')); //Store all HTML files in view folder.
app.use(express.static(__dirname + '/Script')); //Store all JS and CSS in Scripts folder.
app.use(express.static(__dirname + '/Public')); //Store all assets in Public folder


// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port 

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();

var data = '';

var rowResult = '';

var id = '';
var name = '';
var email = '';
var vToken = '';
var language = '';

var reseller = '';
var username = '';

/**
 * @desc expose web service via POST request to HRAppstore to recieve token from it (Take note: Token can only be use once!)
 */
router.post('/', function (req, res) {
    var token = req.body.token; //get token from request body
    var result = '';
    Sync(function () { //Synchronise the code. 
        result = getUsername.sync(null, token); //return if client exist in database
        if (result == 0) {// if client do not exist, insert new user 
            var insertResult = insertUser.sync(null, username, reseller);
            console.log(insertResult);
            var newUser = '';
            Sync(function () {
                newUser = selectCilent.sync(null, username); // return if user is successful added
            })
            if (newUser == 0) { // if user is successfull added redirect to /api -> widget.ejs
                res.redirect('/api');
            }
        } else { //if client exist redirect to /api -> widget.ejs
            res.redirect('/api'); 
        }
    });
    token = '';
});

/**
 * GET Username from HR Appstore
 * @function
 * @param {string} token - token from HRAppstore (To get it you need to expose your web service using post request. see above code)
 * @param {string} callback - once the task is complete it will return to the caller (In this case on line 66 if no line are added or remove)
 */
function getUsername(token, callback) {

    var options = {
        url: 'https://dashboard-staging.hrofficelabs.com/api/external/credentials', //HRappstore URL
        method: "GET", //using GET Request
        qs: { token: token }, //token is require 
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
            username = body.userName;
            username = trimUsername(username);
            Sync(function () {
                var result = selectCilent.sync(null, username);
                callback(null, result);


            })
        }
    });

}

/**
 * Trim the username  
 * @function
 * @param {string} username - Username syntax by HRAppstore example: "openid-staging.hrofficelabs.com/user/vicancy"
 * @returns {string} - Return a trimmed username example: vicancy  
 */
function trimUsername(username) {
    var pos = username.lastIndexOf("/");
    username = username.substring(pos + 1, username.length);
    var char = username.charAt(0).toUpperCase();
    username = username.substring(1, username.length);
    username = char + username;
    return username;
}

/**
 * Select client from Vicancy database using the username
 * @function
 * @param {string} username - Username syntax by HRAppstore example: "openid-staging.hrofficelabs.com/user/vicancy"
 * @returns {string} - Return a trimmed username example: vicancy  
 */
function selectCilent(username, callback) {
    reseller = 'HROffice'; //this have to change if you need switch between platforms cause this is used to retrieve the right information from the database
    pg.defaults.ssl = true; // To allow SSL connection to Heroku database 

    console.log('Connected to postgres! Getting schemas...');
    if (username == 'Vicancy') { // REMOVE/COMMENT THIS CODE IF PRODUCTION STARTS!!!
        username = 'Start People'; // This is for testing if we could retrieve out the data from the data base.
    }
    client.query("SELECT clients.external_id,clients.name,clients.email,clients.language,resellers.token FROM resellers INNER JOIN clients on resellers.id = clients.reseller_id WHERE resellers.name = '" + reseller + "' AND clients.name = '" + username + "'", function (err, result) {

        if (result.rows.length == 0) { //When there are no rows return means there are no client in the database
            callback(null, 0); //return to the main caller
        } else { // else set variables  
            id = result.rows[0].external_id;
            name = result.rows[0].name;
            email = result.rows[0].email;
            vToken = result.rows[0].token;
            language = result.rows[0].language;
            if (language == null) {
                language = 'nl';
            }
            console.log(id);
            console.log(name);
            console.log(email);
            console.log(vToken);
            console.log(language);

            callback(null, result.rows.length);
        }
    });
}

/**
 * Controller for creating new token and insert new user into database
 * @function
 * @param {string} username - Trimmed Username from HRAppstore 
 * @param {string} reseller - Name of the platform 
 * @param {string} callback - return the result of inserting new user
 */
function insertUser(username, reseller, callback) {
    var resellerToken = '';

    Sync(function () {
        resellerToken = generateToken.sync(null);
        var results = insertDatabase.sync(null, username, reseller, resellerToken);
        
        if (results == 200) {
            callback(null, results);
        }
    })
}

/**
 * Generate Random Token for external_id
 * @function
 * @param {string} callback - return the a random token
 */
function generateToken(callback) {
    var resellerToken = '';
    var check = true;
    var text = '';

    text = '?autogen? ';
    var str = "abcdefghijklmnoprxtuvwxyz1234567890";
    var patt1 = /\w/g;
    var result = str.match(patt1);

    for (var i = 0; i < 8; i++) {
        text += randomItem(result)
    }

    //check if the random token exist in the database
    client.query("SELECT clients.external_id FROM clients where clients.external_id = '" + text + "';", function (err, result) {
        if (result.rows.length == 0) {
            check = false;
            callback(null, text);
        } else { //if it exist the generate token again
            Sync(function () {
                generateToken.sync(null);
            })
        }
    });

}

/**
 * Insert new user into database
 * @function
 * @param {string} username - Trimmed Username from HRAppstore 
 * @param {string} reseller - Name of the platform 
 * @param {string} resellerToken - Random generated token
 * @param {string} callback - return the result of inserting new user
 */
function insertDatabase(username, reseller, resellerToken, callback) {

    client.query("SELECT resellers.token FROM Resellers where resellers.name = '" + reseller + "';", function (err, result) {

        var options = {
            url: 'http://app.vicancy.com/api/v1/client/auth', //insert user using POST request vis this URL
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: {
                api_token: result.rows[0].token,
                client: {
                    id: resellerToken,
                    name: username,
                    email: '',
                    language: 'nl'
                }
            },
            json: true
        }
        request.post(options, function (error, response, body) {
            console.log('error:', error); // Print the error if one occurred 
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
            console.log('body:', body);
            if (response.statusCode == 200) {
                callback(null, response.statusCode);
            }
        });
    });

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

app.get('/api', function (req, res) {//this where we show the vicancy logo for the user to click and it will be redirected to /app
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