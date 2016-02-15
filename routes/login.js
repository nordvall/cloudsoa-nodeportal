var express = require('express');
var request = require('request');
var router = express.Router();
var tokenService = require('../tokenservice')
var jwt = require('jsonwebtoken')


router.get('/', function(req, res) {
    var url = tokenService.getAuthorizationEndpoint()
    res.redirect(url);
});

router.post('/callback', function(req, res) {
    var code = req.param('code');
    var jwtString = req.param('id_token');

    var token = jwt.decode(jwtString)
    tokenService.getRefreshTokenFromCode(token.sub, code)

    res.render('token', { jwt: jwtString });
});

router.get('/logout', function(req, res) {
    res.render('token');
});

router.get('/status', function(req, res) {
    res.json(req.user)
});


module.exports = router
