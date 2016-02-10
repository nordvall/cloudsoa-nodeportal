var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

// Optionally override environment variables (process.env.xyz) with .env file
require('dotenv').config()

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.text({ type: "application/json"}))
app.use(bodyParser.urlencoded({ extended: false }));


var login = require('./routes/login')
app.use('/login', login)

// express-jwt is authenticating our incoming api calls
var expressJwt = require('express-jwt');
var fs = require('fs')
var publicKey = fs.readFileSync(path.join(__dirname, 'azure.pub'));

var jwtAuth = expressJwt({
    secret: publicKey,
    audience: process.env.OAUTH_CLIENT_ID,
    issuer: process.env.OAUTH_TOKEN_ISSUER
});

var django = require('./routes/django')
app.use('/django', jwtAuth, django)

var spring = require('./routes/spring')
app.use('/spring', jwtAuth, spring)

module.exports = app;
