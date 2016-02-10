var request = require('request')
var logger = require('./logger');


var tokenService = function() {
    var tokenCache = {};

    var getOrCreateUserCache = function(userid) {
        if (tokenCache[userid] == null) {
            tokenCache[userid] = { accessTokens: [] }
        }
        return tokenCache[userid]
    };

    this.getAuthorizationEndpoint = function() {
        return process.env.OAUTH_AUTHORIZATION_URL + "?response_type=code%20id_token" +
            "&client_id=" + process.env.OAUTH_CLIENT_ID +
            "&redirect_uri=" + process.env.OAUTH_CALLBACK_URL +
            "&scope=openid%20profile%20email" +
            "&response_mode=form_post" +
            "&nonce=abc123";
    };

    this.cacheRefreshToken = function(userid, token) {
        var user_cache = getOrCreateUserCache(userid)
        user_cache.refreshToken = token
    };

    this.getRefreshTokenFromCode = function(userid, code) {
        var user_cache = getOrCreateUserCache(userid);

        request.post({
            url: process.env.OAUTH_TOKEN_URL,
            form: {
                grant_type:'authorization_code',
                code: code,
                client_id: process.env.OAUTH_CLIENT_ID,
                client_secret: process.env.OAUTH_CLIENT_SECRET,
                redirect_uri: process.env.OAUTH_CALLBACK_URL
            }},
            function (error, response, body) {
                var tokenResponse = JSON.parse(response.body);
                user_cache.refreshToken = tokenResponse.refresh_token;
            }
        );
    };

    this.getAccessToken = function(userid, resourceid, callback) {
        var user_cache = getOrCreateUserCache(userid)
        if (user_cache.refreshToken == null) {
            throw "No refresh token available."
        } else if (user_cache.accessTokens[resourceid] != null ){
            logger.log('debug', 'Returning access token from cache.')
            callback(user_cache.accessTokens[resourceid])
            return
        }

        logger.log('debug', 'Requesting access token from STS.')

        request.post({
            url: process.env.OAUTH_TOKEN_URL,
            form: {
                grant_type:'refresh_token',
                refresh_token: user_cache.refreshToken,
                client_id: process.env.OAUTH_CLIENT_ID,
                client_secret: process.env.OAUTH_CLIENT_SECRET,
                resource: resourceid
            }},
            function (error, response, body) {
                logger.log('debug', 'Got access token from STS')
                var tokenResponse = JSON.parse(response.body);
                user_cache.accessTokens[resourceid] = tokenResponse.access_token;
                callback(tokenResponse.access_token)
            }
        );
    }
};


module.exports = new tokenService(); // Note: We instantiate a singleton
