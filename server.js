// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var path = require("path");

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
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
// router.get('/', function (req, res) {
//     res.json({ message: 'hooray! welcome to our get api!' });
// });

var userUrl = '';
// test route to make sure everything is working (accessed at POST http://localhost:8080/api)
router.post('/', function (req, res) {
    userUrl = path.join('https://dashboard-staging.hrofficelabs.com/api/external/credentials?token=' + req.body.token);
    res.get({userUrl});
  
});
    

// router.get(userUrl, function (req, res) {
//     var userName = req.json('userName');
//     var productSettings = req.json('productSettings');
//     console.log(userName);
// });
// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /
app.use('/', router);

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