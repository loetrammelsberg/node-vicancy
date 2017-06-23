// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');
var path = require("path");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

function GetURLParameter(sParam) {

    var sPageURL = window.location.search.substring(1);

    var sURLVariables = sPageURL.split('&');

    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

var token = GetURLParameter('token');

request({
    uri: 'https://dashboard-staging.hrofficelabs.com/api/external/credentials?token=' + token,
    method: "GET",
    timeout: 10000,
    followRedirect: true,
    maxRedirects: 10
}, function (error, response, body) {
    console.log(body);
});